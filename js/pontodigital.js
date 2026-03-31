const form = document.getElementById("formPonto");
const formTela = document.getElementById("formTela");
const tabelaCard = document.getElementById("tabelaCard");
const tabela = document.getElementById("tabelaDados");

const filtroData = document.getElementById("filtroData");
const filtroFrota = document.getElementById("filtroFrota");
const filtroColaborador = document.getElementById("filtroColaborador");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await salvar();
  });
}

async function salvar(event) {
  if (event) event.preventDefault();

  if (!confirm("Deseja salvar esse registro?")) return;

  const dados = {
    data_lancamento: document.getElementById("data_lancamento").value,
    hi_jornada: document.getElementById("hi_jornada").value,
    hf_jornada: document.getElementById("hf_jornada").value,
    colaborador: document.getElementById("colaborador").value,
    matricula: document.getElementById("matricula").value,
    funcao: document.getElementById("funcao").value,
    frota: document.getElementById("frota").value,
    kmi: document.getElementById("kmi").value,
    kmf: document.getElementById("kmf").value,
    fazenda_lote: document.getElementById("fazenda_lote").value,
    turno: document.getElementById("turno").value,
    lider: document.getElementById("lider").value,
    informacao: document.getElementById("informacao").value,
  };

  const { error } = await supabaseClient.from("ponto_digital").insert([dados]);

  if (error) {
    alert("Erro: " + error.message);
  } else {
    alert("Salvo com sucesso!");
    form.reset();
    if (!tabelaCard.classList.contains("hidden")) {
      carregar();
    }
  }
}

async function carregar() {
  await carregarRegistros({
    data: filtroData.value,
    frota: filtroFrota.value,
    colaborador: filtroColaborador.value,
  });
}

async function carregarRegistros(filtros = {}) {
  let query = supabaseClient.from("ponto_digital").select("*");

  if (filtros.data) query = query.eq("data_lancamento", filtros.data);
  if (filtros.frota) query = query.ilike("frota", `%${filtros.frota}%`);
  if (filtros.colaborador) query = query.ilike("colaborador", `%${filtros.colaborador}%`);

  const { data, error } = await query.order("id", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  tabela.innerHTML = "";

  data.forEach((reg) => {
    const kmi = Number(reg.kmi) || 0;
    const kmf = Number(reg.kmf) || 0;
    const kmRodado = kmf - kmi;

    tabela.innerHTML += `
      <tr>
        <td>${reg.data_lancamento || ""}</td>
        <td>${reg.colaborador || ""}</td>
        <td>${reg.frota || ""}</td>
        <td>${reg.kmi || ""}</td>
        <td>${reg.kmf || ""}</td>
        <td>${kmRodado}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="atualizar(${reg.id}, this)">💾</button>
          <button class="btn btn-sm btn-danger" onclick="excluir(${reg.id})">🗑</button>
        </td>
      </tr>
    `;
  });
}

window.atualizar = async function (id, btn) {
  const tr = btn.closest("tr");
  const dadosAtualizados = {
    colaborador: tr.children[1].innerText,
    frota: tr.children[2].innerText,
    kmi: tr.children[3].innerText,
    kmf: tr.children[4].innerText,
  };

  const { error } = await supabaseClient
    .from("ponto_digital")
    .update(dadosAtualizados)
    .eq("id", id);

  if (error) {
    alert(error.message);
  } else {
    alert("Atualizado!");
    carregar();
  }
};

window.excluir = async function (id) {
  if (!confirm("Deseja excluir?")) return;

  const { error } = await supabaseClient
    .from("ponto_digital")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
  } else {
    carregar();
  }
};

function limparFiltros() {
  filtroData.value = "";
  filtroFrota.value = "";
  filtroColaborador.value = "";
  carregar();
}

function mostrarTabela() {
  formTela.classList.add("hidden");
  tabelaCard.classList.remove("hidden");
  carregar();
}

function voltarFormulario() {
  tabelaCard.classList.add("hidden");
  formTela.classList.remove("hidden");
  limparFormulario();
}

function limparFormulario() {
  form.reset();
}

// ENTER para avançar pelos campos do formulário
document.addEventListener("DOMContentLoaded", () => {
  const campos = document.querySelectorAll("#formCampos input, #formCampos textarea");

  campos.forEach((campo, index) => {
    campo.addEventListener("keydown", function (e) {
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
