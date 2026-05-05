-- ============================================
-- SQL PARA SUPABASE - Fertilizantes e Corretivos
-- Sistema Campo 4.0
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Criar tabela fertilizantes_corretivos
CREATE TABLE IF NOT EXISTS public.fertilizantes_corretivos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Dados da aplicação
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
    
    -- Dados da propriedade
    propriedade text,
    lote_talhao text,
    cultura text,
    responsavel_tecnico text,
    data_aplicacao date,
    
    -- Resultados calculados
    total_produto numeric(10,2),
    area_restante numeric(10,2),
    percentual_concluido numeric(5,2),
    custo_total numeric(10,2),
    nutrientes_n numeric(10,2),
    nutrientes_p numeric(10,2),
    nutrientes_k numeric(10,2),
    
    -- Metadados
    user_id uuid REFERENCES auth.users(id),
    empresa_id uuid
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_fertilizantes_data ON public.fertilizantes_corretivos(data_aplicacao);
CREATE INDEX IF NOT EXISTS idx_fertilizantes_propriedade ON public.fertilizantes_corretivos(propriedade);
CREATE INDEX IF NOT EXISTS idx_fertilizantes_cultura ON public.fertilizantes_corretivos(cultura);
CREATE INDEX IF NOT EXISTS idx_fertilizantes_user ON public.fertilizantes_corretivos(user_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.fertilizantes_corretivos ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies de segurança
-- Policy para SELECT (ler próprios registros)
CREATE POLICY "Usuários podem ver seus próprios registros" 
    ON public.fertilizantes_corretivos 
    FOR SELECT 
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy para INSERT (inserir próprios registros)
CREATE POLICY "Usuários podem inserir seus próprios registros" 
    ON public.fertilizantes_corretivos 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy para UPDATE (atualizar próprios registros)
CREATE POLICY "Usuários podem atualizar seus próprios registros" 
    ON public.fertilizantes_corretivos 
    FOR UPDATE 
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy para DELETE (excluir próprios registros)
CREATE POLICY "Usuários podem excluir seus próprios registros" 
    ON public.fertilizantes_corretivos 
    FOR DELETE 
    USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fertilizantes_updated_at ON public.fertilizantes_corretivos;

CREATE TRIGGER update_fertilizantes_updated_at
    BEFORE UPDATE ON public.fertilizantes_corretivos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Comentários na tabela
COMMENT ON TABLE public.fertilizantes_corretivos IS 'Registro de aplicações de fertilizantes e corretivos';
COMMENT ON COLUMN public.fertilizantes_corretivos.tipo_produto IS 'Tipo: fertilizante, corretivo ou ambos';
COMMENT ON COLUMN public.fertilizantes_corretivos.teor_n IS 'Teor de Nitrogênio (%)';
COMMENT ON COLUMN public.fertilizantes_corretivos.teor_p IS 'Teor de Fósforo P2O5 (%)';
COMMENT ON COLUMN public.fertilizantes_corretivos.teor_k IS 'Teor de Potássio K2O (%)';

-- ============================================
-- TABELA DE RELATÓRIOS DE FERTILIZANTES
-- ============================================

-- 1. Criar view para relatório consolidado
CREATE OR REPLACE VIEW public.vw_relatorio_fertilizantes AS
SELECT 
    DATE_TRUNC('month', data_aplicacao) as mes,
    DATE_TRUNC('year', data_aplicacao) as ano,
    propriedade,
    lote_talhao,
    cultura,
    tipo_produto,
    nome_produto,
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
GROUP BY 
    DATE_TRUNC('month', data_aplicacao),
    DATE_TRUNC('year', data_aplicacao),
    propriedade, lote_talhao, cultura, tipo_produto, nome_produto
ORDER BY mes DESC;

COMMENT ON VIEW public.vw_relatorio_fertilizantes IS 'View consolidada para relatórios de fertilizantes e corretivos';

-- ============================================
-- DADOS DE EXEMPLO (OPCIONAL - REMOVA EM PRODUÇÃO)
-- ============================================
/*
INSERT INTO public.fertilizantes_corretivos 
(tipo_produto, nome_produto, area, dose, teor_n, teor_p, teor_k, num_aplicacoes, area_concluida, custo_por_ton, propriedade, lote_talhao, cultura, responsavel_tecnico, data_aplicacao, total_produto, area_restante, percentual_concluido, custo_total, nutrientes_n, nutrientes_p, nutrientes_k)
VALUES 
('fertilizante', 'MAP 11-52-00', 50.00, 300.00, 11.0, 52.0, 0.0, 1, 30.00, 2800.00, 'Fazenda Santa Maria', 'A-01', 'soja', 'Eng. Agr. João Silva', '2026-01-15', 15000.00, 20.00, 60.0, 42000.00, 1650.00, 7800.00, 0.00),
('corretivo', 'Calcário Dolomítico', 30.00, 2000.00, 0.0, 30.0, 20.0, 1, 30.00, 450.00, 'Fazenda Santa Maria', 'A-02', 'soja', 'Eng. Agr. João Silva', '2026-02-10', 60000.00, 0.00, 100.0, 27000.00, 0.00, 18000.00, 12000.00),
('fertilizante', 'Cloreto de Potássio', 45.00, 150.00, 0.0, 0.0, 60.0, 2, 45.00, 3200.00, 'Fazenda Boa Vista', 'B-03', 'milho', 'Eng. Agr. Marina Costa', '2026-03-05', 13500.00, 0.00, 100.0, 43200.00, 0.00, 0.00, 8100.00);
*/

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Verificar se a tabela foi criada
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'fertilizantes_corretivos';

-- Verificar policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'fertilizantes_corretivos';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
