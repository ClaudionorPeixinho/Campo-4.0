<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", () => {

const supabase = window.supabaseClient;
const form = document.getElementById("formEquipamento");
const tabela = document.getElementById("tabelaDados");
const areaTabela = document.getElementById("areaTabela");

let editandoId = null;

/* ============================= */
/* SALVAR */
/* ============================= */
form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const dados = {
        frota: document.getElementById("frota").value,
        modelo: document.getElementById("modelo").value,
        operacao: document.getElementById("operacao").value,
        tag: document.getElementById("tag").value,
        categoria: document.getElementById("categoria").value
    };

    if(editandoId){
        await supabase.from("equipamentos")
        .update(dados)
        .eq("id", editandoId);
        editandoId = null;
    }else{
        await supabase.from("equipamentos")
        .insert([dados]);
    }

    form.reset();
    carregarTabela();
});

/* ============================= */
/* MOSTRAR REGISTROS */
/* ============================= */
document.getElementById("btnMostrar").addEventListener("click", ()=>{
    areaTabela.style.display="block";
    carregarTabela();
});

/* ============================= */
/* CARREGAR */
/* ============================= */
async function carregarTabela(){

    const { data } = await supabase
        .from("equipamentos")
        .select("*")
        .order("frota");

    tabela.innerHTML="";

    data.forEach(item=>{
        tabela.innerHTML+=`
        <tr>
            <td>${item.frota}</td>
            <td>${item.modelo}</td>
            <td>${item.operacao}</td>
            <td>${item.tag || ""}</td>
            <td>${item.categoria}</td>
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

/* ============================= */
/* EDITAR */
/* ============================= */
window.editar = async function(id){

    const { data } = await supabase
        .from("equipamentos")
        .select("*")
        .eq("id", id)
        .single();

    document.getElementById("frota").value = data.frota;
    document.getElementById("modelo").value = data.modelo;
    document.getElementById("operacao").value = data.operacao;
    document.getElementById("tag").value = data.tag;
    document.getElementById("categoria").value = data.categoria;

    editandoId = id;
    window.scrollTo({top:0,behavior:"smooth"});
}

/* ============================= */
/* EXCLUIR */
/* ============================= */
window.excluir = async function(id){
    if(confirm("Deseja excluir este equipamento?")){
        await supabase.from("equipamentos")
        .delete()
        .eq("id", id);
        carregarTabela();
    }
}

/* ============================= */
/* FILTROS */
/* ============================= */
document.getElementById("btnFiltrar").addEventListener("click", async ()=>{

    const frota = document.getElementById("filtroFrota").value;
    const modelo = document.getElementById("filtroModelo").value;

    let query = supabase.from("equipamentos").select("*");

    if(frota) query = query.ilike("frota", `%${frota}%`);
    if(modelo) query = query.ilike("modelo", `%${modelo}%`);

    const { data } = await query;

    tabela.innerHTML="";

    data.forEach(item=>{
        tabela.innerHTML+=`
        <tr>
            <td>${item.frota}</td>
            <td>${item.modelo}</td>
            <td>${item.operacao}</td>
            <td>${item.tag || ""}</td>
            <td>${item.categoria}</td>
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
});

document.getElementById("btnLimparFiltro").addEventListener("click", ()=>{
    document.getElementById("filtroFrota").value="";
    document.getElementById("filtroModelo").value="";
    carregarTabela();
});

});
=======
const db = window.supabase;

let editandoId = null;

// SALVAR
document.getElementById("formEquipamento").addEventListener("submit", async (e) => {
  e.preventDefault();

  const dados = {
    frota: document.getElementById("frota").value.trim(),
    modelo: document.getElementById("modelo").value.trim(),
    operacao: document.getElementById("operacao").value.trim(),
    tag: document.getElementById("tag").value.trim(),
    categoria: document.getElementById("categoria").value
  };

  if (!dados.frota || !dados.modelo || !dados.operacao || !dados.categoria) {
    alert("Preencha os campos obrigatórios!");
    return;
  }

  let response;

  if (editandoId) {
    response = await db.from("equipamentos")
      .update(dados)
      .eq("id", editandoId);
  } else {
    response = await db.from("equipamentos")
      .insert([dados]);
  }

  if (response.error) {
    console.error(response.error);
    alert("Erro ao salvar: " + response.error.message);
    return;
  }

  alert("Salvo com sucesso!");
  limparFormulario();
  carregar();
});

// LIMPAR
function limparFormulario() {
  document.getElementById("formEquipamento").reset();
  editandoId = null;
}

// MOSTRAR TABELA
function mostrarTabela() {
  document.getElementById("formTela").style.display = "none";
  document.getElementById("tabelaTela").style.display = "block";
  carregar();
}

// VOLTAR
function voltarFormulario() {
  document.getElementById("formTela").style.display = "block";
  document.getElementById("tabelaTela").style.display = "none";
}

// FILTROS
function limparFiltros() {
  document.getElementById("fFrota").value = "";
  document.getElementById("fModelo").value = "";
  carregar();
}

// CARREGAR DADOS (CORRIGIDO)
async function carregar() {

  let query = db.from("equipamentos").select("*");

  const frota = document.getElementById("fFrota").value;
  const modelo = document.getElementById("fModelo").value;

  if (frota) query = query.ilike("frota", `%${frota}%`);
  if (modelo) query = query.ilike("modelo", `%${modelo}%`);

  const { data, error } = await query.order("id", { ascending: false });

  if (error) {
    console.error(error);
    alert("Erro ao buscar dados");
    return;
  }

  const tabela = document.getElementById("tabelaDados");
  tabela.innerHTML = "";

  if (!data || data.length === 0) {
    tabela.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum registro encontrado</td></tr>`;
    return;
  }

  data.forEach(item => {
    tabela.innerHTML += `
      <tr>
        <td>${item.frota}</td>
        <td>${item.modelo}</td>
        <td>${item.operacao}</td>
        <td>${item.tag || "-"}</td>
        <td>${item.categoria}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editar(${item.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deletar(${item.id})">Excluir</button>
        </td>
      </tr>
    `;
  });
}

// EDITAR
async function editar(id) {
  const { data, error } = await db
    .from("equipamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Erro ao carregar registro");
    return;
  }

  document.getElementById("frota").value = data.frota;
  document.getElementById("modelo").value = data.modelo;
  document.getElementById("operacao").value = data.operacao;
  document.getElementById("tag").value = data.tag;
  document.getElementById("categoria").value = data.categoria;

  editandoId = id;
  voltarFormulario();
}

// DELETAR
async function deletar(id) {
  if (!confirm("Deseja excluir?")) return;

  const { error } = await db
    .from("equipamentos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erro ao excluir");
    return;
  }

  carregar();
}
>>>>>>> 09689ff7f5569d4753de7f810a4817f41419e92d
