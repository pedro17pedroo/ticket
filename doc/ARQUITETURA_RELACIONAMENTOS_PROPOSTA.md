# 🏗️ ARQUITETURA DE RELACIONAMENTOS MULTI-USER

## 🎯 PROBLEMA ATUAL

Temos 3 tipos de utilizadores em tabelas separadas:
- `users` (Provider SaaS)
- `organization_users` (Tenant Staff - técnicos, agents)
- `client_users` (Empresas Clientes)

Mas as tabelas relacionadas (tickets, comments, etc) ainda apontam apenas para `users.id`

---

## 📊 CASOS DE USO PRINCIPAIS

### **1. TICKETS**

```
┌─────────────────────────────────────────────────┐
│ CENÁRIO 1: Cliente → Técnico (MAIS COMUM)      │
├─────────────────────────────────────────────────┤
│ Requester: client_users.id (João da ACME)      │
│ Assignee: organization_users.id (Técnico TI)   │
│ Fluxo: Cliente abre ticket → Técnico resolve   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ CENÁRIO 2: Técnico → Técnico (INTERNO)         │
├─────────────────────────────────────────────────┤
│ Requester: organization_users.id (Admin Org)   │
│ Assignee: organization_users.id (Técnico TI)   │
│ Fluxo: Ticket interno da organização           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ CENÁRIO 3: Provider → Técnico (SUPORTE)        │
├─────────────────────────────────────────────────┤
│ Requester: users.id (Provider Admin)           │
│ Assignee: organization_users.id (Técnico)      │
│ Fluxo: Provider abre ticket para tenant        │
└─────────────────────────────────────────────────┘
```

### **2. COMMENTS (Comentários em Tickets)**

```
┌─────────────────────────────────────────────────┐
│ QUEM PODE COMENTAR?                             │
├─────────────────────────────────────────────────┤
│ ✅ client_users (donos do ticket)              │
│ ✅ organization_users (atendentes)             │
│ ✅ users (provider suporte)                    │
└─────────────────────────────────────────────────┘
```

### **3. KNOWLEDGE ARTICLES (Base de Conhecimento)**

```
┌─────────────────────────────────────────────────┐
│ QUEM PODE CRIAR?                                │
├─────────────────────────────────────────────────┤
│ ✅ organization_users (técnicos escrevem)      │
│ ✅ users (provider cria templates)             │
│ ❌ client_users (apenas leem)                  │
└─────────────────────────────────────────────────┘
```

### **4. ASSETS (Ativos/Equipamentos)**

```
┌─────────────────────────────────────────────────┐
│ RELACIONAMENTOS                                 │
├─────────────────────────────────────────────────┤
│ owner: client_users.id (empresa dona)          │
│ assigned_to: client_users.id (usuário usando)  │
│ managed_by: organization_users.id (gestor TI)  │
└─────────────────────────────────────────────────┘
```

---

## 🔧 SOLUÇÕES POSSÍVEIS

### **OPÇÃO 1: FKs Polimórficas (Polymorphic Associations)**

**Vantagens:**
- ✅ Flexível
- ✅ Fácil de adicionar novos tipos
- ✅ Queries simples no código

**Desvantagens:**
- ❌ Sem integridade referencial no DB
- ❌ Dados órfãos possíveis
- ❌ Mais complexo para joins

**Exemplo:**
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  
  -- Polimórfico
  requester_type VARCHAR(50), -- 'User', 'OrganizationUser', 'ClientUser'
  requester_id UUID,          -- ID em qualquer tabela
  
  assignee_type VARCHAR(50),
  assignee_id UUID,
  
  ...
);
```

---

### **OPÇÃO 2: Múltiplas FKs com CHECK Constraint** ⭐ **RECOMENDADO**

**Vantagens:**
- ✅ Integridade referencial garantida
- ✅ Cascades funcionam (ON DELETE CASCADE)
- ✅ DB valida dados
- ✅ Índices automáticos

**Desvantagens:**
- ❌ Mais colunas
- ❌ Queries um pouco mais complexas

**Exemplo:**
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  
  -- Requester (quem abriu)
  requester_type VARCHAR(20) NOT NULL, -- 'provider', 'organization', 'client'
  requester_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  requester_org_user_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  requester_client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  
  -- Assignee (quem resolve - sempre org_user)
  assignee_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  
  -- Garantir que apenas um requester_*_id está preenchido
  CONSTRAINT check_requester_single CHECK (
    (requester_type = 'provider' AND requester_user_id IS NOT NULL 
     AND requester_org_user_id IS NULL AND requester_client_user_id IS NULL)
    OR
    (requester_type = 'organization' AND requester_org_user_id IS NOT NULL 
     AND requester_user_id IS NULL AND requester_client_user_id IS NULL)
    OR
    (requester_type = 'client' AND requester_client_user_id IS NOT NULL 
     AND requester_user_id IS NULL AND requester_org_user_id IS NULL)
  ),
  
  ...
);
```

---

### **OPÇÃO 3: Tabela de Referência Universal**

**Vantagens:**
- ✅ Uma única FK
- ✅ Flexível

**Desvantagens:**
- ❌ Complexidade extra
- ❌ Joins mais pesados
- ❌ Overhead de tabela adicional

**Exemplo:**
```sql
CREATE TABLE universal_users (
  id UUID PRIMARY KEY,
  user_type VARCHAR(20),
  user_id UUID,
  provider_user_id UUID REFERENCES users(id),
  org_user_id UUID REFERENCES organization_users(id),
  client_user_id UUID REFERENCES client_users(id)
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  requester_id UUID REFERENCES universal_users(id),
  assignee_id UUID REFERENCES universal_users(id),
  ...
);
```

---

## ⭐ **ARQUITETURA RECOMENDADA: OPÇÃO 2**

### **Por quê?**

1. **Integridade Referencial:** PostgreSQL garante dados válidos
2. **Cascades:** ON DELETE CASCADE funciona automaticamente
3. **Performance:** Índices de FK otimizam queries
4. **Simplicidade:** Não precisa de tabelas extras
5. **Específico por Caso:** Assignee sempre é org_user (FK simples)

---

## 📋 **ESTRUTURA PROPOSTA POR TABELA**

### **1. TICKETS**

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organização tenant responsável
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Cliente (empresa)
  client_id UUID REFERENCES clients(id),
  
  -- REQUESTER (quem abriu o ticket) - POLIMÓRFICO
  requester_type VARCHAR(20) NOT NULL DEFAULT 'client',
    -- 'provider' | 'organization' | 'client'
  requester_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  requester_org_user_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  requester_client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  
  -- ASSIGNEE (quem resolve) - SEMPRE ORGANIZATION_USER
  assignee_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  
  -- Outros campos
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  category VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_requester_single CHECK (
    (requester_type = 'provider' AND requester_user_id IS NOT NULL 
     AND requester_org_user_id IS NULL AND requester_client_user_id IS NULL)
    OR
    (requester_type = 'organization' AND requester_org_user_id IS NOT NULL 
     AND requester_user_id IS NULL AND requester_client_user_id IS NULL)
    OR
    (requester_type = 'client' AND requester_client_user_id IS NOT NULL 
     AND requester_user_id IS NULL AND requester_org_user_id IS NULL)
  )
);

-- Índices
CREATE INDEX idx_tickets_requester_type ON tickets(requester_type);
CREATE INDEX idx_tickets_requester_user ON tickets(requester_user_id);
CREATE INDEX idx_tickets_requester_org_user ON tickets(requester_org_user_id);
CREATE INDEX idx_tickets_requester_client_user ON tickets(requester_client_user_id);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
```

### **2. COMMENTS**

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- AUTHOR (quem comentou) - POLIMÓRFICO
  author_type VARCHAR(20) NOT NULL,
    -- 'provider' | 'organization' | 'client'
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_org_user_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  author_client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Apenas para staff
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint
  CONSTRAINT check_author_single CHECK (
    (author_type = 'provider' AND author_user_id IS NOT NULL 
     AND author_org_user_id IS NULL AND author_client_user_id IS NULL)
    OR
    (author_type = 'organization' AND author_org_user_id IS NOT NULL 
     AND author_user_id IS NULL AND author_client_user_id IS NULL)
    OR
    (author_type = 'client' AND author_client_user_id IS NOT NULL 
     AND author_user_id IS NULL AND author_org_user_id IS NULL)
  )
);
```

### **3. KNOWLEDGE_ARTICLES**

```sql
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- AUTHOR - Apenas provider ou organization
  author_type VARCHAR(20) NOT NULL,
    -- 'provider' | 'organization'
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_org_user_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint
  CONSTRAINT check_author_staff CHECK (
    (author_type = 'provider' AND author_user_id IS NOT NULL AND author_org_user_id IS NULL)
    OR
    (author_type = 'organization' AND author_org_user_id IS NOT NULL AND author_user_id IS NULL)
  )
);
```

### **4. ASSETS**

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- OWNER (empresa dona) - Sempre client
  client_id UUID REFERENCES clients(id),
  
  -- ASSIGNED TO (usuário usando) - Sempre client_user
  assigned_to_client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  
  -- MANAGED BY (gestor TI) - Sempre organization_user
  managed_by_org_user_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  serial_number VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **5. ATTACHMENTS**

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- UPLOADED BY - POLIMÓRFICO
  uploaded_by_type VARCHAR(20) NOT NULL,
  uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_org_user_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  uploaded_by_client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500),
  mimetype VARCHAR(100),
  size INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_uploader_single CHECK (
    (uploaded_by_type = 'provider' AND uploaded_by_user_id IS NOT NULL 
     AND uploaded_by_org_user_id IS NULL AND uploaded_by_client_user_id IS NULL)
    OR
    (uploaded_by_type = 'organization' AND uploaded_by_org_user_id IS NOT NULL 
     AND uploaded_by_user_id IS NULL AND uploaded_by_client_user_id IS NULL)
    OR
    (uploaded_by_type = 'client' AND uploaded_by_client_user_id IS NOT NULL 
     AND uploaded_by_user_id IS NULL AND uploaded_by_org_user_id IS NULL)
  )
);
```

---

## 🔄 **QUERIES NO SEQUELIZE**

### **Criar Ticket:**

```javascript
// Cliente abre ticket
await Ticket.create({
  organizationId: tenant.id,
  clientId: client.id,
  
  requesterType: 'client',
  requesterClientUserId: clientUser.id,
  
  title: 'Problema no sistema',
  status: 'open'
});

// Org user abre ticket interno
await Ticket.create({
  organizationId: tenant.id,
  
  requesterType: 'organization',
  requesterOrgUserId: orgUser.id,
  
  assigneeId: anotherOrgUser.id,
  
  title: 'Manutenção preventiva',
  status: 'open'
});
```

### **Buscar Requester:**

```javascript
const ticket = await Ticket.findByPk(ticketId, {
  include: [
    {
      model: User,
      as: 'requesterUser',
      required: false
    },
    {
      model: OrganizationUser,
      as: 'requesterOrgUser',
      required: false
    },
    {
      model: ClientUser,
      as: 'requesterClientUser',
      required: false
    },
    {
      model: OrganizationUser,
      as: 'assignee'
    }
  ]
});

// Determinar requester
const requester = ticket.requesterUser 
  || ticket.requesterOrgUser 
  || ticket.requesterClientUser;

console.log(`Ticket aberto por: ${requester.name} (${ticket.requesterType})`);
```

### **Virtual Field no Model:**

```javascript
// Ticket model
Ticket.prototype.getRequester = function() {
  switch(this.requesterType) {
    case 'provider':
      return this.requesterUser;
    case 'organization':
      return this.requesterOrgUser;
    case 'client':
      return this.requesterClientUser;
    default:
      return null;
  }
};
```

---

## 📊 **TABELAS QUE PRECISAM AJUSTE**

### **Alta Prioridade (Usar sempre):**
1. ✅ **tickets** - requester polimórfico, assignee org_user
2. ✅ **comments** - author polimórfico
3. ✅ **attachments** - uploaded_by polimórfico

### **Média Prioridade:**
4. **knowledge_articles** - author (provider ou org_user)
5. **assets** - assigned_to (client_user), managed_by (org_user)
6. **hours_banks** - client_user
7. **hours_transactions** - performed_by (org_user)
8. **remote_accesses** - requester polimórfico

### **Baixa Prioridade (Já específicas):**
9. **directions** - manager_id (org_user)
10. **departments** - manager_id (org_user)
11. **sections** - manager_id (org_user)
12. **service_requests** - user_id polimórfico

---

## ✅ **PLANO DE IMPLEMENTAÇÃO**

### **FASE 1: Migração de Schema** (Prioridade)
1. Adicionar novas colunas polimórficas
2. Manter colunas antigas por compatibilidade
3. Migrar dados existentes
4. Adicionar constraints
5. Criar índices

### **FASE 2: Atualizar Models Sequelize**
1. Adicionar novas associações
2. Adicionar métodos helper (getRequester, etc)
3. Atualizar validações

### **FASE 3: Atualizar Controllers**
1. Usar novos campos polimórficos
2. Manter compatibilidade retroativa

### **FASE 4: Cleanup**
1. Remover colunas antigas
2. Remover código legado

---

## 🎯 **VANTAGENS DA ARQUITETURA PROPOSTA**

```
✅ Integridade Referencial (DB garante)
✅ Cascades automáticos
✅ Flexibilidade para 3 tipos de users
✅ Queries otimizadas com índices
✅ Tipo específico por caso (assignee sempre org_user)
✅ Constraints validam dados
✅ Fácil de entender e manter
✅ Escalável para novos tipos
```

---

**Esta é a arquitetura enterprise recomendada para multi-tenant SaaS!** 🚀
