# Deploy para Produção - Referência Rápida

## 🚀 Processo Recomendado (5 Passos)

### 1️⃣ Configurar Credenciais
```bash
export PROD_DB_HOST="seu-host.com"
export PROD_DB_USER="seu-usuario"
export PROD_DB_NAME="sua-base-dados"
export PROD_DB_PASSWORD="sua-senha"
```

### 2️⃣ Executar Deploy Automatizado
```bash
./deploy_to_production.sh
```

Este script:
- ✅ Cria backup automático
- ✅ Executa todas as migrações em transação
- ✅ Verifica sucesso
- ✅ Mantém backup para rollback

### 3️⃣ Verificar Deploy
```bash
./verify_production_deployment.sh
```

Verifica:
- ✅ 6 tabelas criadas
- ✅ ENUM client_user_role
- ✅ Constraints e índices
- ✅ Dados existentes preservados

### 4️⃣ Reiniciar Aplicação
```bash
# Se usar PM2
pm2 restart backend

# Se usar Docker
docker-compose restart backend

# Se usar systemd
sudo systemctl restart tatuticket-backend
```

### 5️⃣ Testar Sistema
```bash
# Verificar health
curl https://seu-dominio.com/api/health

# Testar login
curl -X POST https://seu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "senha"}'
```

## 📋 Checklist Pré-Deploy

- [ ] Testado em ambiente de staging
- [ ] Backup da base de dados criado
- [ ] Horário de baixo tráfego agendado
- [ ] Equipe disponível para suporte
- [ ] Plano de rollback preparado
- [ ] Credenciais de produção configuradas

## 🔄 Rollback (Se Necessário)

```bash
# 1. Parar aplicação
pm2 stop backend

# 2. Restaurar backup
PGPASSWORD=$PROD_DB_PASSWORD pg_restore \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -c backups/backup_YYYYMMDD_HHMMSS.dump

# 3. Reiniciar aplicação
pm2 start backend
```

## 📊 O Que Será Criado

### Tabelas (6)
1. `clients` - Empresas clientes B2B
2. `client_users` - Usuários das empresas clientes
3. `client_catalog_access` - Controle de acesso ao catálogo (empresa)
4. `client_user_catalog_access` - Controle de acesso ao catálogo (usuário)
5. `context_sessions` - Sessões de contexto multi-organização
6. `context_audit_logs` - Auditoria de trocas de contexto

### ENUM
- `client_user_role`: 'client-admin', 'client-manager', 'client-user'

### Índices
- 20+ índices para otimização de queries

## ⚠️ Avisos Importantes

### ✅ SEGURO
- Todas as migrações usam `IF NOT EXISTS`
- Transação única (rollback automático em erro)
- Backup automático antes de qualquer mudança
- Dados existentes são preservados

### ❌ NÃO FAZER
- ❌ Executar sem backup
- ❌ Executar em horário de pico
- ❌ Executar sem testar em staging
- ❌ Modificar o script de migração

## 📞 Suporte

### Logs para Verificar
```bash
# Logs da aplicação
pm2 logs backend --lines 100

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Problemas Comuns

#### Erro: "relation already exists"
✅ Normal - tabela já existe, migração pula automaticamente

#### Erro: "permission denied"
❌ Verificar permissões do usuário PostgreSQL

#### Erro: "could not connect to server"
❌ Verificar credenciais e conectividade

## 📚 Documentação Completa

Para detalhes completos, consultar:
- `GUIA-DEPLOY-PRODUCAO.md` - Guia completo
- `RESTAURACAO-ARQUITETURA-SAAS.md` - Arquitetura
- `backend/docs/API-CONTEXT-SWITCHING.md` - API de contexto

## 🎯 Tempo Estimado

- Backup: 1-5 minutos (depende do tamanho da BD)
- Migrações: 10-30 segundos
- Verificação: 10 segundos
- Reinício da aplicação: 10-30 segundos

**Total**: 2-7 minutos

## ✅ Sucesso!

Após deploy bem-sucedido, o sistema terá:
- ✅ Arquitetura SaaS multi-nível completa
- ✅ Portal Backoffice funcional
- ✅ Portal Organização funcional
- ✅ Portal Empresa Cliente funcional
- ✅ Multi-contexto com mesmo email
- ✅ Controle de acesso ao catálogo

---

**Data**: 28 de Fevereiro de 2026  
**Versão**: 1.0
