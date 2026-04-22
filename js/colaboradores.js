document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("formColaborador");
const formTela = document.getElementById("formTela");
const tabelaTela = document.getElementById("tabelaTela");
const tabela = document.getElementById("tabelaDados");
const btnToggle = document.getElementById("btnToggle");
const btnFecharTabela = document.getElementById("btnFecharTabela");
const btnBuscarTabela = document.getElementById("btnBuscarTabela");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const filtroNome = document.getElementById("filtroNome");
const filtroFuncao = document.getElementById("filtroFuncao");
const filtroTurno = document.getElementById("filtroTurno");

let editId = null;

const campos = form.querySelectorAll("#formCampos input, #formCampos select, #formCampos textarea");

campos.forEach((campo, index) => {
campo.addEventListener("keydown", (e) => {
if (e.key !== "Enter") return;

e.preventDefault();
const proximoCampo = campos[index + 1];
if (proximoCampo) proximoCampo.focus();
});
});

function atualizarBotaoRegistros() {
if (!btnToggle) return;
btnToggle.innerHTML = '<i class="bi bi-table"></i> Registros';
}

function limparFormulario() {
form.reset();
editId = null;
}

function limparFiltros() {
filtroNome.value = "";
filtroFuncao.value = "";
filtroTurno.value = "";
carregarDados();
}

function preencherFormulario(item) {
Object.keys(item).forEach((key) => {
const campo = document.getElementById(key);
if (campo) {
campo.value = item[key] ?? "";
}
});
}

async function mostrarTabela() {
formTela.style.display = "none";
tabelaTela.style.display = "block";
await carregarDados();
}

function voltarFormulario() {
tabelaTela.style.display = "none";
formTela.style.display = "block";
atualizarBotaoRegistros();
}

async function carregarDados() {
const { data, error } = await supabaseClient
.from("colaboradores")
.select("*")
.order("id", { ascending: false });

if (error) {
console.error("Erro ao carregar colaboradores:", error);
alert("Erro ao carregar os registros.");
return;
}

const nomeFiltro = filtroNome.value.trim().toLowerCase();
const funcaoFiltro = filtroFuncao.value.trim().toLowerCase();
const turnoFiltro = filtroTurno.value.trim().toLowerCase();

const registrosFiltrados = data.filter((item) => {
const nomeValido = !nomeFiltro || (item.nome || "").toLowerCase().includes(nomeFiltro);
const funcaoValida = !funcaoFiltro || (item.funcao || "").toLowerCase().includes(funcaoFiltro);
const turnoValido = !turnoFiltro || (item.turno || "").toLowerCase() === turnoFiltro;

return nomeValido && funcaoValida && turnoValido;
});

tabela.innerHTML = "";

registrosFiltrados.forEach((item) => {
const tr = document.createElement("tr");

tr.innerHTML = `
<td>${item.matricula || ""}</td>
<td>${item.nome || ""}</td>
<td>${item.cpf || ""}</td>
<td>${item.funcao || ""}</td>
<td>${item.turno || ""}</td>
<td class="text-nowrap">
<button type="button" class="btn btn-sm btn-warning btn-editar" title="Editar" aria-label="Editar">
<i class="bi bi-pencil-square"></i>
</button>
<button type="button" class="btn btn-sm btn-danger btn-excluir" title="Excluir" aria-label="Excluir">
<i class="bi bi-trash"></i>
</button>
</td>
`;

tr.querySelector(".btn-editar").addEventListener("click", () => {
preencherFormulario(item);
editId = item.id;
voltarFormulario();
window.scrollTo(0, 0);
});

tr.querySelector(".btn-excluir").addEventListener("click", async () => {
const confirmar = window.confirm("Deseja excluir este colaborador?");
if (!confirmar) return;

const { error: deleteError } = await supabaseClient
.from("colaboradores")
.delete()
.eq("id", item.id);

if (deleteError) {
console.error("Erro ao excluir colaborador:", deleteError);
alert("Erro ao excluir o registro.");
return;
}

await carregarDados();
});

tabela.appendChild(tr);
});
}

async function salvarColaborador(e) {
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

const query = editId
? supabaseClient.from("colaboradores").update(dados).eq("id", editId)
: supabaseClient.from("colaboradores").insert([dados]);

const { error } = await query;

if (error) {
console.error("Erro ao salvar colaborador:", error);
alert("Erro ao salvar o colaborador.");
return;
}

limparFormulario();
voltarFormulario();
}

form.addEventListener("submit", salvarColaborador);
btnToggle?.addEventListener("click", mostrarTabela);
btnFecharTabela?.addEventListener("click", voltarFormulario);
btnBuscarTabela?.addEventListener("click", carregarDados);
btnLimparFiltros?.addEventListener("click", limparFiltros);

[filtroNome, filtroFuncao, filtroTurno].forEach((campo) => {
campo?.addEventListener("input", carregarDados);
campo?.addEventListener("change", carregarDados);
});

window.mostrarTabela = mostrarTabela;
window.voltarFormulario = voltarFormulario;
window.limparFormulario = limparFormulario;

atualizarBotaoRegistros();
voltarFormulario();
});
