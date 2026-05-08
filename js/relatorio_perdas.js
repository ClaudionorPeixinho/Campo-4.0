const supabase = window.supabaseClient || window.supabase.createClient(
    "https://szzfqkhibuejhodhkvjj.supabase.co",
    "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_"
);
window.supabaseClient = supabase;

let registrosGlobais = [];

const isSPAMode = new URLSearchParams(window.location.search).get('spa') === 'true';

window.sair = () => {
    if (isSPAMode && window.parent && window.parent.app) {
        window.parent.app.returnToDashboard();
    } else {
        window.location.href = "index_menu.html";
    }
};

window.toggleFiltros = () => {
    const content = document.getElementById('filtersContent');
    const icon = document.getElementById('filterToggleIcon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
};

window.toggleTheme = () => {
    const body = document.body;
    const btnToggle = document.getElementById('btnToggleTheme');
    body.classList.toggle('dark');
    if (body.classList.contains('dark')) {
        btnToggle.innerHTML = '<i class="bi bi-moon"></i>';
        localStorage.setItem('rel-perdas-theme', 'dark');
    } else {
        btnToggle.innerHTML = '<i class="bi bi-brightness-high"></i>';
        localStorage.setItem('rel-perdas-theme', 'light');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (isSPAMode) document.body.classList.add('spa-mode');

    const tema = localStorage.getItem('rel-perdas-theme') || 'light';
    const btnToggle = document.getElementById('btnToggleTheme');
    if (tema === 'dark') {
        document.body.classList.add('dark');
        if (btnToggle) btnToggle.innerHTML = '<i class="bi bi-moon"></i>';
    } else {
        document.body.classList.remove('dark');
        if (btnToggle) btnToggle.innerHTML = '<i class="bi bi-brightness-high"></i>';
    }
    if (btnToggle) btnToggle.addEventListener('click', window.toggleTheme);

    carregarDados();
});

document.addEventListener("keydown", e => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const atual = document.activeElement;
    if (!atual || !atual.matches("input, select")) return;
    e.preventDefault();
    const campos = [...document.querySelectorAll("input, select")].filter(c => !c.disabled && c.offsetParent !== null);
    const index = campos.indexOf(atual);
    if (index >= 0 && index < campos.length - 1) {
        campos[index + 1].focus();
        if (typeof campos[index + 1].select === "function") campos[index + 1].select();
    }
});

window.carregarDados = async () => {
    const tabela = document.getElementById('tabela');
    const registrosCount = document.getElementById('registrosCount');

    try {
        let query = supabase.from('perdas_cana_colhedoras').select('*');

        const frota = document.getElementById('fFrota')?.value.trim();
        const operador = document.getElementById('fOperador')?.value.trim();
        const lote = document.getElementById('fLote')?.value.trim();
        const dataInicio = document.getElementById('fDataInicio')?.value;
        const dataFim = document.getElementById('fDataFim')?.value;

        if (frota) query = query.ilike('equipamento', `%${frota}%`);
        if (operador) query = query.ilike('operador', `%${operador}%`);
        if (lote) query = query.ilike('lote', `%${lote}%`);
        if (dataInicio) query = query.gte('data', dataInicio);
        if (dataFim) query = query.lte('data', dataFim);

        query = query.order('data', { ascending: false });

        const { data, error } = await query;

        if (error && error.code === '42P01') {
            throw new Error('Tabela não encontrada no banco');
        }
        if (error) throw error;

        registrosGlobais = data || [];

        if (registrosGlobais.length === 0) {
            let registros = JSON.parse(localStorage.getItem('perdas') || '[]');
            if (frota) registros = registros.filter(r => r.equipamento?.toLowerCase().includes(frota.toLowerCase()));
            if (operador) registros = registros.filter(r => r.operador?.toLowerCase().includes(operador.toLowerCase()));
            if (lote) registros = registros.filter(r => r.lote?.toLowerCase().includes(lote.toLowerCase()));
            if (dataInicio) registros = registros.filter(r => r.data >= dataInicio);
            if (dataFim) registros = registros.filter(r => r.data <= dataFim);
            registrosGlobais = registros;
        }

        preencherTabela();
        carregarDatalists();

    } catch (e) {
        console.warn('Supabase indisponível, tentando localStorage:', e.message);
        let registros = JSON.parse(localStorage.getItem('perdas') || '[]');

        const frota = document.getElementById('fFrota')?.value.trim();
        const operador = document.getElementById('fOperador')?.value.trim();
        const lote = document.getElementById('fLote')?.value.trim();
        const dataInicio = document.getElementById('fDataInicio')?.value;
        const dataFim = document.getElementById('fDataFim')?.value;

        if (frota) registros = registros.filter(r => r.equipamento?.toLowerCase().includes(frota.toLowerCase()));
        if (operador) registros = registros.filter(r => r.operador?.toLowerCase().includes(operador.toLowerCase()));
        if (lote) registros = registros.filter(r => r.lote?.toLowerCase().includes(lote.toLowerCase()));
        if (dataInicio) registros = registros.filter(r => r.data >= dataInicio);
        if (dataFim) registros = registros.filter(r => r.data <= dataFim);

        registrosGlobais = registros;
        preencherTabela();
        carregarDatalists();
    }
}

function preencherTabela() {
    const tabela = document.getElementById('tabela');
    const totalGeralEl = document.getElementById('totalGeral');
    const registrosCount = document.getElementById('registrosCount');

    tabela.innerHTML = '';
    let totalGeral = 0;

    if (registrosGlobais.length === 0) {
        tabela.innerHTML = `<tr><td colspan="14" class="text-center" style="padding: 50px; color: var(--gray-color);">
            <div style="font-size: 3rem; margin-bottom: 10px;"><i class="bi bi-inbox"></i></div>
            <p style="font-size: 1.1rem;">Nenhum registro encontrado</p>
        </td></tr>`;
        totalGeralEl.innerHTML = '0 <span>un</span>';
        registrosCount.innerHTML = `<i class="bi bi-database"></i> <span>0 registros encontrados</span>`;
        return;
    }

    registrosGlobais.forEach(reg => {
        const total = calcTotal(reg);
        totalGeral += total;

        const dataFormatada = formatarData(reg.data);
        tabela.innerHTML += `
            <tr>
                <td>${dataFormatada}</td>
                <td><strong>${reg.equipamento || '-'}</strong></td>
                <td>${reg.operador || '-'}</td>
                <td>${reg.lote || '-'}</td>
                <td>${reg.quadra || '-'}</td>
                <td>${reg.liberacao || '-'}</td>
                <td class="text-right">${Number(reg.tocos || 0)}</td>
                <td class="text-right">${Number(reg.pontas || 0)}</td>
                <td class="text-right">${Number(reg.lascas || 0)}</td>
                <td class="text-right">${Number(reg.pedacos || 0)}</td>
                <td class="text-right">${Number(reg.inteiras || 0)}</td>
                <td class="text-right">${Number(reg.toletes || 0)}</td>
                <td class="text-right">${Number(reg.palmitos || 0)}</td>
                <td class="text-right" style="font-weight: 700; color: var(--primary-color);">${total}</td>
            </tr>`;
    });

    const totalTocos = registrosGlobais.reduce((s, r) => s + Number(r.tocos || 0), 0);
    const totalPontas = registrosGlobais.reduce((s, r) => s + Number(r.pontas || 0), 0);
    const totalLascas = registrosGlobais.reduce((s, r) => s + Number(r.lascas || 0), 0);
    const totalPedacos = registrosGlobais.reduce((s, r) => s + Number(r.pedacos || 0), 0);
    const totalInteiras = registrosGlobais.reduce((s, r) => s + Number(r.inteiras || 0), 0);
    const totalToletes = registrosGlobais.reduce((s, r) => s + Number(r.toletes || 0), 0);
    const totalPalmitos = registrosGlobais.reduce((s, r) => s + Number(r.palmitos || 0), 0);

    tabela.innerHTML += `
        <tr class="summary-row">
            <td colspan="6" style="text-align: right; font-weight: 700;">TOTAIS</td>
            <td class="text-right">${totalTocos}</td>
            <td class="text-right">${totalPontas}</td>
            <td class="text-right">${totalLascas}</td>
            <td class="text-right">${totalPedacos}</td>
            <td class="text-right">${totalInteiras}</td>
            <td class="text-right">${totalToletes}</td>
            <td class="text-right">${totalPalmitos}</td>
            <td class="text-right" style="font-weight: 700; color: var(--primary-color); font-size: 1.1rem;">${totalGeral}</td>
        </tr>`;

    totalGeralEl.innerHTML = `${totalGeral} <span>un</span>`;
    registrosCount.innerHTML = `<i class="bi bi-database"></i> <span><strong>${registrosGlobais.length}</strong> registro(s) encontrado(s) &mdash; Total de perdas: <strong>${totalGeral}</strong> un</span>`;
}

function calcTotal(dados) {
    return Number(dados.tocos || 0) +
           Number(dados.pontas || 0) +
           Number(dados.lascas || 0) +
           Number(dados.pedacos || 0) +
           Number(dados.inteiras || 0) +
           Number(dados.toletes || 0) +
           Number(dados.palmitos || 0);
}

function formatarData(data) {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

async function carregarDatalists() {
    try {
        const { data } = await supabase.from('perdas_cana_colhedoras').select('equipamento, operador, lote');
        if (data) {
            const frotas = [...new Set(data.map(r => r.equipamento).filter(Boolean))];
            const operadores = [...new Set(data.map(r => r.operador).filter(Boolean))];
            const lotes = [...new Set(data.map(r => r.lote).filter(Boolean))];

            const frotaList = document.getElementById('frotaList');
            const operadorList = document.getElementById('operadorList');
            const loteList = document.getElementById('loteList');

            frotaList.innerHTML = frotas.map(f => `<option value="${f}">`).join('');
            operadorList.innerHTML = operadores.map(o => `<option value="${o}">`).join('');
            loteList.innerHTML = lotes.map(l => `<option value="${l}">`).join('');
        }
    } catch (e) {
        const registros = JSON.parse(localStorage.getItem('perdas') || '[]');
        const frotas = [...new Set(registros.map(r => r.equipamento).filter(Boolean))];
        const operadores = [...new Set(registros.map(r => r.operador).filter(Boolean))];
        const lotes = [...new Set(registros.map(r => r.lote).filter(Boolean))];

        document.getElementById('frotaList').innerHTML = frotas.map(f => `<option value="${f}">`).join('');
        document.getElementById('operadorList').innerHTML = operadores.map(o => `<option value="${o}">`).join('');
        document.getElementById('loteList').innerHTML = lotes.map(l => `<option value="${l}">`).join('');
    }
}

window.filtrar = () => {
    carregarDados();
};

window.limparFiltros = () => {
    document.getElementById('fFrota').value = '';
    document.getElementById('fOperador').value = '';
    document.getElementById('fLote').value = '';
    document.getElementById('fDataInicio').value = '';
    document.getElementById('fDataFim').value = '';
    carregarDados();
};

window.exportarPDF = () => {
    if (registrosGlobais.length === 0) {
        mostrarMensagem('Nenhum registro para exportar', 'warning');
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
        const elemento = document.createElement('div');
        elemento.innerHTML = gerarHTMLTabela();
        const opt = {
            margin: 8,
            filename: `relatorio_perdas_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
        };
        html2pdf().set(opt).from(elemento).save();
        mostrarMensagem('PDF gerado com sucesso!', 'success');
    };
    document.head.appendChild(script);
};

window.exportarExcel = () => {
    if (registrosGlobais.length === 0) {
        mostrarMensagem('Nenhum registro para exportar', 'warning');
        return;
    }

    const cabecalho = ['Data', 'Frota', 'Operador', 'Lote', 'Quadra', 'OS', 'Tocos', 'Pontas', 'Lascas', 'Pedaços', 'Inteiras', 'Toletes', 'Palmitos', 'Total Perdas'];
    let csv = cabecalho.join('\t') + '\n';

    registrosGlobais.forEach(reg => {
        const linha = [
            reg.data || '',
            reg.equipamento || '',
            reg.operador || '',
            reg.lote || '',
            reg.quadra || '',
            reg.liberacao || '',
            reg.tocos || 0,
            reg.pontas || 0,
            reg.lascas || 0,
            reg.pedacos || 0,
            reg.inteiras || 0,
            reg.toletes || 0,
            reg.palmitos || 0,
            calcTotal(reg)
        ];
        csv += linha.join('\t') + '\n';
    });

    const total = registrosGlobais.reduce((s, r) => s + calcTotal(r), 0);
    csv += '\nTOTAL GERAL\t\t\t\t\t\t\t\t\t\t\t\t\t' + total;

    const blob = new Blob([csv], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_perdas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarMensagem('Excel exportado com sucesso!', 'success');
};

function gerarHTMLTabela() {
    let html = `
    <h2 style="color: #27ae60; text-align: center; margin-bottom: 20px; font-family: sans-serif;">
        Relatório de Perdas - Colhedoras
    </h2>
    <p style="text-align: center; color: #666; margin-bottom: 20px; font-family: sans-serif;">
        Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 10px; font-family: sans-serif;">
        <thead>
            <tr style="background-color: #27ae60; color: white;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Data</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Frota</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Operador</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Lote</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Quadra</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">OS</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Tocos</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Pontas</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Lascas</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Pedaços</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Inteiras</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Toletes</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Palmitos</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Total</th>
            </tr>
        </thead>
        <tbody>`;
    registrosGlobais.forEach(reg => {
        html += `
            <tr>
                <td style="padding: 6px; border: 1px solid #ddd;">${formatarData(reg.data)}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${reg.equipamento || '-'}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${reg.operador || '-'}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${reg.lote || '-'}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${reg.quadra || '-'}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${reg.liberacao || '-'}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${reg.tocos || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${reg.pontas || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${reg.lascas || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${reg.pedacos || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${reg.inteiras || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${reg.toletes || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${reg.palmitos || 0}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${calcTotal(reg)}</td>
            </tr>`;
    });
    const total = registrosGlobais.reduce((s, r) => s + calcTotal(r), 0);
    html += `
        </tbody>
        <tfoot>
            <tr style="background-color: #f5f5f5; font-weight: bold;">
                <td colspan="13" style="padding: 8px; border: 1px solid #ddd; text-align: right;">TOTAL GERAL DE PERDAS:</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #27ae60;">${total}</td>
            </tr>
        </tfoot>
    </table>`;
    return html;
}

function mostrarMensagem(texto, tipo = 'info') {
    const msgAnterior = document.getElementById('mensagem-toast');
    if (msgAnterior) msgAnterior.remove();

    const msg = document.createElement('div');
    msg.id = 'mensagem-toast';
    msg.textContent = texto;
    msg.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        padding: 16px 24px; border-radius: 8px;
        font-weight: 600; z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    const cores = { success: '#27ae60', error: '#e74c3c', warning: '#f39c12', info: '#3498db' };
    msg.style.backgroundColor = cores[tipo] || cores.info;
    msg.style.color = 'white';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
