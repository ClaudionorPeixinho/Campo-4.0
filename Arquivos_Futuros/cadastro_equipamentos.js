// Configuração do Supabase
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE';
const SUPABASE_KEY = 'SUA_CHAVE_ANON_DO_SUPABASE';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos do DOM
const equipmentForm = document.getElementById('equipmentForm');
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

// Estado da aplicação
let equipamentos = [];
let filtrosAtivos = {
    tipo: '',
    status: '',
    marca: '',
    ultimas24h: true
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarEquipamentos();
    configurarEventListeners();
    verificarUltimas24h();
});

// Configurar Event Listeners
function configurarEventListeners() {
    equipmentForm.addEventListener('submit', salvarEquipamento);
    toggleTableBtn.addEventListener('click', toggleTabela);
    applyFiltersBtn.addEventListener('click', aplicarFiltros);
    clearFiltersBtn.addEventListener('click', limparFiltros);
    exportBtn.addEventListener('click', exportarDados);
    closeModal.addEventListener('click', () => editModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.style.display = 'none';
    });
    editForm.addEventListener('submit', atualizarEquipamento);
}

// Verificar registros das últimas 24h a cada minuto
function verificarUltimas24h() {
    carregarEquipamentos();
    setInterval(carregarEquipamentos, 60000);
}

// Carregar equipamentos do Supabase
async function carregarEquipamentos() {
    try {
        tableBody.innerHTML = '<tr><td colspan="10" class="loading"><i class="fas fa-spinner"></i> Carregando...</td></tr>';
        
        let query = supabase
            .from('equipamentos')
            .select('*');
        
        // Aplicar filtro de últimas 24h
        if (filtrosAtivos.ultimas24h) {
            const dataLimite = new Date();
            dataLimite.setHours(dataLimite.getHours() - 24);
            query = query.gte('created_at', dataLimite.toISOString());
        }
        
        // Aplicar outros filtros
        if (filtrosAtivos.tipo) {
            query = query.eq('tipo', filtrosAtivos.tipo);
        }
        if (filtrosAtivos.status) {
            query = query.eq('status', filtrosAtivos.status);
        }
        if (filtrosAtivos.marca) {
            query = query.ilike('marca', `%${filtrosAtivos.marca}%`);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        equipamentos = data || [];
        renderizarTabela();
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        tableBody.innerHTML = '<tr><td colspan="10" style="color: #f44336; text-align: center;">Erro ao carregar dados</td></tr>';
    }
}

// Renderizar tabela
function renderizarTabela() {
    if (equipamentos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Nenhum equipamento cadastrado</td></tr>';
        return;
    }
    
    tableBody.innerHTML = equipamentos.map(eq => `
        <tr>
            <td>${eq.id}</td>
            <td><strong>${eq.nome || '-'}</strong></td>
            <td>${formatarTipo(eq.tipo)}</td>
            <td>${eq.marca || '-'}</td>
            <td>${eq.modelo || '-'}</td>
            <td>${eq.ano || '-'}</td>
            <td><span class="status-badge status-${eq.status}">${formatarStatus(eq.status)}</span></td>
            <td>${eq.observacoes || '-'}</td>
            <td>${formatarData(eq.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editarEquipamento('${eq.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="excluirEquipamento('${eq.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Salvar novo equipamento
async function salvarEquipamento(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('nome').value,
        tipo: document.getElementById('tipo').value,
        marca: document.getElementById('marca').value || null,
        modelo: document.getElementById('modelo').value || null,
        ano: document.getElementById('ano').value ? parseInt(document.getElementById('ano').value) : null,
        status: document.getElementById('status').value,
        observacoes: document.getElementById('observacoes').value || null,
        created_at: new Date().toISOString()
    };
    
    try {
        const { error } = await supabase
            .from('equipamentos')
            .insert([formData]);
        
        if (error) throw error;
        
        equipmentForm.reset();
        carregarEquipamentos();
        alert('Equipamento cadastrado com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao cadastrar equipamento');
    }
}

// Editar equipamento
async function editarEquipamento(id) {
    try {
        const { data, error } = await supabase
            .from('equipamentos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('editId').value = data.id;
        document.getElementById('editNome').value = data.nome || '';
        document.getElementById('editTipo').value = data.tipo || '';
        document.getElementById('editMarca').value = data.marca || '';
        document.getElementById('editModelo').value = data.modelo || '';
        document.getElementById('editAno').value = data.ano || '';
        document.getElementById('editStatus').value = data.status || '';
        document.getElementById('editObservacoes').value = data.observacoes || '';
        
        editModal.style.display = 'block';
    } catch (error) {
        console.error('Erro ao carregar equipamento:', error);
        alert('Erro ao carregar dados para edição');
    }
}

// Atualizar equipamento
async function atualizarEquipamento(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const formData = {
        nome: document.getElementById('editNome').value,
        tipo: document.getElementById('editTipo').value,
        marca: document.getElementById('editMarca').value || null,
        modelo: document.getElementById('editModelo').value || null,
        ano: document.getElementById('editAno').value ? parseInt(document.getElementById('editAno').value) : null,
        status: document.getElementById('editStatus').value,
        observacoes: document.getElementById('editObservacoes').value || null,
        updated_at: new Date().toISOString()
    };
    
    try {
        const { error } = await supabase
            .from('equipamentos')
            .update(formData)
            .eq('id', id);
        
        if (error) throw error;
        
        editModal.style.display = 'none';
        carregarEquipamentos();
        alert('Equipamento atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao atualizar equipamento');
    }
}

// Excluir equipamento
async function excluirEquipamento(id) {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;
    
    try {
        const { error } = await supabase
            .from('equipamentos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        carregarEquipamentos();
        alert('Equipamento excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir equipamento');
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
        tipo: document.getElementById('filterTipo').value,
        status: document.getElementById('filterStatus').value,
        marca: document.getElementById('filterMarca').value,
        ultimas24h: document.getElementById('filterData').checked
    };
    
    carregarEquipamentos();
}

// Limpar filtros
function limparFiltros() {
    document.getElementById('filterTipo').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterMarca').value = '';
    document.getElementById('filterData').checked = true;
    
    filtrosAtivos = {
        tipo: '',
        status: '',
        marca: '',
        ultimas24h: true
    };
    
    carregarEquipamentos();
}

// Exportar dados
function exportarDados(formato) {
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

// Exportar PDF
function exportarPDF() {
    alert('Funcionalidade de exportação PDF em desenvolvimento');
}

// Exportar Excel
function exportarExcel() {
    const dadosExport = equipamentos.map(eq => ({
        ID: eq.id,
        Nome: eq.nome,
        Tipo: formatarTipo(eq.tipo),
        Marca: eq.marca,
        Modelo: eq.modelo,
        Ano: eq.ano,
        Status: formatarStatus(eq.status),
        Observações: eq.observacoes,
        'Data de Registro': formatarData(eq.created_at)
    }));
    
    const csv = convertToCSV(dadosExport);
    downloadFile(csv, 'equipamentos_agricolas.csv', 'text/csv');
}

// Exportar JPG
function exportarJPG() {
    alert('Funcionalidade de exportação JPG em desenvolvimento');
}

// Converter para CSV
function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
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

// Formatar tipo
function formatarTipo(tipo) {
    const tipos = {
        'trator': 'Trator',
        'colheitadeira': 'Colheitadeira',
        'pulverizador': 'Pulverizador',
        'plantadeira': 'Plantadeira',
        'arado': 'Arado',
        'grade': 'Grade'
    };
    return tipos[tipo] || tipo;
}

// Formatar status
function formatarStatus(status) {
    const statusMap = {