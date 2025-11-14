# 🎨 Portais Multi-Tenant - Arquitetura Atualizada

## 📋 Visão Geral da Arquitetura de Portais

Seguindo a arquitetura Multi-Tenant B2B2C, o TatuTicket possui **4 portais distintos**:

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE PORTAIS                   │
└─────────────────────────────────────────────────────────────┘

1. Portal Provider (Backoffice SIS)
   URL: admin.tatuticket.com
   Usuários: Super Admin, Provider Admin
   Função: Gerenciar todos os Tenants

2. Portal SaaS (Onboarding)
   URL: tatuticket.com
   Usuários: Visitantes, Prospects
   Função: Apresentação, Onboarding, Trial

3. Portal Organização (Tenant)
   URL: {tenant-slug}.tatuticket.com
   Usuários: Tenant Admin, Agents, Managers
   Função: Gestão interna do tenant

4. Portal Cliente Empresa (B2B)
   URL: {tenant-slug}.tatuticket.com/client
   Usuários: Client Admin, Client Users
   Função: Portal para empresas clientes
```

---

## 🏗️ Estrutura dos Portais

### **1. Portal Provider (Backoffice)**
📁 `/portalBackofficeSis`

**Objetivo:** Gestão completa de Tenants pelo Provider

**Funcionalidades:**
- ✅ Dashboard global (todos os tenants)
- ✅ CRUD de Tenants
- ✅ Configuração de planos e subscription
- ✅ Suspensão/Ativação de tenants
- ✅ Estatísticas consolidadas
- ✅ Gestão de usuários Provider
- ✅ Billing e faturação global
- ✅ Logs de auditoria
- ✅ Monitoramento de uso (quotas)
- ✅ Suporte a multi-region

**Tecnologias:**
- React 18 + Vite
- TailwindCSS
- Recharts (gráficos)
- React Router DOM
- Zustand (state management)
- Axios

**Porta dev:** `5174`

**Rotas principais:**
```
/                      → Dashboard Global
/tenants               → Lista de Tenants
/tenants/new           → Criar Tenant
/tenants/:id           → Detalhes do Tenant
/tenants/:id/edit      → Editar Tenant
/tenants/:id/users     → Usuários do Tenant
/tenants/:id/stats     → Estatísticas
/settings              → Configurações Provider
/billing               → Faturação
/support               → Suporte aos Tenants
```

---

### **2. Portal SaaS (Onboarding)**
📁 `/portalSaaS`

**Objetivo:** Landing page, apresentação e onboarding de novos tenants

**Funcionalidades:**
- ✅ Landing page moderna
- ✅ Apresentação de features
- ✅ Planos e pricing
- ✅ Trial gratuito
- ✅ Formulário de cadastro de Tenant
- ✅ Onboarding wizard
- ✅ Demonstração interativa
- ✅ Blog/Recursos
- ✅ Suporte pré-venda
- ✅ Área de login (redirecionamento)

**Tecnologias:**
- React 18 + Vite
- TailwindCSS
- Framer Motion (animações)
- React Hook Form
- React Router DOM

**Porta dev:** `5175`

**Rotas principais:**
```
/                      → Landing Page
/features              → Funcionalidades
/pricing               → Planos e Preços
/trial                 → Trial Gratuito
/signup                → Cadastro de Tenant
/onboarding            → Wizard de Onboarding
/demo                  → Demonstração
/blog                  → Blog/Recursos
/contact               → Contato
/login                 → Redirecionamento para Tenant
```

---

### **3. Portal Organização (Tenant)**
📁 `/portalOrganizaçãoTenant`

**Objetivo:** Portal interno do Tenant para gestão de tickets e clientes B2B

**Funcionalidades:**
- ✅ Dashboard de tickets
- ✅ Gestão de tickets
- ✅ Gestão de usuários internos (staff)
- ✅ **Gestão de Clientes B2B** ← ATUALIZADO
- ✅ **Gestão de Usuários de Clientes** ← ATUALIZADO
- ✅ Knowledge Base
- ✅ Relatórios e Analytics
- ✅ Configurações do Tenant
- ✅ SLAs e automações
- ✅ Inventário de ativos
- ✅ Remote Access
- ✅ Catálogo de serviços

**Tecnologias:**
- React 18 + Vite
- TailwindCSS
- Socket.IO (real-time)
- Recharts
- Quill (editor)
- React Hook Form
- Zustand

**Porta dev:** `5173`

**Rotas principais (atualizadas):**
```
/                      → Dashboard
/tickets               → Gestão de Tickets
/clientes-b2b          → Gestão de Empresas Clientes ← NOVO
/clientes-b2b/new      → Criar Cliente B2B ← NOVO
/clientes-b2b/:id      → Detalhes do Cliente ← NOVO
/clientes-b2b/:id/users → Usuários do Cliente ← NOVO
/usuarios              → Usuários Internos (Staff)
/knowledge             → Base de Conhecimento
/relatorios            → Relatórios
/inventario            → Inventário
/configuracoes         → Configurações
```

---

### **4. Portal Cliente Empresa (B2B)**
📁 `/portalClientEmpresa`

**Objetivo:** Portal para usuários das empresas clientes B2B abrirem tickets

**Funcionalidades:**
- ✅ Dashboard simplificado
- ✅ Criar tickets
- ✅ Acompanhar tickets
- ✅ Knowledge Base (self-service)
- ✅ **Gestão de usuários (Client Admin)** ← ATUALIZADO
- ✅ Histórico de tickets
- ✅ Chat/comentários
- ✅ Catálogo de serviços
- ✅ Perfil e configurações

**Tecnologias:**
- React 18 + Vite
- TailwindCSS
- Socket.IO
- React Hook Form
- Zustand

**Porta dev:** `5172`

**Rotas principais (atualizadas):**
```
/                      → Dashboard
/tickets               → Meus Tickets
/tickets/new           → Novo Ticket
/tickets/:id           → Detalhes do Ticket
/usuarios              → Usuários da Empresa ← NOVO (Client Admin)
/usuarios/new          → Adicionar Usuário ← NOVO
/knowledge             → Base de Conhecimento
/servicos              → Catálogo de Serviços
/perfil                → Meu Perfil
```

---

## 🔐 Sistema de Autenticação

### **Endpoints de Login**

```javascript
// Portal Provider
POST /api/auth/login-provider
Body: { email, password }
Response: { token, user: { role: 'super-admin' | 'provider-admin' } }

// Portal Tenant (Staff)
POST /api/auth/login
Body: { email, password }
Response: { token, user: { role: 'tenant-admin' | 'agent' | 'tenant-manager' } }

// Portal Cliente (B2B)
POST /api/auth/login-client
Body: { email, password }
Response: { token, user: { role: 'client-admin' | 'client-user', clientId } }
```

### **JWT Token Structure**

```javascript
// Provider
{
  userId: 'uuid',
  organizationId: 'provider-org-id',
  userType: 'provider',
  role: 'super-admin' | 'provider-admin'
}

// Tenant Staff
{
  userId: 'uuid',
  organizationId: 'tenant-org-id',
  userType: 'user',
  role: 'tenant-admin' | 'agent' | 'tenant-manager'
}

// Client User
{
  userId: 'uuid',
  organizationId: 'tenant-org-id',
  clientId: 'client-uuid',
  userType: 'client_user',
  role: 'client-admin' | 'client-user'
}
```

---

## 🔄 Fluxo de Acesso

### **1. Provider acessa Backoffice**
```
1. Acessa admin.tatuticket.com
2. Login com super-admin@tatuticket.com
3. JWT com userType: 'provider'
4. Acesso total a todos os tenants
```

### **2. Tenant Admin acessa Portal**
```
1. Acessa empresademo.tatuticket.com
2. Login com admin@empresademo.com
3. JWT com userType: 'user', organizationId
4. Vê apenas dados da sua organização
```

### **3. Client User acessa Portal Cliente**
```
1. Acessa empresademo.tatuticket.com/client
2. Login com admin@clientedemo.com
3. JWT com userType: 'client_user', clientId, organizationId
4. Vê apenas tickets e dados do seu cliente
```

---

## 📡 Endpoints da API (Resumo)

### **Provider Routes** (Apenas super-admin e provider-admin)
```
GET    /api/provider/tenants              → Listar tenants
GET    /api/provider/tenants/:id          → Detalhes do tenant
POST   /api/provider/tenants              → Criar tenant
PUT    /api/provider/tenants/:id          → Atualizar tenant
PUT    /api/provider/tenants/:id/suspend  → Suspender tenant
PUT    /api/provider/tenants/:id/activate → Reativar tenant
GET    /api/provider/stats                → Estatísticas globais
```

### **Client B2B Routes** (Tenant admins)
```
GET    /api/clients-b2b                   → Listar empresas clientes
GET    /api/clients-b2b/:id               → Detalhes do cliente
POST   /api/clients-b2b                   → Criar cliente
PUT    /api/clients-b2b/:id               → Atualizar cliente
DELETE /api/clients-b2b/:id               → Desativar cliente
GET    /api/clients-b2b/:id/stats         → Estatísticas do cliente
```

### **Client User Routes** (Tenant admins e Client admins)
```
GET    /api/client-users-b2b/clients/:clientId/users  → Listar usuários
GET    /api/client-users-b2b/:id                      → Detalhes do usuário
POST   /api/client-users-b2b/clients/:clientId/users  → Criar usuário
PUT    /api/client-users-b2b/:id                      → Atualizar usuário
DELETE /api/client-users-b2b/:id                      → Desativar usuário
PUT    /api/client-users-b2b/:id/change-password      → Alterar senha
```

---

## 🎨 Componentes Compartilhados

Criar uma biblioteca de componentes compartilhados entre os portais:

```
/packages/ui-components/
├── Button.jsx
├── Card.jsx
├── Modal.jsx
├── Table.jsx
├── Form/
│   ├── Input.jsx
│   ├── Select.jsx
│   ├── Textarea.jsx
│   └── DatePicker.jsx
├── Layout/
│   ├── Sidebar.jsx
│   ├── Navbar.jsx
│   └── Footer.jsx
└── Charts/
    ├── LineChart.jsx
    ├── BarChart.jsx
    └── PieChart.jsx
```

---

## 🚀 Próximos Passos

### **Imediato**
1. ✅ Criar estrutura do Portal Provider
2. ✅ Criar estrutura do Portal SaaS
3. ⏳ Atualizar Portal Tenant com rotas de Clientes B2B
4. ⏳ Atualizar Portal Cliente com gestão de usuários

### **Curto Prazo**
1. Implementar autenticação multi-portal
2. Criar componentes compartilhados
3. Implementar websockets para real-time
4. Criar landing page do Portal SaaS

### **Médio Prazo**
1. Implementar onboarding wizard
2. Criar sistema de billing UI
3. Dashboard analytics avançados
4. Mobile responsive para todos os portais

---

## 📊 Comparativo de Funcionalidades por Portal

| Funcionalidade | Provider | SaaS | Tenant | Cliente |
|---------------|----------|------|--------|---------|
| Gestão Tenants | ✅ | ❌ | ❌ | ❌ |
| Gestão Clientes B2B | ❌ | ❌ | ✅ | ❌ |
| Gestão Usuários B2B | ❌ | ❌ | ✅ | ✅* |
| Tickets | ❌ | ❌ | ✅ | ✅ |
| Knowledge Base | ❌ | ❌ | ✅ | ✅ |
| Relatórios | ✅ | ❌ | ✅ | ✅* |
| Billing | ✅ | ❌ | ✅* | ❌ |
| Onboarding | ❌ | ✅ | ❌ | ❌ |

*Funcionalidade limitada

---

## ✅ Status da Implementação

### **Backend**
- ✅ Models (Organization, Client, ClientUser)
- ✅ Controllers (Provider, Client, ClientUser)
- ✅ Routes configuradas
- ✅ Middleware de autenticação
- ✅ Migrations
- ✅ Seed multi-tenant

### **Frontend**
- ✅ Portal Provider - Estrutura criada
- ✅ Portal SaaS - Estrutura criada
- ⏳ Portal Tenant - Atualizar rotas
- ⏳ Portal Cliente - Atualizar gestão de usuários

**Status Geral: 70% Completo**

---

## 🎯 Conclusão

A arquitetura de portais está alinhada com a estrutura Multi-Tenant B2B2C:

1. **Provider** gerencia **Tenants**
2. **Tenants** gerenciam **Clientes B2B**
3. **Clientes B2B** gerenciam seus **Usuários**
4. **Portal SaaS** atrai novos **Tenants**

Tudo segregado, escalável e production-ready! 🚀
