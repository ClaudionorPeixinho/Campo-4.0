-- =====================================================
-- PULVERIZAÇÃO DE HERBICIDAS - Schema para Supabase
-- Campo 4.0 - Sistema de Gestão Agrícola
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- TABELA 1: pulverizacoes_herbicidas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pulverizacoes_herbicidas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dados da Aplicação
    area DECIMAL(10, 2) NOT NULL,
    area_unit VARCHAR(10) DEFAULT 'ha',
    dose DECIMAL(10, 2) NOT NULL,
    dose_unit VARCHAR(10) DEFAULT 'l/ha',
    velocidade DECIMAL(5, 1),
    bicos INTEGER,
    capacidade DECIMAL(8, 1),
    largura_barra DECIMAL(6, 2),

    -- Dados da Propriedade
    propriedade VARCHAR(255),
    lote_talhao VARCHAR(100),
    cultura VARCHAR(50),
    herbicida VARCHAR(255),
    responsavel_agronomo VARCHAR(255),
    data_aplicacao DATE,

    -- Resultados Calculados
    volume_total DECIMAL(10, 2),
    tanques_necessarios INTEGER,
    tempo_estimado VARCHAR(20),
    produtividade DECIMAL(6, 2),
    litros_por_bico_30seg DECIMAL(8, 4),
    litros_por_bico_60seg DECIMAL(8, 4),
    vazao_media DECIMAL(8, 4),
    eficiencia_tanque DECIMAL(5, 2),
    custo_projecao DECIMAL(10, 2)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pulverizacoes_cultura ON pulverizacoes_herbicidas(cultura);
CREATE INDEX IF NOT EXISTS idx_pulverizacoes_data ON pulverizacoes_herbicidas(data_aplicacao);
CREATE INDEX IF NOT EXISTS idx_pulverizacoes_herbicida ON pulverizacoes_herbicidas(herbicida);
CREATE INDEX IF NOT EXISTS idx_pulverizacoes_propriedade ON pulverizacoes_herbicidas(propriedade);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pulverizacoes_updated_at ON pulverizacoes_herbicidas;
CREATE TRIGGER update_pulverizacoes_updated_at
    BEFORE UPDATE ON pulverizacoes_herbicidas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------
ALTER TABLE pulverizacoes_herbicidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pulverizacoes select" ON pulverizacoes_herbicidas;
DROP POLICY IF EXISTS "Pulverizacoes insert" ON pulverizacoes_herbicidas;
DROP POLICY IF EXISTS "Pulverizacoes update" ON pulverizacoes_herbicidas;
DROP POLICY IF EXISTS "Pulverizacoes delete" ON pulverizacoes_herbicidas;

CREATE POLICY "Pulverizacoes select" ON pulverizacoes_herbicidas FOR SELECT USING (true);
CREATE POLICY "Pulverizacoes insert" ON pulverizacoes_herbicidas FOR INSERT WITH CHECK (true);
CREATE POLICY "Pulverizacoes update" ON pulverizacoes_herbicidas FOR UPDATE USING (true);
CREATE POLICY "Pulverizacoes delete" ON pulverizacoes_herbicidas FOR DELETE USING (true);

-- =====================================================
-- VIEWS
-- =====================================================

CREATE OR REPLACE VIEW vw_pulverizacoes_detalhadas AS
SELECT
    id,
    created_at,
    updated_at,
    propriedade,
    lote_talhao,
    cultura,
    herbicida,
    responsavel_agronomo,
    data_aplicacao,
    area,
    area_unit,
    dose,
    dose_unit,
    velocidade,
    bicos,
    capacidade,
    largura_barra,
    volume_total,
    tanques_necessarios,
    tempo_estimado,
    produtividade,
    custo_projecao
FROM pulverizacoes_herbicidas
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW vw_resumo_pulverizacoes_mensal AS
SELECT
    TO_CHAR(data_aplicacao, 'YYYY-MM') AS mes_referencia,
    TO_CHAR(data_aplicacao, 'MM/YYYY') AS mes_formatado,
    cultura,
    herbicida,
    COUNT(*) AS quantidade_pulverizacoes,
    SUM(area) AS total_area_pulverizada,
    AVG(volume_total) AS media_volume,
    SUM(volume_total) AS volume_total_acumulado,
    AVG(tanques_necessarios) AS media_tanques,
    SUM(custo_projecao) AS custo_total_estimado
FROM pulverizacoes_herbicidas
WHERE data_aplicacao IS NOT NULL
GROUP BY
    TO_CHAR(data_aplicacao, 'YYYY-MM'),
    TO_CHAR(data_aplicacao, 'MM/YYYY'),
    cultura,
    herbicida
ORDER BY mes_referencia DESC;

CREATE OR REPLACE VIEW vw_ranking_herbicidas AS
SELECT
    herbicida,
    COUNT(*) AS quantidade_usos,
    SUM(area) AS total_area_tratada,
    SUM(volume_total) AS volume_total_utilizado,
    AVG(dose) AS dose_media,
    SUM(custo_projecao) AS custo_total,
    MIN(data_aplicacao) AS primeiro_uso,
    MAX(data_aplicacao) AS ultimo_uso
FROM pulverizacoes_herbicidas
WHERE herbicida IS NOT NULL
GROUP BY herbicida
ORDER BY quantidade_usos DESC;

CREATE OR REPLACE VIEW vw_dashboard_pulverizacoes AS
SELECT
    (SELECT COUNT(*) FROM pulverizacoes_herbicidas) AS total_pulverizacoes,
    (SELECT SUM(area) FROM pulverizacoes_herbicidas) AS area_total_pulverizada,
    (SELECT SUM(volume_total) FROM pulverizacoes_herbicidas) AS volume_total_utilizado,
    (SELECT SUM(custo_projecao) FROM pulverizacoes_herbicidas) AS custo_total_estimado,
    (SELECT COUNT(DISTINCT herbicida) FROM pulverizacoes_herbicidas WHERE herbicida IS NOT NULL) AS herbicidas_diferentes,
    (SELECT COUNT(DISTINCT propriedade) FROM pulverizacoes_herbicidas WHERE propriedade IS NOT NULL) AS propriedades_atendidas,
    (SELECT COUNT(DISTINCT cultura) FROM pulverizacoes_herbicidas WHERE cultura IS NOT NULL) AS culturas_atendidas,
    (SELECT AVG(tanques_necessarios) FROM pulverizacoes_herbicidas) AS media_tanques_por_pulverizacao,
    (SELECT herbicida FROM pulverizacoes_herbicidas WHERE herbicida IS NOT NULL GROUP BY herbicida ORDER BY COUNT(*) DESC LIMIT 1) AS herbicida_mais_usado;

-- Comments
COMMENT ON TABLE pulverizacoes_herbicidas IS 'Registros de pulverização de herbicidas';
COMMENT ON VIEW vw_pulverizacoes_detalhadas IS 'Visão detalhada de todas as pulverizações';
COMMENT ON VIEW vw_resumo_pulverizacoes_mensal IS 'Resumo mensal de pulverizações';
COMMENT ON VIEW vw_ranking_herbicidas IS 'Ranking de herbicidas por frequência de uso';
COMMENT ON VIEW vw_dashboard_pulverizacoes IS 'Dados agregados para dashboard de pulverizações';
