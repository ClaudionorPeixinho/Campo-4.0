// Configuração do Supabase
const SUPABASE_URL = 'https://szzfqkhibuejhodhkvjj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_';
const supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabaseClient = supabaseClient;

// Elementos do DOM
const deliveryForm = document.getElementById('deliveryForm');
const tableBody = document.getElementById('tableBody');
const toggleTableBtn = document.getElementById('toggleTable');
const tableSection = document.getElementById('tableSection');
const applyFiltersBtn = document.getElementById('applyFilters');
const clearFiltersBtn = document.getElementById('clearFilters');
const exportBtn = document.getElementById('exportBtn');
const filterIcon = document.getElementById('filterIcon');
const filtersContent = document.getElementById('filtersContent');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeModal = document.querySelector('.close');

// Elementos de peso
const pesoBruto = document.getElementById('peso_bruto');
const pesoLiquido = document.getElementById('peso_liquido');
const pesoTara = document.getElementById('peso_tara');

// Estado da aplicação
let entregas = [];
let filtrosAtivos = {
    turno: '',
    frota: '',
    motorista: '',
    destino: '',
    dataInicio: '',
    dataFim: '',
    ultimas24h: true
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarEntregas();
    configurarEventListeners();
    verificarUltimas24h();
    configurarCalculoTara();
});

// Configurar Event Listeners
function configurarEventListeners() {
    deliveryForm.addEventListener('submit', salvarEntrega);
    toggleTableBtn.addEventListener('click', toggleTabela);
    applyFiltersBtn.addEventListener('click', aplicarFiltros);
    clearFiltersBtn.addEventListener('click', limparFiltros);
    exportBtn.addEventListener('click', exportarDados);
    closeModal.addEventListener('click', () => editModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.style.display = 'none';
    });
    editForm.addEventListener('submit', atualizarEntrega);
}

// Configurar cálculo automático da tara
function configurarCalculoTara() {
    const calcularTara = () => {
        const bruto = parseFloat(pesoBruto.value) || 0;
        const liquido = parseFloat(pesoLiquido.value) || 0;
        const tara = bruto - liquido;
        pesoTara.value = tara >= 0 ? tara.toFixed(2) : 0;
    };
    
    pesoBruto.addEventListener('input', calcularTara);
    pesoLiquido.addEventListener('input', calcularTara);
}

// Verificar registros das últimas 24h a cada minuto
function verificarUltimas24h() {
    carregarEntregas();
    setInterval(carregarEntregas, 60000);
}

// Carregar entregas do Supabase
async function carregarEntregas() {
    try {
        tableBody.innerHTML = '<tr><td colspan="16" class="loading"><i class="fas fa-spinner"></i> Carregando...</td></tr>';
        
        let query = supabaseClient
            .from('entregas')
            .select('*');
        
        // Aplicar filtro de últimas 24h
        if (filtrosAtivos.ultimas24h) {
            const dataLimite = new Date();
            dataLimite.setHours(dataLimite.getHours() - 24);
            query = query.gte('created_at', dataLimite.toISOString());
        }
        
        // Aplicar filtros de data
        if (filtrosAtivos.dataInicio) {
            query = query.gte('data', filtrosAtivos.dataInicio);
        }
        if (filtrosAtivos.dataFim) {
            query = query.lte('data', filtrosAtivos.dataFim);
        }
        
        // Aplicar outros filtros
        if (filtrosAtivos.turno) {
            query = query.eq('turno', filtrosAtivos.turno);
        }
        if (filtrosAtivos.frota) {
            query = query.ilike('frota', `%${filtrosAtivos.frota}%`);
        }
        if (filtrosAtivos.motorista) {
            query = query.ilike('motorista', `%${filtrosAtivos.motorista}%`);
        }
        if (filtrosAtivos.destino) {
            query = query.ilike('destino', `%${filtrosAtivos.destino}%`);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        entregas = data || [];
        renderizarTabela();
    } catch (error) {
        console.error('Erro ao carregar entregas:', error);
        tableBody.innerHTML = '<tr><td colspan="16" style="color: #f44336; text-align: center;">Erro ao carregar dados</td></tr>';
    }
}

// Renderizar tabela
function renderizarTabela() {
    if (entregas.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="16" style="text-align: center;">Nenhum lançamento encontrado</td></tr>';
        return;
    }
    
    tableBody.innerHTML = entregas.map(entrega => {
        const tara = (parseFloat(entrega.peso_bruto) - parseFloat(entrega.peso_liquido)).toFixed(2);
        
        return `
        <tr>
            <td>${entrega.id}</td>
            <td>${formatarDataISO(entrega.data)}</td>
            <td><span class="turno-badge turno-${entrega.turno}">${formatarTurno(entrega.turno)}</span></td>
            <td>${entrega.frota}</td>
            <td>${entrega.motorista}</td>
            <td>${entrega.lider}</td>
            <td>${entrega.local_saida}</td>
            <td>${entrega.hrs_saida}</td>
            <td>${entrega.destino}</td>
            <td>${entrega.hrs_chegada}</td>
            <td class="peso-positive">${formatarPeso(entrega.peso_bruto)} kg</td>
            <td class="peso-positive">${formatarPeso(entrega.peso_liquido)} kg</td>
            <td class="peso-negative">${formatarPeso(tara)} kg</td>
            <td>${entrega.informacoes_adicionais || '-'}</td>
            <td>${formatarData(entrega.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editarEntrega('${entrega.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="excluirEntrega('${entrega.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

// Salvar nova entrega
async function salvarEntrega(e) {
    e.preventDefault();
    
    const formData = {
        data: document.getElementById('data').value,
        turno: document.getElementById('turno').value,
        frota: document.getElementById('frota').value,
        motorista: document.getElementById('motorista').value,
        lider: document.getElementById('lider').value,
        local_saida: document.getElementById('local_saida').value,
        hrs_saida: document.getElementById('hrs_saida').value,
        destino: document.getElementById('destino').value,
        hrs_chegada: document.getElementById('hrs_chegada').value,
        peso_liquido: parseFloat(document.getElementById('peso_liquido').value),
        peso_bruto: parseFloat(document.getElementById('peso_bruto').value),
        informacoes_adicionais: document.getElementById('informacoes_adicionais').value || null,
        created_at: new Date().toISOString()
    };
    
    try {
        const resposta = window.CampoOfflineSync
            ? await window.CampoOfflineSync.saveInsert('entregas', formData)
            : await supabaseClient.from('entregas').insert([formData]);
        const { error } = resposta;
        
        if (error) throw error;
        
        deliveryForm.reset();
        pesoTara.value = '';
        if (!resposta.offline) carregarEntregas();
        alert('Lançamento salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar lançamento');
    }
}

// Editar entrega
async function editarEntrega(id) {
    try {
        const { data, error } = await supabaseClient
            .from('entregas')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('editId').value = data.id;
        document.getElementById('editData').value = data.data;
        document.getElementById('editTurno').value = data.turno;
        document.getElementById('editFrota').value = data.frota;
        document.getElementById('editMotorista').value = data.motorista;
        document.getElementById('editLider').value = data.lider;
        document.getElementById('editLocalSaida').value = data.local_saida;
        document.getElementById('editHrsSaida').value = data.hrs_saida;
        document.getElementById('editDestino').value = data.destino;
        document.getElementById('editHrsChegada').value = data.hrs_chegada;
        document.getElementById('editPesoBruto').value = data.peso_bruto;
        document.getElementById('editPesoLiquido').value = data.peso_liquido;
        document.getElementById('editInformacoes').value = data.informacoes_adicionais || '';
        
        editModal.style.display = 'block';
    } catch (error) {
        console.error('Erro ao carregar entrega:', error);
        alert('Erro ao carregar dados para edição');
    }
}

// Atualizar entrega
async function atualizarEntrega(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const formData = {
        data: document.getElementById('editData').value,
        turno: document.getElementById('editTurno').value,
        frota: document.getElementById('editFrota').value,
        motorista: document.getElementById('editMotorista').value,
        lider: document.getElementById('editLider').value,
        local_saida: document.getElementById('editLocalSaida').value,
        hrs_saida: document.getElementById('editHrsSaida').value,
        destino: document.getElementById('editDestino').value,
        hrs_chegada: document.getElementById('editHrsChegada').value,
        peso_bruto: parseFloat(document.getElementById('editPesoBruto').value),
        peso_liquido: parseFloat(document.getElementById('editPesoLiquido').value),
        informacoes_adicionais: document.getElementById('editInformacoes').value || null,
        updated_at: new Date().toISOString()
    };
    
    try {
        const { error } = await supabaseClient
            .from('entregas')
            .update(formData)
            .eq('id', id);
        
        if (error) throw error;
        
        editModal.style.display = 'none';
        carregarEntregas();
        alert('Lançamento atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao atualizar lançamento');
    }
}

// Excluir entrega
async function excluirEntrega(id) {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('entregas')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        carregarEntregas();
        alert('Lançamento excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir lançamento');
    }
}

// Toggle tabela
function toggleTabela() {
    tableSection.classList.toggle('hidden');
    const span = toggleTableBtn.querySelector('span');
    if (tableSection.classList.contains('hidden')) {
        span.textContent = 'Mostrar Planilha';
        toggleTableBtn.innerHTML = '<i class="fas fa-eye"></i> <span>Mostrar Planilha</span>';
    } else {
        span.textContent = 'Ocultar Planilha';
        toggleTableBtn.innerHTML = '<i class="fas fa-eye-slash"></i> <span>Ocultar Planilha</span>';
    }
}

// Toggle filtros
function toggleFilters() {
    filtersContent.classList.toggle('hidden');
    filterIcon.classList.toggle('fa-chevron-down');
    filterIcon.classList.toggle('fa-chevron-up');
}

// Aplicar filtros
function aplicarFiltros() {
    filtrosAtivos = {
        turno: document.getElementById('filterTurno').value,
        frota: document.getElementById('filterFrota').value,
        motorista: document.getElementById('filterMotorista').value,
        destino: document.getElementById('filterDestino').value,
        dataInicio: document.getElementById('filterDataInicio').value,
        dataFim: document.getElementById('filterDataFim').value,
        ultimas24h: document.getElementById('filterUltimas24h').checked
    };
    
    carregarEntregas();
}

// Limpar filtros
function limparFiltros() {
    document.getElementById('filterTurno').value = '';
    document.getElementById('filterFrota').value = '';
    document.getElementById('filterMotorista').value = '';
    document.getElementById('filterDestino').value = '';
    document.getElementById('filterDataInicio').value = '';
    document.getElementById('filterDataFim').value = '';
    document.getElementById('filterUltimas24h').checked = true;
    
    filtrosAtivos = {
        turno: '',
        frota: '',
        motorista: '',
        destino: '',
        dataInicio: '',
        dataFim: '',
        ultimas24h: true
    };
    
    carregarEntregas();
}

// Exportar dados
function exportarDados() {
    const formatoSelecionado = document.getElementById('exportFormat').value;
    
    switch(formatoSelecionado) {
        case 'pdf':
            exportarPDF();
            break;
        case 'excel':
            exportarExcel();
            break;
        case 'jpg':
            exportarJPG();
            break;
    }
}

// Exportar Excel
function exportarExcel() {
    const dadosExport = entregas.map(entrega => {
        const tara = (parseFloat(entrega.peso_bruto) - parseFloat(entrega.peso_liquido)).toFixed(2);
        
        return {
            ID: entrega.id,
            Data: formatarDataISO(entrega.data),
            Turno: formatarTurno(entrega.turno),
            Frota: entrega.frota,
            Motorista: entrega.motorista,
            'Líder/Gestor': entrega.lider,
            'Local Saída': entrega.local_saida,
            'Hora Saída': entrega.hrs_saida,
            Destino: entrega.destino,
            'Hora Chegada': entrega.hrs_chegada,
            'Peso Bruto (kg)': entrega.peso_bruto,
            'Peso Líquido (kg)': entrega.peso_liquido,
            'Tara (kg)': tara,
            Observações: entrega.informacoes_adicionais || '',
            'Data Registro': formatarData(entrega.created_at)
        };
    });
    
    const csv = convertToCSV(dadosExport);
    downloadFile(csv, 'apontamentos_entregas.csv', 'text/csv');
}

// Exportar PDF (placeholder)
function exportarPDF() {
    alert('Funcionalidade de exportação PDF em desenvolvimento');
}

// Exportar JPG (placeholder)
function exportarJPG() {
    alert('Funcionalidade de exportação JPG em desenvolvimento');
}

// Converter para CSV
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            const escaped = String(value).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

// Download de arquivo
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

// Formatar turno
function formatarTurno(turno) {
    const turnos = {
        'matutino': 'Matutino',
        'vespertino': 'Vespertino',
        'noturno': 'Noturno'
    };
    return turnos[turno] || turno;
}

// Formatar peso
function formatarPeso(peso) {
    if (!peso) return '0,00';
    return parseFloat(peso).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Formatar data ISO
function formatarDataISO(dataISO) {
    if (!dataISO) return '-';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Formatar data/hora
function formatarData(dataISO) {
    if (!dataISO) return '-';
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Funções globais
window.editarEntrega = editarEntrega;
window.excluirEntrega = excluirEntrega;
window.toggleFilters = toggleFilters;
