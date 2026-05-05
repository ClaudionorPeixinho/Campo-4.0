=================================================================
    CAMPO 4.0 - DOCUMENTAÇÃO: FERTILIZANTES E CORRETIVOS
    Sistema de Gestão Agrícola
    Versão: 2.0 - Maio 2026
=================================================================

1. O QUE FOI CRIADO
-----------------

✅ Formulário Completo (fertilizantes_corretivos.html)
   - Design profissional responsivo (notebooks, tablets, celulares)
   - Paleta de cores verde (#27ae60, #8e44ad)
   - Entrada de dados: tipo, nome, área, dose, teor de nutrientes
   - Cálculos: total de produto, área restante, % concluída, custo
   - Tabs: Resumo, Detalhes, Nutrientes (N, P, K)
   - Modal para dados da propriedade/lote/cultura
   - Presets para culturas (Soja, Milho, Cana, Pastagem)
   - Copiar resultados e compartilhar via WhatsApp
   - Salva no Supabase (tabela: fertilizantes_corretivos)

✅ JavaScript (js/fertilizantes.js)
   - Classe GestorFertilizantes com integração Supabase
   - Validação de dados
   - Cálculo de nutrientes (N, P₂O₅, K₂O)
   - Histórico local (localStorage)
   - Registro de aplicações
   - Exclusão de registros
   - Suporte a modo offline (CampoOfflineSync)

✅ Página de Relatórios (relatorio_fertilizantes.html)
   - KPIs: Total de aplicações, produto, % conclusão, custo
   - Gráficos (Chart.js):
     * Aplicações por Mês (barra dupla: produto + custo)
     * Por Cultura (doughnut)
     * Fertilizantes vs Corretivos (pizza)
     * Nutrientes Aplicados (barra)
   - Tabela completa com todos os registros
   - Exportação para PDF e Excel
   - Filtros: período, tipo, cultura
   - Design idêntico aos outros relatórios

✅ SQL Script (sql/fertilizantes_corretivos.sql)
   - Criação da tabela com todos os campos necessários
   - Views para relatórios consolidados
   - Políticas de segurança RLS (Row Level Security)
   - Índices para performance
   - Triggers para updated_at
   - Comentários explicativos

✅ Atualização do Menu (index_menu.html)
   - Item "Fertilizantes e Corretivos" ativado (removido "Em desenvolvimento")
   - Mapeamento da página de formulário e relatório
   - Service Worker atualizado

=================================================================

2. CONFIGURAÇÃO NO SUPABASE (OBRIGATÓRIO)
------------------------------------------------

⚠️ VOCÊ PRECISA EXECUTAR O SCRIPT SQL NO SUPABASE:

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em "SQL Editor" no menu lateral
4. Abra o arquivo: sql/fertilizantes_corretivos.sql
5. Copie todo o conteúdo
6. Cole no SQL Editor e clique em "Run"
7. Aguarde a execução completa

OU EXECUTE ESTE CÓDIGO DIRETAMENTE:

-- Criar tabela
CREATE TABLE IF NOT EXISTS public.fertilizantes_corretivos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tipo_produto text CHECK (tipo_produto IN ('fertilizante', 'corretivo', 'ambos')) NOT NULL,
    nome_produto text,
    area numeric(10,2) NOT NULL,
    area_unit text DEFAULT 'ha',
    dose numeric(10,2) NOT NULL,
    dose_unit text DEFAULT 'kg/ha',
    teor_n numeric(5,2) DEFAULT 0,
    teor_p numeric(5,2) DEFAULT 0,
    teor_k numeric(5,2) DEFAULT 0,
    num_aplicacoes integer DEFAULT 1,
    area_concluida numeric(10,2) DEFAULT 0,
    custo_por_ton numeric(10,2),
    observacoes text,
    propriedade text,
    lote_talhao text,
    cultura text,
    responsavel_tecnico text,
    data_aplicacao date,
    total_produto numeric(10,2),
    area_restante numeric(10,2),
    percentual_concluido numeric(5,2),
    custo_total numeric(10,2),
    nutrientes_n numeric(10,2),
    nutrientes_p numeric(10,2),
    nutrientes_k numeric(10,2),
    user_id uuid REFERENCES auth.users(id),
    empresa_id uuid
);

-- Habilitar RLS
ALTER TABLE public.fertilizantes_corretivos ENABLE ROW LEVEL SECURITY;

-- Criar policies
CREATE POLICY "Usuários podem ver seus próprios registros" 
    ON public.fertilizantes_corretivos FOR SELECT 
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários podem inserir seus próprios registros" 
    ON public.fertilizantes_corretivos FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários podem atualizar seus próprios registros" 
    ON public.fertilizantes_corretivos FOR UPDATE 
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários podem excluir seus próprios registros" 
    ON public.fertilizantes_corretivos FOR DELETE 
    USING (auth.uid() = user_id OR user_id IS NULL);

-- View para relatórios
CREATE OR REPLACE VIEW public.vw_relatorio_fertilizantes AS
SELECT 
    DATE_TRUNC('month', data_aplicacao) as mes,
    DATE_TRUNC('year', data_aplicacao) as ano,
    propriedade, lote_talhao, cultura, tipo_produto, nome_produto,
    COUNT(*) as qtd_aplicacoes,
    SUM(area) as total_area,
    SUM(total_produto) as total_produto_kg,
    SUM(area_concluida) as total_concluido_ha,
    AVG(percentual_concluido) as media_conclusao,
    SUM(custo_total) as custo_total,
    SUM(nutrientes_n) as total_n_kg,
    SUM(nutrientes_p) as total_p_kg,
    SUM(nutrientes_k) as total_k_kg
FROM public.fertilizantes_corretivos
WHERE data_aplicacao IS NOT NULL
GROUP BY DATE_TRUNC('month', data_aplicacao), DATE_TRUNC('year', data_aplicacao),
         propriedade, lote_talhao, cultura, tipo_produto, nome_produto
ORDER BY mes DESC;

=================================================================

3. COMO USAR
------------

1. Acesse o sistema: index_menu.html
2. Faça login
3. No menu lateral, clique em "Tratos Culturais"
4. Clique em "Fertilizantes e Corretivos"
5. Preencha os dados:
   - Tipo de Produto (Fertilizante/Corretivo)
   - Nome do Produto
   - Área para aplicação
   - Dose recomendada
   - Teor de Nutrientes (N, P, K) - opcional
   - Número de aplicações
   - Área já concluída
   - Custo por tonelada
6. Clique em "Dados da Propriedade" para preencher:
   - Nome da fazenda
   - Lote/Talhão
   - Cultura
   - Responsável técnico
   - Data da aplicação
7. Clique em "Calcular" para ver os resultados
8. Os dados serão salvos automaticamente no banco

PARA VER RELATÓRIOS:
1. No menu, clique em "Tratos Culturais"
2. Clique em "Relatórios Agrícolas" (agora inclui dados de fertilizantes)
3. OU acesse diretamente: relatorio_fertilizantes.html
4. Use os filtros para refinar sua busca
5. Exporte para PDF ou Excel

=================================================================

4. ESTRUTURA DE ARQUIVOS
---------------------

📁 Campo-4.0/
├── 📄 index_menu.html (atualizado)
├── 📄 fertilizantes_corretivos.html (NOVO - Formulário)
├── 📄 relatorio_fertilizantes.html (NOVO - Relatórios)
├── 📁 js/
│   ├── 📄 fertilizantes.js (NOVO - Lógica do formulário)
│   ├── 📄 menu.js (mantido para compatibilidade)
│   └── ... (outros arquivos)
├── 📁 css/
│   ├── 📄 style_Menu.css (limpo - não mais usado)
│   └── ... (outros arquivos)
├── 📁 sql/
│   └── 📄 fertilizantes_corretivos.sql (NOVO - Script SQL)
└── 📄 service-worker.js (atualizado)

=================================================================

5. FUNCIONALIDADES
------------------

✅ Cálculo automático de:
   - Total de produto necessário (kg)
   - Área restante para concluir
   - Percentual de conclusão
   - Custo total da aplicação
   - Quantidade de nutrientes (N, P, K)

✅ Presets por cultura:
   - Soja: 300 kg/ha, 20-80-20
   - Milho: 400 kg/ha, 10-90-30
   - Cana: 600 kg/ha (corretivo), 0-30-10
   - Pastagem: 200 kg/ha, 5-20-15

✅ Relatórios completos:
   - KPIs executivos
   - Gráficos interativos
   - Tabela detalhada
   - Exportação PDF/Excel
   - Filtros de período, tipo e cultura

✅ Design responsivo:
   - Desktop (1400px+)
   - Notebook (1024px-1399px)
   - Tablet (768px-1023px)
   - Celular (480px-767px)
   - Celular pequeno (<480px)

=================================================================

6. SOLUÇÃO DE PROBLEMAS
----------------------

❓ Erro: "Tabela não existe"
   → Execute o script SQL no Supabase (item 2 acima)

❓ Erro: "Erro de permissão. Verifique RLS policies!"
   → No Supabase, vá em Authentication > Policies
   → Verifique se as policies foram criadas corretamente
   → Ou desative RLS temporariamente para teste

❓ Dados não salvam offline
   → Verifique se o arquivo js/offline-sync.js existe
   → O sistema salva localmente e sincroniza quando houver internet

❓ Gráficos não aparecem
   → Verifique se o Chart.js está carregando
   → Abra o console do navegador (F12) para ver erros

=================================================================

7. PRÓXIMOS PASSOS (SUGESTÕES)
----------------------------

□ Adicionar upload de fotos da aplicação
□ Criar alertas para aplicações pendentes
□ Integrar com mapas (Google Maps/Leaflet)
□ Adicionar cálculo de custo benefício
□ Criar dashboard específico para fertilizantes
□ Adicionar exportação para Word/PowerPoint
□ Implementar comparação entre culturas
□ Adicionar histórico de preços de produtos

=================================================================

Campo 4.0 © 2026 - Sistema de Gestão Agrícola
Desenvolvido com ❤️ para o agro brasileiro
=================================================================
