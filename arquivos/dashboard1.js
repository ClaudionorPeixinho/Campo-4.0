document.addEventListener("DOMContentLoaded", async () => {

    // ==============================
    // 🔐 VERIFICAR USUÁRIO LOGADO
    // ==============================

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("nomeUsuario").innerText = user.user_metadata?.nome || user.email;

    if(user.user_metadata?.foto){
        document.getElementById("fotoUsuario").src = user.user_metadata.foto;
    }

    // ==============================
    // 📊 CARREGAR DADOS NOS CARDS
    // ==============================

    async function carregarCards() {

        const { data, error } = await supabaseClient
            .from("ponto_digital")
            .select("*");

        if (error) {
            console.error(error);
            return;
        }

        document.getElementById("totalRegistros").innerText = data.length;

        const totalKm = data.reduce((acc, item) => {
            return acc + ((item.kmf || 0) - (item.kmi || 0));
        }, 0);

        document.getElementById("totalKm").innerText = totalKm + " km";
    }

    carregarCards();

    // ==============================
    // 🌗 DARK MODE PREMIUM
    // ==============================

    const toggleTheme = document.getElementById("toggleTheme");

    toggleTheme.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            toggleTheme.innerText = "☀️";
            localStorage.setItem("theme", "dark");
        } else {
            toggleTheme.innerText = "🌙";
            localStorage.setItem("theme", "light");
        }
    });

    // Manter preferência salva
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        toggleTheme.innerText = "☀️";
    }

    // ==============================
    // 🚪 BOTÃO SAIR
    // ==============================

    document.getElementById("btnSair").addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
    });

});