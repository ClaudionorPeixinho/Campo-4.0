# Perdas e Pragas - Configuração e Troubleshooting

## 1. Executar SQL no Supabase

1. Acesse https://app.supabase.com
2. Selecione o projeto `szzfqkhibuejhodhkvjj`
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole TODO o conteúdo do arquivo `perdas_pragas_schema.sql`
6. Clique em **Run** (ou Ctrl+Enter)

### Verificar se funcionou:
Após executar, você deve ver "Success. No rows returned" ou similar. Para verificar:
1. Vá em **Table Editor** no menu lateral
2. Você deve ver as tabelas: `registros_perdas`, `monitoramento_pragas`, `historico_controle_pragas`

## 2. Testar o Formulário

1. Abra o sistema Campo 4.0 (index_menu.html)
2. No menu lateral, clique em **Perdas e Pragas**
3. Abra o console do navegador (F12) para ver os logs
4. Preencha os dados e clique em **Registrar**

### Logs esperados no console:
```
=== Perdas e Pragas Inicializado ===
Supabase client: OK
Supabase: criando cliente com SDK direto
Conexão Supabase OK. Teste: [...]
```

## 3. Mensagens de Erro Comuns

### "Tabela não existe"
- **Causa**: O SQL não foi executado ou falhou
- **Solução**: Execute o SQL novamente no Supabase SQL Editor

### "Erro de permissão" / "permission denied"
- **Causa**: RLS policies bloqueando
- **Solução**: Verifique se as policies foram criadas corretamente

### "Sem conexão"
- **Causa**: Problema de rede ou Supabase offline
- **Solução**: Verifique sua conexão com a internet

## 4. Verificar Dados no Banco

Após registrar, vá em:
1. Supabase Dashboard → **Table Editor**
2. Selecione `registros_perdas`
3. Você deve ver os registros inseridos

## 5. Debug

Se ainda não funcionar, abra o console (F12) e verifique:
- Se há erros de CORS
- Se a resposta do Supabase contém detalhes do erro
- Se o cliente Supabase foi inicializado (`Supabase client: OK`)

Copie a mensagem de erro completa e verifique o log `=== ERRO AO SALVAR ===` no console.
