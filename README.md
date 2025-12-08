# 🎫 TatuTicket - Sistema Enterprise de Gestão de Tickets

[![CI/CD](https://github.com/your-org/tatuticket/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/your-org/tatuticket/actions)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://reactjs.org)

> Plataforma modular enterprise-grade de gestão de tickets/helpdesk com arquitetura single-tenant evolutiva para multi-tenant SaaS.

![TatuTicket Dashboard](docs/images/dashboard-preview.png)

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Início Rápido](#início-rápido)
- [Documentação](#documentação)
- [Roadmap](#roadmap)
- [Contribuir](#contribuir)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

O **TatuTicket** é uma solução completa de gestão de tickets desenvolvida para empresas que necessitam de um sistema robusto, escalável e personalizável para gerenciar suporte técnico, solicitações de serviço e atendimento ao cliente.

### Por que TatuTicket?

- ✅ **Enterprise-Grade**: Arquitetura limpa, modular e escalável
- ✅ **RBAC Completo**: Sistema de permissões granulares com 8 roles e 61+ permissões
- ✅ **Catálogo Avançado**: Hierarquia ilimitada de categorias e 4 tipos de serviço
- ✅ **Multi-Tenancy Ready**: Preparado para evolução SaaS
- ✅ **Real-Time**: Notificações e atualizações em tempo real via Socket.io
- ✅ **Moderno**: React 18, Tailwind CSS, Node.js 18+
- ✅ **Completo**: Tickets, SLAs, Base de Conhecimento, Inventário, Relatórios

---

## ✨ Funcionalidades

### 🎫 Gestão de Tickets
- Criação e acompanhamento de tickets
- Status personalizáveis (novo, em progresso, resolvido, fechado)
- Prioridades configuráveis (baixa, média, alta, crítica)
- Sistema de comentários e notas internas
- Anexos de arquivos (até 20MB)
- Atribuição automática e manual
- Histórico completo de ações
- Visualização em lista e Kanban

### 📚 Catálogo de Serviços (V2 Enterprise)
- **Hierarquia ilimitada** de categorias
- **4 tipos de item**: Incident, Service, Support, Request
- **Roteamento organizacional**: Direction → Department → Section
- Auto-prioridade por tipo
- Skip de aprovação para incidentes
- Workflows específicos por tipo
- Campos customizados dinâmicos
- Portal hierárquico para clientes

### 👥 Gestão de Usuários e RBAC
- **8 roles predefinidas** (admin-org, gerente, supervisor, agente, client-admin, client-manager, client-user, client-viewer)
- **61+ permissões granulares**
- Sistema de fallback inteligente
- Multi-tenancy com isolamento completo
- Gestão de clientes B2B

### 📊 Relatórios e Analytics
- Dashboard com métricas em tempo real
- Estatísticas de tickets por status, prioridade, categoria
- Relatórios de performance de agentes
- Gráficos interativos (Recharts)
- Export para CSV/PDF

### 🔔 Notificações
- Notificações em tempo real (Socket.io)
- Emails automáticos (SMTP)
- Watchers em tickets
- Alertas de SLA

### 📖 Base de Conhecimento
- Artigos com editor rico (Quill)
- Categorização e tags
- Busca avançada
- Visualizações e estatísticas
- Portal público para clientes

### ⏱️ SLAs e Bolsa de Horas
- Gestão de SLAs por cliente/categoria
- Alertas de violação
- Bolsa de horas com consumo e saldo
- Relatórios de utilização

### 🖥️ Inventário de Ativos
- Gestão de hardware e software
- Licenças e contratos
- Associação com clientes
- Histórico de manutenção

### 🌍 Internacionalização
- Suporte multi-idioma (PT/EN)
- Fácil adição de novos idiomas
- Detecção automática de preferência

### 🎨 Temas
- Tema claro e escuro
- Detecção automática de preferência do sistema
- Alternância manual

---

## 🛠️ Stack Tecnológica

### Backend
- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express.js
- **Bancos de Dados**:
  - PostgreSQL 14+ (dados principais)
  - MongoDB 6+ (logs e auditoria)
  - Redis 7+ (cache e sessões)
- **ORM**: Sequelize (PostgreSQL) + Mongoose (MongoDB)
- **Autenticação**: JWT + Passport.js
- **Validação**: Joi
- **Logs**: Winston
- **Upload**: Multer
- **Real-time**: Socket.io
- **Documentação**: Swagger

### Frontend
- **Framework**: React 18 (hooks, componentes funcionais)
- **Build Tool**: Vite
- **Estilização**: Tailwind CSS
- **Roteamento**: React Router v6
- **Estado**: Zustand
- **Formulários**: React Hook Form
- **HTTP**: Axios
- **Ícones**: Lucide React
- **Notificações**: React Hot Toast
- **Gráficos**: Recharts
- **UI Components**: Ant Design (Portal Organização)
- **Editor Rico**: React Quill
- **i18n**: react-i18next

### DevOps
- **Containerização**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Proxy**: Nginx
- **Process Manager**: PM2
- **SSL**: Let's Encrypt (Certbot)

---

## 🏗️ Arquitetura

```
tatuticket/
├── backend/                    # Backend Node.js compartilhado
│   ├── src/
│   │   ├── config/            # Configurações (DB, Redis, Logger)
│   │   ├── middleware/        # Middlewares (Auth, RBAC, Validation)
│   │   ├── modules/           # Módulos de negócio (35+ módulos)
│   │   ├── routes/            # Rotas agregadas
│   │   ├── services/          # Serviços de negócio
│   │   ├── models/            # Models Sequelize/Mongoose
│   │   ├── migrations/        # Migrations do banco
│   │   └── seeds/             # Seeds de dados
│   └── tests/                 # Testes (unit, integration, e2e)
│
├── portalOrganizaçãoTenant/   # Portal para agentes/admins
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/             # Páginas/rotas
│   │   ├── services/          # Serviços API
│   │   ├── store/             # Gestão de estado (Zustand)
│   │   └── utils/             # Utilitários
│   └── public/                # Assets estáticos
│
├── portalClientEmpresa/        # Portal self-service clientes
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   └── public/
│
├── portalBackofficeSis/        # Portal admin sistema (futuro)
├── portalSaaS/                 # Portal multi-tenant (Fase 4)
├── desktop-agent/              # Agente desktop (futuro)
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Orquestração containers
├── DEPLOYMENT.md               # Guia de deployment
└── PRD.md                      # Product Requirements Document

```

### Padrões de Design

- **Backend**: Clean Architecture, Service Layer, Repository Pattern
- **Frontend**: Component-based, Custom Hooks, Context API
- **Segurança**: JWT, RBAC, Rate Limiting, Helmet, CORS
- **Testes**: Unit, Integration, E2E (Mocha, Chai, Supertest)

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+
- Docker (opcional)

### Opção 1: Docker (Recomendado)

```bash
# Clonar repositório
git clone https://github.com/your-org/tatuticket.git
cd tatuticket

# Configurar variáveis de ambiente
cp backend/.env.example backend/.env
nano backend/.env

# Iniciar todos os serviços
docker-compose up -d

# Executar migrations
docker-compose exec backend npm run migrate

# Executar seeds (opcional - dados de exemplo)
docker-compose exec backend npm run seed

# Ver logs
docker-compose logs -f
```

**Acessar:**
- Backend API: http://localhost:3000
- Portal Organização: http://localhost:8080
- Portal Cliente: http://localhost:8081

### Opção 2: Manual

#### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
nano .env
npm run migrate
npm run seed
npm run dev
```

#### 2. Portal Organização

```bash
cd portalOrganizaçãoTenant
npm install
cp .env.example .env
npm run dev
```

#### 3. Portal Cliente

```bash
cd portalClientEmpresa
npm install
cp .env.example .env
npm run dev
```

### Credenciais de Teste

Após executar o seed:

| Role | Email | Senha |
|------|-------|-------|
| Admin | admin@empresademo.com | Admin@123 |
| Agente | agente@empresademo.com | Agente@123 |
| Cliente | cliente@empresademo.com | Cliente@123 |

---

## 📚 Documentação

### Documentação Completa

- **[PRD.md](PRD.md)** - Product Requirements Document completo
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guia de deployment detalhado
- **[backend/README.md](backend/README.md)** - Documentação do backend
- **[backend/RBAC-STATUS.md](backend/RBAC-STATUS.md)** - Status do sistema RBAC
- **[backend/CATALOG-SYSTEM-GUIDE.md](backend/CATALOG-SYSTEM-GUIDE.md)** - Guia do catálogo de serviços
- **[portalOrganizaçãoTenant/README.md](portalOrganizaçãoTenant/README.md)** - Docs portal organização
- **[portalClientEmpresa/README.md](portalClientEmpresa/README.md)** - Docs portal cliente

### API Documentation

Após iniciar o backend, acesse:
- **Swagger UI**: http://localhost:3000/api-docs
- **Swagger JSON**: http://localhost:3000/api-docs.json

### Guias Rápidos

- [Como criar um novo módulo](docs/guides/creating-modules.md)
- [Como adicionar permissões RBAC](docs/guides/rbac-permissions.md)
- [Como configurar email](docs/guides/email-setup.md)
- [Como fazer backup](docs/guides/backup-restore.md)

---

## 🗺️ Roadmap

### ✅ Fase 1 - MVP Single-Tenant (Concluída)
- [x] Backend modular completo
- [x] Sistema RBAC 100% funcional
- [x] Portal Organização (90%)
- [x] Portal Cliente (80%)
- [x] Catálogo de serviços V2
- [x] Autenticação JWT
- [x] Sistema de tickets completo
- [x] Base de conhecimento
- [x] SLAs básicos
- [x] Inventário de ativos

### 🚧 Fase 2 - Consolidação (Em Progresso)
- [x] Portal Backoffice (estrutura)
- [ ] Relatórios avançados
- [ ] Gamificação completa
- [ ] Testes automatizados (70% → 90%)
- [ ] CI/CD (GitHub Actions)
- [ ] Documentação completa

### ⏳ Fase 3 - Autoatendimento e Integrações (Planejada)
- [ ] Chat ao vivo
- [ ] WhatsApp Business API
- [ ] Integração email avançada
- [ ] Automação com IA básica
- [ ] Análises preditivas
- [ ] Multi-idioma completo

### 🔮 Fase 4 - SaaS Multi-Tenant (Futura)
- [ ] Portal SaaS
- [ ] Billing (Stripe)
- [ ] Onboarding multi-tenant
- [ ] Desktop Agent
- [ ] Integrações CRM/ERP
- [ ] VoIP (Twilio)

---

## 🤝 Contribuir

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](CONTRIBUTING.md) antes de enviar PRs.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Testes**: Mínimo 80% cobertura

---

## 🧪 Testes

```bash
# Backend - Todos os testes
cd backend
npm test

# Backend - Testes unitários
npm run test:unit

# Backend - Testes de integração
npm run test:integration

# Backend - Testes E2E
npm run test:e2e

# Backend - Cobertura
npm run test:coverage

# Frontend - Linter
cd portalOrganizaçãoTenant
npm run lint
```

---

## 📊 Status do Projeto

| Componente | Status | Cobertura | Versão |
|------------|--------|-----------|--------|
| Backend | ✅ Estável | ~70% | 1.0.0 |
| Portal Organização | 🚧 90% | - | 1.0.0 |
| Portal Cliente | 🚧 80% | - | 1.0.0 |
| Portal Backoffice | 🔨 Estrutura | - | 0.1.0 |
| Portal SaaS | ⏳ Planejado | - | - |
| Desktop Agent | ⏳ Planejado | - | - |

---

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Equipa

- **Pedro Divino** - Desenvolvedor Principal - [@pedrodivino](https://github.com/pedrodivino)

---

## 🙏 Agradecimentos

- [Express.js](https://expressjs.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Sequelize](https://sequelize.org/)
- [Socket.io](https://socket.io/)
- Todos os contribuidores e utilizadores do TatuTicket

---

## 📞 Suporte

- **Email**: support@tatuticket.com
- **Documentação**: https://docs.tatuticket.com
- **Issues**: https://github.com/your-org/tatuticket/issues
- **Discussions**: https://github.com/your-org/tatuticket/discussions

---

<div align="center">

**[Website](https://tatuticket.com)** • **[Documentação](https://docs.tatuticket.com)** • **[Demo](https://demo.tatuticket.com)**

Feito com ❤️ pela Equipa TatuTicket

</div>
