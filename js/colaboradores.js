document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("formColaborador");
const tabela = document.getElementById("tabelaDados");
const tabelaCard = document.getElementById("tabelaCard");
const btnToggle = document.getElementById("btnToggle");

let editId = null;

// ENTER pula campo
const campos = form.querySelectorAll("input, textarea");
campos.forEach((campo, index) => {
campo.addEventListener("keypress", function(e) {
if (e.key === "Enter") {
e.preventDefault();
const proximo = campos[index + 1];
if (proximo) proximo.focus();
}
});
});

// MOSTRAR/OCULTAR
btnToggle.addEventListener("click", () => {
if (tabelaCard.style.display === "none") {
tabelaCard.style.display = "block";
btnToggle.textContent = "Ocultar Registros";
carregarDados();
} else {
tabelaCard.style.display = "none";
btnToggle.textContent = "Mostrar Registros";
}
});

// SALVAR
form.addEventListener("submit", async (e) => {
e.preventDefault();

const dados = {
matricula: matricula.value,
nome: nome.value,
apelido: apelido.value,
cpf: cpf.value,
rg: rg.value,
cnh: cnh.value,
categoria_cnh: categoria_cnh.value,
telefone: telefone.value,
email: email.value,
funcao: funcao.value,
turno: turno.value,
data_admissao: data_admissao.value,
observacao: observacao.value
};

if (editId) {
await supabaseClient.from("colaboradores").update(dados).eq("id", editId);
editId = null;
} else {
await supabaseClient.from("colaboradores").insert([dados]);
}

form.reset();
carregarDados();
});

// CARREGAR
async function carregarDados() {

const { data } = await supabaseClient
.from("colaboradores")
.select("*")
.order("id", { ascending:false });

tabela.innerHTML = "";

data.forEach(item => {

const tr = document.createElement("tr");

tr.innerHTML = `
<td>${item.matricula}</td>
<td>${item.nome}</td>
<td>${item.cpf}</td>
<td>${item.funcao}</td>
<td>${item.turno}</td>
<td>
<button class="btn btn-sm btn-warning">Editar</button>
<button class="btn btn-sm btn-danger">Excluir</button>
</td>
`;

tr.querySelector(".btn-warning").addEventListener("click", () => {
Object.keys(item).forEach(key => {
if(document.getElementById(key)){
document.getElementById(key).value = item[key];
}
});
editId = item.id;
window.scrollTo(0,0);
});

tr.querySelector(".btn-danger").addEventListener("click", async () => {
await supabaseClient.from("colaboradores").delete().eq("id", item.id);
carregarDados();
});

tabela.appendChild(tr);

});

}

});