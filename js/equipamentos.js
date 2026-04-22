document.addEventListener("DOMContentLoaded", () => {

const supabase = window.supabaseClient;

if (!supabase) {
    alert("Supabase não está carregado!");
    console.error("supabaseClient não encontrado no window.");
    return;
}

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

    try {

        if(editandoId){

            const { error } = await supabase
                .from("equipamentos")
                .update(dados)
                .eq("id", editandoId);

            if (error) throw error;

            alert("Equipamento atualizado com sucesso!");
            editandoId = null;

        } else {

            const { error } = await supabase
                .from("equipamentos")
                .insert([dados]);

            if (error) throw error;

            alert("Equipamento salvo com sucesso!");
        }

        form.reset();
        carregarTabela();

    } catch (err) {
        console.error("ERRO AO SALVAR:", err);
        alert("Erro ao salvar: " + err.message);
    }
});

/* ============================= */
/* MOSTRAR REGISTROS */
/* ============================= */
document.getElementById("btnMostrar").addEventListener("click", ()=>{
    areaTabela.style.display="block";
    carregarTabela();
});

/* ============================= */
/* CARREGAR TABELA */
/* ============================= */
async function carregarTabela(){

    try {
        const { data, error } = await supabase
            .from("equipamentos")
            .select("*")
            .order("frota", { ascending: true });

        if (error) throw error;

        tabela.innerHTML = "";

        if (!data || data.length === 0) {
            tabela.innerHTML = `<tr><td colspan="6">Nenhum registro encontrado</td></tr>`;
            return;
        }

        data.forEach(item=>{
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

    } catch (err) {
        console.error("ERRO AO CARREGAR:", err);
        alert("Erro ao carregar dados: " + err.message);
    }
}

/* ============================= */
/* EDITAR */
/* ============================= */
window.editar = async function(id){

    try {
        const { data, error } = await supabase
            .from("equipamentos")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        document.getElementById("frota").value = data.frota || "";
        document.getElementById("modelo").value = data.modelo || "";
        document.getElementById("operacao").value = data.operacao || "";
        document.getElementById("tag").value = data.tag || "";
        document.getElementById("categoria").value = data.categoria || "";

        editandoId = id;

        window.scrollTo({top:0, behavior:"smooth"});

    } catch (err) {
        console.error("ERRO AO EDITAR:", err);
        alert("Erro ao carregar registro: " + err.message);
    }
}

/* ============================= */
/* EXCLUIR */
/* ============================= */
window.excluir = async function(id){

    if(!confirm("Deseja excluir este equipamento?")) return;

    try {
        const { error } = await supabase
            .from("equipamentos")
            .delete()
            .eq("id", id);

        if (error) throw error;

        alert("Excluído com sucesso!");
        carregarTabela();

    } catch (err) {
        console.error("ERRO AO EXCLUIR:", err);
        alert("Erro ao excluir: " + err.message);
    }
}

/* ============================= */
/* FILTRAR */
/* ============================= */
document.getElementById("btnFiltrar").addEventListener("click", async ()=>{

    const frota = document.getElementById("filtroFrota").value;
    const modelo = document.getElementById("filtroModelo").value;

    try {

        let query = supabase.from("equipamentos").select("*");

        if(frota) query = query.ilike("frota", `%${frota}%`);
        if(modelo) query = query.ilike("modelo", `%${modelo}%`);

        const { data, error } = await query;

        if (error) throw error;

        tabela.innerHTML = "";

        data.forEach(item=>{
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

    } catch (err) {
        console.error("ERRO AO FILTRAR:", err);
        alert("Erro ao filtrar: " + err.message);
    }
});

/* ============================= */
/* LIMPAR FILTRO */
/* ============================= */
document.getElementById("btnLimparFiltro").addEventListener("click", ()=>{
    document.getElementById("filtroFrota").value = "";
    document.getElementById("filtroModelo").value = "";
    carregarTabela();
});

});