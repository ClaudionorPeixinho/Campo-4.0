const supabaseUrl = "SUA_URL";
const supabaseKey = "SUA_ANON_KEY";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const form = document.getElementById("formAbastecimento");
const tabelaBody = document.querySelector("#tabela tbody");

// ENTER para pular campos
document.querySelectorAll(".campo-enter").forEach((campo, index, campos) => {
    campo.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (index + 1 < campos.length) {
                campos[index + 1].focus();
            } else {
                form.querySelector("button[type=submit]").focus();
            }
        }
    });
});

// Calcular total automático
document.getElementById("valor_unitario").addEventListener("input", calcularTotal);
document.getElementById("litros").addEventListener("input", calcularTotal);

function calcularTotal() {
    let litros = parseFloat(document.getElementById("litros").value) || 0;
    let valor = parseFloat(document.getElementById("valor_unitario").value) || 0;
    document.getElementById("valor_total").value = (litros * valor).toFixed(2);
}

// SALVAR
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
        data_abastecimento: data.value,
        hora_abastecimento: hora.value,
        empresa: empresa.value,
        equipamento: equipamento.value,
        material: material.value,
        litros: litros.value,
        valor_unitario: valor_unitario.value,
        valor_total: valor_total.value
    };

    await supabase.from("abastecimentos").insert([dados]);

    form.reset();
    carregarDados();
});

// CARREGAR
async function carregarDados() {
    const { data } = await supabase.from("abastecimentos").select("*").order("data_abastecimento", { ascending: false });

    tabelaBody.innerHTML = "";

    data.forEach(item => {
        tabelaBody.innerHTML += `
            <tr>
                <td>${item.data_abastecimento}</td>
                <td>${item.equipamento}</td>
                <td>${item.material}</td>
                <td>${item.litros}</td>
                <td>R$ ${item.valor_total}</td>
            </tr>
        `;
    });
}

carregarDados();

// FILTROS
async function filtrar() {
    let query = supabase.from("abastecimentos").select("*");

    if (filtroData.value) {
        query = query.eq("data_abastecimento", filtroData.value);
    }

    if (filtroEquip.value) {
        query = query.ilike("equipamento", `%${filtroEquip.value}%`);
    }

    const { data } = await query;

    tabelaBody.innerHTML = "";
    data.forEach(item => {
        tabelaBody.innerHTML += `
            <tr>
                <td>${item.data_abastecimento}</td>
                <td>${item.equipamento}</td>
                <td>${item.material}</td>
                <td>${item.litros}</td>
                <td>R$ ${item.valor_total}</td>
            </tr>
        `;
    });
}

function limparFiltro() {
    filtroData.value = "";
    filtroEquip.value = "";
    carregarDados();
}

function toggleTabela() {
    const tabela = document.getElementById("containerTabela");
    tabela.style.display = tabela.style.display === "none" ? "block" : "none";
}