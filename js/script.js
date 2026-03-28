// Configuração do Supabase
const SUPABASE_URL = "https://szzfqkhibuejhodhkvjj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_";

// Inicializa o cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos do DOM
const form = document.getElementById('abastecimentoForm');
const equipamentoSelect = document.getElementById('equipamento_id');
const operadorSelect = document.getElementById('operador_id');
const combustivelSelect = document.getElementById('combustivel_id');
const filterEquipamento = document.getElementById('filter_equipamento');
const filterOperador = document.getElementById('filter_operador');
const filterCombustivel = document.getElementById('filter_combustivel');
const btnFilter = document.getElementById('btnFilter');
const btnClear = document.getElementById('btnClear');
const btnLoad = document.getElementById('btnLoad');
const tableBody = document.getElementById('tableBody');
const loading = document.getElementById('loading');

// Função para mostrar toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Função para carregar equipamentos
async function carregarEquipamentos() {
    try {
        const { data, error } = await supabase
            .from('equipamentos')
            .select('*')
            .order('nome');
        
        if (error) throw error;
        
        if (data) {
            // Preenche o select do formulário
            equipamentoSelect.innerHTML = '<option value="">Selecione um equipamento</option>';
            
            // Preenche o select do filtro
            filterEquipamento.innerHTML = '<option value="">Todos equipamentos</option>';
            
            data.forEach(eq => {
                const option = document.createElement('option');
                option.value = eq.id;
                option.textContent = `${eq.nome} - ${eq.tipo}`;
                equipamentoSelect.appendChild(option.cloneNode(true));
                
                // Para o filtro, só o nome
                const filterOption = document.createElement('option');
                filterOption.value = eq.id;
                filterOption.textContent = eq.nome;
                filterEquipamento.appendChild(filterOption);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        showToast('Erro ao carregar equipamentos', 'error');
    }
}

// Função para carregar operadores
async function carregarOperadores() {
    try {
        const { data, error } = await supabase
            .from('operadores')
            .select('*')
            .eq('ativo', true)
            .order('nome');
        
        if (error) throw error;
        
        if (data) {
            operadorSelect.innerHTML = '<option value="">Selecione um operador</option>';
            filterOperador.innerHTML = '<option value="">Todos operadores</option>';
            
            data.forEach(op => {
                const option = document.createElement('option');
                option.value = op.id;
                option.textContent = op.nome;
                operadorSelect.appendChild(option.cloneNode(true));
                
                const filterOption = option.cloneNode(true);
                filterOperador.appendChild(filterOption);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar operadores:', error);
        showToast('Erro ao carregar operadores', 'error');
    }
}

// Função para carregar combustíveis
async function carregarCombustiveis() {
    try {
        const { data, error } = await supabase
            .from('combustiveis')
            .select('*')
            .order('nome');
        
        if (error) throw error;
        
        if (data) {
            combustivelSelect.innerHTML = '<option value="">Selecione o combustível</option>';
            filterCombustivel.innerHTML = '<option value="">Todos combustíveis</option>';
            
            data.forEach(comb => {
                const option = document.createElement('option');
                option.value = comb.id;
                option.textContent = comb.nome;
                combustivelSelect.appendChild(option.cloneNode(true));
                
                const filterOption = option.cloneNode(true);
                filterCombustivel.appendChild(filterOption);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar combustíveis:', error);
        showToast('Erro ao carregar combustíveis', 'error');
    }
}

// Função para carregar abastecimentos
async function carregarAbastecimentos() {
    loading.style.display = 'block';
    tableBody.innerHTML = '';
    
    try {
        let query = supabase
            .from('abastecimentos')
            .select(`
                *,
                equipamentos (id, nome, tipo),
                operadores (id, nome),
                combustiveis (id, nome)
            `)
            .order('data_hora', { ascending: false });
        
        // Aplicar filtros
        if (filterEquipamento.value) {
            query = query.eq('equipamento_id', filterEquipamento.value);
        }
        if (filterOperador.value) {
            query = query.eq('operador_id', filterOperador.value);
        }
        if (filterCombustivel.value) {
            query = query.eq('combustivel_id', filterCombustivel.value);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            data.forEach(abast => {
                const row = document.createElement('tr');
                
                // Formatar data
                const dataHora = new Date(abast.data_hora).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                row.innerHTML = `
                    <td>${abast.id}</td>
                    <td>${abast.equipamentos?.nome || '-'}</td>
                    <td>${abast.operadores?.nome || '-'}</td>
                    <td>${abast.combustiveis?.nome || '-'}</td>
                    <td>${abast.quantidade.toFixed(2)} L</td>
                    <td>${dataHora}</td>
                    <td>${abast.horimetro ? abast.horimetro.toFixed(1) + ' h' : '-'}</td>
                    <td>${abast.observacoes || '-'}</td>
                    <td>
                        <button onclick="excluirAbastecimento(${abast.id})" class="btn-delete">
                            🗑️ Excluir
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-records">
                        Nenhum registro encontrado
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar abastecimentos:', error);
        showToast('Erro ao carregar registros', 'error');
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="no-records">
                    Erro ao carregar registros. Tente novamente.
                </td>
            </tr>
        `;
    } finally {
        loading.style.display = 'none';
    }
}

// Função para excluir abastecimento
window.excluirAbastecimento = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('abastecimentos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('Registro excluído com sucesso!', 'success');
        carregarAbastecimentos();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showToast('Erro ao excluir registro', 'error');
    }
};

// Event listener do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validações
    const equipamento_id = document.getElementById('equipamento_id').value;
    const operador_id = document.getElementById('operador_id').value;
    const combustivel_id = document.getElementById('combustivel_id').value;
    const quantidade = document.getElementById('quantidade').value;
    
    if (!equipamento_id || !operador_id || !combustivel_id || !quantidade) {
        showToast('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    if (parseFloat(quantidade) <= 0) {
        showToast('A quantidade deve ser maior que zero!', 'error');
        return;
    }
    
    // Preparar dados
    const data_hora = document.getElementById('data_hora').value;
    const horimetro = document.getElementById('horimetro').value;
    const observacoes = document.getElementById('observacoes').value;
    
    const abastecimento = {
        equipamento_id: parseInt(equipamento_id),
        operador_id: parseInt(operador_id),
        combustivel_id: parseInt(combustivel_id),
        quantidade: parseFloat(quantidade),
        data_hora: data_hora || new Date().toISOString(),
        horimetro: horimetro ? parseFloat(horimetro) : null,
        observacoes: observacoes || null
    };
    
    try {
        const { error } = await supabase
            .from('abastecimentos')
            .insert([abastecimento]);
        
        if (error) throw error;
        
        showToast('Abastecimento registrado com sucesso!', 'success');
        form.reset();
        carregarAbastecimentos();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast('Erro ao salvar abastecimento', 'error');
    }
});

// Event listeners dos filtros
btnFilter.addEventListener('click', carregarAbastecimentos);
btnClear.addEventListener('click', () => {
    filterEquipamento.value = '';
    filterOperador.value = '';
    filterCombustivel.value = '';
    carregarAbastecimentos();
});

btnLoad.addEventListener('click', carregarAbastecimentos);

// Definir data/hora atual no campo
const dataHoraInput = document.getElementById('data_hora');
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
dataHoraInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarEquipamentos();
    carregarOperadores();
    carregarCombustiveis();
});