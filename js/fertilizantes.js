/**
 * Sistema de Gestão de Fertilizantes e Corretivos
 * Sistema de Gestão Agrícola Campo 4.0
 * Versão 1.0 - Com integração ao Supabase
 */

// CONFIG
const FERT_SUPABASE_URL = "https://szzfqkhibuejhodhkvjj.supabase.co";
const FERT_SUPABASE_KEY = "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_";

class GestorFertilizantes {
    constructor() {
        this.historico = this.carregarHistorico();
        this.supabase = this.getSupabaseClient();
        this.registrosSalvos = [];
        this.inicializarEventos();
        this.restaurarDados();
        this.carregarRegistrosSalvos();
    }

    getSupabaseClient() {
        if (typeof supabase !== 'undefined') {
            return supabase.createClient(FERT_SUPABASE_URL, FERT_SUPABASE_KEY);
        }
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
        try {
            if (window.parent && window.parent.supabaseClient) {
                return window.parent.supabaseClient;
            }
        } catch (e) {
            console.warn('Não foi possível acessar parent:', e);
        }
        console.error('Supabase: NÃO foi possível criar cliente');
        return null;
    }

    inicializarEventos() {
        document.querySelectorAll('input, select, textarea').forEach(campo => {
            campo.addEventListener('change', () => {
                this.salvarDados();
                if (typeof atualizarInfoPropriedade === 'function') {
                    atualizarInfoPropriedade();
                }
            });
        });

        document.addEventListener('keydown', (e) => this.avancarCampoComEnter(e));
    }

    avancarCampoComEnter(e) {
        if (e.key !== 'Enter' || e.shiftKey) return;
        const atual = document.activeElement;
        if (!atual || !atual.matches('input, select, textarea')) return;
        if (atual.type === 'button' || atual.type === 'submit' || atual.readOnly) return;

        e.preventDefault();
        const escopo = document.getElementById('modalPropriedade').classList.contains('show')
            ? document.getElementById('modalPropriedade')
            : document;
        const campos = [...escopo.querySelectorAll('input, select, textarea')]
            .filter(campo => !campo.disabled && !campo.readOnly && campo.offsetParent !== null);
        const index = campos.indexOf(atual);

        if (index >= 0 && index < campos.length - 1) {
            campos[index + 1].focus();
            if (typeof campos[index + 1].select === 'function') campos[index + 1].select();
        }
    }

    salvarDados() {
        const dados = {
            tipoProduto: document.getElementById('tipoProduto').value,
            nomeProduto: document.getElementById('nomeProduto').value,
            area: document.getElementById('area').value,
            areaUnit: document.getElementById('areaUnit').value,
            dose: document.getElementById('dose').value,
            doseUnit: document.getElementById('doseUnit').value,
            teorN: document.getElementById('teorN').value,
            teorP: document.getElementById('teorP').value,
            teorK: document.getElementById('teorK').value,
            numAplicacoes: document.getElementById('numAplicacoes').value,
            areaConcluida: document.getElementById('areaConcluida').value,
            custo: document.getElementById('custo').value,
            observacoes: document.getElementById('observacoes').value,
            propriedade: document.getElementById('propriedade').value,
            lote: document.getElementById('lote').value,
            cultura: document.getElementById('cultura').value,
            responsavel: document.getElementById('responsavel').value,
            dataAplicacao: document.getElementById('dataAplicacao').value,
        };
        localStorage.setItem('fertilizantesDados', JSON.stringify(dados));
    }

    restaurarDados() {
        const dados = JSON.parse(localStorage.getItem('fertilizantesDados') || '{}');
        Object.keys(dados).forEach(chave => {
            const elemento = document.getElementById(chave);
            if (elemento) {
                elemento.value = dados[chave];
            }
        });
        if (Object.keys(dados).length > 0) {
            setTimeout(() => {
                if (typeof atualizarInfoPropriedade === 'function') {
                    atualizarInfoPropriedade();
                }
            }, 100);
        }
    }

    async calcular() {
        const dados = this.coletarDados();

        if (!this.validarDados(dados)) {
            return;
        }

        const resultado = this.realizarCalculos(dados);
        this.exibirResultados(resultado, dados);
        this.adicionarAoHistorico(dados, resultado);
        await this.registrarNoBanco(dados, resultado);

        if (typeof atualizarInfoPropriedade === 'function') {
            atualizarInfoPropriedade();
        }

        this.limpar({ manterResultados: true });
    }

    async registrarNoBanco(dados, resultado) {
        if (!this.supabase) {
            console.warn('Supabase não disponível. Salvando apenas localmente.');
            showNotification('Supabase não disponível. Registro salvo localmente.', 'warning');
            return;
        }

        try {
            const registro = {
                tipo_produto: dados.tipoProduto,
                nome_produto: dados.nomeProduto || null,
                area: dados.area,
                area_unit: document.getElementById('areaUnit').value,
                dose: dados.dose,
                dose_unit: document.getElementById('doseUnit').value,
                teor_n: parseFloat(dados.teorN) || 0,
                teor_p: parseFloat(dados.teorP) || 0,
                teor_k: parseFloat(dados.teorK) || 0,
                num_aplicacoes: dados.numAplicacoes,
                area_concluida: parseFloat(dados.areaConcluida) || 0,
                custo_por_ton: parseFloat(dados.custo) || null,
                observacoes: dados.observacoes || null,
                propriedade: dados.propriedade || null,
                lote_talhao: dados.lote || null,
                cultura: dados.cultura || null,
                responsavel_tecnico: dados.responsavel || null,
                data_aplicacao: dados.dataAplicacao || null,
                total_produto: parseFloat(resultado.totalProduto),
                area_restante: parseFloat(resultado.areaRestante),
                percentual_concluido: parseFloat(resultado.percentConcluida),
                custo_total: parseFloat(resultado.custoTotal) || null,
                nutrientes_n: parseFloat(resultado.nutrientes.N),
                nutrientes_p: parseFloat(resultado.nutrientes.P),
                nutrientes_k: parseFloat(resultado.nutrientes.K)
            };

            const { data: inserido, error, offline } = window.CampoOfflineSync
                ? await window.CampoOfflineSync.saveInsert('fertilizantes_corretivos', registro, { select: true, single: true })
                : await this.supabase
                    .from('fertilizantes_corretivos')
                    .insert([registro])
                    .select()
                    .single();

            if (error) throw error;

            if (!offline) this.carregarRegistrosSalvos();
            showNotification(offline ? 'Registro salvo offline. Sincronize quando tiver internet.' : 'Registro salvo com sucesso no banco de dados!', 'success');
        } catch (error) {
            console.error('Erro ao salvar no banco:', error);
            let mensagem = error.message || 'Erro desconhecido';
            if (mensagem.includes('relation') || mensagem.includes('does not exist')) {
                mensagem = 'Tabela não existe. Execute o SQL no Supabase!';
            } else if (mensagem.includes('policy') || mensagem.includes('permission')) {
                mensagem = 'Erro de permissão. Verifique RLS policies!';
            }
            showNotification(`Erro: ${mensagem}`, 'error');
        }
    }

    async carregarRegistrosSalvos() {
        if (!this.supabase) {
            this.registrosSalvos = [];
            return;
        }

        try {
            const { data: testData, error: testError } = await this.supabase
                .from('fertilizantes_corretivos')
                .select('id')
                .limit(1);

            if (testError) {
                console.warn('Erro no teste de conexão:', testError);
                this.registrosSalvos = [];
                return;
            }

            const { data, error } = await this.supabase
                .from('fertilizantes_corretivos')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            this.registrosSalvos = data || [];
            this.atualizarTabelaRegistros();
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            this.registrosSalvos = [];
        }
    }

    atualizarTabelaRegistros() {
        const container = document.getElementById('tabelaRegistros');
        if (!container) return;

        if (!this.registrosSalvos || this.registrosSalvos.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                        <p class="mt-2">Nenhum registro encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        const culturaLabels = {
            'soja': 'Soja', 'milho': 'Milho', 'cana': 'Cana-de-açúcar', 'trigo': 'Trigo',
            'algodao': 'Algodão', 'arroz': 'Arroz', 'feijao': 'Feijão',
            'pastagem': 'Pastagem', 'citrus': 'Citrus', 'cafe': 'Café', 'outra': 'Outra'
        };

        let html = this.registrosSalvos.map(reg => {
            const data = reg.data_aplicacao ? new Date(reg.data_aplicacao + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
            const cultura = culturaLabels[reg.cultura] || reg.cultura || '-';
            const tipo = reg.tipo_produto === 'fertilizante' ? 'Fertilizante' : 
                         reg.tipo_produto === 'corretivo' ? 'Corretivo' : 'Ambos';

            return `
                <tr>
                    <td>${data}</td>
                    <td>${reg.propriedade || '-'}</td>
                    <td>${reg.lote_talhao || '-'}</td>
                    <td>${cultura}</td>
                    <td>${reg.nome_produto || '-'}</td>
                    <td>${reg.area} ${reg.area_unit}</td>
                    <td>${reg.area_concluida || 0} ha</td>
                    <td>R$ ${reg.custo_total ? parseFloat(reg.custo_total).toFixed(2) : '0.00'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="gestor.excluirRegistro('${reg.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = html;
    }

    async excluirRegistro(id) {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;

        try {
            if (this.supabase) {
                const { error } = await this.supabase
                    .from('fertilizantes_corretivos')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                showNotification('Registro excluído com sucesso!', 'success');
                this.carregarRegistrosSalvos();
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showNotification('Erro ao excluir registro.', 'error');
        }
    }

    coletarDados() {
        return {
            tipoProduto: document.getElementById('tipoProduto').value,
            nomeProduto: document.getElementById('nomeProduto').value,
            area: this.converterArea(),
            dose: this.converterDose(),
            teorN: parseFloat(document.getElementById('teorN').value) || 0,
            teorP: parseFloat(document.getElementById('teorP').value) || 0,
            teorK: parseFloat(document.getElementById('teorK').value) || 0,
            numAplicacoes: parseInt(document.getElementById('numAplicacoes').value) || 1,
            areaConcluida: parseFloat(document.getElementById('areaConcluida').value) || 0,
            custo: parseFloat(document.getElementById('custo').value) || 0,
            observacoes: document.getElementById('observacoes').value,
            propriedade: document.getElementById('propriedade').value,
            lote: document.getElementById('lote').value,
            cultura: document.getElementById('cultura').value,
            responsavel: document.getElementById('responsavel').value,
            dataAplicacao: document.getElementById('dataAplicacao').value,
        };
    }

    converterArea() {
        let area = parseFloat(document.getElementById('area').value) || 0;
        const unit = document.getElementById('areaUnit').value;
        if (unit === 'm2') {
            area = area / 10000;
        }
        return area;
    }

    converterDose() {
        let dose = parseFloat(document.getElementById('dose').value) || 0;
        const unit = document.getElementById('doseUnit').value;
        if (unit === 'g/m2') {
            dose = dose / 1000; // Convert g/m² to kg/ha? Actually need to be careful.
            // 1 g/m² = 10 kg/ha. So:
            dose = dose * 10;
        }
        return dose;
    }

    validarDados(dados) {
        if (dados.area <= 0 || dados.dose <= 0) {
            alert('⚠️ Por favor, preencha os campos de área e dose com valores válidos!');
            return false;
        }
        if (dados.numAplicacoes <= 0) {
            alert('⚠️ O número de aplicações deve ser maior que zero!');
            return false;
        }
        return true;
    }

    realizarCalculos(dados) {
        const totalProduto = dados.area * dados.dose * dados.numAplicacoes; // in kg
        const areaRestante = Math.max(0, dados.area - dados.areaConcluida);
        const percentConcluida = dados.area > 0 ? ((dados.areaConcluida / dados.area) * 100).toFixed(1) : 0;
        const custoTotal = dados.custo > 0 ? (totalProduto / 1000) * dados.custo : 0; // custo is R$/t, totalProduto in kg

        // Nutrients
        const nutrientes = {
            N: (totalProduto * (dados.teorN / 100)).toFixed(2),
            P: (totalProduto * (dados.teorP / 100)).toFixed(2),
            K: (totalProduto * (dados.teorK / 100)).toFixed(2)
        };

        return {
            totalProduto: totalProduto.toFixed(2),
            areaRestante: areaRestante.toFixed(2),
            percentConcluida,
            custoTotal: custoTotal.toFixed(2),
            nutrientes,
            ...dados
        };
    }

    exibirResultados(resultado, dados) {
        document.getElementById('totalProduto').textContent = resultado.totalProduto;
        document.getElementById('areaRestante').textContent = resultado.areaRestante;
        document.getElementById('percentConcluida').textContent = resultado.percentConcluida;
        document.getElementById('custoTotal').textContent = resultado.custoTotal;

        // Tab Detalhes
        const detalhesTable = document.getElementById('detalhesTable');
        detalhesTable.innerHTML = `
            <tr>
                <td><strong>Tipo de Produto</strong></td>
                <td>${dados.tipoProduto === 'fertilizante' ? 'Fertilizante' : dados.tipoProduto === 'corretivo' ? 'Corretivo' : 'Ambos'}</td>
            </tr>
            <tr>
                <td><strong>Nome do Produto</strong></td>
                <td>${dados.nomeProduto || '-'}</td>
            </tr>
            <tr>
                <td><strong>Propriedade</strong></td>
                <td>${dados.propriedade || '-'}</td>
            </tr>
            <tr>
                <td><strong>Lote / Talhão</strong></td>
                <td>${dados.lote || '-'}</td>
            </tr>
            <tr>
                <td><strong>Cultura</strong></td>
                <td>${dados.cultura || '-'}</td>
            </tr>
            <tr>
                <td><strong>Responsável Técnico</strong></td>
                <td>${dados.responsavel || '-'}</td>
            </tr>
            <tr>
                <td><strong>Data da Aplicação</strong></td>
                <td>${dados.dataAplicacao ? new Date(dados.dataAplicacao).toLocaleDateString('pt-BR') : '-'}</td>
            </tr>
            <tr style="background: rgba(142, 68, 173, 0.1); border-top: 2px solid #8e44ad;">
                <td><strong>Área Total</strong></td>
                <td>${dados.area.toFixed(2)} ha</td>
            </tr>
            <tr>
                <td><strong>Dose Recomendada</strong></td>
                <td>${dados.dose.toFixed(2)} kg/ha</td>
            </tr>
            <tr>
                <td><strong>Número de Aplicações</strong></td>
                <td>${dados.numAplicacoes}x</td>
            </tr>
            <tr style="background: rgba(142, 68, 173, 0.1);">
                <td><strong>Total de Produto</strong></td>
                <td><strong>${resultado.totalProduto} kg</strong></td>
            </tr>
            <tr>
                <td><strong>Área Concluída</strong></td>
                <td>${dados.areaConcluida} ha</td>
            </tr>
            <tr>
                <td><strong>Área Restante</strong></td>
                <td>${resultado.areaRestante} ha</td>
            </tr>
            <tr>
                <td><strong>% Concluída</strong></td>
                <td><strong>${resultado.percentConcluida}%</strong></td>
            </tr>
            <tr style="background: rgba(39, 174, 96, 0.1);">
                <td><strong>Custo Total</strong></td>
                <td><strong>R$ ${resultado.custoTotal}</strong></td>
            </tr>
            <tr>
                <td><strong>Observações</strong></td>
                <td>${dados.observacoes || '-'}</td>
            </tr>
        `;

        // Tab Nutrientes
        const nutrientesTable = document.getElementById('nutrientesTable');
        nutrientesTable.innerHTML = `
            <tr>
                <td>N (Nitrogênio)</td>
                <td>${dados.teorN}%</td>
                <td>${resultado.nutrientes.N} kg</td>
            </tr>
            <tr>
                <td>P₂O₅ (Fósforo)</td>
                <td>${dados.teorP}%</td>
                <td>${resultado.nutrientes.P} kg</td>
            </tr>
            <tr>
                <td>K₂O (Potássio)</td>
                <td>${dados.teorK}%</td>
                <td>${resultado.nutrientes.K} kg</td>
            </tr>
        `;

        document.getElementById('resultados').classList.add('show');
        setTimeout(() => {
            document.querySelector('.results-container').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    adicionarAoHistorico(dados, resultado) {
        const item = {
            id: Date.now(),
            data: new Date().toLocaleString('pt-BR'),
            propriedade: dados.propriedade,
            lote: dados.lote,
            area: dados.area,
            totalProduto: resultado.totalProduto,
            dados: dados,
            resultado: resultado
        };
        
        this.historico.unshift(item);
        if (this.historico.length > 50) {
            this.historico.pop();
        }
        
        this.salvarHistorico();
    }

    salvarHistorico() {
        localStorage.setItem('fertilizantesHistorico', JSON.stringify(this.historico));
    }

    carregarHistorico() {
        return JSON.parse(localStorage.getItem('fertilizantesHistorico') || '[]');
    }

    limpar(opcoes = {}) {
        document.getElementById('tipoProduto').value = 'fertilizante';
        document.getElementById('nomeProduto').value = '';
        document.getElementById('area').value = '';
        document.getElementById('areaUnit').value = 'ha';
        document.getElementById('dose').value = '';
        document.getElementById('doseUnit').value = 'kg/ha';
        document.getElementById('teorN').value = '';
        document.getElementById('teorP').value = '';
        document.getElementById('teorK').value = '';
        document.getElementById('numAplicacoes').value = '1';
        document.getElementById('areaConcluida').value = '';
        document.getElementById('custo').value = '';
        document.getElementById('observacoes').value = '';
        document.getElementById('propriedade').value = '';
        document.getElementById('lote').value = '';
        document.getElementById('cultura').value = '';
        document.getElementById('responsavel').value = '';
        document.getElementById('dataAplicacao').valueAsDate = new Date();
        if (!opcoes.manterResultados) {
            document.getElementById('resultados').classList.remove('show');
        }
        document.getElementById('propriedadeInfo').classList.remove('show');
        localStorage.removeItem('fertilizantesDados');

        const primeiroCampo = document.getElementById('tipoProduto');
        if (primeiroCampo) primeiroCampo.focus();
    }
}

let gestor;
document.addEventListener('DOMContentLoaded', () => {
    gestor = new GestorFertilizantes();
    window.gestor = gestor;
});

function calcular() {
    gestor.calcular();
}

function limparFormulario() {
    gestor.limpar();
}

function carregarPreset(preset) {
    const presets = {
        soja: { cultura: 'soja', dose: 300, tipo: 'fertilizante', teorN: 20, teorP: 80, teorK: 20 },
        milho: { cultura: 'milho', dose: 400, tipo: 'fertilizante', teorN: 10, teorP: 90, teorK: 30 },
        cana: { cultura: 'cana', dose: 600, tipo: 'corretivo', teorN: 0, teorP: 30, teorK: 10 },
        pastagem: { cultura: 'pastagem', dose: 200, tipo: 'fertilizante', teorN: 5, teorP: 20, teorK: 15 }
    };

    const config = presets[preset];
    if (config) {
        document.getElementById('cultura').value = config.cultura;
        document.getElementById('dose').value = config.dose;
        document.getElementById('tipoProduto').value = config.tipo;
        document.getElementById('teorN').value = config.teorN;
        document.getElementById('teorP').value = config.teorP;
        document.getElementById('teorK').value = config.teorK;
    }
}
