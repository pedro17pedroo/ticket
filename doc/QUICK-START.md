# ⚡ Guia Rápido - TatuTicket

Comandos essenciais para começar rapidamente com o TatuTicket.

---

## 🚀 Setup Inicial (Primeira Vez)

### Opção 1: Script Automatizado (Recomendado)

```bash
# Executar script de setup
./setup.sh

# Seguir instruções na tela
```

### Opção 2: Docker (Mais Rápido)

```bash
# Iniciar todos os serviços
docker-compose up -d

# Executar migrations
docker-compose exec backend npm run migrate

# Executar seeds (dados de exemplo)
docker-compose exec backend npm run seed

# Ver logs
docker-compose logs -f
```

### Opção 3: Manual

```bash
# Backend
cd backend && npm install && npm run migrate && npm run seed && npm run dev

# Portal Organização (novo terminal)
cd portalOrganizaçãoTenant && npm install && npm run dev

# Portal Cliente (novo terminal)
cd portalClientEmpresa && npm install && npm run dev
```

---

## 🔑 Credenciais de Teste

Após executar seeds:

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | admin@empresademo.com | Admin@123 |
| **Agente** | agente@empresademo.com | Agente@123 |
| **Cliente** | cliente@empresademo.com | Cliente@123 |

---

## 🌐 URLs de Acesso

| Serviço | URL | Porta |
|---------|-----|-------|
| **Backend API** | http://localhost:3000 | 3000 |
| **API Docs (Swagger)** | http://localhost:3000/api-docs | 3000 |
| **Portal Organização** | http://localhost:5173 | 5173 |
| **Portal Cliente** | http://localhost:5174 | 5174 |

---

## 📦 Comandos Backend

```bash
cd backend

# Desenvolvimento
npm run dev                    # Iniciar servidor (nodemon)
npm start                      # Iniciar servidor (produção)

# Banco de Dados
npm run migrate                # Executar migrations
npm run seed                   # Executar seeds

# Testes
npm test                       # Todos os testes
npm run test:unit              # Testes unitários
npm run test:integration       # Testes de integração
npm run test:e2e               # Testes E2E
npm run test:coverage          # Cobertura de testes

# Qualidade
npm run lint                   # Linter
```

---

## 🎨 Comandos Frontend

### Portal Organização

```bash
cd portalOrganizaçãoTenant

npm run dev                    # Desenvolvimento
npm run build                  # Build produção
npm run preview                # Preview do build
npm run lint                   # Linter
```

### Portal Cliente

```bash
cd portalClientEmpresa

npm run dev                    # Desenvolvimento
npm run build                  # Build produção
npm run preview                # Preview do build
npm run lint                   # Linter
```

---

## 🐳 Comandos Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Ver logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f postgres

# Reiniciar serviço específico
docker-compose restart backend

# Executar comando no container
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed

# Rebuild imagens
docker-compose build
docker-compose up -d --build

# Limpar tudo
docker-compose down -v
```

---

## 🗄️ Comandos Banco de Dados

### PostgreSQL

```bash
# Conectar ao banco
psql -U postgres -d tatuticket

# Backup
pg_dump -U postgres -d tatuticket > backup.sql

# Restore
psql -U postgres -d tatuticket < backup.sql

# Ver tabelas
psql -U postgres -d tatuticket -c "\dt"

# Ver dados de uma tabela
psql -U postgres -d tatuticket -c "SELECT * FROM users LIMIT 5;"
```

### MongoDB

```bash
# Conectar ao banco
mongosh tatuticket_logs

# Backup
mongodump --db tatuticket_logs --out backup/

# Restore
mongorestore --db tatuticket_logs backup/tatuticket_logs/

# Ver collections
mongosh tatuticket_logs --eval "db.getCollectionNames()"
```

### Redis

```bash
# Conectar
redis-cli

# Ver todas as chaves
redis-cli KEYS "*"

# Limpar cache
redis-cli FLUSHALL
```

---

## 🔍 Debugging

### Backend

```bash
# Ver logs em tempo real
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Debug com Node Inspector
node --inspect src/server.js
```

### Frontend

```bash
# Abrir DevTools do navegador
# Chrome: F12 ou Cmd+Option+I (Mac)
# Firefox: F12 ou Cmd+Option+I (Mac)

# Ver console
console.log()
console.error()
console.warn()
```

---

## 🧪 Testes Rápidos

### Testar API

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresademo.com","password":"Admin@123"}'

# Listar tickets (com token)
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Testar Frontend

```bash
# Abrir no navegador
open http://localhost:5173  # Mac
xdg-open http://localhost:5173  # Linux
start http://localhost:5173  # Windows
```

---

## 🔧 Troubleshooting Rápido

### Porta já em uso

```bash
# Encontrar processo usando porta 3000
lsof -i :3000
# ou
netstat -tulpn | grep 3000

# Matar processo
kill -9 PID
```

### Limpar node_modules

```bash
# Backend
cd backend && rm -rf node_modules package-lock.json && npm install

# Portal Organização
cd portalOrganizaçãoTenant && rm -rf node_modules package-lock.json && npm install

# Portal Cliente
cd portalClientEmpresa && rm -rf node_modules package-lock.json && npm install
```

### Reset completo do banco

```bash
# PostgreSQL
psql -U postgres -c "DROP DATABASE tatuticket;"
psql -U postgres -c "CREATE DATABASE tatuticket;"
cd backend && npm run migrate && npm run seed

# MongoDB
mongosh tatuticket_logs --eval "db.dropDatabase()"

# Redis
redis-cli FLUSHALL
```

### Erro de permissões

```bash
# Corrigir permissões
sudo chown -R $USER:$USER .
chmod -R 755 .
```

---

## 📚 Documentação Completa

- **README.md** - Visão geral do projeto
- **DEPLOYMENT.md** - Guia de deployment
- **CONTRIBUTING.md** - Guia de contribuição
- **PRD.md** - Product Requirements Document
- **backend/README.md** - Documentação do backend
- **backend/RBAC-STATUS.md** - Status do RBAC
- **backend/CATALOG-SYSTEM-GUIDE.md** - Guia do catálogo

---

## 🆘 Precisa de Ajuda?

1. Verifique a [Documentação](README.md)
2. Procure em [Issues](https://github.com/your-org/tatuticket/issues)
3. Abra uma [Discussion](https://github.com/your-org/tatuticket/discussions)
4. Entre em contato: support@tatuticket.com

---

## ⚡ Comandos Mais Usados

```bash
# Setup inicial
./setup.sh

# Desenvolvimento (3 terminais)
cd backend && npm run dev
cd portalOrganizaçãoTenant && npm run dev
cd portalClientEmpresa && npm run dev

# Docker (tudo de uma vez)
docker-compose up -d

# Testes
cd backend && npm test

# Ver logs
docker-compose logs -f
tail -f backend/logs/combined.log

# Reset banco
cd backend && npm run migrate && npm run seed
```

---

**Dica:** Adicione este arquivo aos seus favoritos para acesso rápido! 🌟
