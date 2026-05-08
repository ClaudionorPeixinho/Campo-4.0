# 🌾 Calculadora de Pulverização de Herbicidas - Campo 4.0

## Visão Geral
Calculadora moderna e intuitiva para cálculo preciso de pulverização de herbicidas em áreas agrícolas. Desenvolvida para funcionar offline com suporte a temas claro/escuro e responsividade em todos os dispositivos.

---

## 📋 Recursos Principais

### ✨ Funcionalidades Principais
- ✅ **Cálculo Preciso**: Volume total, tanques necessários, tempo estimado
- ✅ **Múltiplas Unidades**: Suporte para hectares, m², L/ha e ml/ha
- ✅ **Presets de Culturas**: Soja, Milho, Cana-de-açúcar (personalizáveis)
- ✅ **Tema Escuro/Claro**: Alterna automaticamente com preferência do dispositivo
- ✅ **Histórico Automático**: Salva últimos 50 cálculos
- ✅ **Dados Persistentes**: Carrega automaticamente últimas entradas
- ✅ **Compartilhamento**: Copiar para clipboard e WhatsApp
- ✅ **Responsivo**: Funciona perfeitamente em mobile, tablet e desktop
- ✅ **Offline**: Funciona completamente sem internet

### 📊 Cálculos Realizados
1. **Volume Total de Herbicida** (Área × Dose)
2. **Tanques Necessários** (Volume ÷ Capacidade)
3. **Tempo de Trabalho** (Estimativa baseada em velocidade)
4. **Produtividade** (ha/hora)
5. **Vazão por Bico** (30s e 60s)
6. **Ciclo de Voltas** (Distribuição por tanque)
7. **Eficiência** (Aproveitamento do tanque)
8. **Custo Estimado** (Projeção)

---

## 🚀 Como Usar

### Passo 1: Preencer Dados de Aplicação
1. **Área a Pulverizar**: Insira o tamanho da área (hectares ou m²)
2. **Dose Recomendada**: Conforme bula do produto (L/ha ou ml/ha)
3. **Velocidade do Trator**: Velocidade média de deslocamento (km/h)
4. **Quantidade de Bicos**: Bicos presentes na barra
5. **Capacidade do Tanque**: Litros do reservatório
6. **Largura da Barra**: Em metros

### Passo 2: Informações Adicionais (Opcional)
- Propriedade/Fazenda
- Lote/Talhão
- Cultura
- Herbicida utilizado
- Engenheiro agrônomo responsável
- Data da aplicação

### Passo 3: Calcular
Clique no botão **"Calcular"** ou pressione **Enter**

### Passo 4: Visualizar Resultados
Navegue pelos abas:
- **Resumo**: Valores principais
- **Detalhes**: Tabela completa com todos os cálculos
- **Ciclo**: Distribuição por volta/tanque

---

## 🎯 Presets Disponíveis

### 🌱 Soja
- Dose: 2.0 L/ha
- Bicos: 20
- Velocidade: 8 km/h
- Largura: 20m

### 🌽 Milho
- Dose: 1.5 L/ha
- Bicos: 20
- Velocidade: 7.5 km/h
- Largura: 20m

### 🍃 Cana-de-açúcar
- Dose: 2.5 L/ha
- Bicos: 24
- Velocidade: 6.5 km/h
- Largura: 24m

---

## 💾 Armazenamento de Dados

### Dados Salvos Automaticamente
- Última entrada de dados (formulário)
- Últimos 50 cálculos (histórico)
- Preferência de tema (claro/escuro)

### Como Limpar
Clique em **"Limpar"** para resetar todos os campos do formulário atual.
Para limpar histórico: Abra o DevTools (F12) → Application → Clear Storage

---

## 🎨 Cores e Temas

### Tema Claro
- Fundo: Gradiente azul claro
- Primário: Verde #27ae60
- Texto: Cinza escuro #2c3e50

### Tema Escuro
- Fundo: Gradiente azul escuro
- Primário: Verde claro #2ecc71
- Texto: Branco #ffffff

---

## 📱 Compatibilidade

| Navegador | Desktop | Mobile |
|-----------|---------|--------|
| Chrome    | ✅      | ✅     |
| Firefox   | ✅      | ✅     |
| Safari    | ✅      | ✅     |
| Edge      | ✅      | ✅     |

---

## ⚙️ Estrutura de Arquivos

```
Campo-4.0/
├── pulverizacao_herbicidas.html    # Interface principal
├── js/
│   └── pulverizacao.js              # Lógica de cálculos
└── css/
    ├── estilo.css                   # Estilos base
    └── dark.css                     # Tema escuro
```

---

## 🔧 Funcionalidades Avançadas

### Classe CalculadoraPulverizacao
A lógica principal está encapsulada em uma classe JavaScript que fornece:

```javascript
// Inicializar
const calc = new CalculadoraPulverizacao();

// Métodos principais
calc.calcular()          // Realiza cálculos
calc.limpar()           // Limpa formulário
calc.salvarHistorico()  // Salva no LocalStorage
calc.carregarHistorico()// Carrega histórico
```

### Conversão de Unidades
- **Área**: Hectares ↔ m²
- **Dose**: L/ha ↔ ml/ha
- Conversões automáticas durante cálculo

---

## 📞 Compartilhamento

### Copiar para Clipboard
Botão "Copiar" formata os resultados em texto estruturado

### Compartilhar no WhatsApp
Botão "WhatsApp" abre o aplicativo com mensagem pré-formatada

**Formato de Compartilhamento:**
```
📊 *Cálculo de Pulverização - Lote X*

Volume: XXX L
Tanques: X
Tempo: Xh XXm

Calculado em Campo 4.0
```

---

## 🔒 Privacidade e Segurança

- ✅ Todos dados armazenados localmente
- ✅ Sem envio de informações para servidor
- ✅ Funciona completamente offline
- ✅ Nenhuma coleta de dados pessoais

---

## 🐛 Troubleshooting

### Cálculos não aparecem?
1. Verifique se preencheu todos os campos obrigatórios
2. Garanta que os valores são maiores que 0
3. Limpe o cache (Ctrl+Shift+Delete)

### Dados não salvam?
- Verifique se o LocalStorage está habilitado
- Tente em modo incógnito/privado

### Tema não persiste?
- Limpe cookies do site
- Verifique permissões do navegador

---

## 📈 Dicas de Uso

1. **Sempre validar** doses com a bula do produto
2. **Considerar clima** antes de pulverizar
3. **Calicar bicos** periodicamente
4. **Manter registros** para rastreabilidade
5. **Evitar aplicação** em dias muito quentes (>30°C)

---

## 🔄 Versão

- **v2.0** - Modernização completa com JavaScript moderno
- **Compatível** com Campo 4.0 v1.0+
- **Última atualização**: Março 2024

---

## 👨‍💻 Desenvolvido para

**Campo 4.0** - Sistema de Gestão Agrícola
Auxiliando produtores rurais com tecnologia moderna e acessível.

---

## 📄 Licença

Proprietário do projeto Campo 4.0. Uso interno.

---

**Need help?** Consulte o manual do Campo 4.0 ou entre em contato com o suporte técnico.
