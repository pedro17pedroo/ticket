# Checklist de Validação da Migração

## Antes da Migração

### Verificações de Ambiente
- [ ] PostgreSQL está rodando
- [ ] Banco `tatuticket` existe e está acessível
- [ ] Credenciais em `backend/.env` estão corretas
- [ ] Backups existem nos caminhos especificados
- [ ] Espaço em disco suficiente (mínimo 500MB)

### Comandos de Verificação
```bash
# Verificar PostgreSQL
psql -h localhost -U postgres -d tatuticket -c "SELECT version();"

# Verificar backups
ls -lh /Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260315_201256.sql
ls -lh /Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260402_184400.sql

# Verificar espaço em disco
df -h .
```

## Durante a Migração

### Etapas Esperadas
- [ ] Diretório de trabalho criado
- [ ] Backup do estado atual criado
- [ ] Tabelas identificadas (82 comuns, 7 preservadas)
- [ ] Constraints desabilitadas
- [ ] Tabelas limpas (82 tabelas)
- [ ] Dados de produção restaurados
- [ ] Constraints reabilitadas
- [ ] Validação executada

### Mensagens Esperadas
```
[1] Fazendo backup do banco de desenvolvimento atual...
✓ Backup salvo em: ...

[2] Identificando tabelas comuns...
✓ 82 tabelas serão migradas
⚠ 7 tabelas serão preservadas (só existem em dev)

[3] Desabilitando constraints temporariamente...
✓ Constraints desabilitadas

[4] Limpando 82 tabelas...
✓ 82 tabelas limpas

[5] Restaurando dados de produção...
✓ Dados de produção restaurados com sucesso

[6] Reabilitando constraints...
✓ Constraints reabilitadas

[7] Validando integridade dos dados...
✓ Validação concluída

MIGRAÇÃO CONCLUÍDA COM SUCESSO!
```

## Após a Migração

### Validação de Dados

#### 1. Contagem de Registros Principais
```sql
-- Conectar ao banco
psql -h localhost -U postgres -d tatuticket

-- Verificar contagens
SELECT 'clients' as tabela, COUNT(*) as total FROM clients
UNION ALL
SELECT 'client_users', COUNT(*) FROM client_users
UNION ALL
SELECT 'organization_users', COUNT(*) FROM organization_users
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'attachments', COUNT(*) FROM attachments;
```

**Valores Esperados**:
- [ ] clients: 10
- [ ] client_users: 14
- [ ] organization_users: 20
- [ ] tickets: 65
- [ ] comments: > 0
- [ ] attachments: > 0

#### 2. Verificar Tabelas Preservadas
```sql
-- Verificar que tabelas novas ainda existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'context_sessions',
    'context_audit_logs',
    'catalog_access_audit_logs',
    'catalog_access_control',
    'todo_collaborators_v2',
    'todos_v2',
    'user_permissions'
  )
ORDER BY table_name;
```

**Resultado Esperado**:
- [ ] 7 tabelas listadas

#### 3. Verificar Integridade Referencial
```sql
-- Verificar que não há FKs quebradas
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f'
  AND convalidated = false;
```

**Resultado Esperado**:
- [ ] 0 linhas (nenhuma constraint quebrada)

#### 4. Verificar Dados Específicos
```sql
-- Verificar clientes
SELECT id, name, email FROM clients LIMIT 5;

-- Verificar usuários de organização
SELECT id, name, email FROM organization_users LIMIT 5;

-- Verificar usuários de cliente
SELECT id, name, email, client_id FROM client_users LIMIT 5;

-- Verificar tickets
SELECT id, title, status, created_at FROM tickets ORDER BY created_at DESC LIMIT 5;
```

**Verificar**:
- [ ] Dados parecem reais (não são dados de teste)
- [ ] Datas fazem sentido
- [ ] Relacionamentos estão corretos

### Validação Funcional

#### 1. Testar Backend
```bash
# Iniciar backend
cd backend
npm start
```

**Verificar**:
- [ ] Backend inicia sem erros
- [ ] Conexão com banco estabelecida
- [ ] Logs não mostram erros de FK

#### 2. Testar Endpoints
```bash
# Testar health check
curl http://localhost:4003/health

# Testar login (ajustar credenciais)
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"[email]","password":"[senha]","portalType":"organization"}'
```

**Verificar**:
- [ ] Health check retorna OK
- [ ] Login funciona
- [ ] Token JWT é retornado

#### 3. Testar Multi-Contexto
```bash
# Listar contextos disponíveis (usar token do login)
curl http://localhost:4003/api/auth/contexts \
  -H "Authorization: Bearer [TOKEN]"
```

**Verificar**:
- [ ] Retorna lista de contextos
- [ ] Dados estão corretos

### Validação de Sistema

#### 1. Desktop Agent
- [ ] Abre sem erros
- [ ] Login funciona
- [ ] Seleção de contexto aparece (se múltiplos)
- [ ] Troca de contexto funciona
- [ ] Catálogo de serviços carrega

#### 2. Portal Organização
- [ ] Abre sem erros
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Lista de tickets aparece
- [ ] Criação de ticket funciona

#### 3. Portal Cliente
- [ ] Abre sem erros
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Lista de tickets aparece
- [ ] Criação de ticket funciona

## Rollback (Se Necessário)

### Quando Fazer Rollback
- [ ] Dados incorretos após migração
- [ ] Erros de integridade referencial
- [ ] Sistema não funciona corretamente
- [ ] Tabelas preservadas foram perdidas

### Como Fazer Rollback
```bash
# 1. Identificar arquivo de backup
ls -lt backend/backups/migration-work/

# 2. Restaurar backup
psql -h localhost -U postgres -d tatuticket < backend/backups/migration-work/dev-before-migration-[TIMESTAMP].sql

# 3. Verificar restauração
psql -h localhost -U postgres -d tatuticket -c "SELECT COUNT(*) FROM clients;"
```

### Após Rollback
- [ ] Dados voltaram ao estado anterior
- [ ] Sistema funciona normalmente
- [ ] Investigar causa do problema
- [ ] Ajustar script se necessário

## Problemas Comuns

### Problema: "psql: command not found"
**Solução**:
```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
```

### Problema: "password authentication failed"
**Solução**:
- Verificar `POSTGRES_PASSWORD` em `backend/.env`
- Testar conexão manual: `psql -h localhost -U postgres -d tatuticket`

### Problema: "relation does not exist"
**Solução**:
- Verificar que backup de produção está correto
- Verificar que banco de desenvolvimento existe
- Restaurar backup e tentar novamente

### Problema: "constraint violation"
**Solução**:
- Verificar que constraints foram desabilitadas
- Verificar ordem de restauração de dados
- Limpar tabelas novamente e restaurar

## Documentação

### Arquivos de Log
- [ ] Salvar output do script de migração
- [ ] Salvar queries de validação
- [ ] Documentar qualquer problema encontrado

### Backup
- [ ] Manter backup pré-migração por 7 dias
- [ ] Documentar localização do backup
- [ ] Testar restauração do backup

## Conclusão

### Migração Bem-Sucedida
- [ ] Todos os dados migrados corretamente
- [ ] Tabelas preservadas intactas
- [ ] Sistema funciona normalmente
- [ ] Backup disponível para emergências
- [ ] Documentação atualizada

### Próximos Passos
- [ ] Monitorar sistema por 24h
- [ ] Validar com usuários reais
- [ ] Documentar lições aprendidas
- [ ] Atualizar procedimentos se necessário

---

**Data da Migração**: _______________
**Executado por**: _______________
**Resultado**: [ ] Sucesso [ ] Falha [ ] Rollback
**Observações**: _______________
