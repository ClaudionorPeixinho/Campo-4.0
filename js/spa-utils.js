/**
 * SPA Utilities - Funções compartilhadas para modo SPA
 * Carregado por todos os formulários quando em modo iframe
 */

// Detectar SPA Mode
const isSPAMode = new URLSearchParams(window.location.search).get('spa') === 'true';

if(isSPAMode) {
    window.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('spa-mode');
    });
}

// Função sair - faz logout e vai para login
window.sair = function() {
    const doLogout = (client) => {
        if (client) {
            return client.auth.signOut().then(() => true).catch(() => true);
        }
        return Promise.resolve(true);
    };

    const redirect = (target) => {
        try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
        target.location.href = 'login.html';
    };

    if (isSPAMode && window.parent) {
        doLogout(window.parent.supabaseClient).then(() => redirect(window.parent));
    } else {
        doLogout(window.supabaseClient).then(() => redirect(window));
    }
}

// Função logout (alias para sair)
window.logout = function() {
    window.sair();
}
