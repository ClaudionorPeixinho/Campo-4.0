(function () {
  "use strict";

  const APP_NAME = "Campo 4.0";
  const STORAGE_KEY = "campo40_pwa_dismissed";
  const CACHE_VERSION = "v6";
  const APP_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");

  let deferredPrompt = null;
  let isInstalled = false;
  let installPromptVisible = false;

  function isEmbedded() {
    return window.self !== window.top;
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function hasDismissedRecently() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (data.timestamp && (Date.now() - data.timestamp < 24 * 60 * 60 * 1000)) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  function markDismissed() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
  }

  function clearDismissed() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function createStyles() {
    if (document.getElementById("pwa-installer-styles")) return;

    const style = document.createElement("style");
    style.id = "pwa-installer-styles";
    style.textContent = `
      .pwa-install-banner {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(120px);
        background: linear-gradient(135deg, #198754, #0d3d1f);
        color: white;
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        z-index: 10002;
        display: flex;
        align-items: center;
        gap: 16px;
        max-width: 480px;
        width: 90%;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Inter', Arial, sans-serif;
      }

      .pwa-install-banner.show {
        transform: translateX(-50%) translateY(0);
      }

      .pwa-install-banner-icon {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        background: rgba(255,255,255,0.15);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      .pwa-install-banner-body {
        flex: 1;
        min-width: 0;
      }

      .pwa-install-banner-title {
        font-weight: 700;
        font-size: 0.95rem;
        margin-bottom: 2px;
      }

      .pwa-install-banner-desc {
        font-size: 0.8rem;
        opacity: 0.85;
      }

      .pwa-install-banner-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .pwa-install-btn {
        background: white;
        color: #0d3d1f;
        border: none;
        padding: 8px 18px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        white-space: nowrap;
      }

      .pwa-install-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }

      .pwa-install-close {
        background: rgba(255,255,255,0.15);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        transition: background 0.2s;
        flex-shrink: 0;
      }

      .pwa-install-close:hover {
        background: rgba(255,255,255,0.25);
      }

      .pwa-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        font-family: 'Inter', Arial, sans-serif;
      }

      .pwa-status-badge.online {
        background: rgba(25,135,84,0.15);
        color: #2ecc71;
        border: 1px solid rgba(46,204,113,0.3);
      }

      .pwa-status-badge.offline {
        background: rgba(220,53,69,0.15);
        color: #f87171;
        border: 1px solid rgba(248,113,113,0.3);
      }

      .pwa-status-badge i {
        font-size: 0.9rem;
      }

      .pwa-menu-install-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 10px 18px;
        margin: 3px 0;
        cursor: pointer;
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
        font-size: 0.9rem;
        font-family: 'Inter', Arial, sans-serif;
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.85);
        text-align: left;
      }

      .pwa-menu-install-btn:hover {
        background: rgba(255,255,255,0.1);
        transform: translateX(5px);
        color: white;
      }

      .pwa-menu-install-btn i {
        font-size: 1.3rem;
        width: 28px;
        text-align: center;
        flex-shrink: 0;
        color: inherit;
      }

      .pwa-install-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(8px);
        z-index: 10003;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: 'Inter', Arial, sans-serif;
      }

      .pwa-install-modal-overlay.show {
        display: flex;
        animation: pwaFadeIn 0.3s ease;
      }

      @keyframes pwaFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .pwa-install-modal {
        background: #1a2e1a;
        border: 1px solid rgba(46,204,113,0.2);
        border-radius: 24px;
        padding: 32px;
        max-width: 420px;
        width: 100%;
        color: white;
        text-align: center;
        animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes pwaSlideUp {
        from { transform: translateY(40px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .pwa-install-modal-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #198754, #27ae60);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        box-shadow: 0 8px 32px rgba(25,135,84,0.3);
      }

      .pwa-install-modal h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin-bottom: 8px;
      }

      .pwa-install-modal p {
        font-size: 0.9rem;
        color: rgba(255,255,255,0.7);
        margin-bottom: 24px;
        line-height: 1.5;
      }

      .pwa-install-features {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 24px;
      }

      .pwa-install-feature {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 12px;
        text-align: center;
      }

      .pwa-install-feature i {
        display: block;
        font-size: 1.5rem;
        color: #2ecc71;
        margin-bottom: 6px;
      }

      .pwa-install-feature span {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.7);
      }

      .pwa-install-modal-actions {
        display: flex;
        gap: 12px;
      }

      .pwa-install-modal-actions .pwa-install-btn {
        flex: 1;
        padding: 12px;
        font-size: 0.9rem;
      }

      .pwa-install-modal-actions .pwa-install-close {
        flex: 0.5;
        width: auto;
        height: auto;
        border-radius: 999px;
        padding: 12px;
        font-size: 0.9rem;
      }

      @media (max-width: 480px) {
        .pwa-install-banner {
          bottom: 10px;
          padding: 12px 16px;
        }
        .pwa-install-banner-desc {
          display: none;
        }
        .pwa-install-features {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createBanner() {
    if (document.getElementById("pwaInstallBanner")) return;

    const banner = document.createElement("div");
    banner.id = "pwaInstallBanner";
    banner.className = "pwa-install-banner";
    banner.innerHTML = `
      <div class="pwa-install-banner-icon">
        <i class="bi bi-phone"></i>
      </div>
      <div class="pwa-install-banner-body">
        <div class="pwa-install-banner-title">Instalar ${APP_NAME}</div>
        <div class="pwa-install-banner-desc">Acesso rápido, funciona offline e na lavoura</div>
      </div>
      <div class="pwa-install-banner-actions">
        <button class="pwa-install-btn" id="pwaBannerInstallBtn">
          <i class="bi bi-download"></i> Instalar
        </button>
        <button class="pwa-install-close" id="pwaBannerCloseBtn">&times;</button>
      </div>
    `;
    document.body.appendChild(banner);

    banner.querySelector("#pwaBannerInstallBtn").addEventListener("click", () => {
      installApp();
    });

    banner.querySelector("#pwaBannerCloseBtn").addEventListener("click", () => {
      hideBanner();
      markDismissed();
    });
  }

  function createModal() {
    if (document.getElementById("pwaInstallModal")) return;

    const modal = document.createElement("div");
    modal.id = "pwaInstallModal";
    modal.className = "pwa-install-modal-overlay";
    modal.innerHTML = `
      <div class="pwa-install-modal">
        <div class="pwa-install-modal-icon">
          <i class="bi bi-phone"></i>
        </div>
        <h2>Instalar ${APP_NAME}</h2>
        <p>Transforme o sistema em um aplicativo nativo no seu dispositivo. Ideal para uso no campo, com ou sem internet.</p>
        <div class="pwa-install-features">
          <div class="pwa-install-feature">
            <i class="bi bi-wifi-off"></i>
            <span>Uso Offline</span>
          </div>
          <div class="pwa-install-feature">
            <i class="bi bi-speedometer2"></i>
            <span>Acesso Rápido</span>
          </div>
          <div class="pwa-install-feature">
            <i class="bi bi-bell"></i>
            <span>Notificações</span>
          </div>
          <div class="pwa-install-feature">
            <i class="bi bi-phone-landscape"></i>
            <span>Tela Cheia</span>
          </div>
        </div>
        <div class="pwa-install-modal-actions">
          <button class="pwa-install-btn" id="pwaModalInstallBtn">
            <i class="bi bi-download"></i> Instalar Agora
          </button>
          <button class="pwa-install-close" id="pwaModalCloseBtn">Agora não</button>
        </div>
        <div class="pwa-install-share" style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
          <p style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:8px;">
            <i class="bi bi-share-fill"></i> Compartilhe com outros dispositivos
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="pwa-share-btn" id="pwaShareBtn" style="flex:1;padding:10px;background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.15);border-radius:999px;font-weight:600;font-size:0.8rem;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;">
              <i class="bi bi-whatsapp"></i> Compartilhar Link
            </button>
            <button class="pwa-share-btn" id="pwaCopyLinkBtn" style="padding:10px 16px;background:rgba(255,255,255,0.05);color:white;border:1px solid rgba(255,255,255,0.1);border-radius:999px;font-weight:500;font-size:0.8rem;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;gap:6px;">
              <i class="bi bi-clipboard"></i>
            </button>
          </div>
          <div id="pwaShareStatus" style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:6px;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#pwaModalInstallBtn").addEventListener("click", () => {
      installApp();
      hideModal();
    });

    modal.querySelector("#pwaModalCloseBtn").addEventListener("click", () => {
      hideModal();
      markDismissed();
    });

    modal.querySelector("#pwaShareBtn").addEventListener("click", shareApp);
    modal.querySelector("#pwaCopyLinkBtn").addEventListener("click", copyAppUrl);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideModal();
        markDismissed();
      }
    });
  }

  function showBanner() {
    if (isInstalled || isStandalone() || isEmbedded() || hasDismissedRecently() || installPromptVisible) return;
    const banner = document.getElementById("pwaInstallBanner");
    if (banner) {
      banner.classList.add("show");
      installPromptVisible = true;
    }
  }

  function hideBanner() {
    const banner = document.getElementById("pwaInstallBanner");
    if (banner) {
      banner.classList.remove("show");
      installPromptVisible = false;
    }
  }

  function showModal() {
    if (isInstalled || isStandalone() || isEmbedded()) return;
    const modal = document.getElementById("pwaInstallModal");
    if (modal) {
      modal.classList.add("show");
    }
  }

  function hideModal() {
    const modal = document.getElementById("pwaInstallModal");
    if (modal) {
      modal.classList.remove("show");
    }
  }

  async function installApp() {
    if (!deferredPrompt) {
      showManualInstructions();
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("PWA instalado com sucesso");
      }
    } catch (err) {
      console.warn("Erro ao instalar PWA:", err);
    }

    deferredPrompt = null;
    hideBanner();
    hideModal();
  }

  function showManualInstructions() {
    const modal = document.getElementById("pwaInstallModal");
    if (!modal) return;

    const content = modal.querySelector(".pwa-install-modal");
    if (!content) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !isIOS;

    let steps = "";
    if (isIOS) {
      steps = `
        <div style="text-align:left;font-size:0.8rem;color:rgba(255,255,255,0.8);line-height:1.6;">
          <p><strong>Para instalar no iPhone/iPad:</strong></p>
          <ol style="padding-left:20px;margin:8px 0;">
            <li>Toque no botão <strong>Compartilhar</strong> <span style="font-size:1.2rem;">⎙</span> no Safari</li>
            <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
            <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
          </ol>
        </div>`;
    } else if (isAndroid && isChrome) {
      steps = `
        <div style="text-align:left;font-size:0.8rem;color:rgba(255,255,255,0.8);line-height:1.6;">
          <p><strong>Para instalar no Android:</strong></p>
          <ol style="padding-left:20px;margin:8px 0;">
            <li>Toque nos <strong>3 pontos</strong> ⋮ no navegador Chrome</li>
            <li>Toque em <strong>"Adicionar à tela inicial"</strong></li>
            <li>Toque em <strong>"Instalar"</strong></li>
          </ol>
        </div>`;
    } else {
      steps = `
        <div style="text-align:left;font-size:0.8rem;color:rgba(255,255,255,0.8);line-height:1.6;">
          <p><strong>Para instalar no computador:</strong></p>
          <ol style="padding-left:20px;margin:8px 0;">
            <li>Clique no ícone de <strong>instalar</strong> <span style="font-size:1.2rem;">↓</span> na barra de endereço</li>
            <li>Ou use o menu do navegador > <strong>"Instalar ${APP_NAME}"</strong></li>
          </ol>
        </div>`;
    }

    const currentContent = content.innerHTML;
    if (currentContent.includes("pwa-manual-install")) return;

    const manualDiv = document.createElement("div");
    manualDiv.id = "pwa-manual-install";
    manualDiv.style.cssText = "margin-top:16px;padding:12px;background:rgba(255,255,255,0.05);border-radius:12px;border:1px solid rgba(255,255,255,0.1);";
    manualDiv.innerHTML = `
      <div style="text-align:center;margin-bottom:8px;">
        <i class="bi bi-info-circle" style="font-size:1.2rem;color:#2ecc71;"></i>
        <span style="font-weight:600;font-size:0.85rem;margin-left:6px;">Instalação Manual</span>
      </div>
      ${steps}
    `;
    content.appendChild(manualDiv);
  }

  function addMenuButton() {
    if (isEmbedded()) return;
    if (document.getElementById("pwaMenuInstallBtn")) return;

    const sidebarNav = document.querySelector(".sidebar-nav > ul") || document.querySelector(".sidebar-nav");
    if (!sidebarNav) return;

    const installItem = document.createElement("li");
    installItem.innerHTML = `
      <button class="pwa-menu-install-btn" id="pwaMenuInstallBtn">
        <i class="bi bi-cloud-download"></i>
        <span>Instalar Aplicativo</span>
      </button>
    `;

    const firstItem = sidebarNav.querySelector("li");
    if (firstItem) {
      sidebarNav.insertBefore(installItem, firstItem);
    } else {
      sidebarNav.appendChild(installItem);
    }

    installItem.querySelector("#pwaMenuInstallBtn").addEventListener("click", () => {
      if (deferredPrompt) {
        installApp();
      } else {
        showModal();
      }
    });
  }

  function addStatusBar() {
    if (isEmbedded()) return;
    if (document.getElementById("pwaStatusBar")) return;

    const statusBar = document.createElement("div");
    statusBar.id = "pwaStatusBar";
    statusBar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:10001;text-align:center;padding:6px 12px;font-size:0.75rem;font-weight:600;font-family:'Inter',Arial,sans-serif;transition:all 0.3s ease;";

    function updateStatus() {
      if (navigator.onLine) {
        statusBar.style.background = "rgba(25,135,84,0.9)";
        statusBar.style.color = "white";
        statusBar.textContent = "Online - Dados sincronizados";
        setTimeout(() => { statusBar.style.transform = "translateY(-100%)"; }, 3000);
      } else {
        statusBar.style.background = "rgba(220,53,69,0.9)";
        statusBar.style.color = "white";
        statusBar.textContent = "Offline - Modo Campo Ativado";
        statusBar.style.transform = "translateY(0)";
      }
    }

    updateStatus();
    document.body.appendChild(statusBar);

    window.addEventListener("online", () => {
      updateStatus();
      if (window.CampoOfflineSync && typeof window.CampoOfflineSync.sync === "function") {
        window.CampoOfflineSync.sync();
      }
    });

    window.addEventListener("offline", updateStatus);
  }

  function handleBeforeInstallPrompt(e) {
    e.preventDefault();
    deferredPrompt = e;

    if (!isStandalone() && !isInstalled) {
      setTimeout(showBanner, 2000);
    }
  }

  function handleAppInstalled() {
    isInstalled = true;
    deferredPrompt = null;
    hideBanner();
    hideModal();

    const statusBar = document.createElement("div");
    statusBar.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#198754;color:white;padding:12px 24px;border-radius:999px;font-weight:700;font-size:0.9rem;z-index:10004;box-shadow:0 8px 24px rgba(0,0,0,0.3);font-family:'Inter',Arial,sans-serif;";
    statusBar.innerHTML = `<i class="bi bi-check-circle"></i> ${APP_NAME} instalado com sucesso!`;
    document.body.appendChild(statusBar);
    setTimeout(() => statusBar.remove(), 4000);
  }

  function checkServiceWorkerUpdate() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        reg.update();

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateNotification(reg);
            }
          });
        });
      });
    });
  }

  function showUpdateNotification(reg) {
    if (document.getElementById("pwaUpdateBanner")) return;

    const banner = document.createElement("div");
    banner.id = "pwaUpdateBanner";
    banner.style.cssText = "position:fixed;top:0;left:0;right:0;background:#0d6efd;color:white;padding:12px 20px;z-index:10005;text-align:center;font-family:'Inter',Arial,sans-serif;display:flex;align-items:center;justify-content:center;gap:12px;";
    banner.innerHTML = `
      <span style="font-weight:600;">Nova versão disponível!</span>
      <button id="pwaUpdateBtn" style="background:white;color:#0d6efd;border:none;padding:6px 16px;border-radius:999px;font-weight:700;cursor:pointer;">Atualizar</button>
      <button id="pwaUpdateClose" style="background:rgba(255,255,255,0.2);border:none;color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;">&times;</button>
    `;
    document.body.appendChild(banner);

    banner.querySelector("#pwaUpdateBtn").addEventListener("click", () => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      }
    });

    banner.querySelector("#pwaUpdateClose").addEventListener("click", () => {
      banner.remove();
    });
  }

  function getFullAppUrl() {
    return APP_URL + "instalar.html";
  }

  async function shareApp() {
    const url = getFullAppUrl();
    const text = `🌾 ${APP_NAME} - Sistema Agro Inteligente\n\nInstale o app no seu dispositivo para gerenciar sua fazenda online e offline.\n\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: APP_NAME, text: text, url: url });
        showShareStatus("Link compartilhado!", "rgba(46,204,113,0.8)");
      } catch (e) {
        if (e.name !== "AbortError") {
          fallbackShare(url);
        }
      }
    } else {
      fallbackShare(url);
    }
  }

  function fallbackShare(url) {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`🌾 ${APP_NAME} - Instale o app: ${url}`)}`;
    window.open(whatsappUrl, "_blank");
    showShareStatus("WhatsApp aberto em outra janela", "rgba(37,211,102,0.8)");
  }

  async function copyAppUrl() {
    const url = getFullAppUrl();
    try {
      await navigator.clipboard.writeText(url);
      showShareStatus("Link copiado! Envie para quem quiser.", "rgba(46,204,113,0.8)");
    } catch (e) {
      showShareStatus("Copie manualmente: " + url, "rgba(255,152,0,0.8)");
    }
  }

  function showShareStatus(msg, bg) {
    const el = document.getElementById("pwaShareStatus");
    if (!el) return;
    el.textContent = msg;
    el.style.cssText = `font-size:0.75rem;color:white;margin-top:6px;padding:4px 10px;border-radius:6px;background:${bg};transition:opacity 0.3s;`;
    setTimeout(() => { el.style.opacity = "0"; }, 4000);
  }

  function init() {
    if (isStandalone()) {
      isInstalled = true;
      return;
    }

    createStyles();
    createBanner();
    createModal();

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
          addMenuButton();
          addStatusBar();
          checkServiceWorkerUpdate();
        }, 500);
      });
    } else {
      setTimeout(() => {
        addMenuButton();
        addStatusBar();
        checkServiceWorkerUpdate();
      }, 500);
    }
  }

  window.CampoPWA = {
    install: installApp,
    showPrompt: showBanner,
    showModal: showModal,
    hidePrompt: hideBanner,
    isInstalled: () => isInstalled || isStandalone(),
    clearDismiss: clearDismissed
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
