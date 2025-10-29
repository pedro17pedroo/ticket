# 🚀 Guia de Deploy - TatuTicket

## Docker Compose (Recomendado)

### Pré-requisitos
- Docker 20+
- Docker Compose 2+

### Deploy Completo

```bash
# 1. Clonar repositório
git clone <repo-url>
cd ticket

# 2. Configurar variáveis de ambiente (opcional)
cp backend/.env.example backend/.env
# Editar backend/.env com suas configurações

# 3. Build e iniciar todos os serviços
docker-compose up -d

# 4. Ver logs
docker-compose logs -f

# 5. Executar seed de dados iniciais
docker-compose exec backend node src/seeds/initialSeed.js
```

### Serviços Disponíveis

- **Backend API**: http://localhost:3000
- **Portal Organização**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Comandos Úteis

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v

# Rebuild de um serviço específico
docker-compose build backend
docker-compose up -d backend

# Ver logs de um serviço
docker-compose logs -f backend

# Executar comando no container
docker-compose exec backend npm run seed

# Escalar serviço (ex: 3 instâncias do backend)
docker-compose up -d --scale backend=3
```

## Deploy Manual (Desenvolvimento)

### 1. PostgreSQL

```bash
# Instalar PostgreSQL
brew install postgresql@15  # macOS
sudo apt install postgresql-15  # Ubuntu

# Criar banco de dados
createdb tatuticket

# Restaurar backup (se existir)
psql tatuticket < backup.sql
```

### 2. MongoDB

```bash
# Instalar MongoDB
brew install mongodb-community@7  # macOS
sudo apt install mongodb-org  # Ubuntu

# Iniciar serviço
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Ubuntu
```

### 3. Redis

```bash
# Instalar Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Iniciar serviço
brew services start redis  # macOS
sudo systemctl start redis  # Ubuntu
```

### 4. Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env

# Executar seed
node src/seeds/initialSeed.js

# Iniciar
npm run dev  # Desenvolvimento
npm start    # Produção
```

### 5. Portal Organização

```bash
cd portalOrganizaçãoTenant
npm install
cp .env.example .env
# Editar .env

# Iniciar
npm run dev     # Desenvolvimento
npm run build   # Build produção
npm run preview # Preview do build
```

## Deploy em Produção

### Opção 1: VPS/Servidor Dedicado

#### Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/tatuticket

# Backend API
upstream backend_api {
    server localhost:3000;
}

# Portal Organização
server {
    listen 80;
    server_name portal.tatuticket.com;

    location / {
        root /var/www/tatuticket/portal-org/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# API direta
server {
    listen 80;
    server_name api.tatuticket.com;

    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### PM2 para Processos

```bash
# Instalar PM2
npm install -g pm2

# Backend
cd backend
pm2 start src/server.js --name tatuticket-backend

# Salvar configuração
pm2 save
pm2 startup
```

#### SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d portal.tatuticket.com -d api.tatuticket.com
```

### Opção 2: Cloud Platforms

#### Heroku

```bash
# Backend
heroku create tatuticket-backend
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
heroku addons:create mongolab:sandbox
git push heroku main

# Portal (Netlify, Vercel, etc)
npm run build
# Deploy via interface
```

#### AWS/GCP/Azure

- **Backend**: Elastic Beanstalk, App Engine, App Service
- **Bancos**: RDS (Postgres), DocumentDB/MongoDB Atlas, ElastiCache (Redis)
- **Frontend**: S3 + CloudFront, Cloud Storage, Blob Storage

### Opção 3: Kubernetes

```yaml
# kubernetes/deployment.yaml (exemplo simplificado)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tatuticket-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tatuticket-backend
  template:
    metadata:
      labels:
        app: tatuticket-backend
    spec:
      containers:
      - name: backend
        image: tatuticket/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        # ... outras env vars
```

## Variáveis de Ambiente - Produção

### Backend (.env)

```bash
NODE_ENV=production
PORT=3000

# PostgreSQL
POSTGRES_HOST=<db-host>
POSTGRES_PORT=5432
POSTGRES_DB=tatuticket
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<strong-password>

# MongoDB
MONGODB_URI=mongodb://<user>:<password>@<host>:27017/tatuticket_logs

# Redis
REDIS_HOST=<redis-host>
REDIS_PORT=6379

# JWT (GERAR CHAVE SEGURA!)
JWT_SECRET=<generate-strong-secret-key>
JWT_EXPIRES_IN=24h

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<email>
EMAIL_PASSWORD=<app-password>

# URLs
CORS_ORIGIN=https://portal.tatuticket.com
```

### Frontend (.env)

```bash
VITE_API_URL=https://api.tatuticket.com/api
```

## Backup e Restore

### PostgreSQL

```bash
# Backup
pg_dump tatuticket > backup_$(date +%Y%m%d).sql

# Restore
psql tatuticket < backup_20251022.sql

# Backup automatizado (cron)
0 2 * * * pg_dump tatuticket | gzip > /backups/tatuticket_$(date +\%Y\%m\%d).sql.gz
```

### MongoDB

```bash
# Backup
mongodump --db tatuticket_logs --out /backups/mongo_$(date +%Y%m%d)

# Restore
mongorestore --db tatuticket_logs /backups/mongo_20251022/tatuticket_logs
```

## Monitorização

### Logs

```bash
# Backend logs (PM2)
pm2 logs tatuticket-backend

# Docker logs
docker-compose logs -f backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Métricas

- **PM2 Monitor**: `pm2 monit`
- **Docker Stats**: `docker stats`
- Ferramentas externas: New Relic, Datadog, Prometheus + Grafana

## Troubleshooting

### Backend não inicia

```bash
# Verificar logs
docker-compose logs backend

# Verificar conexões DB
docker-compose exec postgres pg_isready
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
docker-compose exec redis redis-cli ping
```

### Portal não carrega

```bash
# Verificar build
cd portalOrganizaçãoTenant
npm run build

# Verificar nginx
docker-compose logs portal-org
```

### Problemas de autenticação

- Verificar JWT_SECRET está definido
- Verificar CORS_ORIGIN permite o domínio
- Limpar cache do navegador

## Segurança - Checklist

- [ ] Alterar todas as senhas padrão
- [ ] Gerar JWT_SECRET forte
- [ ] Configurar SSL/HTTPS
- [ ] Configurar firewall (portas 80, 443, 22 apenas)
- [ ] Desabilitar root SSH
- [ ] Configurar rate limiting
- [ ] Backups automatizados
- [ ] Monitorização de logs
- [ ] Updates de segurança automáticos

---

Para dúvidas, consulte README.md ou documentação específica de cada serviço.
