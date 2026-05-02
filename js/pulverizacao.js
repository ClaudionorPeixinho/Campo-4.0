/**
 * Calculadora de Pulverização de Herbicidas
 * Sistema de Gestão Agrícola Campo 4.0
 * Versão 2.0 - Moderna e Responsiva
 */

class CalculadoraPulverizacao {
    constructor() {
        this.historico = this.carregarHistorico();
        this.inicializarEventos();
        this.restaurarDados();
    }

    inicializarEventos() {
        // Salvar dados automaticamente enquanto digita
        document.querySelectorAll('input, select').forEach(campo => {
            campo.addEventListener('change', () => {
                this.salvarDados();
                if (typeof atualizarInfoPropriedade === 'function') {
                    atualizarInfoPropriedade();
                }
            });
        });

        // Enter para calcular
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.calcular();
            }
        });
    }

    salvarDados() {
        const dados = {
            area: document.getElementById('area').value,
            areaUnit: document.getElementById('areaUnit').value,
            dose: document.getElementById('dose').value,
            doseUnit: document.getElementById('doseUnit').value,
            velocidade: document.getElementById('velocidade').value,
            bicos: document.getElementById('bicos').value,
            capacidade: document.getElementById('capacidade').value,
            larguraBarra: document.getElementById('larguraBarra').value,
            propriedade: document.getElementById('propriedade').value,
            lote: document.getElementById('lote').value,
            cultura: document.getElementById('cultura').value,
            herbicida: document.getElementById('herbicida').value,
            ra: document.getElementById('ra').value,
            dataAplicacao: document.getElementById('dataAplicacao').value,
        };
        localStorage.setItem('pulverizacaoDados', JSON.stringify(dados));
    }

    restaurarDados() {
        const dados = JSON.parse(localStorage.getItem('pulverizacaoDados') || '{}');
        Object.keys(dados).forEach(chave => {
            const elemento = document.getElementById(chave);
            if (elemento) {
                elemento.value = dados[chave];
            }
        });
        // Atualizar informações da propriedade se houver dados
        if (Object.keys(dados).length > 0) {
            setTimeout(() => {
                if (typeof atualizarInfoPropriedade === 'function') {
                    atualizarInfoPropriedade();
                }
            }, 100);
        }
    }

    calcular() {
        const dados = this.coletarDados();

        if (!this.validarDados(dados)) {
            return;
        }

        const resultado = this.realizarCalculos(dados);
        this.exibirResultados(resultado);
        this.adicionarAoHistorico(dados, resultado);

        if (typeof atualizarInfoPropriedade === 'function') {
            atualizarInfoPropriedade();
        }
    }

    coletarDados() {
        return {
            area: this.converterArea(),
            dose: this.converterDose(),
            velocidade: parseFloat(document.getElementById('velocidade').value) || 0,
            bicos: parseInt(document.getElementById('bicos').value) || 0,
            capacidade: parseFloat(document.getElementById('capacidade').value) || 0,
            larguraBarra: parseFloat(document.getElementById('larguraBarra').value) || 0,
            propriedade: document.getElementById('propriedade').value,
            lote: document.getElementById('lote').value,
            cultura: document.getElementById('cultura').value,
            herbicida: document.getElementById('herbicida').value,
            ra: document.getElementById('ra').value,
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
        if (unit === 'ml/ha') {
            dose = dose / 1000;
        }
        return dose;
    }

    validarDados(dados) {
        if (dados.area <= 0 || dados.dose <= 0 || dados.velocidade <= 0 ||
            dados.bicos <= 0 || dados.capacidade <= 0) {
            alert('⚠️ Por favor, preencha todos os campos com valores válidos!');
            return false;
        }
        return true;
    }

    realizarCalculos(dados) {
        const totalHerbicida = dados.area * dados.dose;
        const tanquesNecessarios = Math.ceil(totalHerbicida / dados.capacidade);
        const tempoEstimadoHoras = (dados.area * dados.larguraBarra) / (dados.velocidade * dados.larguraBarra);
        const horas = Math.floor(tempoEstimadoHoras);
        const minutos = Math.round((tempoEstimadoHoras - horas) * 60);
        const produtividade = (dados.velocidade * dados.larguraBarra) / 10;

        // Cálculos avançados
        const litrosPorBico30seg = (dados.dose / dados.velocidade / dados.bicos) * 0.5;
        const litrosPorBico60seg = dados.dose / dados.velocidade / dados.bicos;
        
        // Vazão média por bico (L/min)
        const vazaoMedia = (litrosPorBico60seg / 60).toFixed(4);
        
        // Eficiência do tanque
        const eficienciaTanque = ((totalHerbicida % dados.capacidade) / dados.capacidade * 100).toFixed(1);
        
        // Custo estimado (valor padrão)
        const custoProjecao = (totalHerbicida * 15).toFixed(2); // R$ 15 por litro

        return {
            totalHerbicida: totalHerbicida.toFixed(2),
            tanquesNecessarios,
            tempoEstimado: `${horas}h ${minutos}m`,
            horas,
            minutos,
            produtividade: produtividade.toFixed(2),
            litrosPorBico30seg: litrosPorBico30seg.toFixed(3),
            litrosPorBico60seg: litrosPorBico60seg.toFixed(3),
            vazaoMedia,
            eficienciaTanque,
            custoProjecao,
            ...dados
        };
    }

    exibirResultados(resultado) {
        // Atualizar valores principais
        document.getElementById('totalHerbicida').textContent = resultado.totalHerbicida;
        document.getElementById('tanquesNecessarios').textContent = resultado.tanquesNecessarios;
        document.getElementById('tempoEstimado').textContent = resultado.tempoEstimado;
        document.getElementById('produtividade').textContent = resultado.produtividade;

        // Tabela de detalhes
        const detalhesTable = document.getElementById('detalhesTable');
        detalhesTable.innerHTML = `
            <tr>
                <td><strong>Propriedade</strong></td>
                <td>${resultado.propriedade || '-'}</td>
            </tr>
            <tr>
                <td><strong>Lote / Talhão</strong></td>
                <td>${resultado.lote || '-'}</td>
            </tr>
            <tr>
                <td><strong>Cultura</strong></td>
                <td>${resultado.cultura || '-'}</td>
            </tr>
            <tr>
                <td><strong>Herbicida</strong></td>
                <td>${resultado.herbicida || '-'}</td>
            </tr>
            <tr>
                <td><strong>Data da Aplicação</strong></td>
                <td>${resultado.dataAplicacao ? new Date(resultado.dataAplicacao).toLocaleDateString('pt-BR') : '-'}</td>
            </tr>
            <tr>
                <td><strong>Engenheiro Agrônomo</strong></td>
                <td>${resultado.ra || '-'}</td>
            </tr>
            <tr style="background: rgba(39, 174, 96, 0.1); border-top: 2px solid #27ae60;">
                <td><strong>Área Total</strong></td>
                <td>${resultado.area.toFixed(2)} ha</td>
            </tr>
            <tr>
                <td><strong>Dose Recomendada</strong></td>
                <td>${resultado.dose.toFixed(2)} L/ha</td>
            </tr>
            <tr>
                <td><strong>Volume Total</strong></td>
                <td><strong>${resultado.totalHerbicida} Litros</strong></td>
            </tr>
            <tr>
                <td><strong>Tanques Necessários</strong></td>
                <td><strong>${resultado.tanquesNecessarios} unidades</strong></td>
            </tr>
            <tr>
                <td><strong>Capacidade do Tanque</strong></td>
                <td>${resultado.capacidade} Litros</td>
            </tr>
            <tr>
                <td><strong>Velocidade do Trator</strong></td>
                <td>${resultado.velocidade} km/h</td>
            </tr>
            <tr>
                <td><strong>Largura da Barra</strong></td>
                <td>${resultado.larguraBarra} metros</td>
            </tr>
            <tr>
                <td><strong>Quantidade de Bicos</strong></td>
                <td>${resultado.bicos} bicos</td>
            </tr>
            <tr style="background: rgba(52, 152, 219, 0.1);">
                <td><strong>Vazão por Bico (30 seg)</strong></td>
                <td>${resultado.litrosPorBico30seg} L</td>
            </tr>
            <tr>
                <td><strong>Vazão por Bico (60 seg)</strong></td>
                <td>${resultado.litrosPorBico60seg} L</td>
            </tr>
            <tr>
                <td><strong>Vazão Média por Bico</strong></td>
                <td>${resultado.vazaoMedia} L/min</td>
            </tr>
            <tr style="background: rgba(39, 174, 96, 0.1);">
                <td><strong>Tempo Total de Trabalho</strong></td>
                <td>${resultado.tempoEstimado}</td>
            </tr>
            <tr>
                <td><strong>Produtividade</strong></td>
                <td>${resultado.produtividade} ha/h</td>
            </tr>
            <tr>
                <td><strong>Eficiência do Tanque</strong></td>
                <td>${resultado.eficienciaTanque}%</td>
            </tr>
            <tr style="background: rgba(243, 156, 18, 0.1);">
                <td><strong>Custo Estimado</strong></td>
                <td>R$ ${resultado.custoProjecao}</td>
            </tr>
        `;

        // Tabela de ciclo de voltas
        const cicloTable = document.getElementById('cicloTable');
        let cicloHTML = '';
        const totalHerbicida = parseFloat(resultado.totalHerbicida);
        
        for (let i = 1; i <= resultado.tanquesNecessarios; i++) {
            const volumeVolta = i === resultado.tanquesNecessarios 
                ? totalHerbicida - (resultado.capacidade * (i - 1))
                : resultado.capacidade;
            const tempoVolta = (volumeVolta / totalHerbicida) * resultado.horas * 60 + resultado.minutos * (volumeVolta / totalHerbicida);
            const horasVolta = Math.floor(tempoVolta / 60);
            const minutosVolta = Math.round(tempoVolta % 60);
            
            cicloHTML += `
                <tr>
                    <td>${i}ª Volta</td>
                    <td>${volumeVolta.toFixed(2)} L</td>
                    <td>${horasVolta}h ${minutosVolta}m</td>
                </tr>
            `;
        }
        cicloTable.innerHTML = cicloHTML;

        // Exibir resultados
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
            totalHerbicida: resultado.totalHerbicida,
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
        localStorage.setItem('pulverizacaoHistorico', JSON.stringify(this.historico));
    }

    carregarHistorico() {
        return JSON.parse(localStorage.getItem('pulverizacaoHistorico') || '[]');
    }

    limpar() {
        document.getElementById('area').value = '';
        document.getElementById('dose').value = '';
        document.getElementById('velocidade').value = '';
        document.getElementById('bicos').value = '';
        document.getElementById('capacidade').value = '';
        document.getElementById('larguraBarra').value = '';
        document.getElementById('propriedade').value = '';
        document.getElementById('lote').value = '';
        document.getElementById('cultura').value = '';
        document.getElementById('herbicida').value = '';
        document.getElementById('ra').value = '';
        document.getElementById('dataAplicacao').valueAsDate = new Date();
        document.getElementById('resultados').classList.remove('show');
        document.getElementById('propriedadeInfo').classList.remove('show');
        localStorage.removeItem('pulverizacaoDados');
    }
}

// Instanciar ao carregar a página
let calculadora;
document.addEventListener('DOMContentLoaded', () => {
    calculadora = new CalculadoraPulverizacao();
});

// Funções globais para compatibilidade com HTML
function calcular() {
    calculadora.calcular();
}

function limparFormulario() {
    calculadora.limpar();
}

function carregarPreset(preset) {
    const presets = {
        soja: { cultura: 'soja', dose: 2.0, bicos: 20, velocidade: 8, larguraBarra: 20 },
        milho: { cultura: 'milho', dose: 1.5, bicos: 20, velocidade: 7.5, larguraBarra: 20 },
        cana: { cultura: 'cana-de-açúcar', dose: 2.5, bicos: 24, velocidade: 6.5, larguraBarra: 24 }
    };

    const config = presets[preset];
    if (config) {
        document.getElementById('cultura').value = config.cultura;
        document.getElementById('dose').value = config.dose;
        document.getElementById('bicos').value = config.bicos;
        document.getElementById('velocidade').value = config.velocidade;
        document.getElementById('larguraBarra').value = config.larguraBarra;
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
    const propriedade = document.getElementById('propriedade').value;
    const lote = document.getElementById('lote').value;
    const cultura = document.getElementById('cultura').value;
    const herbicida = document.getElementById('herbicida').value;
    const area = document.getElementById('area').value;
    const dose = document.getElementById('dose').value;
    const totalHerbicida = document.getElementById('totalHerbicida').textContent;
    const tanques = document.getElementById('tanquesNecessarios').textContent;
    const tempo = document.getElementById('tempoEstimado').textContent;
    const produtividade = document.getElementById('produtividade').textContent;

    const texto = `
════════════════════════════════════════
     PULVERIZAÇÃO DE HERBICIDAS
════════════════════════════════════════

IDENTIFICAÇÃO:
Propriedade: ${propriedade || '---'}
Lote/Talhão: ${lote || '---'}
Cultura: ${cultura || '---'}
Herbicida: ${herbicida || '---'}

PARÂMETROS:
Área: ${area} ha
Dose: ${dose} L/ha

RESULTADOS:
✓ Volume Total: ${totalHerbicida} L
✓ Tanques Necessários: ${tanques} un
✓ Tempo de Trabalho: ${tempo}
✓ Produtividade: ${produtividade} ha/h

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

// Utilitários
function exportarPDF() {
    const conteudo = document.querySelector('.results-container');
    if (!conteudo || !conteudo.classList.contains('show')) {
        alert('Calcule antes de exportar!');
        return;
    }
    alert('Funcionalidade de PDF será implementada em breve!');
}

function compartilharWhatsApp() {
    const tempo = document.getElementById('tempoEstimado').textContent;
    const totalHerbicida = document.getElementById('totalHerbicida').textContent;
    const tanques = document.getElementById('tanquesNecessarios').textContent;
    const lote = document.getElementById('lote').value;

    const mensagem = `📊 *Cálculo de Pulverização ${lote ? `- Lote ${lote}` : ''}\n\n` +
        `Volume: ${totalHerbicida}L\n` +
        `Tanques: ${tanques}\n` +
        `Tempo: ${tempo}\n\n` +
        `Calculado em Campo 4.0`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}
