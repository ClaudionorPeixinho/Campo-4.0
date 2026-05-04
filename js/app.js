const SUPABASE_URL = "https://szzfqkhibuejhodhkvjj.supabase.co";
const SUPABASE_KEY = "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_";

const client = window.supabaseClient || supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabaseClient = client;

let editandoId = null;

// TROCA DE TELAS
function mostrarTabela() {
  document.getElementById("formTela").classList.add("hidden");
  document.getElementById("tabelaBox").classList.remove("hidden");
  carregar();
}

function voltarFormulario() {
  document.getElementById("formTela").classList.remove("hidden");
  document.getElementById("tabelaBox").classList.add("hidden");
}

// LIMPAR FORM (CORRIGIDO)
function limparFormulario() {
  document.querySelectorAll("#formCampos input, #formCampos select").forEach(campo => {
    campo.value = "";
  });

  document.getElementById("combustivel").value = "Diesel";

  editandoId = null;
}

// ENTER PULA CAMPOS
document.addEventListener("DOMContentLoaded", () => {
  const campos = document.querySelectorAll("#formCampos input, #formCampos select");

  campos.forEach((campo, index) => {
    campo.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const proximo = campos[index + 1];
        if (proximo) proximo.focus();
      }
    });
  });
});

// SALVAR
async function salvar() {

  const dados = {
    equipamento: equipamento.value,
    operador: operador.value,
    local_abastecimento: local.value,
    nome_abastecedor: abastecedor.value,
    combustivel: combustivel.value,
    quantidade: quantidade.value,
    data_hora: data.value,
    horimetro: horimetro.value,
    observacoes: obs.value
  };

  let resposta;

  if (editandoId) {
    if (!navigator.onLine) {
      alert("Edicoes exigem internet. O registro original ainda esta no Supabase.");
      return;
    }
    resposta = await client.from("abastecimentos").update(dados).eq("id", editandoId);
  } else {
    resposta = window.CampoOfflineSync
      ? await window.CampoOfflineSync.saveInsert("abastecimentos", dados)
      : await client.from("abastecimentos").insert([dados]);
  }

  if (resposta?.error) {
    alert("Erro ao salvar: " + resposta.error.message);
    return;
  }

  alert(resposta?.offline ? "Salvo offline. Use Sincronizar quando tiver internet." : "Salvo com sucesso!");

  limparFormulario();
}

// CARREGAR (CORRIGIDO)
async function carregar() {

  let query = client.from("abastecimentos").select("*");

  const eq = document.getElementById("filtroEquipamento").value;
  const op = document.getElementById("filtroOperador").value;
  const comb = document.getElementById("filtroCombustivel").value;

  if (eq) query = query.ilike("equipamento", `%${eq}%`);
  if (op) query = query.ilike("operador", `%${op}%`);
  if (comb) query = query.eq("combustivel", comb);

  const { data } = await query.order("id", { ascending: false });

  const tabela = document.getElementById("tabela");
  tabela.innerHTML = "";

  data.forEach(item => {
    tabela.innerHTML += `
      <tr>
        <td>${item.id}</td>
        <td>${item.equipamento}</td>
        <td>${item.operador}</td>
        <td>${item.combustivel}</td>
        <td>${item.quantidade}</td>
        <td>${new Date(item.data_hora).toLocaleString()}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick='editar(${JSON.stringify(item)})'>
            ✏️
          </button>
          <button class="btn btn-danger btn-sm" onclick="excluir(${item.id})">
            🗑️
          </button>
        </td>
      </tr>
    `;
  });
}

// EDITAR
function editar(item) {
  equipamento.value = item.equipamento;
  operador.value = item.operador;
  local.value = item.local_abastecimento || "";
  abastecedor.value = item.nome_abastecedor || "";
  combustivel.value = item.combustivel;
  quantidade.value = item.quantidade;
  data.value = item.data_hora;
  horimetro.value = item.horimetro;
  obs.value = item.observacoes;

  editandoId = item.id;

  voltarFormulario();
}

// EXCLUIR
async function excluir(id) {
  if (!confirm("Deseja excluir?")) return;

  await client.from("abastecimentos").delete().eq("id", id);

  carregar();
}

// LIMPAR FILTROS
function limparFiltros() {
  document.querySelectorAll("#filtros input").forEach(i => i.value = "");
  document.getElementById("filtroCombustivel").value = "";
  carregar();
}
