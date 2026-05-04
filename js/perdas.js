const supabase = window.supabaseClient || window.supabase.createClient(
    "https://szzfqkhibuejhodhkvjj.supabase.co",
    "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_"
);
window.supabaseClient = supabase;

let registrosGlobais = [];

// ============================================
// NAVEGAÇÃO E INICIALIZAÇÃO
// ============================================

// Detectar SPA Mode
const isSPAMode = new URLSearchParams(window.location.search).get('spa') === 'true';

window.sair = () => {
    if(isSPAMode && window.parent && window.parent.app) {
        // Em modo SPA, voltar via parent window
        window.parent.app.returnToDashboard();
    } else {
        // Modo standalone
        window.location.href = "index_menu.html";
    }
}

// Toggle Light/Dark Mode
window.toggleTheme = () => {
    const body = document.body;
    const btnToggle = document.getElementById('btnToggleTheme');
    
    body.classList.toggle('dark');
    
    if(body.classList.contains('dark')) {
        btnToggle.innerHTML = '<i class="bi bi-moon"></i>';
        localStorage.setItem('perdas-theme', 'dark');
    } else {
        btnToggle.innerHTML = '<i class="bi bi-brightness-high"></i>';
        localStorage.setItem('perdas-theme', 'light');
    }
}

// Carregar tema salvo
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar classe SPA mode ao body
    if(isSPAMode) {
        document.body.classList.add('spa-mode');
    }
    
    const tema = localStorage.getItem('perdas-theme') || 'light';
    const btnToggle = document.getElementById('btnToggleTheme');
    
    if(tema === 'dark') {
        document.body.classList.add('dark');
        if(btnToggle) btnToggle.innerHTML = '<i class="bi bi-moon"></i>';
    } else {
        document.body.classList.remove('dark');
        if(btnToggle) btnToggle.innerHTML = '<i class="bi bi-brightness-high"></i>';
    }
    
    // Setup event listener para botão de toggle
    if(btnToggle) {
        btnToggle.addEventListener('click', window.toggleTheme);
    }
});

// Toggle Filtros
window.toggleFiltersCollapse = () => {
    const filtersContainer = document.getElementById('filtersContainer');
    const filterButtonsContainer = document.getElementById('filterButtonsContainer');
    const btnCollapse = document.querySelector('.btn-collapse-filter');
    
    if(filtersContainer.style.display === 'none') {
        filtersContainer.style.display = 'grid';
        filterButtonsContainer.style.display = 'flex';
        if(btnCollapse) btnCollapse.classList.add('active');
    } else {
        filtersContainer.style.display = 'none';
        filterButtonsContainer.style.display = 'none';
        if(btnCollapse) btnCollapse.classList.remove('active');
    }
}

// Inicializar ao carregar página
document.addEventListener('DOMContentLoaded', () => {
    // Setar data de hoje
    const dataInput = document.getElementById('data');
    if(dataInput) dataInput.valueAsDate = new Date();
});

// ============================================
// NAVEGAÇÃO ENTRE CAMPOS COM ENTER E TAB
// ============================================

document.addEventListener("keydown", e => {
    if(e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        
        // Inputs e textareas
        let campos = [...document.querySelectorAll(".input-modern, textarea")];
        let atual = document.activeElement;
        let index = campos.indexOf(atual);
        
        if(index >= 0 && index < campos.length - 1) {
            campos[index + 1].focus();
            campos[index + 1].select && campos[index + 1].select();
        }
    }
});

// ============================================
// CÁLCULO TOTAL
// ============================================

function calcTotal(dados) {
    return Number(dados.tocos || 0) + 
           Number(dados.pontas || 0) + 
           Number(dados.lascas || 0) +
           Number(dados.pedacos || 0) + 
           Number(dados.inteiras || 0) +
           Number(dados.toletes || 0) + 
           Number(dados.palmitos || 0);
}

// ============================================
// SALVAR REGISTRO
// ============================================

window.salvar = async () => {
    try {
        // Validar campos obrigatórios
        const data = document.getElementById('data').value;
        const equipamento = document.getElementById('equipamento').value;
        const operador = document.getElementById('operador').value;

        if(!data || !equipamento || !operador) {
            mostrarMensagem('Por favor, preencha data, equipamento e operador!', 'warning');
            return;
        }

        let dados = {
            data: data,
            liberacao: document.getElementById('liberacao').value,
            lote: document.getElementById('lote').value,
            quadra: document.getElementById('quadra').value,
            equipamento: equipamento,
            operador: operador,
            tocos: document.getElementById('tocos').value || 0,
            pontas: document.getElementById('pontas').value || 0,
            lascas: document.getElementById('lascas').value || 0,
            pedacos: document.getElementById('pedacos').value || 0,
            inteiras: document.getElementById('inteiras').value || 0,
            toletes: document.getElementById('toletes').value || 0,
            palmitos: document.getElementById('palmitos').value || 0,
            observacao: document.getElementById('observacao').value || ''
        };

        // Calcular total
        dados.total = calcTotal(dados);

        // Salvar no Supabase ou na fila offline.
        const {data: resultado, error, offline} = window.CampoOfflineSync
            ? await window.CampoOfflineSync.saveInsert('perdas_cana', dados)
            : await supabase.from('perdas_cana').insert([dados]);

        if(error) {
            if(error.code === '42P01') {
                // Tabela não existe, criar simulado
                console.warn('Tabela não criada, usando localStorage');
                let registros = JSON.parse(localStorage.getItem('perdas') || '[]');
                dados.id = Date.now();
                registros.push(dados);
                localStorage.setItem('perdas', JSON.stringify(registros));
                mostrarMensagem('✅ Registro salvo com sucesso!', 'success');
            } else {
                throw error;
            }
        } else {
            mostrarMensagem('✅ Registro salvo com sucesso!', 'success');
        }

        limpar();
        // Recarregar registros se estiver visualizando
        const registrosElement = document.getElementById('registros');
        if(registrosElement && registrosElement.classList.contains('show')) {
            listar();
        }

    } catch(e) {
        console.error(e);
        mostrarMensagem('❌ Erro ao salvar: ' + e.message, 'error');
    }
}

// ============================================
// LISTAR REGISTROS
// ============================================

window.listar = async (filtro = {}) => {
    try {
        let dados = [];
        let error = null;

        // Tentar Supabase primeiro
        try {
            let query = supabase.from('perdas_cana').select('*');

            if(filtro.equipamento)
                query = query.ilike('equipamento', `%${filtro.equipamento}%`);
            if(filtro.lote)
                query = query.ilike('lote', `%${filtro.lote}%`);
            if(filtro.operador)
                query = query.ilike('operador', `%${filtro.operador}%`);

            const resultado = await query;
            dados = resultado.data || [];
            error = resultado.error;
        } catch(e) {
            console.log('Supabase indisponível, usando localStorage');
        }

        // Se Supabase falhar, usar localStorage
        if(error || dados.length === 0) {
            let registros = JSON.parse(localStorage.getItem('perdas') || '[]');
            
            if(filtro.equipamento)
                registros = registros.filter(r => r.equipamento?.includes(filtro.equipamento));
            if(filtro.lote)
                registros = registros.filter(r => r.lote?.includes(filtro.lote));
            if(filtro.operador)
                registros = registros.filter(r => r.operador?.includes(filtro.operador));
            
            dados = registros;
        }

        registrosGlobais = dados;

        // Montar tabela
        const tabela = document.getElementById('tabela');
        if(!tabela) return;
        
        tabela.innerHTML = '';
        let totalGeral = 0;

        if(dados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#95a5a6;">Nenhum registro encontrado</td></tr>`;
        } else {
            dados.forEach(registro => {
                totalGeral += Number(registro.total || 0);

                const dataFormatada = formatarData(registro.data);
                tabela.innerHTML += `
                    <tr>
                        <td>${dataFormatada}</td>
                        <td>${registro.equipamento || '-'}</td>
                        <td>${registro.lote || '-'}</td>
                        <td>${registro.operador || '-'}</td>
                        <td style="text-align: right; font-weight: 600;">${Number(registro.total || 0).toFixed(2)}</td>
                        <td style="text-align: center;">
                            <button class="btn-table-action btn-edit" onclick="editar(${registro.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-table-action btn-delete" onclick="excluir(${registro.id})" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        }

        // Atualizar total geral
        const totalGeralElement = document.getElementById('totalGeral');
        if(totalGeralElement) totalGeralElement.textContent = totalGeral.toFixed(2);

    } catch(e) {
        console.error(e);
        mostrarMensagem('❌ Erro ao listar: ' + e.message, 'error');
    }
}

// ============================================
// FILTRAR REGISTROS
// ============================================

window.filtrar = () => {
    listar({
        equipamento: document.getElementById('fEquipamento').value,
        lote: document.getElementById('fLote').value,
        operador: document.getElementById('fOperador').value
    });
}

window.limparFiltro = () => {
    document.getElementById('fEquipamento').value = '';
    document.getElementById('fLote').value = '';
    document.getElementById('fOperador').value = '';
    listar();
}

// ============================================
// EXCLUIR REGISTRO
// ============================================

window.excluir = async (id) => {
    if(!confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
        const {error} = await supabase.from('perdas_cana').delete().eq('id', id);
        
        if(error && error.code !== '42P01') {
            throw error;
        }

        // Excluir do localStorage também
        let registros = JSON.parse(localStorage.getItem('perdas') || '[]');
        registros = registros.filter(r => r.id !== id);
        localStorage.setItem('perdas', JSON.stringify(registros));

        mostrarMensagem('✅ Registro excluído com sucesso!', 'success');
        listar();

    } catch(e) {
        mostrarMensagem('❌ Erro ao excluir: ' + e.message, 'error');
    }
}

// ============================================
// EDITAR REGISTRO
// ============================================

window.editar = async (id) => {
    try {
        let registro = null;

        // Procurar no Supabase
        try {
            const resultado = await supabase.from('perdas_cana').select('*').eq('id', id).single();
            registro = resultado.data;
        } catch(e) {
            // Se não encontrar no Supabase, procurar no localStorage
            let registros = JSON.parse(localStorage.getItem('perdas') || '[]');
            registro = registros.find(r => r.id === id);
        }

        if(!registro) {
            mostrarMensagem('❌ Registro não encontrado', 'error');
            return;
        }

        // Carregar dados no formulário
        Object.keys(registro).forEach(chave => {
            const elemento = document.getElementById(chave);
            if(elemento) {
                elemento.value = registro[chave] || '';
            }
        });

        // Fechar tabela e voltar ao formulário
        fecharRegistros();
        mostrarMensagem('ℹ️ Registro carregado. Clique em Salvar para atualizar.', 'info');

    } catch(e) {
        mostrarMensagem('❌ Erro ao editar: ' + e.message, 'error');
    }
}

// ============================================
// LIMPAR FORMULÁRIO
// ============================================

window.limpar = () => {
    document.querySelectorAll('.input-modern').forEach(input => {
        if(input.type === 'date') {
            input.valueAsDate = new Date();
        } else {
            input.value = '';
        }
    });
    
    // Foco no primeiro campo
    const primeiroInput = document.querySelector('.input-modern');
    if(primeiroInput) primeiroInput.focus();
}

// ============================================
// ABRIR/FECHAR REGISTROS
// ============================================

window.abrirRegistros = () => {
    const formulario = document.getElementById('formulario');
    const registros = document.getElementById('registros');
    
    if(formulario) formulario.style.display = 'none';
    if(registros) registros.classList.add('show');
    
    listar();
}

window.fecharRegistros = () => {
    const formulario = document.getElementById('formulario');
    const registros = document.getElementById('registros');
    
    if(registros) registros.classList.remove('show');
    if(formulario) formulario.style.display = 'block';
}

// ============================================
// EXPORTAÇÃO DE DADOS
// ============================================

window.exportarPDF = async () => {
    if(registrosGlobais.length === 0) {
        mostrarMensagem('⚠️ Nenhum registro para exportar', 'warning');
        return;
    }

    try {
        // Usar biblioteca html2pdf
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        
        script1.onload = () => {
            const elemento = document.createElement('div');
            elemento.innerHTML = gerarHTMLTabela('PDF');
            
            const opt = {
                margin: 10,
                filename: `perdas_cana_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };
            
            html2pdf().set(opt).from(elemento).save();
            mostrarMensagem('✅ PDF gerado com sucesso!', 'success');
        };
        
        document.head.appendChild(script1);

    } catch(e) {
        console.error(e);
        mostrarMensagem('❌ Erro ao exportar PDF: ' + e.message, 'error');
    }
}

window.exportarExcel = () => {
    if(registrosGlobais.length === 0) {
        mostrarMensagem('⚠️ Nenhum registro para exportar', 'warning');
        return;
    }

    try {
        const cabecalho = ['Data', 'OS', 'Lote', 'Quadra', 'Equipamento', 'Operador', 'Tocos', 'Pontas', 'Lascas', 'Pedaços', 'Inteiras', 'Toletes', 'Palmitos', 'Total', 'Observação'];
        
        let csv = cabecalho.join('\t') + '\n';

        registrosGlobais.forEach(reg => {
            const linha = [
                reg.data || '',
                reg.liberacao || '',
                reg.lote || '',
                reg.quadra || '',
                reg.equipamento || '',
                reg.operador || '',
                reg.tocos || '',
                reg.pontas || '',
                reg.lascas || '',
                reg.pedacos || '',
                reg.inteiras || '',
                reg.toletes || '',
                reg.palmitos || '',
                reg.total || '',
                reg.observacao || ''
            ];
            csv += linha.join('\t') + '\n';
        });

        // Criar blob e download
        const blob = new Blob([csv], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `perdas_cana_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        mostrarMensagem('✅ Excel exportado com sucesso!', 'success');

    } catch(e) {
        console.error(e);
        mostrarMensagem('❌ Erro ao exportar Excel: ' + e.message, 'error');
    }
}

window.compartilharWhatsApp = () => {
    if(registrosGlobais.length === 0) {
        mostrarMensagem('⚠️ Nenhum registro para compartilhar', 'warning');
        return;
    }

    try {
        let mensagem = encodeURIComponent(
            `📊 *RELATÓRIO DE PERDAS - CANA-DE-AÇÚCAR*\n\n` +
            `Data: ${new Date().toLocaleDateString('pt-BR')}\n` +
            `Total de Registros: ${registrosGlobais.length}\n\n` +
            `📋 RESUMO:\n` +
            registrosGlobais.map((reg, idx) => 
                `${idx + 1}. ${reg.data} - ${reg.equipamento} (${reg.operador}) - Total: ${reg.total}`
            ).join('\n') +
            `\n\nTotal de Perdas: ${registrosGlobais.reduce((a,b) => a + Number(b.total||0), 0).toFixed(2)}`
        );

        window.open(`https://wa.me/?text=${mensagem}`, '_blank');
        mostrarMensagem('✅ Abrindo WhatsApp...', 'success');

    } catch(e) {
        mostrarMensagem('❌ Erro ao compartilhar: ' + e.message, 'error');
    }
}

window.compartilharEmail = () => {
    if(registrosGlobais.length === 0) {
        mostrarMensagem('⚠️ Nenhum registro para enviar', 'warning');
        return;
    }

    try {
        const assunto = `Relatório de Perdas - Cana-de-Açúcar ${new Date().toLocaleDateString('pt-BR')}`;
        
        let corpo = `
Relatório de Perdas - Cana-de-Açúcar
Data: ${new Date().toLocaleDateString('pt-BR')}
Total de Registros: ${registrosGlobais.length}

RESUMO:
${registrosGlobais.map((reg, idx) => 
    `${idx + 1}. ${reg.data} - ${reg.equipamento} (${reg.operador}) - Total: ${reg.total}`
).join('\n')}

Total de Perdas: ${registrosGlobais.reduce((a,b) => a + Number(b.total||0), 0).toFixed(2)}

---
Enviado via Campo 4.0
        `;

        const mailtoLink = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
        window.location.href = mailtoLink;

    } catch(e) {
        mostrarMensagem('❌ Erro ao compartilhar: ' + e.message, 'error');
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatarData(data) {
    if(!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function gerarHTMLTabela(tipo) {
    let html = `
    <h2 style="color: #27ae60; text-align: center; margin-bottom: 20px;">
        Relatório de Perdas - Cana-de-Açúcar
    </h2>
    <p style="text-align: center; color: #666; margin-bottom: 20px;">
        Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
            <tr style="background-color: #27ae60; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Data</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">OS</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Lote</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Quadra</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Equipamento</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Operador</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Total</th>
            </tr>
        </thead>
        <tbody>
    `;

    registrosGlobais.forEach(reg => {
        html += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${formatarData(reg.data)}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${reg.liberacao || '-'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${reg.lote || '-'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${reg.quadra || '-'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${reg.equipamento || '-'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${reg.operador || '-'}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${reg.total || 0}</td>
            </tr>
        `;
    });

    const total = registrosGlobais.reduce((a,b) => a + Number(b.total||0), 0);
    html += `
        </tbody>
        <tfoot>
            <tr style="background-color: #f5f5f5; font-weight: bold;">
                <td colspan="6" style="padding: 10px; border: 1px solid #ddd; text-align: right;">TOTAL DE PERDAS:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${total.toFixed(2)}</td>
            </tr>
        </tfoot>
    </table>
    `;

    return html;
}

function mostrarMensagem(texto, tipo = 'info') {
    // Remover mensagem anterior se existir
    const msgAnterior = document.getElementById('mensagem-toast');
    if(msgAnterior) msgAnterior.remove();

    const msg = document.createElement('div');
    msg.id = 'mensagem-toast';
    msg.textContent = texto;
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    // Cores por tipo
    const cores = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    msg.style.backgroundColor = cores[tipo] || cores.info;
    msg.style.color = 'white';

    document.body.appendChild(msg);

    // Auto remover após 4 segundos
    setTimeout(() => msg.remove(), 4000);
}

// CSS para animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
