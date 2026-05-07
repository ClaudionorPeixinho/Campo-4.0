(function () {
  "use strict";

  const isEmbedded = window.self !== window.top;

  if (isEmbedded) {
    try {
      if (window.parent && window.parent.CampoOfflineSync) {
        window.CampoOfflineSync = window.parent.CampoOfflineSync;
        return;
      }
    } catch (error) {
      console.warn("Nao foi possivel reutilizar sincronizacao da janela principal:", error);
    }
  }

  const SUPABASE_URL = "https://szzfqkhibuejhodhkvjj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_";
  const QUEUE_KEY = "campo40OfflineQueue";

  function readQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch (error) {
      console.error("Fila offline invalida:", error);
      return [];
    }
  }

  function writeQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    updateButton();
  }

  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && window.supabase.createClient) {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return window.supabaseClient;
    }
    return null;
  }

  function notify(message, type) {
    if (typeof window.showNotification === "function") {
      window.showNotification(message, type || "success");
      return;
    }
    const toast = document.createElement("div");
    toast.className = "campo-sync-toast";
    toast.textContent = message;
    toast.style.background = type === "error" ? "#dc3545" : type === "warning" ? "#ffc107" : "#198754";
    toast.style.color = type === "warning" ? "#1f2937" : "#fff";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function enqueue(table, records) {
    const queue = readQueue();
    const normalized = Array.isArray(records) ? records : [records];
    queue.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      action: "insert",
      table,
      records: normalized,
      createdAt: new Date().toISOString()
    });
    writeQueue(queue);
    notify("Sem internet. Registro salvo no aparelho para sincronizar depois.", "warning");
  }

  function isNetworkError(error) {
    if (!navigator.onLine) return true;
    const message = String(error?.message || error || "").toLowerCase();
    return message.includes("failed to fetch") ||
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("internet") ||
      message.includes("offline");
  }

  async function saveInsert(table, records, options) {
    if (!navigator.onLine) {
      enqueue(table, records);
      return { data: null, error: null, offline: true };
    }

    const client = getClient();
    if (!client) {
      enqueue(table, records);
      return { data: null, error: null, offline: true };
    }

    try {
      let query = client.from(table).insert(Array.isArray(records) ? records : [records]);
      if (options?.select) query = query.select(options.select === true ? undefined : options.select);
      if (options?.single) query = query.single();

      const response = await query;
      if (response.error && isNetworkError(response.error)) {
        enqueue(table, records);
        return { data: null, error: null, offline: true };
      }
      return { ...response, offline: false };
    } catch (error) {
      if (isNetworkError(error)) {
        enqueue(table, records);
        return { data: null, error: null, offline: true };
      }
      throw error;
    }
  }

  async function sync() {
    if (!navigator.onLine) {
      notify("Ainda sem internet. Os dados continuam salvos no aparelho.", "warning");
      return { sent: 0, remaining: readQueue().length };
    }

    const client = getClient();
    if (!client) {
      notify("Supabase nao carregou. Abra o app com internet e tente novamente.", "error");
      return { sent: 0, remaining: readQueue().length };
    }

    const queue = readQueue();
    if (!queue.length) {
      notify("Nao ha dados pendentes para sincronizar.", "success");
      return { sent: 0, remaining: 0 };
    }

    let sent = 0;
    const remaining = [];

    for (const item of queue) {
      try {
        const { error } = await client.from(item.table).insert(item.records);
        if (error) {
          console.error("Erro ao sincronizar item:", error);
          remaining.push(item);
        } else {
          sent += item.records.length;
        }
      } catch (error) {
        console.error("Falha ao sincronizar item:", error);
        remaining.push(item);
      }
    }

    writeQueue(remaining);
    if (window.calculadora && typeof window.calculadora.syncRegistrosLocais === "function") {
      await window.calculadora.syncRegistrosLocais();
    }
    if (sent) notify(`${sent} registro(s) sincronizado(s) com o Supabase.`, "success");
    if (remaining.length) notify(`${remaining.length} lote(s) continuam pendentes.`, "warning");
    window.dispatchEvent(new CustomEvent("campo40:sync-complete", { detail: { sent, remaining: remaining.length } }));
    return { sent, remaining: remaining.length };
  }

  function updateButton() {
    const button = document.getElementById("campoSyncButton");
    const status = document.getElementById("campoSyncStatus");
    const count = readQueue().reduce((total, item) => total + (item.records?.length || 1), 0);
    if (button) button.textContent = count ? `Sincronizar (${count})` : "Sincronizar";
    if (status) status.textContent = navigator.onLine ? "Online" : "Offline";
  }

  function renderButton() {
    if (isEmbedded) return;
    if (document.getElementById("campoSyncButton")) return;

    const style = document.createElement("style");
    style.textContent = `
      .campo-sync-panel{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;gap:8px;align-items:center;font-family:Arial,sans-serif}
      .campo-sync-panel span{background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:999px;padding:8px 12px;font-size:13px;box-shadow:0 6px 18px rgba(0,0,0,.14)}
      .campo-sync-panel button{border:0;border-radius:999px;background:#198754;color:#fff;padding:10px 14px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.18);cursor:pointer}
       .campo-sync-panel .campo-exit-button{background:#fff;color:#1f2937;border:1px solid #d1d5db}
      .campo-sync-panel button:disabled{opacity:.7;cursor:wait}
      .campo-sync-toast{position:fixed;top:16px;right:16px;z-index:10000;border-radius:8px;padding:12px 16px;box-shadow:0 8px 24px rgba(0,0,0,.2);font:600 14px Arial,sans-serif;max-width:320px}
      @media (max-width:640px){.campo-sync-panel{left:10px;right:10px;bottom:10px;justify-content:flex-end;flex-wrap:wrap}.campo-sync-panel span,.campo-sync-panel button{font-size:12px;padding:8px 10px}}
    `;
    document.head.appendChild(style);

    const panel = document.createElement("div");
    panel.className = "campo-sync-panel";
    panel.innerHTML = '<button id="campoExitButton" class="campo-exit-button" type="button"><i class="bi bi-box-arrow-right"></i> Sair</button><span id="campoSyncStatus"></span><button id="campoSyncButton" type="button"></button>';
    document.body.appendChild(panel);

    document.getElementById("campoExitButton").addEventListener("click", () => {
      if (typeof window.sair === "function") {
        window.sair();
      } else {
        window.location.href = "index_menu.html";
      }
    });

    document.getElementById("campoSyncButton").addEventListener("click", async (event) => {
      event.currentTarget.disabled = true;
      try {
        await sync();
      } finally {
        event.currentTarget.disabled = false;
        updateButton();
      }
    });

    updateButton();
  }

  window.CampoOfflineSync = {
    enqueue,
    saveInsert,
    sync,
    pendingCount: () => readQueue().reduce((total, item) => total + (item.records?.length || 1), 0)
  };

  window.addEventListener("online", () => {
    updateButton();
    sync();
  });
  window.addEventListener("offline", updateButton);
  document.addEventListener("DOMContentLoaded", renderButton);
})();
