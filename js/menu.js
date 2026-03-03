document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // MENU ATIVO
    // =========================
    var menuItem = document.querySelectorAll('.item-menu');

    function selectlink() {
        menuItem.forEach((item) =>
            item.classList.remove('ativo')
        );
        this.classList.add('ativo');
    }

    menuItem.forEach((item) =>
        item.addEventListener('click', selectlink)
    );

    // =========================
    // EXPANDIR MENU
    // =========================
    var btnExp = document.querySelector('#btn-exp');
    var menuSide = document.querySelector('.menu-lateral');

    if (btnExp) {
        btnExp.addEventListener('click', function () {
            menuSide.classList.toggle('expandir');
        });
    }

    // =========================
    // LOGIN TRANSITION
    // =========================
    var btnSignin = document.querySelector("#signin");
    var btnSignup = document.querySelector("#signup");
    var body = document.querySelector("body");

    if (btnSignin) {
        btnSignin.addEventListener("click", function () {
            body.className = "sign-in-js";
        });
    }

    if (btnSignup) {
        btnSignup.addEventListener("click", function () {
            body.className = "sign-up-js";
        });
    }

    // =========================
    // LOGOUT DO SISTEMA
    // =========================
    var btnLogout = document.querySelector("#btnLogout");

    if (btnLogout) {
        btnLogout.addEventListener("click", async function () {

            if (confirm("Deseja realmente sair do sistema?")) {

                if (window.supabaseClient) {
                    await supabaseClient.auth.signOut();
                }

                window.location.href = "login.html";
            }
        });
    }

    // =========================
    // FECHAR APLICATIVO
    // =========================
    var btnFechar = document.querySelector("#btnFechar");

    if (btnFechar) {
        btnFechar.addEventListener("click", function () {

            if (confirm("Deseja fechar o aplicativo?")) {

                // Para PWA ou navegador compatível
                window.close();

                // Fallback (caso não feche)
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 300);

            }
        });
    }

});




