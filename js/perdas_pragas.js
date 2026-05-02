/**
 * Calculadora de Perdas e Pragas - Cana-de-Açúcar
 * Sistema de Gestão Agrícola Campo 4.0
 * Versão 2.0 - Com integração ao Supabase
 */

// CONFIG - Mesmo padrão do apontamento.js
const PERDAS_SUPABASE_URL = "https://szzfqkhibuejhodhkvjj.supabase.co";
const PERDAS_SUPABASE_KEY = "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_";

class CalculadoraPerdasPragas {
    constructor() {
        this.historico = this.carregarHistorico();
        this.supabase = this.getSupabaseClient();
        this.registrosSalvos = [];
        console.log('=== Perdas e Pragas Inicializado ===');
        console.log('Supabase client:', this.supabase ? 'OK' : 'NÃO DISPONÍVEL');
        this.inicializarEventos();
        this.restaurarDados();
        this.carregarRegistrosSalvos();
    }

    getSupabaseClient() {
        // 1. Criar cliente diretamente (mesmo padrão do apontamento.js)
        if (typeof supabase !== 'undefined') {
            console.log('Supabase: criando cliente com SDK direto');
            return supabase.createClient(PERDAS_SUPABASE_URL, PERDAS_SUPABASE_KEY);
        }
        // 2. Tentar window.supabaseClient (herdado do parent)
        if (window.supabaseClient) {
            console.log('Supabase: usando window.supabaseClient');
            return window.supabaseClient;
        }
        // 3. Tentar parent window
        try {
            if (window.parent && window.parent.supabaseClient) {
                console.log('Supabase: usando parent.supabaseClient');
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
                if (typeof atualizarResumo === 'function') {
                    atualizarResumo();
                }
            });
        });

        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('modalPragas').classList.contains('show')) {
                this.registrar();
            }
        });
    }

    salvarDados() {
        const dados = {
            tipoPerda: document.getElementById('tipoPerda').value,
            estagioCultura: document.getElementById('estagioCultura').value,
            areaAfetada: document.getElementById('areaAfetada').value,
            areaUnit: document.getElementById('areaUnit').value,
            severidade: document.getElementById('severidade').value,
            perdaEstimada: document.getElementById('perdaEstimada').value,
            condicoesClimaticas: document.getElementById('condicoesClimaticas').value,
            dataConstatacao: document.getElementById('dataConstatacao').value,
            observacoes: document.getElementById('observacoes').value,
            praga: document.getElementById('praga').value,
            nomeCientifico: document.getElementById('nomeCientifico').value,
            estagioPraga: document.getElementById('estagioPraga').value,
            nivelInfestacao: document.getElementById('nivelInfestacao').value,
            metodoAmostragem: document.getElementById('metodoAmostragem').value,
            populacaoEstimada: document.getElementById('populacaoEstimada').value,
            populacaoUnit: document.getElementById('populacaoUnit').value,
            nivelDano: document.getElementById('nivelDano').value,
            tipoControle: document.getElementById('tipoControle').value,
            produtoControle: document.getElementById('produtoControle').value,
            outroProduto: document.getElementById('outroProduto').value,
            dataAmostragem: document.getElementById('dataAmostragem').value,
            responsavelTecnico: document.getElementById('responsavelTecnico').value,
            observacoesPraga: document.getElementById('observacoesPraga').value,
        };
        localStorage.setItem('perdasPragasDados', JSON.stringify(dados));
    }

    restaurarDados() {
        const dados = JSON.parse(localStorage.getItem('perdasPragasDados') || '{}');
        Object.keys(dados).forEach(chave => {
            const elemento = document.getElementById(chave);
            if (elemento) {
                elemento.value = dados[chave];
            }
        });

        if (dados.produtoControle === 'outro') {
            document.getElementById('outroProdutoGroup').style.display = 'block';
        }

        if (Object.keys(dados).length > 0) {
            setTimeout(() => {
                if (typeof atualizarResumo === 'function') {
                    atualizarResumo();
                }
            }, 100);
        }
    }

    coletarDados() {
        const areaAfetada = parseFloat(document.getElementById('areaAfetada').value) || 0;
        const areaUnit = document.getElementById('areaUnit').value;
        let areaHa = areaAfetada;
        if (areaUnit === 'm2') {
            areaHa = areaAfetada / 10000;
        }

        return {
            tipoPerda: document.getElementById('tipoPerda').value,
            estagioCultura: document.getElementById('estagioCultura').value,
            areaAfetada: areaHa,
            areaOriginal: areaAfetada,
            areaUnit: areaUnit,
            severidade: document.getElementById('severidade').value,
            perdaEstimada: parseFloat(document.getElementById('perdaEstimada').value) || 0,
            condicoesClimaticas: document.getElementById('condicoesClimaticas').value,
            dataConstatacao: document.getElementById('dataConstatacao').value,
            observacoes: document.getElementById('observacoes').value,
            praga: document.getElementById('praga').value,
            nomeCientifico: document.getElementById('nomeCientifico').value,
            estagioPraga: document.getElementById('estagioPraga').value,
            nivelInfestacao: parseFloat(document.getElementById('nivelInfestacao').value) || 0,
            metodoAmostragem: document.getElementById('metodoAmostragem').value,
            populacaoEstimada: parseFloat(document.getElementById('populacaoEstimada').value) || 0,
            populacaoUnit: document.getElementById('populacaoUnit').value,
            nivelDano: document.getElementById('nivelDano').value,
            tipoControle: document.getElementById('tipoControle').value,
            produtoControle: document.getElementById('produtoControle').value,
            outroProduto: document.getElementById('outroProduto').value,
            dataAmostragem: document.getElementById('dataAmostragem').value,
            responsavelTecnico: document.getElementById('responsavelTecnico').value,
            observacoesPraga: document.getElementById('observacoesPraga').value,
        };
    }

    validarDados(dados) {
        if (!dados.tipoPerda) {
            alert('⚠️ Selecione o tipo de perda!');
            return false;
        }

        if (dados.areaAfetada <= 0) {
            alert('⚠️ Informe a área afetada!');
            return false;
        }

        if (!dados.severidade) {
            alert('⚠️ Selecione a severidade do dano!');
            return false;
        }

        return true;
    }

    async registrar() {
        const dados = this.coletarDados();

        if (!this.validarDados(dados)) {
            return;
        }

        const resultado = this.calcularImpacto(dados);

        console.log('=== DEBUG SUPABASE ===');
        console.log('Supabase client:', this.supabase);
        console.log('Parent window:', window.parent);
        console.log('Parent supabaseClient:', window.parent?.supabaseClient);

        if (!this.supabase) {
            console.error('Supabase client não encontrado!');
            this.exibirResultados(resultado);
            this.adicionarAoHistorico(dados, resultado);
            this.salvarDadosLocalmente(resultado);
            showNotification('Erro: Supabase não inicializado. Registro salvo localmente.', 'error');
            return;
        }

        try {
            const registroPerda = {
                tipo_perda: dados.tipoPerda,
                estagio_cultura: dados.estagioCultura || null,
                area_afetada: dados.areaAfetada,
                area_unit: dados.areaUnit,
                severidade: dados.severidade || null,
                perda_estimada: dados.perdaEstimada || null,
                condicoes_climaticas: dados.condicoesClimaticas || null,
                data_constatacao: dados.dataConstatacao || null,
                observacoes: dados.observacoes || null,
                perda_tch: parseFloat(resultado.perdaTCH),
                tch_final: parseFloat(resultado.tchFinal),
                perda_total_toneladas: parseFloat(resultado.perdaTotalToneladas),
                custo_perda_estimado: parseFloat(resultado.custoPerdaEstimado),
                nivel_risco: resultado.nivelRisco,
                acao_recomendada: resultado.acaoRecomendada,
                responsavel_registro: dados.responsavelTecnico || null,
            };

            console.log('Enviando registro:', registroPerda);

            const { data: perdaInserida, error: erroPerda } = await this.supabase
                .from('registros_perdas')
                .insert([registroPerda])
                .select()
                .single();

            if (erroPerda) {
                console.error('Erro ao inserir perda:', erroPerda);
                throw erroPerda;
            }

            console.log('Perda inserida com sucesso:', perdaInserida);

            if (dados.praga) {
                const monitoramentoPraga = {
                    praga: dados.praga,
                    nome_cientifico: dados.nomeCientifico || null,
                    estagio_praga: dados.estagioPraga || null,
                    nivel_infestacao: dados.nivelInfestacao || null,
                    metodo_amostragem: dados.metodoAmostragem || null,
                    populacao_estimada: dados.populacaoEstimada || null,
                    populacao_unit: dados.populacaoUnit || null,
                    nivel_dano_economico: dados.nivelDano || null,
                    tipo_controle: dados.tipoControle || null,
                    produto_controle: dados.produtoControle === 'outro' ? (dados.outroProduto || null) : (dados.produtoControle || null),
                    outro_produto: dados.produtoControle === 'outro' ? (dados.outroProduto || null) : null,
                    data_amostragem: dados.dataAmostragem || null,
                    observacoes: dados.observacoesPraga || null,
                    responsavel_tecnico: dados.responsavelTecnico || null,
                    registro_perda_id: perdaInserida.id,
                };

                console.log('Enviando monitoramento:', monitoramentoPraga);

                const { error: erroPraga } = await this.supabase
                    .from('monitoramento_pragas')
                    .insert([monitoramentoPraga]);

                if (erroPraga) {
                    console.error('Erro ao inserir praga:', erroPraga);
                    throw erroPraga;
                }

                console.log('Monitoramento inserido com sucesso');
            }

            this.exibirResultados(resultado);
            this.adicionarAoHistorico(dados, resultado);
            this.carregarRegistrosSalvos();
            showNotification('Registro salvo com sucesso no banco de dados!', 'success');
        } catch (error) {
            console.error('=== ERRO AO SALVAR ===');
            console.error('Mensagem:', error.message);
            console.error('Detalhes:', JSON.stringify(error, null, 2));
            this.exibirResultados(resultado);
            this.adicionarAoHistorico(dados, resultado);
            this.salvarDadosLocalmente(resultado);

            let mensagemErro = error.message || 'Erro desconhecido';
            if (mensagemErro.includes('relation') || mensagemErro.includes('does not exist')) {
                mensagemErro = 'Tabela não existe. Execute o SQL no Supabase primeiro!';
            } else if (mensagemErro.includes('policy') || mensagemErro.includes('permission')) {
                mensagemErro = 'Erro de permissão. Verifique as RLS policies no Supabase!';
            }

            showNotification(`Erro: ${mensagemErro}`, 'error');
        }

        if (typeof atualizarResumo === 'function') {
            atualizarResumo();
        }
    }

    calcularImpacto(dados) {
        const tchBase = 85;
        const perdaTCH = (dados.perdaEstimada / 100) * tchBase;
        const tchFinal = tchBase - perdaTCH;
        const perdaTotalToneladas = perdaTCH * dados.areaAfetada;
        const custoPerdaEstimado = perdaTotalToneladas * 150;

        let nivelRisco;
        if (dados.perdaEstimada <= 5) {
            nivelRisco = 'baixo';
        } else if (dados.perdaEstimada <= 15) {
            nivelRisco = 'moderado';
        } else {
            nivelRisco = 'alto';
        }

        let acaoRecomendada;
        if (dados.nivelInfestacao > 10 || dados.nivelDano === 'acima') {
            acaoRecomendada = 'Intervenção imediata necessária';
        } else if (dados.nivelInfestacao > 5 || dados.nivelDano === 'proximo') {
            acaoRecomendada = 'Monitoramento intensificado';
        } else {
            acaoRecomendada = 'Manter monitoramento regular';
        }

        return {
            ...dados,
            perdaTCH: perdaTCH.toFixed(1),
            tchFinal: tchFinal.toFixed(1),
            perdaTotalToneladas: perdaTotalToneladas.toFixed(1),
            custoPerdaEstimado: custoPerdaEstimado.toFixed(2),
            nivelRisco,
            acaoRecomendada,
        };
    }

    exibirResultados(resultado) {
        const severidadeLabels = {
            'baixa': 'Baixa (até 5%)',
            'media': 'Média (5% - 15%)',
            'alta': 'Alta (acima de 15%)'
        };

        const tipoLabels = {
            'praga': 'Perda por Praga',
            'doenca': 'Perda por Doença',
            'climatica': 'Perda Climática',
            'falha_plantio': 'Falha no Plantio',
            'compactacao': 'Compactação do Solo',
            'erosao': 'Erosão',
            'outra': 'Outra'
        };

        const estagioLabels = {
            'plantio': 'Plantio',
            'cana_plantada': 'Cana Plantada (1º Corte)',
            'cana_soca_1': 'Soca (2º Corte)',
            'cana_soca_2': 'Soca (3º Corte)',
            'cana_soca_3': 'Soca (4º Corte+)'
        };

        const pragaLabels = {
            'broca': 'Broca-da-cana',
            'bicudo': 'Bicudo-da-cana',
            'cigarrinha': 'Cigarrinha-das-raízes',
            'cupim': 'Cupim',
            'broca_gigante': 'Broca-gigante',
            'broca_rizoma': 'Broca-do-rizoma',
            'cochonilha': 'Cochonilha',
            'pulgao': 'Pulgão',
            'formiga_cortadeira': 'Formiga Cortadeira',
            'outra': 'Outra'
        };

        const resumoTable = document.getElementById('resumoTable');
        resumoTable.innerHTML = `
            <tr style="background: rgba(255,255,255,0.1);">
                <td><strong>Tipo de Perda</strong></td>
                <td>${tipoLabels[resultado.tipoPerda] || resultado.tipoPerda}</td>
            </tr>
            <tr>
                <td><strong>Estágio da Cultura</strong></td>
                <td>${estagioLabels[resultado.estagioCultura] || '-'}</td>
            </tr>
            <tr>
                <td><strong>Área Afetada</strong></td>
                <td>${resultado.areaOriginal} ${resultado.areaUnit} (${resultado.areaAfetada.toFixed(2)} ha)</td>
            </tr>
            <tr>
                <td><strong>Severidade</strong></td>
                <td>${severidadeLabels[resultado.severidade] || '-'}</td>
            </tr>
            <tr style="background: rgba(255,255,255,0.15);">
                <td><strong>Perda Estimada</strong></td>
                <td><strong>${resultado.perdaEstimada}%</strong></td>
            </tr>
            <tr>
                <td><strong>Perda em TCH</strong></td>
                <td>${resultado.perdaTCH} TCH</td>
            </tr>
            <tr style="background: rgba(255,255,255,0.1);">
                <td><strong>Perda Total Estimada</strong></td>
                <td><strong>${resultado.perdaTotalToneladas} toneladas</strong></td>
            </tr>
            <tr>
                <td><strong>Custo Estimado da Perda</strong></td>
                <td>R$ ${parseFloat(resultado.custoPerdaEstimado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            </tr>
            ${resultado.praga ? `
            <tr style="background: rgba(255,255,255,0.1);">
                <td><strong>Praga Identificada</strong></td>
                <td>${pragaLabels[resultado.praga] || resultado.praga}</td>
            </tr>
            <tr>
                <td><strong>Nome Científico</strong></td>
                <td><em>${resultado.nomeCientifico || '-'}</em></td>
            </tr>
            <tr>
                <td><strong>Nível de Infestação</strong></td>
                <td>${resultado.nivelInfestacao}% colmos</td>
            </tr>
            <tr style="background: rgba(255,255,255,0.1);">
                <td><strong>Nível de Dano Econômico</strong></td>
                <td>${resultado.nivelDano ? resultado.nivelDano.toUpperCase().replace('_', ' ') : '-'}</td>
            </tr>
            <tr>
                <td><strong>Tipo de Controle</strong></td>
                <td>${resultado.tipoControle || '-'}</td>
            </tr>
            <tr>
                <td><strong>Produto/Agente</strong></td>
                <td>${resultado.outroProduto || resultado.produtoControle || '-'}</td>
            </tr>
            ` : ''}
            <tr style="background: rgba(255,255,255,0.15); border-top: 2px solid rgba(255,255,255,0.3);">
                <td><strong>Ação Recomendada</strong></td>
                <td><strong>${resultado.acaoRecomendada}</strong></td>
            </tr>
        `;

        const detalhesTable = document.getElementById('detalhesTable');
        detalhesTable.innerHTML = `
            <tr>
                <td><strong>Responsável Técnico</strong></td>
                <td>${resultado.responsavelTecnico || '-'}</td>
            </tr>
            <tr>
                <td><strong>Data da Constatação</strong></td>
                <td>${resultado.dataConstatacao ? new Date(resultado.dataConstatacao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
            </tr>
            ${resultado.dataAmostragem ? `
            <tr>
                <td><strong>Data da Amostragem</strong></td>
                <td>${new Date(resultado.dataAmostragem + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
            </tr>
            ` : ''}
            <tr>
                <td><strong>Condições Climáticas</strong></td>
                <td>${resultado.condicoesClimaticas || '-'}</td>
            </tr>
            ${resultado.metodoAmostragem ? `
            <tr>
                <td><strong>Método de Amostragem</strong></td>
                <td>${resultado.metodoAmostragem}</td>
            </tr>
            ` : ''}
            ${resultado.populacaoEstimada > 0 ? `
            <tr>
                <td><strong>População Estimada</strong></td>
                <td>${resultado.populacaoEstimada} ${resultado.populacaoUnit}</td>
            </tr>
            ` : ''}
            <tr style="background: rgba(39, 174, 96, 0.1);">
                <td><strong>TCH Base Estimado</strong></td>
                <td>85 t/ha</td>
            </tr>
            <tr>
                <td><strong>TCH Final Estimado</strong></td>
                <td><strong>${resultado.tchFinal} t/ha</strong></td>
            </tr>
            <tr style="background: rgba(231, 76, 60, 0.1);">
                <td><strong>Nível de Risco</strong></td>
                <td><strong>${resultado.nivelRisco.toUpperCase()}</strong></td>
            </tr>
            ${resultado.observacoes ? `
            <tr>
                <td><strong>Observações (Perdas)</strong></td>
                <td>${resultado.observacoes}</td>
            </tr>
            ` : ''}
            ${resultado.observacoesPraga ? `
            <tr>
                <td><strong>Observações (Praga)</strong></td>
                <td>${resultado.observacoesPraga}</td>
            </tr>
            ` : ''}
        `;

        this.gerarRecomendacoes(resultado);

        document.getElementById('resultados').classList.add('show');
        setTimeout(() => {
            document.querySelector('.results-container').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    gerarRecomendacoes(resultado) {
        let recomendacoes = '';
        const praga = resultado.praga;
        const tipoControle = resultado.tipoControle;
        const nivelDano = resultado.nivelDano;

        if (nivelDano === 'acima' || resultado.nivelRisco === 'alto') {
            recomendacoes += `<div class="warning-box" style="margin-bottom: 15px;">
                <strong><i class="bi bi-exclamation-triangle-fill"></i> ATENÇÃO:</strong>
                O nível de dano econômico foi ultrapassado. Intervenção imediata é recomendada para evitar perdas maiores.
            </div>`;
        }

        if (praga === 'broca') {
            recomendacoes += `
                <div class="info-box">
                    <strong><i class="bi bi-bug-fill"></i> Recomendações para Broca-da-cana (Diatraea saccharalis):</strong>
                    <ul style="margin-top: 10px; margin-left: 20px;">
                        <li>Realizar amostragem quinzenal durante todo o ciclo</li>
                        <li>Liberação de <em>Cotesia flavipes</em> quando infestação > 10%</li>
                        <li>Monitorar parasitismo natural antes de decisão de controle</li>
                        <li>Se parasitismo ≥ 50%, manter monitoramento (controle biológico natural)</li>
                        <li>Utilizar inseticidas seletivos apenas se necessário</li>
                        <li>Plantar variedades tolerantes em áreas de histórico</li>
                    </ul>
                </div>
            `;
        } else if (praga === 'bicudo') {
            recomendacoes += `
                <div class="info-box">
                    <strong><i class="bi bi-bug-fill"></i> Recomendações para Bicudo-da-cana (Sphenophorus levis):</strong>
                    <ul style="margin-top: 10px; margin-left: 20px;">
                        <li>Monitoramento constante em áreas de histórico</li>
                        <li>Uso de iscas inseticidas em focos identificados</li>
                        <li>Aplicação de <em>Beauveria bassiana</em> no solo</li>
                        <li>Evitar trânsito de máquinas entre áreas contaminadas</li>
                        <li>Destruir touceiras após colheita</li>
                        <li>Perdas podem chegar a 30 t/ha se não controlado</li>
                    </ul>
                </div>
            `;
        } else if (praga === 'cigarrinha') {
            recomendacoes += `
                <div class="info-box">
                    <strong><i class="bi bi-bug-fill"></i> Recomendações para Cigarrinha-das-raízes (Mahanarva fimbriolata):</strong>
                    <ul style="margin-top: 10px; margin-left: 20px;">
                        <li>Monitorar com maior frequência no início das chuvas</li>
                        <li>Aplicação de <em>Metarhizium anisopliae</em> preventivo</li>
                        <li>Manejo adequado da palhada na colheita mecanizada</li>
                        <li>Contagem de massas de ninfa a cada 15 dias</li>
                        <li>Inseticidas sistêmicos em alta infestação</li>
                        <li>Perdas podem chegar a 17,5% no processo industrial</li>
                    </ul>
                </div>
            `;
        } else if (praga === 'cupim') {
            recomendacoes += `
                <div class="info-box">
                    <strong><i class="bi bi-bug-fill"></i> Recomendações para Cupim (Heterotermes tenuis):</strong>
                    <ul style="margin-top: 10px; margin-left: 20px;">
                        <li>Atenção em solos arenosos (maior incidência)</li>
                        <li>Amostragem com iscas antes do plantio</li>
                        <li>Aplicação de inseticida no sulco de plantio</li>
                        <li>Fipronil é opção para controle em áreas críticas</li>
                        <li>Perdas podem chegar a 10 t/ha/ano</li>
                    </ul>
                </div>
            `;
        }

        if (tipoControle === 'biologico') {
            recomendacoes += `
                <div class="info-box" style="border-left-color: #27ae60;">
                    <strong><i class="bi bi-check-circle"></i> Controle Biológico:</strong>
                    Excelente escolha! O controle biológico é sustentável e eficaz. Monitore a eficiência do agente por pelo menos 30 dias após aplicação.
                </div>
            `;
        } else if (tipoControle === 'quimico') {
            recomendacoes += `
                <div class="info-box" style="border-left-color: #e74c3c;">
                    <strong><i class="bi bi-exclamation-triangle"></i> Controle Químico:</strong>
                    Siga rigorosamente as instruções da bula. Respeite o período de carência e utilize EPIs. Rotação de princípios ativos para evitar resistência.
                </div>
            `;
        }

        if (resultado.condicoesClimaticas === 'seco') {
            recomendacoes += `
                <div class="info-box" style="border-left-color: #f39c12;">
                    <strong><i class="bi bi-sun"></i> Período Seco:</strong>
                    Pragas subterrâneas (cupim, broca-do-rizoma) tendem a aumentar. Intensifique o monitoramento e considere irrigação se disponível.
                </div>
            `;
        } else if (resultado.condicoesClimaticas === 'chuvoso') {
            recomendacoes += `
                <div class="info-box" style="border-left-color: #3498db;">
                    <strong><i class="bi bi-cloud-rain"></i> Período Chuvoso:</strong>
                    Cigarrinha-das-raízes se prolifera rapidamente. Aumente a frequência de amostragem para semanal.
                </div>
            `;
        }

        if (!recomendacoes) {
            recomendacoes = `
                <div class="info-box">
                    <strong><i class="bi bi-info-circle"></i> Recomendações Gerais:</strong>
                    Mantenha o monitoramento contínuo da área. Registre todas as ocorrências e acompanhe a evolução dos danos. Consulte o engenheiro agrônomo para orientações específicas.
                </div>
            `;
        }

        document.getElementById('recomendacoesBox').style.display = recomendacoes.includes('ATENÇÃO') ? 'block' : 'none';
        document.getElementById('recomendacoesMIP').innerHTML = recomendacoes;
    }

    adicionarAoHistorico(dados, resultado) {
        const item = {
            id: Date.now(),
            data: new Date().toLocaleString('pt-BR'),
            tipoPerda: dados.tipoPerda,
            praga: dados.praga,
            areaAfetada: dados.areaAfetada,
            perdaEstimada: resultado.perdaEstimada,
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
        localStorage.setItem('perdasPragasHistorico', JSON.stringify(this.historico));
    }

    carregarHistorico() {
        return JSON.parse(localStorage.getItem('perdasPragasHistorico') || '[]');
    }

    salvarDadosLocalmente(resultado) {
        const registros = JSON.parse(localStorage.getItem('perdasPragasRegistros') || '[]');
        registros.unshift({
            ...resultado,
            savedAt: new Date().toISOString(),
            synced: false
        });
        if (registros.length > 100) registros.pop();
        localStorage.setItem('perdasPragasRegistros', JSON.stringify(registros));
    }

    async carregarRegistrosSalvos() {
        if (!this.supabase) {
            console.warn('Supabase não disponível - carregando do localStorage');
            this.registrosSalvos = [];
            return;
        }

        try {
            // Teste rápido de conexão
            const { data: testData, error: testError } = await this.supabase
                .from('registros_perdas')
                .select('id')
                .limit(1);

            if (testError) {
                console.warn('Erro no teste de conexão:', testError);
                this.registrosSalvos = [];
                return;
            }

            console.log('Conexão Supabase OK. Teste:', testData);

            const { data, error } = await this.supabase
                .from('registros_perdas')
                .select(`
                    *,
                    monitoramento_pragas (
                        id, praga, nome_cientifico, nivel_infestacao,
                        tipo_controle, produto_controle, nivel_dano_economico
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            this.registrosSalvos = data || [];
            console.log('Registros carregados:', this.registrosSalvos.length);
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
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                        <p class="mt-2">Nenhum registro encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        const severidadeIcons = {
            'baixa': '<span class="badge bg-success">Baixa</span>',
            'media': '<span class="badge bg-warning">Média</span>',
            'alta': '<span class="badge bg-danger">Alta</span>'
        };

        const tipoLabels = {
            'praga': 'Praga',
            'doenca': 'Doença',
            'climatica': 'Climática',
            'falha_plantio': 'Falha Plantio',
            'compactacao': 'Compactação',
            'erosao': 'Erosão',
            'outra': 'Outra'
        };

        let html = this.registrosSalvos.map(reg => {
            const pragaInfo = reg.monitoramento_pragas?.[0];
            const data = reg.data_constatacao ? new Date(reg.data_constatacao + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

            return `
                <tr>
                    <td>${data}</td>
                    <td>${tipoLabels[reg.tipo_perda] || reg.tipo_perda}</td>
                    <td>${reg.area_afetada} ${reg.area_unit}</td>
                    <td>${severidadeIcons[reg.severidade] || reg.severidade}</td>
                    <td><strong>${reg.perda_estimada}%</strong></td>
                    <td>${pragaInfo ? pragaInfo.praga || '-' : '-'}</td>
                    <td>${reg.perda_total_toneladas?.toFixed(1) || '-'} t</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="calculadora.excluirRegistro('${reg.id}')">
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
                    .from('registros_perdas')
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

    async syncRegistrosLocais() {
        const registros = JSON.parse(localStorage.getItem('perdasPragasRegistros') || '[]');
        const naoSincronizados = registros.filter(r => !r.synced);

        if (naoSincronizados.length === 0) return;

        for (const reg of naoSincronizados) {
            try {
                await this.salvarNoSupabase(reg);
                reg.synced = true;
            } catch (error) {
                console.error('Erro ao sincronizar:', error);
            }
        }

        localStorage.setItem('perdasPragasRegistros', JSON.stringify(registros));
        if (naoSincronizados.some(r => r.synced)) {
            showNotification(`${naoSincronizados.length} registro(s) sincronizado(s)!`, 'success');
        }
    }

    limpar() {
        document.getElementById('tipoPerda').value = '';
        document.getElementById('estagioCultura').value = '';
        document.getElementById('areaAfetada').value = '';
        document.getElementById('severidade').value = '';
        document.getElementById('perdaEstimada').value = '';
        document.getElementById('condicoesClimaticas').value = '';
        document.getElementById('dataConstatacao').valueAsDate = new Date();
        document.getElementById('observacoes').value = '';
        document.getElementById('praga').value = '';
        document.getElementById('nomeCientifico').value = '';
        document.getElementById('estagioPraga').value = '';
        document.getElementById('nivelInfestacao').value = '';
        document.getElementById('metodoAmostragem').value = '';
        document.getElementById('populacaoEstimada').value = '';
        document.getElementById('nivelDano').value = '';
        document.getElementById('tipoControle').value = '';
        document.getElementById('produtoControle').value = '';
        document.getElementById('outroProduto').value = '';
        document.getElementById('outroProdutoGroup').style.display = 'none';
        document.getElementById('dataAmostragem').valueAsDate = new Date();
        document.getElementById('responsavelTecnico').value = '';
        document.getElementById('observacoesPraga').value = '';
        document.getElementById('resultados').classList.remove('show');
        document.getElementById('resumoPerdas').classList.remove('show');
        localStorage.removeItem('perdasPragasDados');
    }
}

let calculadora;
document.addEventListener('DOMContentLoaded', () => {
    calculadora = new CalculadoraPerdasPragas();
});

function registrar() {
    calculadora.registrar();
}

function limparFormulario() {
    calculadora.limpar();
}

function carregarPresetPraga(praga) {
    const presets = {
        broca: {
            praga: 'broca',
            estagioPraga: 'larva',
            metodoAmostragem: 'contagem_colmos',
            tipoControle: 'biologico',
            produtoControle: 'cotesia'
        },
        bicudo: {
            praga: 'bicudo',
            estagioPraga: 'adulto',
            metodoAmostragem: 'inspecao',
            tipoControle: 'integrado',
            produtoControle: 'beauveria'
        },
        cigarrinha: {
            praga: 'cigarrinha',
            estagioPraga: 'ninfa',
            metodoAmostragem: 'massa_ninfas',
            tipoControle: 'biologico',
            produtoControle: 'metarhizium'
        }
    };

    const config = presets[praga];
    if (config) {
        document.getElementById('praga').value = config.praga;
        document.getElementById('estagioPraga').value = config.estagioPraga;
        document.getElementById('metodoAmostragem').value = config.metodoAmostragem;
        document.getElementById('tipoControle').value = config.tipoControle;
        document.getElementById('produtoControle').value = config.produtoControle;

        atualizarNomeCientifico();
    }
}

function abrirTab(evt, tabName) {
    const tabcontents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabcontents.length; i++) {
        tabcontents[i].classList.remove('active');
    }

    const tabbtn = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabbtn.length; i++) {
        tabbtn[i].classList.remove('active');
    }

    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

function copiarResultados() {
    const tipoPerda = document.getElementById('tipoPerda');
    const tipoTexto = tipoPerda.options[tipoPerda.selectedIndex]?.text || '-';
    const praga = document.getElementById('praga');
    const pragaTexto = praga.options[praga.selectedIndex]?.text || '-';
    const area = document.getElementById('areaAfetada').value;
    const severidade = document.getElementById('severidade');
    const severidadeTexto = severidade.options[severidade.selectedIndex]?.text || '-';
    const perda = document.getElementById('perdaEstimada').value;
    const infestacao = document.getElementById('nivelInfestacao').value;

    const texto = `
════════════════════════════════════════
     REGISTRO DE PERDAS E PRAGAS
════════════════════════════════════════

TIPO DE PERDA:
${tipoTexto}

DADOS DA PERDA:
Área Afetada: ${area} ha
Severidade: ${severidadeTexto}
Perda Estimada: ${perda}%

${praga.value ? `
PRAGA IDENTIFICADA:
Praga: ${pragaTexto}
Nome Científico: ${document.getElementById('nomeCientifico').value}
Nível de Infestação: ${infestacao}% colmos
` : ''}
Data: ${new Date().toLocaleDateString('pt-BR')}
════════════════════════════════════════
    Campo 4.0 - Gestão Agrícola
════════════════════════════════════════
    `.trim();

    navigator.clipboard.writeText(texto).then(() => {
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Copiado!';
        btn.style.background = '#27ae60';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    });
}

function compartilharWhatsApp() {
    const tipoPerda = document.getElementById('tipoPerda');
    const tipoTexto = tipoPerda.options[tipoPerda.selectedIndex]?.text || '-';
    const area = document.getElementById('areaAfetada').value;
    const perda = document.getElementById('perdaEstimada').value;
    const praga = document.getElementById('praga');
    const pragaTexto = praga.options[praga.selectedIndex]?.text || '-';

    const mensagem = `📊 *Registro de Perdas e Pragas*\n\n` +
        `Tipo: ${tipoTexto}\n` +
        `Área: ${area} ha\n` +
        `Perda: ${perda}%\n` +
        `${praga.value ? `Praga: ${pragaTexto}\n` : ''}` +
        `\nRegistrado em Campo 4.0`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}
