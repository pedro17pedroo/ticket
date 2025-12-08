# 🚀 Guia de Deployment - TatuTicket

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Deployment Local (Desenvolvimento)](#deployment-local-desenvolvimento)
3. [Deployment Docker (Produção)](#deployment-docker-produção)
4. [Deployment Manual (VPS/Cloud)](#deployment-manual-vpscloud)
5. [Configuração de Ambiente](#configuração-de-ambiente)
6. [Backup e Restore](#backup-e-restore)
7. [Monitorização](#monitorização)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Desenvolvimento Local
- Node.js 18+ (LTS)
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+
- npm ou yarn

### Produção (Docker)
- Docker 24+
- Docker Compose 2.20+
- 4GB RAM mínimo (8GB recomendado)
- 20GB espaço em disco

### Produção (Manual)
- Ubuntu 22.04 LTS ou similar
- Node.js 18+ (LTS)
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+
- Nginx (para proxy reverso)
- PM2 (para gestão de processos)

---

## 💻 Deployment Local (Desenvolvimento)

### 1. Clonar Repositório

```bash
git clone https://github.com/your-org/tatuticket.git
cd tatuticket
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar e configurar .env
cp .env.example .env
nano .env

# Executar migrations
npm run migrate

# Executar seeds (opcional - dados de exemplo)
npm run seed

# Iniciar servidor
npm run dev
```

Backend estará disponível em: `http://localhost:3000`

### 3. Configurar Portal Organização

```bash
cd ../portalOrganizaçãoTenant

# Instalar dependências
npm install

# Copiar e configurar .env
cp .env.example .env
nano .env

# Iniciar servidor
npm run dev
```

Portal Organização estará disponível em: `http://localhost:5173`

### 4. Configurar Portal Cliente

```bash
cd ../portalClientEmpresa

# Instalar dependências
npm install

# Copiar e configurar .env
cp .env.example .env
nano .env

# Iniciar servidor
npm run dev
```

Portal Cliente estará disponível em: `http://localhost:5174`

### 5. Credenciais de Teste

Após executar o seed:

**Admin Organização:**
- Email: `admin@empresademo.com`
- Senha: `Admin@123`

**Agente:**
- Email: `agente@empresademo.com`
- Senha: `Agente@123`

**Cliente:**
- Email: `cliente@empresademo.com`
- Senha: `Cliente@123`

---

## 🐳 Deployment Docker (Produção)

### 1. Preparar Ambiente

```bash
# Clonar repositório
git clone https://github.com/your-org/tatuticket.git
cd tatuticket

# Criar arquivo .env para Docker
cp backend/.env.example backend/.env
nano backend/.env
```

### 2. Configurar Variáveis de Ambiente

Editar `backend/.env`:

```bash
NODE_ENV=production
PORT=3000

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=tatuticket
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/tatuticket_logs

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=CHANGE_ME_SUPER_SECRET_KEY_MIN_32_CHARS
JWT_EXPIRES_IN=24h

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=TatuTicket

# URLs Frontend
FRONTEND_URL=https://your-domain.com
CLIENT_PORTAL_URL=https://client.your-domain.com
ORGANIZATION_PORTAL_URL=https://org.your-domain.com
```

### 3. Build e Iniciar Containers

```bash
# Build das imagens
docker-compose build

# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar status
docker-compose ps
```

### 4. Executar Migrations e Seeds

```bash
# Executar migrations
docker-compose exec backend npm run migrate

# Executar seeds (opcional)
docker-compose exec backend npm run seed
```

### 5. Acessar Aplicação

- **Backend API:** `http://localhost:3000`
- **Portal Organização:** `http://localhost:8080`
- **Portal Cliente:** `http://localhost:8081`

### 6. Configurar Nginx (Proxy Reverso)

Criar `/etc/nginx/sites-available/tatuticket`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Portal Organização
server {
    listen 80;
    server_name org.your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Portal Cliente
server {
    listen 80;
    server_name client.your-domain.com;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar e reiniciar Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/tatuticket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificados
sudo certbot --nginx -d api.your-domain.com
sudo certbot --nginx -d org.your-domain.com
sudo certbot --nginx -d client.your-domain.com

# Renovação automática (já configurada)
sudo certbot renew --dry-run
```

---

## 🖥️ Deployment Manual (VPS/Cloud)

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Instalar Redis
sudo apt install -y redis-server

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx
```

### 2. Configurar Bancos de Dados

**PostgreSQL:**

```bash
sudo -u postgres psql

CREATE DATABASE tatuticket;
CREATE USER tatuticket_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE tatuticket TO tatuticket_user;
\q
```

**MongoDB:**

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Redis:**

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 3. Deploy Backend

```bash
# Criar diretório
sudo mkdir -p /var/www/tatuticket
sudo chown -R $USER:$USER /var/www/tatuticket
cd /var/www/tatuticket

# Clonar repositório
git clone https://github.com/your-org/tatuticket.git .

# Configurar backend
cd backend
npm install --production
cp .env.example .env
nano .env

# Executar migrations
npm run migrate

# Iniciar com PM2
pm2 start src/server.js --name tatuticket-backend
pm2 save
pm2 startup
```

### 4. Deploy Portais Frontend

```bash
# Portal Organização
cd /var/www/tatuticket/portalOrganizaçãoTenant
npm install
npm run build

# Portal Cliente
cd /var/www/tatuticket/portalClientEmpresa
npm install
npm run build

# Configurar Nginx para servir builds
sudo nano /etc/nginx/sites-available/tatuticket-frontend
```

Configuração Nginx para frontend:

```nginx
# Portal Organização
server {
    listen 80;
    server_name org.your-domain.com;
    root /var/www/tatuticket/portalOrganizaçãoTenant/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Portal Cliente
server {
    listen 80;
    server_name client.your-domain.com;
    root /var/www/tatuticket/portalClientEmpresa/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/tatuticket-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ⚙️ Configuração de Ambiente

### Variáveis Críticas

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execução | `production` |
| `PORT` | Porta do backend | `3000` |
| `POSTGRES_HOST` | Host PostgreSQL | `localhost` ou `postgres` |
| `POSTGRES_DB` | Nome do banco | `tatuticket` |
| `POSTGRES_USER` | Usuário PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Senha PostgreSQL | `strong_password` |
| `MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/tatuticket_logs` |
| `REDIS_HOST` | Host Redis | `localhost` ou `redis` |
| `JWT_SECRET` | Chave secreta JWT | Mínimo 32 caracteres aleatórios |
| `JWT_EXPIRES_IN` | Expiração token | `24h`, `7d`, etc. |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_USER` | Email SMTP | `your-email@gmail.com` |
| `SMTP_PASS` | Senha SMTP | App password do Gmail |

### Gerar JWT Secret Seguro

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 💾 Backup e Restore

### Backup PostgreSQL

```bash
# Backup completo
pg_dump -U postgres -d tatuticket > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup com compressão
pg_dump -U postgres -d tatuticket | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup automático (cron)
# Adicionar ao crontab: crontab -e
0 2 * * * pg_dump -U postgres -d tatuticket | gzip > /backups/tatuticket_$(date +\%Y\%m\%d).sql.gz
```

### Restore PostgreSQL

```bash
# Restore de backup
psql -U postgres -d tatuticket < backup_20241206.sql

# Restore de backup comprimido
gunzip -c backup_20241206.sql.gz | psql -U postgres -d tatuticket
```

### Backup MongoDB

```bash
# Backup
mongodump --db tatuticket_logs --out /backups/mongo_$(date +%Y%m%d)

# Restore
mongorestore --db tatuticket_logs /backups/mongo_20241206/tatuticket_logs
```

### Backup Docker Volumes

```bash
# Backup volumes
docker run --rm -v tatuticket_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data

# Restore volumes
docker run --rm -v tatuticket_postgres_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/postgres_backup.tar.gz -C /
```

---

## 📊 Monitorização

### PM2 Monitoring

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs tatuticket-backend

# Ver métricas
pm2 monit

# Restart
pm2 restart tatuticket-backend

# Stop
pm2 stop tatuticket-backend
```

### Docker Monitoring

```bash
# Ver logs
docker-compose logs -f backend

# Ver recursos
docker stats

# Ver processos
docker-compose ps
```

### Health Checks

```bash
# Backend health
curl http://localhost:3000/api/health

# PostgreSQL
psql -U postgres -d tatuticket -c "SELECT 1"

# MongoDB
mongosh --eval "db.adminCommand('ping')"

# Redis
redis-cli ping
```

---

## 🔧 Troubleshooting

### Backend não inicia

```bash
# Verificar logs
pm2 logs tatuticket-backend
# ou
docker-compose logs backend

# Verificar conexões DB
psql -U postgres -d tatuticket -c "SELECT 1"
mongosh --eval "db.adminCommand('ping')"
redis-cli ping

# Verificar porta
sudo netstat -tulpn | grep 3000
```

### Erro de conexão PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar configuração pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Adicionar linha:
# host    all             all             0.0.0.0/0               md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Erro de permissões

```bash
# Corrigir permissões de arquivos
sudo chown -R $USER:$USER /var/www/tatuticket

# Corrigir permissões uploads
chmod -R 755 backend/uploads
```

### Migrations falhando

```bash
# Ver status migrations
npx sequelize-cli db:migrate:status

# Reverter última migration
npx sequelize-cli db:migrate:undo

# Executar migration específica
node backend/src/scripts/run-specific-migration.js
```

### Frontend não carrega

```bash
# Verificar build
cd portalOrganizaçãoTenant
npm run build

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Ver logs Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Suporte

Para problemas ou dúvidas:
- **Email:** support@tatuticket.com
- **Documentação:** https://docs.tatuticket.com
- **Issues:** https://github.com/your-org/tatuticket/issues

---

**Última atualização:** Dezembro 2024  
**Versão:** 1.0.0
