// CONFIG
const SUPABASE_URL = "https://szzfqkhibuejhodhkvjj.supabase.co";
const SUPABASE_KEY = "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let editandoId = null;

// ELEMENTOS
const form = document.getElementById("formApontamento");
const formTela = document.getElementById("formTela");
const tabelaTela = document.getElementById("tabelaTela");
const tabela = document.getElementById("tabela");

// =========================
// TROCA DE TELA
// =========================
function mostrarTabela() {
  formTela.style.display = "none";
  tabelaTela.style.display = "block";
  carregar();
}

function voltarFormulario() {
  tabelaTela.style.display = "none";
  formTela.style.display = "block";
}

// =========================
// SALVAR
// =========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const dados = {
      data_lancamento: document.getElementById("data_lancamento").value,
      turno: document.getElementById("turno").value,
      frota: document.getElementById("frota").value,
      motorista: document.getElementById("motorista").value,
      lider_gestor: document.getElementById("lider_gestor").value,
      saida: document.getElementById("saida").value,
      hora_saida: document.getElementById("hora_saida").value,
      destino: document.getElementById("destino").value,
      hora_chegada: document.getElementById("hora_chegada").value,
      peso_liquido: document.getElementById("peso_liquido").value,
      peso_bruto: document.getElementById("peso_bruto").value,
      informacoes_adicionais: document.getElementById("informacoes_adicionais").value
    };

    // VALIDAÇÃO SIMPLES
    if (!dados.data_lancamento || !dados.turno || !dados.frota) {
      alert("Preencha os campos obrigatórios!");
      return;
    }

    let resposta;

    if (editandoId) {
      resposta = await client
        .from("apontamentos_entrega")
        .update(dados)
        .eq("id", editandoId);
    } else {
      resposta = await client
        .from("apontamentos_entrega")
        .insert([dados]);
    }

    if (resposta.error) {
      console.error(resposta.error);
      alert("Erro ao salvar!");
      return;
    }

    alert("Salvo com sucesso!");

    limparFormulario();

  } catch (erro) {
    console.error(erro);
    alert("Erro inesperado!");
  }
});

// =========================
// LIMPAR FORM
// =========================
function limparFormulario() {
  form.reset();
  editandoId = null;
}

// =========================
// CARREGAR DADOS
// =========================
async function carregar() {

  try {
    let query = client.from("apontamentos_entrega").select("*");

    const fFrota = document.getElementById("fFrota").value;
    const fMotorista = document.getElementById("fMotorista").value;
    const fTurno = document.getElementById("fTurno").value;

    if (fFrota) query = query.ilike("frota", `%${fFrota}%`);
    if (fMotorista) query = query.ilike("motorista", `%${fMotorista}%`);
    if (fTurno) query = query.eq("turno", fTurno);

    const { data, error } = await query.order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar dados!");
      return;
    }

    tabela.innerHTML = "";

    data.forEach(item => {
      tabela.innerHTML += `
        <tr>
          <td>${item.id}</td>
          <td>${item.data_lancamento}</td>
          <td>${item.frota}</td>
          <td>${item.motorista}</td>
          <td>${item.destino}</td>
          <td>${item.peso_liquido}</td>
          <td>
            <button class="btn btn-warning btn-sm" onclick='editar(${JSON.stringify(item)})'>✏️</button>
            <button class="btn btn-danger btn-sm" onclick="excluir(${item.id})">🗑️</button>
          </td>
        </tr>
      `;
    });

  } catch (erro) {
    console.error(erro);
  }
}

// =========================
// LIMPAR FILTROS
// =========================
function limparFiltros() {
  document.getElementById("fFrota").value = "";
  document.getElementById("fMotorista").value = "";
  document.getElementById("fTurno").value = "";
  carregar();
}

// =========================
// EDITAR
// =========================
function editar(item) {

  document.getElementById("data_lancamento").value = item.data_lancamento;
  document.getElementById("turno").value = item.turno;
  document.getElementById("frota").value = item.frota;
  document.getElementById("motorista").value = item.motorista;
  document.getElementById("lider_gestor").value = item.lider_gestor;
  document.getElementById("saida").value = item.saida;
  document.getElementById("hora_saida").value = item.hora_saida;
  document.getElementById("destino").value = item.destino;
  document.getElementById("hora_chegada").value = item.hora_chegada;
  document.getElementById("peso_liquido").value = item.peso_liquido;
  document.getElementById("peso_bruto").value = item.peso_bruto;
  document.getElementById("informacoes_adicionais").value = item.informacoes_adicionais;

  editandoId = item.id;

  voltarFormulario();
}

// =========================
// EXCLUIR
// =========================
async function excluir(id) {
  if (!confirm("Deseja excluir?")) return;

  const { error } = await client
    .from("apontamentos_entrega")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erro ao excluir!");
    return;
  }

  carregar();
}

// =========================
// ENTER PULA CAMPOS (CORRIGIDO)
// =========================
document.addEventListener("DOMContentLoaded", () => {

  const campos = document.querySelectorAll("#formCampos input, #formCampos select");

  campos.forEach((campo, index) => {
    campo.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();

        const proximo = campos[index + 1];
        if (proximo) {
          proximo.focus();
        }
      }
    });
  });

});