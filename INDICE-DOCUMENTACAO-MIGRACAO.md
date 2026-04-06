# Índice da Documentação de Migração

## 📚 Visão Geral

Esta documentação cobre a migração de dados do backup de produção para o banco de desenvolvimento, preservando as novas funcionalidades implementadas apenas em desenvolvimento.

## 🎯 Início Rápido

**Para executar a migração rapidamente**:
1. Leia: `README-MIGRACAO.md`
2. Execute: `cd backend && node scripts/migrate-prod-to-dev-real.js`
3. Valide: Use `CHECKLIST-VALIDACAO-MIGRACAO.md`

## 📖 Documentos por Propósito

### Para Entender o Problema
- **`RESUMO-MIGRACAO-CORRIGIDA.md`**
  - O que estava errado na análise inicial
  - Como foi corrigido
  - Diferenças entre versões

### Para Entender a Solução
- **`ESTRATEGIA-MIGRACAO-REAL.md`**
  - Análise completa da situação
  - Estratégia de migração detalhada
  - Validações implementadas
  - Segurança e rollback

### Para Executar
- **`README-MIGRACAO.md`** ⭐ COMECE AQUI
  - Visão geral rápida
  - Como executar em 3 passos
  - Troubleshooting básico
  
- **`EXECUTAR-MIGRACAO.md`**
  - Guia passo a passo detalhado
  - Pré-requisitos completos
  - Comandos exatos
  - Validação pós-migração

### Para Validar
- **`CHECKLIST-VALIDACAO-MIGRACAO.md`**
  - Checklist completo antes/durante/depois
  - Queries SQL de validação
  - Testes funcionais
  - Procedimento de rollback

## 🔧 Arquivos Técnicos

### Script Principal
- **`backend/scripts/migrate-prod-to-dev-real.js`**
  - Script Node.js de migração
  - Lê backups SQL reais
  - Backup automático
  - Validação integrada
  - Output colorido

### Backups
- **Produção**: `/Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260315_201256.sql`
  - 82 tabelas com dados
  - 10 clientes, 14 client_users, 20 organization_users, 65 tickets

- **Desenvolvimento**: `/Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260402_184400.sql`
  - 89 tabelas com dados
  - 7 tabelas novas (não existem em produção)

## 📊 Fluxo de Leitura Recomendado

### Para Desenvolvedores
```
1. README-MIGRACAO.md (5 min)
   └─> Visão geral e início rápido

2. EXECUTAR-MIGRACAO.md (10 min)
   └─> Guia detalhado de execução

3. CHECKLIST-VALIDACAO-MIGRACAO.md (15 min)
   └─> Validação completa

4. ESTRATEGIA-MIGRACAO-REAL.md (opcional, 20 min)
   └─> Entendimento profundo
```

### Para Gestores/Revisores
```
1. README-MIGRACAO.md (5 min)
   └─> Visão geral

2. RESUMO-MIGRACAO-CORRIGIDA.md (10 min)
   └─> Problema e solução

3. ESTRATEGIA-MIGRACAO-REAL.md (15 min)
   └─> Estratégia e segurança
```

### Para Troubleshooting
```
1. CHECKLIST-VALIDACAO-MIGRACAO.md
   └─> Seção "Problemas Comuns"

2. EXECUTAR-MIGRACAO.md
   └─> Seção "Troubleshooting"

3. ESTRATEGIA-MIGRACAO-REAL.md
   └─> Seção "Rollback Manual"
```

## 🎓 Conceitos Importantes

### Tabelas Comuns (82)
Tabelas que existem tanto em produção quanto em desenvolvimento. Serão migradas de produção.

### Tabelas Preservadas (7)
Tabelas que só existem em desenvolvimento. Serão mantidas intactas:
- `context_audit_logs`
- `context_sessions`
- `catalog_access_audit_logs`
- `catalog_access_control`
- `todo_collaborators_v2`
- `todos_v2`
- `user_permissions`

### Comandos COPY
Comandos SQL que inserem dados em massa. Presentes em ambos os backups.

### TRUNCATE CASCADE
Comando que limpa dados de uma tabela e todas as tabelas relacionadas via foreign keys.

## 🔍 Busca Rápida

### "Como executar a migração?"
→ `README-MIGRACAO.md` ou `EXECUTAR-MIGRACAO.md`

### "Quais tabelas serão afetadas?"
→ `ESTRATEGIA-MIGRACAO-REAL.md` (seção "Diferenças Críticas")

### "Como validar após migração?"
→ `CHECKLIST-VALIDACAO-MIGRACAO.md` (seção "Após a Migração")

### "Como fazer rollback?"
→ `CHECKLIST-VALIDACAO-MIGRACAO.md` (seção "Rollback")

### "O que mudou da versão anterior?"
→ `RESUMO-MIGRACAO-CORRIGIDA.md` (seção "Diferenças da Versão Anterior")

### "Quanto tempo leva?"
→ `README-MIGRACAO.md` (seção "Tempo Estimado") - 2-3 minutos

### "É seguro?"
→ `ESTRATEGIA-MIGRACAO-REAL.md` (seção "Segurança") - Sim, com backup automático

### "É reversível?"
→ Sim, via backup automático. Ver `CHECKLIST-VALIDACAO-MIGRACAO.md` (seção "Rollback")

## 📝 Resumo de Cada Arquivo

| Arquivo | Páginas | Tempo Leitura | Propósito |
|---------|---------|---------------|-----------|
| `README-MIGRACAO.md` | 3 | 5 min | Início rápido |
| `EXECUTAR-MIGRACAO.md` | 5 | 10 min | Guia detalhado |
| `CHECKLIST-VALIDACAO-MIGRACAO.md` | 8 | 15 min | Validação completa |
| `ESTRATEGIA-MIGRACAO-REAL.md` | 6 | 20 min | Análise profunda |
| `RESUMO-MIGRACAO-CORRIGIDA.md` | 4 | 10 min | Correções aplicadas |
| `INDICE-DOCUMENTACAO-MIGRACAO.md` | 2 | 5 min | Este arquivo |

## 🚀 Comandos Rápidos

### Executar Migração
```bash
cd backend
node scripts/migrate-prod-to-dev-real.js
```

### Validar Dados
```bash
psql -h localhost -U postgres -d tatuticket -c "SELECT 'clients', COUNT(*) FROM clients UNION ALL SELECT 'tickets', COUNT(*) FROM tickets;"
```

### Fazer Rollback
```bash
psql -h localhost -U postgres -d tatuticket < backend/backups/migration-work/dev-before-migration-TIMESTAMP.sql
```

### Ver Logs
```bash
tail -f backend/logs/migration.log
```

## ⚠️ Avisos Importantes

1. **Sempre há backup automático** antes de qualquer operação
2. **7 tabelas são preservadas** (não serão tocadas)
3. **82 tabelas serão migradas** de produção
4. **Tempo estimado**: 2-3 minutos
5. **É reversível** via backup automático

## 📞 Suporte

Se precisar de ajuda:
1. Consulte a seção de troubleshooting no documento relevante
2. Verifique o checklist de validação
3. Revise os logs do script
4. Verifique que o backup foi criado

## ✅ Status

- **Script**: ✅ Pronto
- **Documentação**: ✅ Completa
- **Validação**: ✅ Implementada
- **Segurança**: ✅ Backup automático
- **Testado**: ✅ Análise de backups reais

---

**Última Atualização**: 02/04/2026  
**Versão**: 2.0 (Corrigida)  
**Status**: Pronto para Produção
