# 🎫 TatuTicket - Sistema de Gestão de Tickets

Sistema modular de gestão de tickets, single-tenant evolutivo para SaaS multi-tenant.

## 📋 Visão Geral

TatuTicket é uma plataforma completa de helpdesk com:
- Backend Node.js compartilhado (PostgreSQL + MongoDB + Redis)
- Portal de Organização (React/Vite/Tailwind)
- Portal do Cliente (React/Vite/Tailwind)
- Suporte multi-idioma e temas escuro/claro
- Arquitetura modular e escalável

## 🛠️ Stack Tecnológica

### Backend
- **Node.js + Express.js** - API REST
- **PostgreSQL** - Dados principais (tickets, users, etc)
- **MongoDB** - Logs e auditoria
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Sequelize** - ORM para PostgreSQL
- **Mongoose** - ODM para MongoDB

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **React Router v6** - Roteamento
- **Zustand** - State management
- **Axios** - HTTP client
- **i18next** - Internacionalização

## 📁 Estrutura do Projeto

```
ticket/
├── backend/                          # Backend compartilhado
│   ├── src/
│   │   ├── config/                   # Configurações (DB, Redis, Logger)
│   │   ├── middleware/               # Auth, Validação, Auditoria
│   │   ├── modules/                  # Módulos de negócio
│   │   │   ├── auth/
│   │   │   ├── tickets/
│   │   │   ├── users/
│   │   │   ├── departments/
│   │   │   ├── categories/
│   │   │   ├── slas/
│   │   │   ├── knowledge/
│   │   │   ├── hours/
│   │   │   └── audit/
│   │   ├── routes/
│   │   ├── seeds/
│   │   └── server.js
│   └── package.json
│
├── portalOrganizaçãoTenant/          # Portal gestão (admin/agentes)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── App.jsx
│   └── package.json
│
├── portalClientEmpresa/              # Portal clientes (em breve)
├── portalBackofficeSis/              # Portal backoffice (futuro)
├── portalSaaS/                       # Portal SaaS (futuro)
├── PRD.md                            # Product Requirements Document
└── README.md                         # Este arquivo
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js v18+
- PostgreSQL v14+
- MongoDB v6+
- Redis v7+
- npm ou yarn

### 1. Clonar e Instalar

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Editar .env com suas configurações
```

```bash
# Portal Organização
cd portalOrganizaçãoTenant
npm install
cp .env.example .env
```

### 2. Configurar Bancos de Dados

```bash
# PostgreSQL
createdb tatuticket

# Redis (iniciar servidor)
redis-server

# MongoDB (inicia automaticamente)
```

### 3. Seed de Dados Iniciais

```bash
cd backend
node src/seeds/initialSeed.js
```

Credenciais criadas:
- **Admin:** admin@empresademo.com / Admin@123
- **Agente:** agente@empresademo.com / Agente@123
- **Cliente:** cliente@empresademo.com / Cliente@123

### 4. Executar

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# http://localhost:3000

# Terminal 2 - Portal Organização
cd portalOrganizaçãoTenant
npm run dev
# http://localhost:5173
```

## 📡 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil do usuário

### Tickets
- `GET /api/tickets` - Listar tickets
- `POST /api/tickets` - Criar ticket
- `GET /api/tickets/:id` - Ver ticket
- `PUT /api/tickets/:id` - Atualizar ticket
- `POST /api/tickets/:id/comments` - Adicionar comentário

### Departamentos
- `GET /api/departments` - Listar
- `POST /api/departments` - Criar

Documentação completa: `backend/README.md`

## 🎯 Roadmap de Implementação

### ✅ Fase 1 - MVP Single-Tenant (8-10 semanas) - EM ANDAMENTO
- [x] Backend base com PostgreSQL, MongoDB, Redis
- [x] Modelos: Organizations, Users, Tickets, Departments, etc
- [x] Autenticação JWT com roles
- [x] APIs REST principais
- [x] Portal Organização - Setup base
- [x] Dashboard com estatísticas
- [x] Gestão de tickets completa
- [x] Sistema de comentários
- [x] Tema escuro/claro
- [ ] Portal Cliente - Setup
- [ ] Base de Conhecimento
- [ ] Relatórios básicos
- [ ] Docker Compose

### 🔄 Fase 2 - Expansão (6-8 semanas)
- [ ] Portal Backoffice
- [ ] SLAs avançados
- [ ] Colaboração e menções
- [ ] Relatórios avançados
- [ ] Multi-idioma completo

### 🔮 Fase 3 - Autoatendimento (8-10 semanas)
- [ ] Suporte multicanal (WhatsApp, Chat)
- [ ] Integrações (Email avançado)
- [ ] Busca semântica
- [ ] Análises preditivas

### 🌐 Fase 4 - SaaS Multi-Tenant (10-12 semanas)
- [ ] Portal SaaS
- [ ] Multi-tenant completo
- [ ] Billing (Stripe)
- [ ] IA e automação
- [ ] Integrações externas (CRM, VoIP)

## 🔐 Roles e Permissões

- **admin-org**: Administrador da organização (acesso total)
- **agente**: Agente de suporte (gestão de tickets)
- **cliente-org**: Cliente da organização (criar/ver próprios tickets)

## 🎨 Funcionalidades Principais

### Portal Organização
- ✅ Dashboard com métricas
- ✅ Gestão completa de tickets
- ✅ Sistema de comentários públicos/internos
- ✅ Filtros avançados
- ✅ Tema escuro/claro
- ✅ Responsivo
- 🚧 Gestão de clientes
- 🚧 Departamentos
- 🚧 Base de conhecimento

### Portal Cliente (em breve)
- Abertura de tickets
- Acompanhamento de tickets
- Base de conhecimento
- Histórico de interações

## 📊 Métricas de Sucesso (KPIs)

- Redução 40% tempo resolução
- 60% satisfação cliente (CSAT)
- 50% tickets via self-service
- 99.9% uptime

## 🔒 Segurança

- Helmet para headers HTTP seguros
- Rate limiting (100 req/15min)
- Bcrypt para hash de senhas
- JWT tokens com expiração
- Validação de entrada (Joi)
- Auditoria completa em MongoDB
- CORS configurável

## 🐳 Docker (em desenvolvimento)

```bash
# Build e executar
docker-compose up -d
```

## 🧪 Testes

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd portalOrganizaçãoTenant
npm test
```

## 📚 Documentação

- **PRD Completo**: Ver `PRD.md`
- **Backend API**: Ver `backend/README.md`
- **Portal Organização**: Ver `portalOrganizaçãoTenant/README.md`

## 💡 Próximos Passos

1. ✅ Backend core implementado
2. ✅ Portal Organização - estrutura base
3. 🔄 Finalizar Portal Cliente
4. 📝 Implementar Base de Conhecimento
5. 📊 Relatórios e dashboards avançados
6. 🐳 Docker Compose completo
7. 🚀 Deploy e CI/CD

## 👥 Equipa

Equipa TatuTicket - Outubro 2025

## 📄 Licença

ISC

---

**Nota**: Este é um projeto em desenvolvimento ativo. Funcionalidades marcadas com 🚧 estão em implementação.
