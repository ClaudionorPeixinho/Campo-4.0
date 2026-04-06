const supabase = window.supabaseClient;
const form = document.getElementById("formEquipamento");
const formTela = document.getElementById("formTela");
const tabelaTela = document.getElementById("tabelaTela");
const tabela = document.getElementById("tabelaDados");

const filtroFrota = document.getElementById("fFrota");
const filtroModelo = document.getElementById("fModelo");

let editandoId = null;

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await salvar();
  });
}

async function salvar() {
  if (!confirm("Deseja salvar este equipamento?")) return;

  const dados = {
    frota: document.getElementById("frota").value,
    modelo: document.getElementById("modelo").value,
    operacao: document.getElementById("operacao").value,
    tag: document.getElementById("tag").value,
    categoria: document.getElementById("categoria").value,
  };

  if (editandoId) {
    await supabase.from("equipamentos").update(dados).eq("id", editandoId);
    editandoId = null;
  } else {
    await supabase.from("equipamentos").insert([dados]);
  }

  limparFormulario();
  carregar();
}

function mostrarTabela() {
  formTela.style.display = "none";
  tabelaTela.style.display = "block";
  carregar();
}

function voltarFormulario() {
  tabelaTela.style.display = "none";
  formTela.style.display = "block";
  limparFormulario();
}

function limparFormulario() {
  form.reset();
  editandoId = null;
}

async function carregar() {
  let query = supabase.from("equipamentos").select("*").order("id", { ascending: false });

  const frota = filtroFrota.value;
  const modelo = filtroModelo.value;

  if (frota) query = query.ilike("frota", `%${frota}%`);
  if (modelo) query = query.ilike("modelo", `%${modelo}%`);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    alert("Erro ao carregar equipamentos!");
    return;
  }

  tabela.innerHTML = "";

  data.forEach((item) => {
    tabela.innerHTML += `
      <tr>
        <td>${item.frota || ""}</td>
        <td>${item.modelo || ""}</td>
        <td>${item.operacao || ""}</td>
        <td>${item.tag || ""}</td>
        <td>${item.categoria || ""}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editar('${item.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="excluir('${item.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

window.editar = async function (id) {
  const { data } = await supabase.from("equipamentos").select("*").eq("id", id).single();

  if (!data) return;

  document.getElementById("frota").value = data.frota;
  document.getElementById("modelo").value = data.modelo;
  document.getElementById("operacao").value = data.operacao;
  document.getElementById("tag").value = data.tag;
  document.getElementById("categoria").value = data.categoria;

  editandoId = id;
  voltarFormulario();
};

window.excluir = async function (id) {
  if (!confirm("Deseja excluir este equipamento?")) return;

  await supabase.from("equipamentos").delete().eq("id", id);
  carregar();
};

function limparFiltros() {
  filtroFrota.value = "";
  filtroModelo.value = "";
  carregar();
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnFiltrar").addEventListener("click", carregar);
  document.getElementById("btnLimparFiltro").addEventListener("click", limparFiltros);
});
