document.addEventListener("DOMContentLoaded", () => {
const supabase = window.supabaseClient;

if (!supabase) {
alert("Supabase não está carregado.");
console.error("supabaseClient não encontrado no window.");
return;
}

const form = document.getElementById("formEquipamento");
const formTela = document.getElementById("formTela");
const tabelaTela = document.getElementById("tabelaTela");
const tabela = document.getElementById("tabelaDados");
const btnToggle = document.getElementById("btnToggle");
const btnFecharTabela = document.getElementById("btnFecharTabela");
const btnBuscarTabela = document.getElementById("btnBuscarTabela");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const filtroFrota = document.getElementById("filtroFrota");
const filtroModelo = document.getElementById("filtroModelo");

let editandoId = null;

const campos = form.querySelectorAll("#formCampos input, #formCampos select");

campos.forEach((campo, index) => {
campo.addEventListener("keydown", (e) => {
if (e.key !== "Enter") return;

e.preventDefault();
const proximoCampo = campos[index + 1];
if (proximoCampo) proximoCampo.focus();
});
});

function limparFormulario() {
form.reset();
editandoId = null;
}

function limparFiltros() {
filtroFrota.value = "";
filtroModelo.value = "";
carregarTabela();
}

function preencherFormulario(item) {
document.getElementById("frota").value = item.frota || "";
document.getElementById("modelo").value = item.modelo || "";
document.getElementById("operacao").value = item.operacao || "";
document.getElementById("tag").value = item.tag || "";
document.getElementById("categoria").value = item.categoria || "";
}

async function mostrarTabela() {
formTela.style.display = "none";
tabelaTela.style.display = "block";
await carregarTabela();
}

function voltarFormulario() {
tabelaTela.style.display = "none";
formTela.style.display = "block";
}

function montarLinha(item) {
const tr = document.createElement("tr");

tr.innerHTML = `
<td>${item.frota || ""}</td>
<td>${item.modelo || ""}</td>
<td>${item.operacao || ""}</td>
<td>${item.tag || ""}</td>
<td>${item.categoria || ""}</td>
<td class="acoes-tabela">
<button type="button" class="btn btn-warning btn-sm btn-editar" title="Editar" aria-label="Editar">
<i class="bi bi-pencil-square"></i>
</button>
<button type="button" class="btn btn-danger btn-sm btn-excluir" title="Excluir" aria-label="Excluir">
<i class="bi bi-trash"></i>
</button>
</td>
`;

tr.querySelector(".btn-editar").addEventListener("click", () => {
preencherFormulario(item);
editandoId = item.id;
voltarFormulario();
window.scrollTo({ top: 0, behavior: "smooth" });
});

tr.querySelector(".btn-excluir").addEventListener("click", async () => {
if (!confirm("Deseja excluir este equipamento?")) return;

const { error } = await supabase
.from("equipamentos")
.delete()
.eq("id", item.id);

if (error) {
console.error("Erro ao excluir equipamento:", error);
alert("Erro ao excluir o registro.");
return;
}

await carregarTabela();
});

return tr;
}

async function carregarTabela() {
let query = supabase
.from("equipamentos")
.select("*")
.order("id", { ascending: false });

const frota = filtroFrota.value.trim();
const modelo = filtroModelo.value.trim();

if (frota) query = query.ilike("frota", `%${frota}%`);
if (modelo) query = query.ilike("modelo", `%${modelo}%`);

const { data, error } = await query;

if (error) {
console.error("Erro ao carregar equipamentos:", error);
alert("Erro ao carregar os registros.");
return;
}

tabela.innerHTML = "";

if (!data || data.length === 0) {
tabela.innerHTML = '<tr><td colspan="6" class="text-center py-3">Nenhum registro encontrado.</td></tr>';
return;
}

data.forEach((item) => {
tabela.appendChild(montarLinha(item));
});
}

async function salvar(e) {
e.preventDefault();

const dados = {
frota: document.getElementById("frota").value,
modelo: document.getElementById("modelo").value,
operacao: document.getElementById("operacao").value,
tag: document.getElementById("tag").value,
categoria: document.getElementById("categoria").value
};

const operacao = editandoId
? supabase.from("equipamentos").update(dados).eq("id", editandoId)
: null;

if (editandoId && !navigator.onLine) {
alert("Edicoes exigem internet. O registro original ainda esta no Supabase.");
return;
}

const resposta = editandoId
? await operacao
: window.CampoOfflineSync
? await window.CampoOfflineSync.saveInsert("equipamentos", dados)
: await supabase.from("equipamentos").insert([dados]);

const { error } = resposta;

if (error) {
console.error("Erro ao salvar equipamento:", error);
alert("Erro ao salvar o equipamento.");
return;
}

limparFormulario();
voltarFormulario();
if (resposta.offline) alert("Salvo offline. Use Sincronizar quando tiver internet.");
}

form.addEventListener("submit", salvar);
btnToggle?.addEventListener("click", mostrarTabela);
btnFecharTabela?.addEventListener("click", voltarFormulario);
btnBuscarTabela?.addEventListener("click", carregarTabela);
btnLimparFiltros?.addEventListener("click", limparFiltros);

[filtroFrota, filtroModelo].forEach((campo) => {
campo?.addEventListener("input", carregarTabela);
});

window.mostrarTabela = mostrarTabela;
window.voltarFormulario = voltarFormulario;
window.limparFormulario = limparFormulario;

limparFormulario();
voltarFormulario();
});
