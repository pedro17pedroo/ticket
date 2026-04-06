# Quick Start: Migração de Dados

## TL;DR - Execução Rápida

### Opção 1: Script Node.js (Recomendado)

```bash
# 1. Testar sem fazer alterações
node backend/scripts/migrate-production-to-dev.js --dry-run

# 2. Executar migração real
node backend/scripts/migrate-production-to-dev.js

# 3. Confirmar quando solicitado
# Digite: sim
```

### Opção 2: Script Shell (Mais Rápido)

```bash
# 1. Dar permissão
chmod +x backend/scripts/migrate-simple.sh

# 2. Executar
./backend/scripts/migrate-simple.sh

# 3. Confirmar quando solicitado
# Digite: s
```

---

## Pré-requisitos

✅ PostgreSQL instalado e rodando  
✅ Backup de produção em: `backend/backups/tatuticket_20260315_201256.sql`  
✅ Arquivo `.env` configurado no backend  
✅ Node.js instalado (para Opção 1)

---

## Configuração do .env

Certifique-se que seu `backend/.env` está correto:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tatuticket
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
```

---

## O Que os Scripts Fazem

1. ✅ Criam backup do banco atual
2. ✅ Criam banco temporário
3. ✅ Restauram backup de produção no temporário
4. ✅ Copiam dados para desenvolvimento
5. ✅ Atualizam sequences
6. ✅ Validam integridade
7. ✅ Limpam banco temporário

---

## Validação Rápida Pós-Migração

```sql
-- Conectar ao banco
psql -h localhost -U postgres -d tatuticket

-- Contar registros
SELECT 
    'Organizations' as tabela, COUNT(*) as registros FROM organizations
UNION ALL
SELECT 'Org Users', COUNT(*) FROM organization_users
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Client Users', COUNT(*) FROM client_users
UNION ALL
SELECT 'Tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'Messages', COUNT(*) FROM ticket_messages;
```

---

## Rollback em Caso de Problema

```bash
# O script cria backup automático em:
# backend/backups/pre-migration-YYYYMMDD_HHMMSS.sql

# Para restaurar:
psql -h localhost -U postgres -d postgres -c "DROP DATABASE tatuticket;"
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE tatuticket;"
psql -h localhost -U postgres -d tatuticket -f backend/backups/pre-migration-YYYYMMDD_HHMMSS.sql
```

---

## Testar Aplicação

```bash
# 1. Iniciar backend
cd backend
npm run dev

# 2. Testar login
# - Abrir http://localhost:4003
# - Fazer login com usuário de produção
# - Verificar se dados aparecem corretamente

# 3. Testar desktop agent
cd desktop-agent
npm start
```

---

## Problemas Comuns

### "psql: command not found"
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Baixar de: https://www.postgresql.org/download/windows/
```

### "permission denied"
```bash
# Dar permissão ao script
chmod +x backend/scripts/migrate-simple.sh
```

### "FATAL: password authentication failed"
```bash
# Verificar senha no .env
# Ou definir variável de ambiente:
export PGPASSWORD="sua_senha"
```

### "database does not exist"
```bash
# Criar banco manualmente:
psql -h localhost -U postgres -c "CREATE DATABASE tatuticket;"
```

---

## Checklist Rápido

- [ ] Backup de produção existe
- [ ] .env configurado
- [ ] PostgreSQL rodando
- [ ] Script executado sem erros
- [ ] Validação SQL executada
- [ ] Contagem de registros OK
- [ ] Aplicação testada
- [ ] Login funciona
- [ ] Tickets aparecem

---

## Suporte

Se encontrar problemas:

1. Verifique logs do PostgreSQL
2. Execute validação SQL
3. Consulte `GUIA-MIGRACAO-DADOS-PRODUCAO.md`
4. Restaure backup se necessário

---

## Tempo Estimado

- Script Node.js: ~5-10 minutos
- Script Shell: ~3-5 minutos
- Validação: ~2 minutos
- **Total: ~10-15 minutos**

---

## Após Migração

```bash
# 1. Executar migrations pendentes
cd backend
npx sequelize-cli db:migrate

# 2. Reiniciar aplicação
npm run dev

# 3. Testar funcionalidades principais
# - Login
# - Criação de ticket
# - Troca de contexto (se aplicável)
```

---

**Pronto!** Sua migração está completa. 🎉
