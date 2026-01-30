# T-Desk - Sistema de Gestão de Tickets e Service Desk

Sistema completo de gestão de tickets, service desk e ITSM com arquitetura multi-tenant SaaS.

## 🚀 Estrutura do Projeto

```
ticket/
├── backend/              # API Node.js + Express
├── portalSaaS/          # Portal SaaS (onboarding)
├── portalBackofficeSis/ # Portal Backoffice (super admin)
├── portalOrganizaçãoTenant/ # Portal da Organização (técnicos)
├── portalClientEmpresa/ # Portal do Cliente
├── desktop-agent/       # Agente Desktop (inventário)
└── archive/            # Documentação e scripts antigos
```

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- MongoDB 5+
- Redis 6+

## 🔧 Instalação

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar variáveis de ambiente no .env
npm run dev
```

### 2. Portais Frontend

```bash
# Portal SaaS
cd portalSaaS
npm install
cp .env.example .env
npm run dev

# Portal Backoffice
cd portalBackofficeSis
npm install
cp .env.example .env
npm run dev

# Portal Organização
cd portalOrganizaçãoTenant
npm install
cp .env.example .env
npm run dev

# Portal Cliente
cd portalClientEmpresa
npm install
cp .env.example .env
npm run dev
```

### 3. Desktop Agent

```bash
cd desktop-agent
npm install
cp .env.example .env
npm run dev
```

## 🌐 URLs de Desenvolvimento

- **Backend API**: http://localhost:4003/api
- **Portal SaaS**: http://localhost:5173
- **Portal Backoffice**: http://localhost:5175
- **Portal Organização**: http://localhost:5174
- **Portal Cliente**: http://localhost:5176

## 🔑 Variáveis de Ambiente

### Backend (.env)

```env
NODE_ENV=development
PORT=4003
LOG_LEVEL=debug
DEBUG=true

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tatuticket
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

MONGODB_URI=mongodb://localhost:27017/tdesk_logs

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

### Portais (.env)

```env
VITE_API_URL=http://localhost:4003/api
```

## 📦 Build para Produção

```bash
# Backend
cd backend
npm run build

# Portais
cd portalSaaS && npm run build
cd portalBackofficeSis && npm run build
cd portalOrganizaçãoTenant && npm run build
cd portalClientEmpresa && npm run build

# Desktop Agent
cd desktop-agent && npm run build
```

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Portais
cd portalOrganizaçãoTenant
npm test
```

## 📚 Documentação

- **Arquitetura**: Ver `archive/doc/` para documentação detalhada
- **API**: Swagger disponível em http://localhost:4003/api-docs
- **Changelog**: Ver `CHANGELOG.md`

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- PostgreSQL (dados principais)
- MongoDB (logs e auditoria)
- Redis (cache e sessões)
- Socket.io (real-time)
- Winston (logging)

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios

### Desktop Agent
- Electron
- React

## 🔐 Segurança

- Autenticação JWT
- RBAC (Role-Based Access Control)
- Multi-tenant com isolamento de dados
- Rate limiting
- CORS configurável
- Logs estruturados

## 📊 Performance

- Logs otimizados para produção (zero overhead em debug)
- Cache Redis
- Queries otimizadas
- Lazy loading
- Code splitting

## 🤝 Contribuindo

Ver `CONTRIBUTING.md` para guidelines de contribuição.

## 📝 Licença

Proprietary - Todos os direitos reservados

## 👥 Equipe

Desenvolvido por Tatu Solutions

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: suporte@tatusolutions.com
- Website: https://tatusolutions.com

---

**Versão**: 1.0.0
**Última atualização**: Janeiro 2026
