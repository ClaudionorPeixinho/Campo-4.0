const supabase = window.supabaseClient;

// ELEMENTOS -------------------------
const form = document.getElementById("formEquipamento");
const tabela = document.getElementById("tabelaDados");
const formTela = document.getElementById("formTela");
const tabelaTela = document.getElementById("tabelaTela");

let editandoId = null;

// SALVAR -----------------------------
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
        frota: document.getElementById("frota").value.trim(),
        modelo: document.getElementById("modelo").value.trim(),
        operacao: document.getElementById("operacao").value.trim(),
        tag: document.getElementById("tag").value.trim(),
        categoria: document.getElementById("categoria").value
    };

    let result;

    if (editandoId) {
        result = await supabase
            .from("equipamentos")
            .update(dados)
            .eq("id", editandoId);
    } else {
        result = await supabase
            .from("equipamentos")
            .insert([dados]);
    }

    if (result.error) {
        console.error(result.error);
        alert("ERRO ao salvar.");
        return;
    }

    alert("Salvo!");
    editandoId = null;
    form.reset();
});

// MOSTRAR / OCULTAR TELA -------------
window.mostrarTabela = function () {
    formTela.style.display = "none";
    tabelaTela.style.display = "block";
    carregar();
};

window.voltarFormulario = function () {
    tabelaTela.style.display = "none";
    formTela.style.display = "block";
};

// CARREGAR DADOS ---------------------
async function carregar() {
    tabela.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    let query = supabase
        .from("equipamentos")
        .select("*")
        .order("id", { ascending: false });

    const fFrota = document.getElementById("fFrota").value.trim();
    const fModelo = document.getElementById("fModelo").value.trim();

    if (fFrota !== "") query = query.ilike("frota", `%${fFrota}%`);
    if (fModelo !== "") query = query.ilike("modelo", `%${fModelo}%`);

    const { data, error } = await query;

    if (error) {
        console.error(error);
        tabela.innerHTML = `<tr><td colspan="6">Erro ao carregar</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tabela.innerHTML = `<tr><td colspan="6">Nenhum registro</td></tr>`;
        return;
    }

    tabela.innerHTML = "";

    data.forEach(equip => {
        tabela.innerHTML += `
            <tr>
                <td>${equip.frota ?? ""}</td>
                <td>${equip.modelo ?? ""}</td>
                <td>${equip.operacao ?? ""}</td>
                <td>${equip.tag ?? ""}</td>
                <td>${equip.categoria ?? ""}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editar(${equip.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="excluir(${equip.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

window.carregar = carregar;

// EDITAR -----------------------------
window.editar = async function (id) {
    const { data, error } = await supabase
        .from("equipamentos")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error(error);
        alert("Erro ao carregar item para edição.");
        return;
    }

    editandoId = id;
    document.getElementById("frota").value = data.frota;
    document.getElementById("modelo").value = data.modelo;
    document.getElementById("operacao").value = data.operacao;
    document.getElementById("tag").value = data.tag;
    document.getElementById("categoria").value = data.categoria;

    voltarFormulario();
};

// EXCLUIR -----------------------------
window.excluir = async function (id) {
    if (!confirm("Excluir?")) return;

    const { error } = await supabase
        .from("equipamentos")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("Erro ao excluir.");
        return;
    }

    carregar();
};

// LIMPAR FILTROS ----------------------
window.limparFiltros = function () {
    document.getElementById("fFrota").value = "";
    document.getElementById("fModelo").value = "";
    carregar();
};