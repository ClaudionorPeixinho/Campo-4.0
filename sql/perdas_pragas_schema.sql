-- =====================================================
-- PERDAS E PRAGAS - Schema para Supabase
-- Campo 4.0 - Sistema de Gestão Agrícola
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- TABELA 1: registros_perdas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS registros_perdas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_perda VARCHAR(50) NOT NULL,
    estagio_cultura VARCHAR(50),
    area_afetada DECIMAL(10, 2) NOT NULL,
    area_unit VARCHAR(10) DEFAULT 'ha',
    severidade VARCHAR(20),
    perda_estimada DECIMAL(5, 2),
    condicoes_climaticas VARCHAR(50),
    data_constatacao DATE,
    observacoes TEXT,
    propriedade VARCHAR(255),
    lote_talhao VARCHAR(100),
    fazenda VARCHAR(255),
    perda_tch DECIMAL(8, 2),
    tch_final DECIMAL(8, 2),
    perda_total_toneladas DECIMAL(10, 2),
    custo_perda_estimado DECIMAL(12, 2),
    nivel_risco VARCHAR(20),
    acao_recomendada VARCHAR(255),
    responsavel_registro VARCHAR(255),
    usuario_id UUID
);

-- -----------------------------------------------------
-- TABELA 2: monitoramento_pragas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS monitoramento_pragas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    praga VARCHAR(50) NOT NULL,
    nome_cientifico VARCHAR(255),
    estagio_praga VARCHAR(30),
    nivel_infestacao DECIMAL(5, 2),
    metodo_amostragem VARCHAR(50),
    populacao_estimada DECIMAL(10, 2),
    populacao_unit VARCHAR(30),
    nivel_dano_economico VARCHAR(30),
    tipo_controle VARCHAR(50),
    produto_controle VARCHAR(255),
    outro_produto VARCHAR(255),
    data_amostragem DATE,
    observacoes TEXT,
    responsavel_tecnico VARCHAR(255),
    registro_perda_id UUID REFERENCES registros_perdas(id) ON DELETE CASCADE,
    propriedade VARCHAR(255),
    lote_talhao VARCHAR(100),
    fazenda VARCHAR(255),
    parasitismo_natural DECIMAL(5, 2),
    presenca_inimigos_naturais BOOLEAN DEFAULT FALSE,
    inimigos_naturais_descricao VARCHAR(255),
    temperatura_ambiente DECIMAL(4, 1),
    umidade_relativa DECIMAL(5, 2),
    fase_cana VARCHAR(30)
);

-- -----------------------------------------------------
-- TABELA 3: historico_controle_pragas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_controle_pragas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    monitoramento_id UUID REFERENCES monitoramento_pragas(id) ON DELETE CASCADE,
    data_aplicacao DATE NOT NULL,
    tipo_controle VARCHAR(50) NOT NULL,
    produto_utilizado VARCHAR(255),
    dose_aplicada VARCHAR(100),
    area_tratada DECIMAL(10, 2),
    metodo_aplicacao VARCHAR(50),
    responsavel_aplicacao VARCHAR(255),
    condicoes_climaticas VARCHAR(50),
    eficacia_esperada VARCHAR(30),
    observacoes TEXT,
    propriedade VARCHAR(255),
    lote_talhao VARCHAR(100)
);

-- -----------------------------------------------------
-- TRIGGER updated_at
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_registros_perdas_updated_at ON registros_perdas;
CREATE TRIGGER update_registros_perdas_updated_at
    BEFORE UPDATE ON registros_perdas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monitoramento_pragas_updated_at ON monitoramento_pragas;
CREATE TRIGGER update_monitoramento_pragas_updated_at
    BEFORE UPDATE ON monitoramento_pragas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------
ALTER TABLE registros_perdas ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoramento_pragas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_controle_pragas ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes para evitar conflitos
DROP POLICY IF EXISTS "Registros perdas select" ON registros_perdas;
DROP POLICY IF EXISTS "Registros perdas insert" ON registros_perdas;
DROP POLICY IF EXISTS "Registros perdas update" ON registros_perdas;
DROP POLICY IF EXISTS "Registros perdas delete" ON registros_perdas;

DROP POLICY IF EXISTS "Monitoramento pragas select" ON monitoramento_pragas;
DROP POLICY IF EXISTS "Monitoramento pragas insert" ON monitoramento_pragas;
DROP POLICY IF EXISTS "Monitoramento pragas update" ON monitoramento_pragas;
DROP POLICY IF EXISTS "Monitoramento pragas delete" ON monitoramento_pragas;

DROP POLICY IF EXISTS "Historico controle select" ON historico_controle_pragas;
DROP POLICY IF EXISTS "Historico controle insert" ON historico_controle_pragas;
DROP POLICY IF EXISTS "Historico controle update" ON historico_controle_pragas;
DROP POLICY IF EXISTS "Historico controle delete" ON historico_controle_pragas;

-- Políticas para registros_perdas (permitir tudo para autenticados)
CREATE POLICY "Registros perdas select" ON registros_perdas FOR SELECT USING (true);
CREATE POLICY "Registros perdas insert" ON registros_perdas FOR INSERT WITH CHECK (true);
CREATE POLICY "Registros perdas update" ON registros_perdas FOR UPDATE USING (true);
CREATE POLICY "Registros perdas delete" ON registros_perdas FOR DELETE USING (true);

-- Políticas para monitoramento_pragas
CREATE POLICY "Monitoramento pragas select" ON monitoramento_pragas FOR SELECT USING (true);
CREATE POLICY "Monitoramento pragas insert" ON monitoramento_pragas FOR INSERT WITH CHECK (true);
CREATE POLICY "Monitoramento pragas update" ON monitoramento_pragas FOR UPDATE USING (true);
CREATE POLICY "Monitoramento pragas delete" ON monitoramento_pragas FOR DELETE USING (true);

-- Políticas para historico_controle_pragas
CREATE POLICY "Historico controle select" ON historico_controle_pragas FOR SELECT USING (true);
CREATE POLICY "Historico controle insert" ON historico_controle_pragas FOR INSERT WITH CHECK (true);
CREATE POLICY "Historico controle update" ON historico_controle_pragas FOR UPDATE USING (true);
CREATE POLICY "Historico controle delete" ON historico_controle_pragas FOR DELETE USING (true);

-- =====================================================
-- VIEWS
-- =====================================================

CREATE OR REPLACE VIEW vw_perdas_pragas_detalhadas AS
SELECT
    rp.id,
    rp.created_at,
    rp.updated_at,
    rp.tipo_perda,
    rp.estagio_cultura,
    rp.area_afetada,
    rp.area_unit,
    rp.severidade,
    rp.perda_estimada,
    rp.condicoes_climaticas,
    rp.data_constatacao,
    rp.observacoes AS observacoes_perda,
    rp.propriedade,
    rp.lote_talhao,
    rp.fazenda,
    rp.perda_tch,
    rp.tch_final,
    rp.perda_total_toneladas,
    rp.custo_perda_estimado,
    rp.nivel_risco,
    rp.acao_recomendada,
    rp.responsavel_registro,
    mp.id AS praga_id,
    mp.praga,
    mp.nome_cientifico,
    mp.estagio_praga,
    mp.nivel_infestacao,
    mp.metodo_amostragem,
    mp.populacao_estimada,
    mp.populacao_unit,
    mp.nivel_dano_economico,
    mp.tipo_controle,
    mp.produto_controle,
    mp.outro_produto,
    mp.data_amostragem,
    mp.observacoes AS observacoes_praga,
    mp.responsavel_tecnico
FROM registros_perdas rp
LEFT JOIN monitoramento_pragas mp ON mp.registro_perda_id = rp.id
ORDER BY rp.created_at DESC;

CREATE OR REPLACE VIEW vw_ranking_pragas AS
SELECT
    mp.praga,
    mp.nome_cientifico,
    COUNT(*) AS ocorrencias,
    AVG(mp.nivel_infestacao) AS media_infestacao,
    MAX(mp.nivel_infestacao) AS max_infestacao,
    COUNT(CASE WHEN mp.nivel_dano_economico = 'acima' THEN 1 END) AS vezes_acima_nde,
    COUNT(CASE WHEN mp.tipo_controle = 'biologico' THEN 1 END) AS controles_biologicos,
    COUNT(CASE WHEN mp.tipo_controle = 'quimico' THEN 1 END) AS controles_quimicos,
    SUM(rp.perda_total_toneladas) AS perda_total_toneladas,
    SUM(rp.custo_perda_estimado) AS custo_total_estimado
FROM monitoramento_pragas mp
LEFT JOIN registros_perdas rp ON rp.id = mp.registro_perda_id
GROUP BY mp.praga, mp.nome_cientifico
ORDER BY ocorrencias DESC;

CREATE OR REPLACE VIEW vw_dashboard_perdas_pragas AS
SELECT
    (SELECT COUNT(*) FROM registros_perdas) AS total_registros_perdas,
    (SELECT COUNT(*) FROM monitoramento_pragas) AS total_monitoramentos,
    (SELECT COUNT(DISTINCT praga) FROM monitoramento_pragas WHERE praga IS NOT NULL) AS total_pragas_identificadas,
    (SELECT SUM(area_afetada) FROM registros_perdas) AS area_total_afetada,
    (SELECT SUM(perda_total_toneladas) FROM registros_perdas) AS perda_total_toneladas_geral,
    (SELECT SUM(custo_perda_estimado) FROM registros_perdas) AS custo_total_geral,
    (SELECT COUNT(*) FROM registros_perdas WHERE severidade = 'baixa') AS perdas_severidade_baixa,
    (SELECT COUNT(*) FROM registros_perdas WHERE severidade = 'media') AS perdas_severidade_media,
    (SELECT COUNT(*) FROM registros_perdas WHERE severidade = 'alta') AS perdas_severidade_alta,
    (SELECT COUNT(*) FROM monitoramento_pragas WHERE nivel_dano_economico = 'acima') AS pragas_acima_nde;
