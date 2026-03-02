document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("formPonto");
const tabela = document.querySelector("#tabelaRegistros tbody");
const btnToggle = document.getElementById("btnToggleRegistros");
const listaRegistros = document.getElementById("listaRegistros");

const filtroData = document.getElementById("filtroData");
const filtroFrota = document.getElementById("filtroFrota");
const filtroColaborador = document.getElementById("filtroColaborador");

const btnFiltrar = document.getElementById("btnFiltrar");
const btnLimpar = document.getElementById("btnLimparFiltro");

// ENTER navegação
const inputs = form.querySelectorAll("input, textarea");
inputs.forEach((input, index) => {
    input.addEventListener("keydown", function(e){
        if(e.key === "Enter"){
            e.preventDefault();
            if(index < inputs.length -1){
                inputs[index+1].focus();
            }
        }
    });
});

// SALVAR
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if(!confirm("Deseja salvar esse registro?")) return;

    const formData = new FormData(form);
    const dados = {};
    formData.forEach((v,k)=> dados[k] = v || null);

    const { error } = await supabaseClient
        .from("ponto_digital")
        .insert([dados]);

    if(error){
        alert("Erro: "+error.message);
    } else {
        alert("Salvo com sucesso!");
        form.reset();
        carregarRegistros();
    }
});

// CARREGAR REGISTROS
async function carregarRegistros(filtros = {}){

    let query = supabaseClient.from("ponto_digital").select("*").order("id",{ascending:false});

    if(filtros.data) query = query.eq("data_lancamento", filtros.data);
    if(filtros.frota) query = query.ilike("frota", `%${filtros.frota}%`);
    if(filtros.colaborador) query = query.ilike("colaborador", `%${filtros.colaborador}%`);

    const { data, error } = await query;

    if(error){
        alert(error.message);
        return;
    }

    tabela.innerHTML = "";

    data.forEach(reg => {

        const kmRodado = (reg.kmf || 0) - (reg.kmi || 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${reg.data_lancamento}</td>
            <td contenteditable="true">${reg.colaborador || ""}</td>
            <td contenteditable="true">${reg.frota || ""}</td>
            <td contenteditable="true">${reg.kmi || ""}</td>
            <td contenteditable="true">${reg.kmf || ""}</td>
            <td>${kmRodado}</td>
            <td>
                <button onclick="atualizar(${reg.id}, this)">💾</button>
                <button onclick="excluir(${reg.id})">🗑</button>
            </td>
        `;

        tabela.appendChild(tr);
    });
}

// ATUALIZAR
window.atualizar = async function(id, btn){

    const tr = btn.closest("tr");
    const dadosAtualizados = {
        colaborador: tr.children[1].innerText,
        frota: tr.children[2].innerText,
        kmi: tr.children[3].innerText,
        kmf: tr.children[4].innerText
    };

    const { error } = await supabaseClient
        .from("ponto_digital")
        .update(dadosAtualizados)
        .eq("id", id);

    if(error){
        alert(error.message);
    } else {
        alert("Atualizado!");
        carregarRegistros();
    }
}

// EXCLUIR
window.excluir = async function(id){

    if(!confirm("Deseja excluir?")) return;

    const { error } = await supabaseClient
        .from("ponto_digital")
        .delete()
        .eq("id", id);

    if(error){
        alert(error.message);
    } else {
        carregarRegistros();
    }
}

// FILTRO
btnFiltrar.addEventListener("click", ()=>{
    carregarRegistros({
        data: filtroData.value,
        frota: filtroFrota.value,
        colaborador: filtroColaborador.value
    });
});

btnLimpar.addEventListener("click", ()=>{
    filtroData.value="";
    filtroFrota.value="";
    filtroColaborador.value="";
    carregarRegistros();
});

// TOGGLE REGISTROS
btnToggle.addEventListener("click", ()=>{
    if(listaRegistros.style.display === "none"){
        listaRegistros.style.display = "block";
        btnToggle.innerText = "📋 Ocultar Registros";
        carregarRegistros();
    } else {
        listaRegistros.style.display = "none";
        btnToggle.innerText = "📋 Mostrar Registros";
    }
});

});