# Estratégia Real de Migração: Produção → Desenvolvimento

## Situação Atual (Análise Correta)

### Backup de Produção
- **Arquivo**: `tatuticket_20260315_201256.sql`
- **Tabelas com dados**: 82
- **Contém**: Comandos COPY com dados reais de produção
- **Dados importantes**:
  - 10 clientes
  - 14 client_users
  - 20 organization_users
  - 65 tickets
  - Comentários, anexos, etc.

### Backup de Desenvolvimento
- **Arquivo**: `tatuticket_20260402_184400.sql`
- **Tabelas com dados**: 89
- **Contém**: Comandos COPY com dados de desenvolvimento

### Diferenças Críticas

**7 Tabelas APENAS em Desenvolvimento** (devem ser preservadas):
1. `context_audit_logs` - Logs de auditoria do sistema multi-contexto
2. `context_sessions` - Sessões ativas do sistema multi-contexto
3. `catalog_access_audit_logs` - Auditoria de acesso ao catálogo
4. `catalog_access_control` - Controle de acesso ao catálogo
5. `todo_collaborators_v2` - Nova versão de colaboradores de tarefas
6. `todos_v2` - Nova versão de tarefas
7. `user_permissions` - Sistema de permissões de usuário

**82 Tabelas Comuns** (devem ser migradas de produção):
- Todas as tabelas principais do sistema
- Dados de clientes, usuários, tickets, etc.

## Estratégia de Migração

### Fase 1: Preparação
1. ✅ Criar diretório de trabalho para arquivos temporários
2. ✅ Fazer backup completo do banco de desenvolvimento atual
3. ✅ Identificar tabelas comuns entre produção e desenvolvimento

### Fase 2: Limpeza Seletiva
1. ✅ Desabilitar constraints temporariamente (`SET session_replication_role = replica`)
2. ✅ Limpar APENAS as 82 tabelas comuns usando `TRUNCATE CASCADE`
3. ✅ Preservar as 7 tabelas novas de desenvolvimento (não tocar nelas)

### Fase 3: Restauração
1. ✅ Restaurar dados do backup de produção
2. ✅ PostgreSQL irá:
   - Criar estruturas se não existirem (já existem, então ignora)
   - Executar comandos COPY para inserir dados
   - Ignorar tabelas que não existem no backup (as 7 novas)

### Fase 4: Finalização
1. ✅ Reabilitar constraints (`SET session_replication_role = DEFAULT`)
2. ✅ Validar integridade dos dados
3. ✅ Verificar contagens de registros

## Script Implementado

### Arquivo: `backend/scripts/migrate-prod-to-dev-real.js`

**Características**:
- ✅ Lê os backups SQL reais e identifica tabelas com dados
- ✅ Preserva automaticamente as 7 tabelas novas de desenvolvimento
- ✅ Faz backup antes de qualquer operação
- ✅ Usa TRUNCATE CASCADE para limpar dados mantendo estrutura
- ✅ Restaura dados de produção via psql
- ✅ Valida integridade após migração
- ✅ Output colorido e informativo

**Uso**:
```bash
cd backend
node scripts/migrate-prod-to-dev-real.js
```

## Validações Implementadas

### Antes da Migração
- ✅ Verifica existência dos backups
- ✅ Identifica tabelas comuns
- ✅ Lista tabelas que serão preservadas
- ✅ Cria backup do estado atual

### Durante a Migração
- ✅ Desabilita constraints para evitar erros de FK
- ✅ Limpa tabelas uma por uma com feedback
- ✅ Restaura dados com tratamento de erros

### Após a Migração
- ✅ Reabilita constraints
- ✅ Conta registros em tabelas críticas
- ✅ Verifica que tabelas preservadas ainda existem
- ✅ Valida integridade referencial

## Segurança

### Backups Automáticos
- Backup completo antes de qualquer operação
- Salvo em: `backend/backups/migration-work/dev-before-migration-TIMESTAMP.sql`
- Pode ser usado para restaurar em caso de problema

### Rollback Manual
Se algo der errado:
```bash
# Restaurar backup anterior
psql -h localhost -U postgres -d tatuticket < backend/backups/migration-work/dev-before-migration-TIMESTAMP.sql
```

## Tabelas Preservadas (Desenvolvimento)

Estas tabelas NÃO serão tocadas durante a migração:

1. **context_audit_logs** - Sistema multi-contexto implementado
2. **context_sessions** - Sessões ativas de contexto
3. **catalog_access_audit_logs** - Auditoria de catálogo
4. **catalog_access_control** - Controle de acesso
5. **todo_collaborators_v2** - Colaboradores v2
6. **todos_v2** - Tarefas v2
7. **user_permissions** - Permissões

## Resultado Esperado

Após a migração:
- ✅ Dados de produção no banco de desenvolvimento
- ✅ 7 tabelas novas de desenvolvimento preservadas
- ✅ Sistema multi-contexto funcional
- ✅ Integridade referencial mantida
- ✅ Backup do estado anterior disponível

## Próximos Passos

1. **Revisar configuração** - Verificar variáveis de ambiente em `backend/.env`
2. **Executar migração** - Rodar o script
3. **Validar resultado** - Verificar dados migrados
4. **Testar sistema** - Garantir que tudo funciona
5. **Documentar** - Registrar qualquer ajuste necessário

## Notas Importantes

- ⚠️ O script usa `TRUNCATE CASCADE` - isso limpa dados relacionados
- ⚠️ Sempre há um backup antes da operação
- ⚠️ Constraints são temporariamente desabilitadas
- ⚠️ A restauração pode gerar warnings sobre estruturas existentes (normal)
- ✅ Tabelas novas de desenvolvimento são automaticamente preservadas
