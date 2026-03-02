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