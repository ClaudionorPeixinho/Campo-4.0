document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("formApontamento");
const areaTabela = document.getElementById("areaTabela");
const tabelaContainer = document.getElementById("tabelaContainer");
const btnMostrar = document.getElementById("btnMostrar");

let editId = null;

/* ENTER pula campo */
const campos = form.querySelectorAll("input, select");
campos.forEach((campo, index) => {
    campo.addEventListener("keydown", function(e){
        if(e.key === "Enter"){
            e.preventDefault();
            if(campos[index + 1]){
                campos[index + 1].focus();
            } else {
                form.requestSubmit();
            }
        }
    });
});

/* SALVAR */
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
        data_lancamento: data_lancamento.value,
        turno: turno.value,
        frota: frota.value,
        motorista: motorista.value,
        lider_gestor: lider_gestor.value,
        saida: saida.value,
        hora_saida: hora_saida.value,
        destino: destino.value,
        hora_chegada: hora_chegada.value,
        peso_liquido: peso_liquido.value,
        peso_bruto: peso_bruto.value,
        informacoes_adicionais: informacoes_adicionais.value
    };

    if(editId){
        await supabaseClient.from("apontamento_entrega_cana")
            .update(dados).eq("id", editId);
        editId = null;
    } else {
        await supabaseClient.from("apontamento_entrega_cana")
            .insert([dados]);
    }

    form.reset();
    carregarDados();
});

/* MOSTRAR TABELA */
btnMostrar.addEventListener("click", () => {
    areaTabela.style.display =
        areaTabela.style.display === "none" ? "block" : "none";
    carregarDados();
});

/* CARREGAR DADOS */
async function carregarDados(){

    const { data } = await supabaseClient
        .from("apontamento_entrega_cana")
        .select("*")
        .order("id", { ascending:false });

    let html = `
    <table class="table table-striped table-bordered">
    <thead class="table-success">
    <tr>
    <th>Data</th>
    <th>Frota</th>
    <th>Motorista</th>
    <th>Saída</th>
    <th>Chegada</th>
    <th>Peso Líq</th>
    <th>Ações</th>
    </tr>
    </thead>
    <tbody>`;

    data.forEach(item => {
        html += `
        <tr>
        <td>${item.data_lancamento}</td>
        <td>${item.frota}</td>
        <td>${item.motorista}</td>
        <td>${item.hora_saida}</td>
        <td>${item.hora_chegada}</td>
        <td>${item.peso_liquido}</td>
        <td>
        <button onclick="editar(${item.id})" class="btn btn-warning btn-sm">✏</button>
        <button onclick="excluir(${item.id})" class="btn btn-danger btn-sm">🗑</button>
        </td>
        </tr>`;
    });

    html += "</tbody></table>";
    tabelaContainer.innerHTML = html;
}

/* EDITAR */
window.editar = async (id) => {
    const { data } = await supabaseClient
        .from("apontamento_entrega_cana")
        .select("*").eq("id", id).single();

    Object.keys(data).forEach(key=>{
        if(document.getElementById(key)){
            document.getElementById(key).value = data[key];
        }
    });

    editId = id;
    window.scrollTo(0,0);
};

/* EXCLUIR */
window.excluir = async (id) => {
    await supabaseClient
        .from("apontamento_entrega_cana")
        .delete().eq("id", id);

    carregarDados();
};

});