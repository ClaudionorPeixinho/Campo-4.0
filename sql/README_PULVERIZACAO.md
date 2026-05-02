# Pulverização de Herbicidas - Instruções de Configuração

## 1. Executar SQL no Supabase

1. Acesse https://app.supabase.com
2. Selecione o projeto `szzfqkhibuejhodhkvjj`
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `sql/pulverizacao_herbicidas_schema.sql`
6. Clique em **Run** para executar

### O que será criado:
- ✅ Tabela `pulverizacoes_herbicidas` - Registros de pulverização
- ✅ View `vw_pulverizacoes_detalhadas` - Visão detalhada
- ✅ View `vw_resumo_pulverizacoes_mensal` - Resumo mensal
- ✅ View `vw_ranking_herbicidas` - Ranking de herbicidas
- ✅ View `vw_dashboard_pulverizacoes` - Dados para dashboard
- ✅ RLS policies (acesso liberado)
- ✅ Trigger para updated_at automático

## 2. Testar o Formulário

1. Abra o sistema Campo 4.0 (index_menu.html)
2. No menu lateral, clique em **Pulverização**
3. Abra o console do navegador (F12) para ver os logs
4. Preencha os dados da aplicação
5. Clique em **Dados da Propriedade** para abrir o modal
6. Preencha os dados da propriedade
7. Clique em **Salvar e Fechar**
8. Clique em **Calcular**

### Logs esperados no console:
```
=== Pulverização Inicializado ===
Supabase client: OK
Supabase: criando cliente com SDK direto
Conexão Supabase OK.
```

## 3. Funcionalidades

### Ao clicar em "Calcular":
- Calcula volume total, tanques, tempo, produtividade
- Salva automaticamente no banco de dados
- Exibe resultados com tabs (Resumo, Detalhes, Ciclo)
- Mostra notificação de sucesso

### Tabela de Registros Salvos:
- Exibida abaixo dos resultados
- Mostra todos os registros do banco
- Botão de excluir em cada registro
- Atualiza automaticamente após cada registro

## 4. Verificar Dados no Banco

1. Supabase Dashboard → **Table Editor**
2. Selecione `pulverizacoes_herbicidas`
3. Você deve ver os registros inseridos

## 5. Mensagens de Erro

- **"Tabela não existe"** → Execute o SQL no Supabase
- **"Erro de permissão"** → Verifique RLS policies
- **"Supabase não disponível"** → Verifique conexão com internet
