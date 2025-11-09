# Arquitetura Multi-Tenant B2B2C - TatuTicket

## 🎯 Visão Geral

Sistema de 3 níveis hierárquicos com segregação total de dados:

```
PROVIDER (TatuTicket)
    ↓
TENANTS (Organizações que contratam)
    ↓
CLIENTS (Empresas clientes dos Tenants)
    ↓
CLIENT USERS (Usuários das empresas clientes)
```

---

## 📊 Modelo de Dados

### **1. ORGANIZATIONS (Provider + Tenants)**

Tabela unificada que suporta tanto o Provider quanto os Tenants.

```javascript
Organization {
  id: UUID PRIMARY KEY,
  type: ENUM('provider', 'tenant') NOT NULL,
  parentId: UUID NULL, // NULL se type='provider', senão referência ao provider
  
  // Identificação
  name: STRING NOT NULL,
  slug: STRING UNIQUE NOT NULL,
  tradeName: STRING,
  taxId: STRING, // NIF/CNPJ
  
  // Contato
  email: STRING,
  phone: STRING,
  address: TEXT,
  
  // Branding
  logo: STRING,
  primaryColor: STRING DEFAULT '#3B82F6',
  secondaryColor: STRING DEFAULT '#10B981',
  
  // Contrato (apenas para tenants)
  subscription: JSONB {
    plan: STRING, // 'basic', 'professional', 'enterprise'
    status: STRING, // 'active', 'suspended', 'cancelled'
    startDate: DATE,
    endDate: DATE,
    billingEmail: STRING,
    maxUsers: INTEGER,
    maxClients: INTEGER,
    maxStorageGB: INTEGER,
    features: ARRAY // ['sla', 'automation', 'api', 'whitelabel']
  },
  
  // Deployment
  deployment: JSONB {
    type: STRING, // 'saas', 'onpremise', 'hybrid'
    databaseUrl: STRING, // Para on-premise
    region: STRING, // 'eu-west', 'us-east', etc
    customDomain: STRING // Para whitelabel
  },
  
  // Configurações
  settings: JSONB {
    language: STRING DEFAULT 'pt',
    timezone: STRING DEFAULT 'Europe/Lisbon',
    dateFormat: STRING DEFAULT 'DD/MM/YYYY',
    allowSelfRegistration: BOOLEAN,
    requireApproval: BOOLEAN,
    sessionTimeout: INTEGER,
    twoFactorAuth: BOOLEAN
  },
  
  // Status
  isActive: BOOLEAN DEFAULT true,
  suspendedAt: TIMESTAMP,
  suspendedReason: TEXT,
  
  // Timestamps
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}

INDEXES:
- slug (UNIQUE)
- type
- parentId
- isActive
```

---

### **2. USERS (Staff do Provider e dos Tenants)**

Usuários internos que gerenciam o sistema.

```javascript
User {
  id: UUID PRIMARY KEY,
  organizationId: UUID NOT NULL REFERENCES organizations(id),
  
  // Identificação
  name: STRING NOT NULL,
  email: STRING NOT NULL,
  password: STRING NOT NULL,
  
  // Role baseado no tipo de organização
  role: ENUM(
    // Para Provider (type='provider')
    'super-admin',      // Acesso total a tudo
    'provider-admin',   // Gerencia tenants
    'provider-support', // Suporte aos tenants
    
    // Para Tenants (type='tenant')
    'tenant-admin',     // Admin da organização tenant
    'tenant-manager',   // Gerente/Supervisor
    'agent',            // Agente de atendimento
    'viewer'            // Apenas visualização
  ) NOT NULL,
  
  // Estrutura Organizacional (apenas para tenants)
  directionId: UUID REFERENCES directions(id),
  departmentId: UUID REFERENCES departments(id),
  sectionId: UUID REFERENCES sections(id),
  
  // Perfil
  avatar: STRING,
  phone: STRING,
  
  // Permissões especiais
  permissions: JSONB {
    canManageUsers: BOOLEAN,
    canManageClients: BOOLEAN,
    canManageTickets: BOOLEAN,
    canViewReports: BOOLEAN,
    canManageSettings: BOOLEAN,
    canAccessAPI: BOOLEAN,
    customPermissions: ARRAY
  },
  
  // Configurações pessoais
  settings: JSONB {
    notifications: BOOLEAN DEFAULT true,
    emailNotifications: BOOLEAN DEFAULT true,
    theme: STRING DEFAULT 'light',
    language: STRING DEFAULT 'pt'
  },
  
  // Status
  isActive: BOOLEAN DEFAULT true,
  lastLogin: TIMESTAMP,
  
  // Timestamps
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}

INDEXES:
- (email, organizationId) UNIQUE
- organizationId
- role
- departmentId
- isActive

CONSTRAINT:
- UNIQUE (email, organizationId)
```

---

### **3. CLIENTS (Empresas Clientes dos Tenants)**

Empresas B2B que são clientes dos tenants.

```javascript
Client {
  id: UUID PRIMARY KEY,
  organizationId: UUID NOT NULL REFERENCES organizations(id),
  
  // Identificação da Empresa
  name: STRING NOT NULL, // Razão social
  tradeName: STRING, // Nome fantasia
  taxId: STRING, // NIF/CNPJ
  industryType: STRING, // 'technology', 'retail', 'healthcare', etc
  
  // Contato Principal
  email: STRING NOT NULL,
  phone: STRING,
  website: STRING,
  
  // Endereço
  address: JSONB {
    street: STRING,
    number: STRING,
    complement: STRING,
    city: STRING,
    state: STRING,
    postalCode: STRING,
    country: STRING DEFAULT 'PT'
  },
  
  // Contrato/SLA
  contract: JSONB {
    contractNumber: STRING,
    startDate: DATE,
    endDate: DATE,
    slaLevel: STRING, // 'basic', 'standard', 'premium', 'enterprise'
    supportHours: STRING, // '24x7', 'business-hours', 'extended'
    responseTimeSLA: INTEGER, // minutos
    resolutionTimeSLA: INTEGER, // minutos
    maxUsers: INTEGER,
    maxTicketsPerMonth: INTEGER,
    status: STRING // 'active', 'suspended', 'expired'
  },
  
  // Faturação
  billing: JSONB {
    billingEmail: STRING,
    billingContact: STRING,
    billingPhone: STRING,
    paymentMethod: STRING, // 'bank-transfer', 'credit-card', 'invoice'
    billingCycle: STRING, // 'monthly', 'quarterly', 'annually'
    monthlyValue: DECIMAL,
    currency: STRING DEFAULT 'EUR'
  },
  
  // Pessoa de Contato Primária
  primaryContact: JSONB {
    name: STRING,
    email: STRING,
    phone: STRING,
    position: STRING
  },
  
  // Configurações do Cliente
  settings: JSONB {
    allowUserRegistration: BOOLEAN DEFAULT false,
    requireApproval: BOOLEAN DEFAULT true,
    autoAssignTickets: BOOLEAN,
    departmentId: UUID, // Departamento padrão para tickets
    priorityId: UUID, // Prioridade padrão
    notificationPreferences: OBJECT
  },
  
  // Estatísticas (cache)
  stats: JSONB {
    totalUsers: INTEGER DEFAULT 0,
    activeUsers: INTEGER DEFAULT 0,
    totalTickets: INTEGER DEFAULT 0,
    openTickets: INTEGER DEFAULT 0,
    lastTicketDate: TIMESTAMP
  },
  
  // Status
  isActive: BOOLEAN DEFAULT true,
  suspendedAt: TIMESTAMP,
  suspendedReason: TEXT,
  
  // Timestamps
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}

INDEXES:
- organizationId
- taxId
- email
- isActive
- (name, organizationId)
```

---

### **4. CLIENT_USERS (Usuários das Empresas Clientes)**

Usuários finais que usam o sistema para abrir tickets e solicitar serviços.

```javascript
ClientUser {
  id: UUID PRIMARY KEY,
  organizationId: UUID NOT NULL REFERENCES organizations(id),
  clientId: UUID NOT NULL REFERENCES clients(id),
  
  // Identificação
  name: STRING NOT NULL,
  email: STRING NOT NULL,
  password: STRING NOT NULL,
  
  // Role dentro da empresa cliente
  role: ENUM(
    'client-admin',  // Admin da empresa cliente (pode criar users)
    'client-manager', // Gerente (aprova tickets)
    'client-user'    // Usuário padrão (abre tickets)
  ) NOT NULL DEFAULT 'client-user',
  
  // Perfil
  avatar: STRING,
  phone: STRING,
  position: STRING, // Cargo na empresa
  departmentName: STRING, // Departamento na empresa cliente
  
  // Informações de Localização (para on-site)
  location: JSONB {
    building: STRING,
    floor: STRING,
    room: STRING,
    site: STRING // Para multi-site
  },
  
  // Permissões
  permissions: JSONB {
    canCreateTickets: BOOLEAN DEFAULT true,
    canViewAllClientTickets: BOOLEAN DEFAULT false, // Ver tickets de toda empresa
    canApproveRequests: BOOLEAN DEFAULT false,
    canAccessKnowledgeBase: BOOLEAN DEFAULT true,
    canRequestServices: BOOLEAN DEFAULT true
  },
  
  // Configurações pessoais
  settings: JSONB {
    notifications: BOOLEAN DEFAULT true,
    emailNotifications: BOOLEAN DEFAULT true,
    theme: STRING DEFAULT 'light',
    language: STRING DEFAULT 'pt',
    autoWatchTickets: BOOLEAN DEFAULT true
  },
  
  // Status
  isActive: BOOLEAN DEFAULT true,
  emailVerified: BOOLEAN DEFAULT false,
  emailVerifiedAt: TIMESTAMP,
  lastLogin: TIMESTAMP,
  
  // Timestamps
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}

INDEXES:
- (email, organizationId) UNIQUE
- clientId
- organizationId
- role
- isActive

CONSTRAINT:
- UNIQUE (email, organizationId)
```

---

## 🔐 Segregação de Dados e Segurança

### **Row Level Security (RLS)**

Cada consulta deve filtrar por `organizationId` apropriado:

```sql
-- Super Admin (Provider) - Vê TUDO
SELECT * FROM tickets;

-- Tenant Admin - Vê apenas sua org + seus clientes
SELECT t.* FROM tickets t
WHERE t.organization_id = :tenantOrgId;

-- Client User - Vê apenas tickets da sua empresa
SELECT t.* FROM tickets t
JOIN client_users cu ON t.requester_id = cu.id
WHERE cu.client_id = :clientId AND cu.id = :userId;
```

### **Middleware de Autenticação**

```javascript
// Detectar tipo de usuário no token JWT
{
  userId: UUID,
  organizationId: UUID,
  userType: 'provider' | 'tenant' | 'client',
  role: STRING,
  clientId: UUID? // Apenas para client_users
}
```

---

## 🌐 Portais Dedicados

### **1. Portal Provider (Super Admin)**
- URL: `admin.tatuticket.com`
- Acesso: Super admins do provider
- Funções:
  - Gerenciar todos os tenants
  - Ver estatísticas globais
  - Configurar sistema
  - Suporte aos tenants
  - Billing global

### **2. Portal Tenant**
- URL: `{tenant-slug}.tatuticket.com` ou domínio customizado
- Acesso: Staff da organização tenant
- Funções:
  - Gerenciar clientes B2B
  - Gerenciar tickets
  - Configurar sistema para a org
  - Relatórios e dashboards
  - Gerenciar equipe interna

### **3. Portal Client**
- URL: `{tenant-slug}.tatuticket.com/client` ou `client.{custom-domain}.com`
- Acesso: Usuários das empresas clientes
- Funções:
  - Abrir e acompanhar tickets
  - Solicitar serviços do catálogo
  - Acessar base de conhecimento
  - Ver histórico
  - Gerenciar perfil

---

## 📝 Fluxo de Dados

### **Exemplo: Criação de Ticket**

```
1. Client User faz login → JWT contém: { clientId, organizationId }
2. Abre ticket → Ticket criado com:
   - organizationId: do tenant
   - requesterId: client_user.id
   - clientId: client.id (novo campo)
3. Ticket fica visível para:
   - Client User (criador)
   - Outros users da mesma empresa (se permission)
   - Agents/Admins do Tenant
   - Super Admins do Provider
```

---

## 🗂️ Alterações Necessárias em Tabelas Existentes

### **TICKETS**
```javascript
// Adicionar campos:
clientId: UUID REFERENCES clients(id), // Empresa cliente
requesterId: UUID, // Pode ser User OU ClientUser
requesterType: ENUM('user', 'client_user'), // Identificar tipo

// Queries adaptadas:
WHERE organization_id = :tenantId AND client_id IN (SELECT id FROM clients WHERE organization_id = :tenantId)
```

### **DEPARTMENTS, CATEGORIES, SLAs, etc**
```javascript
// Já têm organizationId, mantém como está
// Pertencem à organização tenant
```

---

## 🚀 Vantagens desta Arquitetura

1. ✅ **Segregação Total**: Provider, Tenants e Clients isolados
2. ✅ **Multi-Deployment**: SaaS e On-Premise na mesma base de código
3. ✅ **Whitelabel**: Cada tenant pode ter domínio customizado
4. ✅ **Escalável**: Suporta milhares de tenants e clientes
5. ✅ **B2B Completo**: Contratos, SLAs, billing por cliente
6. ✅ **Hierarquia Clara**: Provider → Tenant → Client → Client Users
7. ✅ **Segurança Robusta**: RLS + JWT + permissões granulares

---

## 🛠️ Implementação

Próximos passos:
1. ✅ Criar modelos Client e ClientUser
2. ✅ Migration para adicionar campos em Organizations
3. ✅ Migration para alterar Users (remover role cliente-org)
4. ✅ Criar ClientAuthController (login separado)
5. ✅ Atualizar middleware de autenticação
6. ✅ Criar controllers para gestão de Clients
7. ✅ Script de migração de dados existentes
8. ✅ Atualizar frontend com 3 portais

---

**Arquitetura pronta para escalar para milhões de usuários! 🚀**
