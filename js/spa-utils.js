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

// Função sair - volta ao dashboard via parent window
window.sair = function() {
    if(isSPAMode && window.parent && window.parent.app) {
        window.parent.app.returnToDashboard();
    } else {
        window.location.href = "index_menu.html";
    }
}

// Função logout (alias para sair)
window.logout = function() {
    window.sair();
}
