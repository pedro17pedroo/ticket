# PRD Único e Modular – TatuTicket (Versão Single-Tenant First, Evolutivo para SaaS)

**Documento:** Product Requirements Document (PRD)  
**Versão:** 2.1  
**Data:** Outubro 2025  
**Autor:** Equipa TatuTicket  

## 📋 Resumo Executivo

Este PRD redefine o desenvolvimento do TatuTicket como uma plataforma modular de gestão de tickets, com backend compartilhado e evolutivo, priorizando uma instalação single-tenant urgente para uma empresa específica. O foco inicial é no **Portal da Organização** (gestão interna de tickets, agentes e estrutura) e no **Portal do Cliente da Organização** (abertura e acompanhamento de tickets, pedidos de suporte, implementações e report de problemas). Todos os portais (Organização, Cliente, Backoffice do Sistema e SaaS) consumirão o mesmo backend, que será construído de forma evolutiva: iniciando com a estrutura base para Organizações (tenants isolados), e expandindo para multi-tenant/SaaS na fase final.

### Objetivo
- Entregar um MVP single-tenant funcional em 8-10 semanas para instalação imediata em uma empresa, permitindo abertura e gestão de tickets.
- Evoluir o backend modularmente à medida que portais são implementados, garantindo reutilização de código e escalabilidade.
- Incorporar funcionalidades principais (P0/P1) primeiro, adicionais (P2) em seguida, e avançadas (P3) por último, baseando-se na análise de requisitos ideais e lacunas identificadas.

### Público-Alvo
- **Organização (Tenant Inicial):** Agentes e administradores que gerenciam tickets, departamentos e clientes.
- **Clientes da Organização:** Usuários finais que abrem tickets para suporte, implementações e problemas.
- **Admins do Sistema (Backoffice):** Gestão interna do sistema (futuro).
- **Admins Globais (SaaS):** Gestão multi-tenant, billing e auditoria (última fase).

### Escopo Geral
- **Backend Compartilhado:** Node.js/Express (ou similar), com estrutura base para Organizações (usuários, tickets, autenticação). Evolutivo: APIs REST/GraphQL iniciais para portais prioritários, expandindo para integrações e IA.
- **Portais:** 
  - **PortalOrganizaçãoTenant** (prioridade 1): Interface para agentes/admin da organização.
  - **PortalClientEmpresa** (prioridade 1): Portal self-service para clientes.
  - **PortalBackofficeSis** (prioridade 2): Gestão do sistema.
  - **PortalSaaS** (prioridade 4, última): Onboarding multi-tenant e billing.
- **Arquitetura:** Monorepo com backend central e subpastas para portais (ex.: `backend/`, `portalOrganizaçãoTenant/`, etc.). Uso de Docker para instalação single-tenant inicial.
- **Priorização de Funcionalidades:** 
  - **Principais (P0/P1):** Essenciais para MVP single-tenant (tickets básicos, autenticação, SLAs simples).
  - **Adicionais (P2):** Melhoria de experiência (multi-idioma, relatórios avançados).
  - **Avançadas (P3):** Diferenciação (IA, integrações externas).

### Estrutura de Diretórios Inicial
```
backend/ (núcleo compartilhado: APIs, DB, auth)
├── node_modules/
├── src/ (módulos evolutivos: organizations, tickets, users)
└── ...
portalOrganizaçãoTenant/ (agentes: gestão tickets)
├── node_modules/
└── ...
portalClientEmpresa/ (clientes: abertura tickets)
├── node_modules/
└── ...
portalBackofficeSis/ (admin sistema: futuro)
├── node_modules/
└── ...
portalSaaS/ (multi-tenant: última)
├── node_modules/
└── ...
```

---

## 🛠️ Stack Tecnológica

Para garantir uma implementação moderna, escalável e de alta qualidade, o TatuTicket adotará a seguinte stack tecnológica, alinhada aos princípios de simplicidade, modularidade e usabilidade:

### Frontend (Portais: Organização, Cliente, Backoffice e SaaS)
- **Framework Principal:** ReactJS (versão mais recente, com hooks e componentes funcionais para uma arquitetura modular e reutilizável).
- **Estilização e UI:** Tailwind CSS (para designs rápidos, responsivos e personalizáveis, com suporte nativo a temas escuro e claro via classes utilitárias como `dark:`).
- **Build Tool:** Vite (para desenvolvimento rápido, hot-reload eficiente e bundles otimizados em produção).
- **Características Gerais:**
  - **Design Moderno e Bonito:** Interfaces profissionais, com foco em minimalismo e usabilidade intuitiva. Uso de componentes UI prontos (ex.: Headless UI ou Radix UI) para elementos como botões, tabelas e formulários.
  - **Temas Escuro e Claro:** Implementação via Tailwind e contexto React (ex.: `useTheme` hook), com detecção automática de preferência do usuário (via `prefers-color-scheme`).
  - **Simples e Fácil de Usar:** Navegação fluida com menus laterais/colapsáveis, submenus hierárquicos (ex.: via React Router com nested routes), e fluxos guiados para tarefas complexas.
  - **Evitar Modais para Formulários Complexos:** Priorizar páginas dedicadas e profissionais para atividades como criação de tickets ou relatórios, com wizards multi-etapa inline (ex.: formulários em páginas full-width, sem interrupções modais).
  - **Responsivo:** Totalmente mobile-first, com breakpoints Tailwind para desktop, tablet e mobile (testes com Lighthouse para >90% performance).
  - **Modular e Organizado:** Estrutura de componentes por feature (ex.: `/components/Tickets/Table`, `/pages/Organization/Dashboard`), com storybook para documentação e testes visuais. Rotas modulares via React Router v6.

### Backend (Compartilhado para Todos os Portais)
- **Runtime e Framework:** Node.js (versão LTS mais recente) com Express.js (para roteamento leve e middleware flexível).
- **Banco de Dados Principal:** PostgreSQL (para todas as entidades de negócio core: usuários, tickets, organizações, SLAs, bolsas de horas, etc. – garantindo ACID, índices otimizados e queries relacionais eficientes).
- **Banco de Dados Secundário:** MongoDB (para entidades não-relacionais como logs de auditoria, histórico de notificações, anexos não-estruturados e métricas de performance – facilitando escalabilidade horizontal e buscas full-text).
- **Arquitetura Geral:**
  - **Limpa e Organizada:** Adoção de Clean Architecture (camadas: entities, use cases, controllers, repositories), com separação clara de responsabilidades (ex.: domain logic isolado de infra).
  - **Modular e Independente:** Estrutura por módulos independentes para fácil escalabilidade (ex.: microsserviços leves via Docker Compose inicial, evoluindo para Kubernetes). Cada módulo segue o padrão `module-category` (ex.: para "categorias" de tickets: `categoriaController.js`, `categoriaRouter.js`, `categoriaModel.js` – com validações via Joi/Zod e testes unitários via Jest).
  - **Outros Elementos:** 
    - APIs: RESTful inicial (com suporte GraphQL via Apollo em fases avançadas); Autenticação JWT + Passport.js.
    - Cache/Logs: Redis para sessões e cache; Winston + MongoDB para logs estruturados.
    - Segurança: Helmet, rate-limiting, bcrypt para hashes.
    - Testes: 90% cobertura com Mocha/Chai para backend.

Essa stack garante performance (<500ms), manutenibilidade e escalabilidade, com deploy via Docker (single-tenant) e CI/CD via GitHub Actions.

---

## 🔹 Fases de Desenvolvimento

O roadmap é faseado para evolução incremental: Fase 1 foca no single-tenant urgente, com backend base para Organizações. Cada fase adiciona portais e funcionalidades, priorizando P0/P1. Estimativas consideram equipe de 4-6 devs (2 backend, 2 frontend, 1 DevOps, 1 QA parcial). A stack acima será implementada desde a Fase 1.

### Fase 1 – Núcleo Single-Tenant (MVP Urgente para Instalação em Empresa) [8-10 Semanas]
**Objetivo:** Backend base para Organizações + Portais Organização e Cliente. Permitir instalação imediata, cadastro de clientes, abertura/gestão de tickets (suporte, implementações, problemas).

**Backend Evolutivo (Base para Organizações):**
- Estrutura completa: Modelos DB (PostgreSQL para negócio, MongoDB para logs iniciais) para Organizations (isolada inicialmente), Users (agentes/clientes), Tickets, Departments. Organização modular: `src/modules/tickets/ticketController.js`, etc.
- APIs principais: CRUD Tickets, Auth (JWT), Upload anexos (até 20MB).
- Autenticação: Login/logout, roles básicas (admin-org, agente, cliente-org).
- Configuração single-tenant: Variáveis env para instalação local/on-prem.

**Funcionalidades Principais (P0/P1):**
- **Gestão de Tickets Básica (Omnicanal Inicial):** Criação manual/via e-mail; Status (novo, progresso, resolvido, fechado); Prioridades/categorias configuráveis; Interface tabela/Kanban. (PortalOrganizaçãoTenant + PortalClientEmpresa – com páginas dedicadas para criação de tickets).
- **Onboarding e Gestão de Usuários/Clientes:** Cadastro clientes (PortalClientEmpresa); Permissões (clientes abrem/acompanham tickets). (Ambos portais – formulários em páginas full, responsivos).
- **Gestão de Estrutura Organizacional:** Departamentos/equipes; Roteamento manual tickets. (PortalOrganizaçãoTenant – menu com submenus para departamentos).
- **Base de Conhecimento Inicial:** CRUD artigos; Busca simples. (Ambos portais – busca integrada com tema escuro/claro).
- **Relatórios Básicos:** Volume tickets por status/cliente; Export CSV/PDF. (PortalOrganizaçãoTenant – dashboards modulares).
- **Gestão de SLAs Simples:** Tempos resposta/resolução; Alertas básicos. (PortalOrganizaçãoTenant).
- **Bolsa de Horas Básica:** Registro/consumo horas; Relatórios saldo. (PortalOrganizaçãoTenant + integração billing simples).

**Critérios de Aceitação:**
- [ ] Instalação Docker em 1h; Funcional single-tenant.
- [ ] Clientes abrem tickets via PortalClientEmpresa; Agentes gerenciam via PortalOrganizaçãoTenant.
- [ ] Testes: 95% cobertura APIs; Performance <500ms; UI responsiva e com temas.

**Entregas:** Backend base + 2 portais React/Tailwind/Vite; Deploy local.

✅ **Com Fase 1:** Sistema instalado na empresa, tickets fluindo (suporte/implementações/problemas).

### Fase 2 – Expansão Interna e Colaboração (Consolidação Single-Tenant) [6-8 Semanas]
**Objetivo:** Adicionar PortalBackofficeSis; Reforçar backend com módulos evolutivos (ex.: SLA avançado). Priorizar adicionais (P1/P2).

**Backend Evolutivo:**
- Expansão: Módulos para SLAs, Horas, Relatórios; Cache básico (Redis); Logs auditáveis iniciais (MongoDB). Manter modularidade: `src/modules/slas/slaController.js`, etc.
- APIs: Dashboards, Customizações (campos tickets, logo/cores por org).

**Funcionalidades Adicionais (P1/P2):**
- **Gestão de SLAs Avançada:** SLAs por cliente/categoria; Escalação automática; Dashboards. (PortalOrganizaçãoTenant + Backoffice – páginas profissionais para config).
- **Colaboração Básica:** Detecção colisão; Menções @; Notas privadas; Transferências departamentos. (PortalOrganizaçãoTenant – integrações inline sem modais).
- **Portal Self-Service Completo:** Dashboard cliente; Histórico interações; Busca integrada. (PortalClientEmpresa – navegação simples com submenus).
- **Avaliação Satisfação:** Pesquisas pós-fechamento (CSAT); Relatórios. (PortalClientEmpresa).
- **Relatórios Avançados:** Métricas performance (FCR, produtividade); Customizáveis. (PortalBackofficeSis + Organização).
- **Multi-Idioma Inicial:** Português/Inglês; i18n básica (via react-i18next). (Todos portais).
- **Consolidação Conversas:** Timeline unificada; Merge tickets. (PortalOrganizaçãoTenant).

**Critérios de Aceitação:**
- [ ] PortalBackofficeSis operacional para relatórios internos.
- [ ] Integração backend: 100% reutilização APIs.
- [ ] Métricas: Redução 30% tempo resolução via self-service; UI organizada e modular.

**Entregas:** PortalBackofficeSis; Módulos backend expandidos.

✅ **Com Fase 2:** Single-tenant robusto, com colaboração e métricas; Pronto para expansão multi-tenant.

### Fase 3 – Autoatendimento e Integrações Básicas [8-10 Semanas]
**Objetivo:** Melhorar engajamento; Backend com integrações iniciais. Priorizar adicionais/avançadas (P2).

**Backend Evolutivo:**
- Módulos: Integrações (e-mail avançado, chat básico); Busca semântica inicial (PostgreSQL full-text + MongoDB).
- APIs: Feedback, Métricas preditivas básicas. Arquitetura limpa: repositories abstratos para DBs.

**Funcionalidades Adicionais/Avançadas (P2):**
- **Suporte Multicanal Básico:** Chat ao vivo integrado; WhatsApp Business API. (PortalClientEmpresa + Organização – widgets responsivos).
- **Autoatendimento Avançado:** FAQ sugestões; Tradução automática tickets. (PortalClientEmpresa).
- **Análises Avançadas:** Previsões volume tickets; Anomalias. (PortalBackofficeSis – dashboards bonitos com Tailwind).
- **Busca/Filtros Avançados:** Semântica; Filtros salvos. (Todos portais).
- **Customização Tenant:** Campos custom; Temas. (PortalOrganizaçãoTenant – temas dinâmicos via contexto).
- **Compliance Inicial:** Auditoria ações; GDPR/LGPD basics (esquecimento dados). (Backend + Backoffice – logs em MongoDB).

**Critérios de Aceitação:**
- [ ] Integrações testadas: 80% tickets multicanal.
- [ ] Suporte RTL opcional (P3, se tempo – via Tailwind RTL).

**Entregas:** Integrações backend; Atualizações portais.

### Fase 4 – SaaS e Integrações Avançadas (Multi-Tenant Final) [10-12 Semanas]
**Objetivo:** PortalSaaS; Backend full multi-tenant. Priorizar avançadas (P3), mas só após single-tenant validado.

**Backend Evolutivo:**
- Full multi-tenant: Isolamento dados por tenant (PostgreSQL schemas); Billing module (Stripe). Modular: `src/modules/saas/billingController.js`, etc.
- Módulos: IA básica (classificação tickets); Microserviços iniciais; SSO.

**Funcionalidades Avançadas (P3) + SaaS:**
- **Onboarding SaaS:** Cadastro empresas; Escolha planos; Pagamentos recorrentes. (PortalSaaS – onboarding em páginas guiadas).
- **Gestão Global:** Limites planos; Faturas; Impersonate. (PortalSaaS + Backoffice).
- **Integrações Externas:** Redes sociais; VoIP (Twilio); CRM (HubSpot). (Todos).
- **Automação IA:** Sugestões respostas; Análise sentimento; Chatbot. (Organização + Cliente).
- **Escalabilidade:** Cache distribuído; Auditoria completa. (Backend – MongoDB para logs imutáveis).
- **On-Premise Opcional:** Docker packages; Sync cloud-onprem.

**Critérios de Aceitação:**
- [ ] Multi-tenant: 99% isolamento; Billing funcional.
- [ ] KPIs: Aumento 50% adoção multicanal.

**Entregas:** PortalSaaS; Backend multi-tenant; On-premise setup.

---

## 3. Requisitos Não Funcionais

- **Performance:** <500ms (95% reqs); Cache para queries frequentes (Redis).
- **Segurança:** JWT/MFA; AES-256; Logs imutáveis (MongoDB).
- **Escalabilidade:** Backend modular (microsserviços fase 4); Kubernetes futuro.
- **Conformidade:** LGPD/GDPR (fase 3+); Acessibilidade WCAG 2.1 (testes com Tailwind).
- **Deploy:** Docker/K8s; CI/CD GitHub Actions.

---

## 📅 ROADMAP DE IMPLEMENTAÇÃO

| Fase | Duração | Foco Principal | Portais Adicionados | Funcionalidades Priorizadas |
|------|---------|----------------|---------------------|-----------------------------|
| 1    | 8-10 sem | Single-Tenant MVP | Organização + Cliente | P0/P1 (Tickets, Auth, SLAs básicos) |
| 2    | 6-8 sem | Colaboração + Backoffice | Backoffice | P1/P2 (SLAs avanç, Relatórios) |
| 3    | 8-10 sem | Autoatendimento | - | P2 (Multicanal, Busca) |
| 4    | 10-12 sem | SaaS Multi-Tenant | SaaS | P3 (IA, Integrações) |

**Total Estimado:** 32-40 semanas (2025-2026).

---

## 💰 ESTIMATIVA DE RECURSOS

- **Equipe:** 1 PM; 2 Backend Devs (Node/Express/Postgres/Mongo); 2 Frontend Devs (React/Tailwind/Vite); 1 DevOps; 0.5 UX/QA.
- **Investimento:** ~40 semanas dev; Infra cloud inicial baixa (single-tenant local).
- **Custos Adicionais:** APIs (Stripe, Twilio) fase 4; Licenças DB (se cloud).

---

## 🎯 MÉTRICAS DE SUCESSO

- **KPIs:** Redução 40% tempo resolução; 60% satisfação (CSAT); 50% tickets self-service; 99.9% uptime.
- **Adoção:** 80% tickets via portais prioritários; Volume multicanal +200% (fase 3+).

---

## ⚠️ RISCOS E MITIGAÇÕES

- **Técnicos:** Dependência backend evolutivo → Prototipagem APIs fase 1; Testes unitários 90% (Jest/Mocha).
- **Negócios:** Urgência single-tenant → MVP validado com empresa piloto.
- **Escopo:** Sobrecarga P3 → Corte via priorização trimestral; Manter modularidade para iterações rápidas.

---

## 📝 CONCLUSÃO

Este PRD garante uma evolução pragmática: MVP single-tenant urgente via backend base para Organizações, com portais compartilhados e stack tecnológica moderna (React/Tailwind/Vite frontend; Node/Express/Postgres/Mongo backend). A modularidade permite adicionar valor incrementalmente, culminando no SaaS completo. Próximos passos: Aprovação, setup monorepo, sprint fase 1.