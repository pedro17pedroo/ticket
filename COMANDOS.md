# 🔧 Comandos Essenciais - TatuTicket

Referência rápida de comandos para trabalhar com o TatuTicket.

## 🐳 Docker

### Iniciar Sistema Completo
```bash
# Iniciar todos os serviços em background
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f portal-org
```

### Parar e Reiniciar
```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart backend
docker-compose restart portal-org
```

### Rebuild e Update
```bash
# Rebuild de todos os serviços
docker-compose build

# Rebuild de um serviço específico
docker-compose build backend
docker-compose build portal-org

# Build e iniciar
docker-compose up -d --build
```

### Executar Comandos nos Containers
```bash
# Seed de dados iniciais
docker-compose exec backend node src/seeds/initialSeed.js

# Acessar bash do backend
docker-compose exec backend sh

# Acessar PostgreSQL
docker-compose exec postgres psql -U postgres -d tatuticket

# Acessar MongoDB
docker-compose exec mongodb mongosh tatuticket_logs

# Acessar Redis
docker-compose exec redis redis-cli
```

### Monitorização
```bash
# Status dos containers
docker-compose ps

# Recursos utilizados
docker stats

# Ver configuração
docker-compose config
```

## 💻 Backend (Desenvolvimento Manual)

### Setup Inicial
```bash
cd backend
npm install
cp .env.example .env
# Editar .env conforme necessário
```

### Base de Dados
```bash
# Criar database PostgreSQL
createdb tatuticket

# Ou via psql
psql -U postgres
CREATE DATABASE tatuticket;
\q

# Executar seed
node src/seeds/initialSeed.js
```

### Desenvolvimento
```bash
# Modo desenvolvimento (com nodemon)
npm run dev

# Modo produção
npm start

# Verificar sintaxe
npm run lint
```

### Testes
```bash
# Executar testes
npm test

# Testes com cobertura
npm run test:coverage
```

### Gestão de Processos (PM2)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar com PM2
pm2 start src/server.js --name tatuticket-backend

# Ver logs
pm2 logs tatuticket-backend

# Monitorizar
pm2 monit

# Reiniciar
pm2 restart tatuticket-backend

# Parar
pm2 stop tatuticket-backend

# Remover
pm2 delete tatuticket-backend

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup
```

## 🎨 Portal Organização

### Setup Inicial
```bash
cd portalOrganizaçãoTenant
npm install
cp .env.example .env
```

### Desenvolvimento
```bash
# Iniciar servidor dev
npm run dev
# Acesse: http://localhost:5173

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Linting
```bash
# Verificar código
npm run lint
```

## 🗄️ Gestão de Base de Dados

### PostgreSQL

#### Backup
```bash
# Backup simples
pg_dump tatuticket > backup.sql

# Backup com data
pg_dump tatuticket > backup_$(date +%Y%m%d).sql

# Backup comprimido
pg_dump tatuticket | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### Restore
```bash
# Restore simples
psql tatuticket < backup.sql

# Restore com drop
psql -U postgres -c "DROP DATABASE IF EXISTS tatuticket;"
psql -U postgres -c "CREATE DATABASE tatuticket;"
psql tatuticket < backup.sql
```

#### Manutenção
```bash
# Conectar ao banco
psql -U postgres -d tatuticket

# Listar tabelas
\dt

# Descrever tabela
\d tickets

# Ver tamanho do banco
SELECT pg_size_pretty(pg_database_size('tatuticket'));

# Ver tabelas maiores
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Limpar tabelas (CUIDADO!)
TRUNCATE tickets, comments CASCADE;
```

### MongoDB

#### Backup
```bash
# Backup do database
mongodump --db tatuticket_logs --out backup_mongo_$(date +%Y%m%d)

# Backup comprimido
mongodump --db tatuticket_logs --archive=backup.archive --gzip
```

#### Restore
```bash
# Restore
mongorestore --db tatuticket_logs backup_mongo_20251022/tatuticket_logs

# Restore de archive
mongorestore --archive=backup.archive --gzip
```

#### Queries
```bash
# Conectar
mongosh tatuticket_logs

# Ver collections
show collections

# Contar documentos
db.audit_logs.countDocuments()

# Ver últimos logs
db.audit_logs.find().sort({timestamp: -1}).limit(10).pretty()

# Limpar logs antigos (> 90 dias)
db.audit_logs.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

### Redis

#### Comandos
```bash
# Conectar
redis-cli

# Ver todas as chaves
KEYS *

# Ver valor
GET chave

# Limpar tudo (CUIDADO!)
FLUSHALL

# Info
INFO

# Monitorar comandos
MONITOR
```

## 🔍 Debugging

### Backend
```bash
# Ver logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Node debugger
node --inspect src/server.js

# Com nodemon
nodemon --inspect src/server.js
```

### Docker
```bash
# Inspecionar container
docker inspect tatuticket-backend

# Ver processos em container
docker-compose exec backend ps aux

# Verificar rede
docker network inspect tatuticket-network

# Ver volumes
docker volume ls
docker volume inspect ticket_postgres_data
```

## 🧪 Testes e Validação

### Testar API (curl)
```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresademo.com","password":"Admin@123"}'

# Com token
TOKEN="seu-token-jwt"
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN"
```

### Testar API (httpie)
```bash
# Instalar httpie
brew install httpie  # macOS
sudo apt install httpie  # Ubuntu

# Login
http POST :3000/api/auth/login email=admin@empresademo.com password=Admin@123

# Tickets
http GET :3000/api/tickets "Authorization: Bearer $TOKEN"
```

## 📊 Monitorização

### Recursos do Sistema
```bash
# CPU e memória
top
htop

# Espaço em disco
df -h

# Processos Node
ps aux | grep node

# Conexões de rede
netstat -tuln | grep LISTEN
```

### Logs em Tempo Real
```bash
# Todos os logs Docker
docker-compose logs -f --tail=100

# Logs do sistema (macOS)
log stream --predicate 'process == "node"'

# Logs do sistema (Ubuntu)
journalctl -f -u tatuticket-backend
```

## 🚀 Deploy

### Build para Produção
```bash
# Backend
cd backend
npm ci --only=production
npm start

# Frontend
cd portalOrganizaçãoTenant
npm run build
# Arquivos em dist/
```

### Variáveis de Ambiente
```bash
# Gerar secret seguro para JWT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Verificar variáveis
cd backend
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET)"
```

## 🔧 Manutenção

### Limpar Cache e Build
```bash
# Docker
docker system prune -a
docker volume prune

# Node modules
rm -rf node_modules package-lock.json
npm install

# Build frontend
rm -rf dist
npm run build
```

### Atualizar Dependências
```bash
# Ver outdated
npm outdated

# Atualizar minor/patch
npm update

# Atualizar major (cuidado!)
npm install package@latest
```

## 📦 Úteis

### Ver Portas em Uso
```bash
# macOS/Linux
lsof -i :3000
lsof -i :5173

# Matar processo em porta
kill -9 $(lsof -t -i:3000)
```

### Exportar/Importar Dados
```bash
# Exportar tickets para JSON
psql tatuticket -c "COPY (SELECT * FROM tickets) TO STDOUT WITH CSV HEADER" > tickets.csv

# Exportar logs de auditoria
mongoexport --db tatuticket_logs --collection audit_logs --out audit.json
```

---

## 📚 Referências Rápidas

**URLs Desenvolvimento:**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- API Docs: http://localhost:3000/api/health

**URLs Docker:**
- Backend: http://localhost:3000
- Frontend: http://localhost:8080

**Credenciais Padrão:**
- Admin: admin@empresademo.com / Admin@123
- Agente: agente@empresademo.com / Agente@123
- Cliente: cliente@empresademo.com / Cliente@123

**Documentação:**
- [README.md](README.md) - Visão geral
- [QUICKSTART.md](QUICKSTART.md) - Início rápido
- [DEPLOY.md](DEPLOY.md) - Deploy produção
- [STATUS.md](STATUS.md) - Status atual
