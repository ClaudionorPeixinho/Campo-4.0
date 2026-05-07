/**
 * SPA Utilities - Funções compartilhadas para modo SPA
 * Carregado por todos os formulários quando em modo iframe
 */

// Detectar SPA Mode
const isSPAMode = new URLSearchParams(window.location.search).get('spa') === 'true';

if(isSPAMode) {
    // Adicionar classe ao body
    window.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('spa-mode');
    });
    
    // Adicionar CSS para esconder headers
    const style = document.createElement('style');
    style.textContent = `
        body.spa-mode .topo,
        body.spa-mode .header,
        body.spa-mode .navbar,
        body.spa-mode .navbar-section,
        body.spa-mode .topbar {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
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
    `;
    document.head.appendChild(style);
}

// Função sair - faz logout e volta ao login
window.sair = function() {
    if(isSPAMode && window.parent && window.parent.supabaseClient) {
        window.parent.supabaseClient.auth.signOut().then(() => {
            window.parent.location.href = "login.html";
        }).catch(() => {
            window.parent.location.href = "login.html";
        });
    } else if (window.supabaseClient) {
        supabaseClient.auth.signOut().then(() => {
            window.location.href = "login.html";
        }).catch(() => {
            window.location.href = "login.html";
        });
    } else {
        window.location.href = "login.html";
    }
}

// Função logout (alias para sair)
window.logout = function() {
    window.sair();
}
