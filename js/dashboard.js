document.addEventListener("DOMContentLoaded", async () => {

    // =========================
    // GARANTE QUE SUPABASE EXISTE
    // =========================
    if (!window.supabaseClient) {
        console.error("Supabase não carregado!");
        return;
    }

    const supabase = window.supabaseClient;

    // =========================
    // VERIFICA LOGIN
    // =========================
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.warn("Usuário não autenticado");
        window.location.href = "login.html";
        return;
    }

    // =========================
    // USER INFO
    // =========================
    const user = session.user;

    try {
        const { data } = await supabase
            .from("usuarios")
            .select("nome")
            .eq("id", user.id)
            .single();

        const nome = data?.nome || user.email;

        const elName = document.querySelector(".user-info span");
        const elAvatar = document.querySelector(".user-avatar");

        if (elName) elName.textContent = nome;
        if (elAvatar) elAvatar.textContent = nome.charAt(0).toUpperCase();

    } catch (e) {
        console.warn("Erro ao buscar usuário:", e);
    }

    const conteudo = document.getElementById("conteudoPrincipal");

    // =========================
    // DASHBOARD
    // =========================
    async function loadDashboard() {

        try {

            const [
                colabRes,
                equipRes,
                apontRes,
                abasteRes,
                pontoRes
            ] = await Promise.all([
                supabase.from("vw_colaboradores").select("*"),
                supabase.from("vw_equipamentos").select("*"),
                supabase.from("vw_apontamentos").select("*"),
                supabase.from("vw_abastecimentos").select("*"),
                supabase.from("vw_pontodigital").select("*")
            ]);

            // =========================
            // TRATAMENTO DE ERROS SUPABASE
            // =========================
            if (colabRes.error || equipRes.error || apontRes.error) {
                console.error("Erro Supabase:", {
                    colab: colabRes.error,
                    equip: equipRes.error,
                    apont: apontRes.error
                });
                throw new Error("Erro ao buscar dados");
            }

            const colaboradores = colabRes.data || [];
            const equipamentos = equipRes.data || [];
            const apontamentos = apontRes.data || [];
            const abastecimentos = abasteRes.data || [];
            const ponto = pontoRes.data || [];

            // =========================
            // CALCULOS SEGUROS
            // =========================
            const totalColaboradores = colaboradores.length;
            const totalEquipamentos = equipamentos.length;
            const totalApontamentos = apontamentos.length;
            const totalPonto = ponto.length;

            const totalHoras = apontamentos.reduce((s, a) =>
                s + (parseFloat(a.horas_trabalhadas) || 0), 0);

            const totalLitros = abastecimentos.reduce((s, a) =>
                s + (parseFloat(a.litros) || 0), 0);

            // =========================
            // RENDER HTML
            // =========================
            conteudo.innerHTML = `
                <div class="welcome-card">
                    <h2>Bem-vindo ao Campo 4.0</h2>
                    <p>Dados em tempo real</p>
                </div>

                <div class="stats-grid">

                    <div class="stat-card">
                        <div class="stat-icon">👨‍🌾</div>
                        <div class="stat-value">${totalColaboradores}</div>
                        <div class="stat-label">Colaboradores</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🚜</div>
                        <div class="stat-value">${totalEquipamentos}</div>
                        <div class="stat-label">Equipamentos</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value">${totalApontamentos}</div>
                        <div class="stat-label">Apontamentos</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${totalHoras.toFixed(1)}</div>
                        <div class="stat-label">Horas Trabalhadas</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">⛽</div>
                        <div class="stat-value">${totalLitros.toFixed(1)}</div>
                        <div class="stat-label">Litros</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🕒</div>
                        <div class="stat-value">${totalPonto}</div>
                        <div class="stat-label">Registros</div>
                    </div>

                </div>

                <div class="row mt-4">

                    <div class="col-md-6">
                        <div class="form-container">
                            <h3 class="form-title">Apontamentos por Mês</h3>
                            <div id="chartApontamentos"></div>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="form-container">
                            <h3 class="form-title">Horas por Colaborador</h3>
                            <div id="chartColaboradores"></div>
                        </div>
                    </div>

                </div>
            `;

            // ESPERA DOM RENDERIZAR
            setTimeout(() => {
                gerarGraficos(apontamentos);
            }, 200);

        } catch (error) {
            console.error("Erro geral:", error);
            conteudo.innerHTML = `<p style="color:red;">Erro ao carregar dashboard</p>`;
        }
    }

    // =========================
    // GRÁFICOS (CORRIGIDO)
    // =========================
    function gerarGraficos(apontamentos) {

        if (!window.ApexCharts) {
            console.error("ApexCharts não carregado!");
            return;
        }

        // LIMPA GRÁFICOS ANTIGOS
        document.querySelector("#chartApontamentos").innerHTML = "";
        document.querySelector("#chartColaboradores").innerHTML = "";

        const porMes = {};

        apontamentos.forEach(a => {
            if (!a.data) return;

            const data = new Date(a.data);
            if (isNaN(data)) return;

            const mes = data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0");
            porMes[mes] = (porMes[mes] || 0) + 1;
        });

        new ApexCharts(document.querySelector("#chartApontamentos"), {
            chart: { type: 'line', height: 300 },
            series: [{ name: "Apontamentos", data: Object.values(porMes) }],
            xaxis: { categories: Object.keys(porMes) }
        }).render();

        const porColab = {};

        apontamentos.forEach(a => {
            const nome = a.colaborador || "N/A";
            porColab[nome] = (porColab[nome] || 0) + (parseFloat(a.horas_trabalhadas) || 0);
        });

        new ApexCharts(document.querySelector("#chartColaboradores"), {
            chart: { type: 'bar', height: 300 },
            series: [{ name: "Horas", data: Object.values(porColab) }],
            xaxis: { categories: Object.keys(porColab) }
        }).render();
    }

    // =========================
    // INICIALIZA
    // =========================
    loadDashboard();

});