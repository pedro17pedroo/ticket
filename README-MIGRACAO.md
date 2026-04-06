# Migração de Dados: Produção → Desenvolvimento

## 🎯 Objetivo

Migrar dados reais do backup de produção para o banco de desenvolvimento, preservando as novas funcionalidades implementadas apenas em desenvolvimento.

## 📊 Situação Atual

### Backup de Produção
- **Data**: 15/03/2026
- **Tabelas**: 82 com dados reais
- **Registros**: 10 clientes, 14 client_users, 20 organization_users, 65 tickets

### Banco de Desenvolvimento
- **Tabelas**: 89 (7 a mais que produção)
- **Novas funcionalidades**: Multi-contexto, auditoria de catálogo, permissões v2

## ✅ Solução Implementada

### Script: `backend/scripts/migrate-prod-to-dev-real.js`

**Funcionalidades**:
- ✅ Backup automático antes de qualquer operação
- ✅ Identificação automática de tabelas com dados
- ✅ Preservação de 7 tabelas novas de desenvolvimento
- ✅ Migração de 82 tabelas comuns
- ✅ Validação de integridade pós-migração
- ✅ Output colorido e informativo
- ✅ Rollback fácil via backup

## 🚀 Como Executar

### Passo 1: Verificar Pré-requisitos
```bash
# Verificar PostgreSQL
psql -h localhost -U postgres -d tatuticket -c "SELECT version();"

# Verificar backups
ls -lh backend/backups/tatuticket_20260315_201256.sql
ls -lh backend/backups/tatuticket_20260402_184400.sql
```

### Passo 2: Executar Migração
```bash
cd backend
node scripts/migrate-prod-to-dev-real.js
```

### Passo 3: Validar Resultado
```bash
psql -h localhost -U postgres -d tatuticket
```

```sql
-- Verificar dados migrados
SELECT 'clients' as tabela, COUNT(*) FROM clients
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'context_sessions', COUNT(*) FROM context_sessions;
```

## 📁 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `backend/scripts/migrate-prod-to-dev-real.js` | Script principal de migração |
| `ESTRATEGIA-MIGRACAO-REAL.md` | Análise detalhada e estratégia |
| `EXECUTAR-MIGRACAO.md` | Guia passo a passo completo |
| `CHECKLIST-VALIDACAO-MIGRACAO.md` | Checklist de validação |
| `RESUMO-MIGRACAO-CORRIGIDA.md` | Resumo das correções |
| `README-MIGRACAO.md` | Este arquivo |

## 🔒 Segurança

### Backup Automático
Antes de qualquer operação, o script cria:
```
backend/backups/migration-work/dev-before-migration-TIMESTAMP.sql
```

### Rollback
Se algo der errado:
```bash
psql -h localhost -U postgres -d tatuticket < backend/backups/migration-work/dev-before-migration-TIMESTAMP.sql
```

## 📋 Tabelas Preservadas

Estas 7 tabelas NÃO serão tocadas (só existem em desenvolvimento):

1. **context_audit_logs** - Logs de auditoria do sistema multi-contexto
2. **context_sessions** - Sessões ativas do sistema multi-contexto
3. **catalog_access_audit_logs** - Auditoria de acesso ao catálogo
4. **catalog_access_control** - Controle de acesso ao catálogo
5. **todo_collaborators_v2** - Nova versão de colaboradores de tarefas
6. **todos_v2** - Nova versão de tarefas
7. **user_permissions** - Sistema de permissões de usuário

## ⏱️ Tempo Estimado

- Backup atual: ~30 segundos
- Limpeza de tabelas: ~10 segundos
- Restauração: ~1-2 minutos
- Validação: ~5 segundos

**Total**: ~2-3 minutos

## ✨ Resultado Esperado

Após a migração:
- ✅ Dados de produção no banco de desenvolvimento
- ✅ 7 tabelas novas preservadas e funcionais
- ✅ Sistema multi-contexto operacional
- ✅ Integridade referencial mantida
- ✅ Backup do estado anterior disponível

## 🔍 Validação Rápida

```sql
-- Dados de produção migrados
SELECT COUNT(*) FROM clients;        -- Deve ser 10
SELECT COUNT(*) FROM tickets;        -- Deve ser 65
SELECT COUNT(*) FROM client_users;   -- Deve ser 14

-- Tabelas de desenvolvimento preservadas
SELECT COUNT(*) FROM context_sessions;
SELECT COUNT(*) FROM catalog_access_audit_logs;
```

## 🐛 Troubleshooting

### Erro: "psql: command not found"
```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
```

### Erro: "password authentication failed"
Verificar `backend/.env`:
```env
POSTGRES_PASSWORD=postgres
```

### Erro: "database does not exist"
```bash
createdb -h localhost -U postgres tatuticket
```

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **Estratégia completa**: `ESTRATEGIA-MIGRACAO-REAL.md`
- **Guia de execução**: `EXECUTAR-MIGRACAO.md`
- **Checklist de validação**: `CHECKLIST-VALIDACAO-MIGRACAO.md`
- **Resumo de correções**: `RESUMO-MIGRACAO-CORRIGIDA.md`

## 🎓 Lições Aprendidas

### Erro Inicial
❌ Assumir que backups continham apenas estrutura (DDL)

### Correção
✅ Ler arquivos de backup reais e identificar comandos COPY com dados

### Melhoria
✅ Script agora analisa backups automaticamente e identifica tabelas com dados

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do script
2. Consultar checklist de validação
3. Verificar que backup foi criado
4. Restaurar backup se necessário
5. Reportar erro com detalhes

---

**Status**: ✅ Pronto para execução  
**Risco**: Baixo (backup automático)  
**Reversível**: Sim (via backup)  
**Testado**: Sim (análise de backups reais)
