# 🎨 Design: Unificação de Tickets

**Spec ID:** ticket-unification  
**Status:** 🔴 Planejamento  
**Data:** 18 de Janeiro de 2026

---

## 🏗️ Arquitetura

### Antes (Complexo)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
│  - MyRequests.jsx (busca service_requests)              │
│  - ServiceCatalog.jsx (cria service_requests)           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    BACKEND API                          │
│  - POST /api/catalog/items/:id/request                  │
│  - GET /api/catalog/requests                            │
│  - GET /api/tickets                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────┐         ┌──────────────────────┐
│  SERVICE_REQUESTS    │────────→│      TICKETS         │
│  - form_data         │ cria    │  - subject           │
│  - status            │ ticket  │  - description       │
│  - approval_*        │         │  - status            │
└──────────────────────┘         └──────────────────────┘
```

### Depois (Simples)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
│  - MyTickets.jsx (busca tickets)                        │
│  - ServiceCatalog.jsx (cria tickets)                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    BACKEND API                          │
│  - POST /api/catalog/items/:id/ticket                   │
│  - GET /api/tickets/my-tickets                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     TICKETS                             │
│  - subject, description, status                         │
│  - form_data (JSONB)                                    │
│  - approval_status, approved_by, approved_at            │
│  - source: 'email' | 'portal' | 'catalog'               │
│  - catalogItemId (opcional)                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Schema da Tabela Tickets (Unificada)

```sql
CREATE TABLE tickets (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Conteúdo
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Status e Prioridade
  status VARCHAR(50) NOT NULL DEFAULT 'novo',
  priority VARCHAR(50) NOT NULL DEFAULT 'media',
  priority_id UUID REFERENCES priorities(id),
  
  -- Tipo e Origem
  type VARCHAR(50) NOT NULL DEFAULT 'suporte',
  source VARCHAR(50) NOT NULL DEFAULT 'portal',
  -- source: 'email', 'portal', 'catalog', 'chat', 'whatsapp', 'telefone'
  
  -- Requester (Polimórfico)
  requester_type VARCHAR(50),
  requester_user_id UUID REFERENCES users(id),
  requester_org_user_id UUID REFERENCES organization_users(id),
  requester_client_user_id UUID REFERENCES client_users(id),
  
  -- Assignee
  assignee_id UUID REFERENCES organization_users(id),
  
  -- Estrutura Organizacional
  client_id UUID REFERENCES clients(id),
  direction_id UUID REFERENCES directions(id),
  department_id UUID REFERENCES departments(id),
  section_id UUID REFERENCES sections(id),
  
  -- Catálogo de Serviços
  catalog_category_id UUID REFERENCES catalog_categories(id),
  catalog_item_id UUID REFERENCES catalog_items(id),
  
  -- 🆕 CAMPOS DE APROVAÇÃO (antes em service_requests)
  requires_approval BOOLEAN DEFAULT false,
  approval_status VARCHAR(50),
  -- approval_status: 'pending', 'approved', 'rejected'
  approval_comments TEXT,
  approved_by UUID REFERENCES organization_users(id),
  approved_at TIMESTAMP,
  rejected_by UUID REFERENCES organization_users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- 🆕 DADOS DO FORMULÁRIO (antes em service_requests)
  form_data JSONB DEFAULT '{}',
  estimated_cost DECIMAL(10,2),
  estimated_delivery_days INTEGER,
  
  -- SLA e Timing
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  due_date TIMESTAMP,
  sla_breached BOOLEAN DEFAULT false,
  
  -- Metadados
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Watchers
  client_watchers TEXT[],
  org_watchers UUID[],
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_tickets_client ON tickets(client_id);
CREATE INDEX idx_tickets_requester_client ON tickets(requester_client_user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_source ON tickets(source);
CREATE INDEX idx_tickets_catalog_item ON tickets(catalog_item_id);
CREATE INDEX idx_tickets_approval_status ON tickets(approval_status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
```

---

## 🔄 Fluxos de Criação

### Fluxo 1: Ticket via Catálogo (COM Aprovação)

```
Cliente                 Frontend              Backend              Database
  │                        │                     │                    │
  │  1. Preenche form      │                     │                    │
  │───────────────────────→│                     │                    │
  │                        │  2. POST /catalog/  │                    │
  │                        │     items/:id/ticket│                    │
  │                        │────────────────────→│                    │
  │                        │                     │  3. Validar form   │
  │                        │                     │                    │
  │                        │                     │  4. CREATE ticket  │
  │                        │                     │    status='aguardando_aprovacao'
  │                        │                     │    requires_approval=true
  │                        │                     │    form_data={...}
  │                        │                     │───────────────────→│
  │                        │  5. Ticket criado   │                    │
  │                        │←────────────────────│                    │
  │  6. Confirmação        │                     │                    │
  │←───────────────────────│                     │                    │
  │                        │                     │                    │
  
Gestor                  Frontend              Backend              Database
  │                        │                     │                    │
  │  7. Ver pendentes      │                     │                    │
  │───────────────────────→│  8. GET /tickets?   │                    │
  │                        │     approval_status=│                    │
  │                        │     pending         │                    │
  │                        │────────────────────→│  9. SELECT tickets │
  │                        │                     │───────────────────→│
  │  10. Lista             │                     │                    │
  │←───────────────────────│←────────────────────│                    │
  │                        │                     │                    │
  │  11. Aprovar           │                     │                    │
  │───────────────────────→│  12. PATCH /tickets/│                    │
  │                        │      :id/approve    │                    │
  │                        │────────────────────→│  13. UPDATE ticket │
  │                        │                     │     status='novo'  │
  │                        │                     │     approval_status='approved'
  │                        │                     │     approved_by=gestor_id
  │                        │                     │     approved_at=NOW()
  │                        │                     │───────────────────→│
  │  14. Aprovado          │                     │                    │
  │←───────────────────────│←────────────────────│                    │
```

### Fluxo 2: Ticket via Catálogo (SEM Aprovação)

```
Cliente                 Frontend              Backend              Database
  │                        │                     │                    │
  │  1. Preenche form      │                     │                    │
  │───────────────────────→│                     │                    │
  │                        │  2. POST /catalog/  │                    │
  │                        │     items/:id/ticket│                    │
  │                        │────────────────────→│                    │
  │                        │                     │  3. Validar form   │
  │                        │                     │                    │
  │                        │                     │  4. CREATE ticket  │
  │                        │                     │    status='novo'   │
  │                        │                     │    requires_approval=false
  │                        │                     │    form_data={...}
  │                        │                     │───────────────────→│
  │                        │  5. Ticket criado   │                    │
  │                        │←────────────────────│                    │
  │  6. Confirmação        │                     │                    │
  │←───────────────────────│                     │                    │
```

### Fluxo 3: Ticket via Email

```
Email Server           IMAP Service          Backend              Database
  │                        │                     │                    │
  │  1. Email recebido     │                     │                    │
  │───────────────────────→│                     │                    │
  │                        │  2. Processar email │                    │
  │                        │────────────────────→│                    │
  │                        │                     │  3. CREATE ticket  │
  │                        │                     │    source='email'  │
  │                        │                     │    status='novo'   │
  │                        │                     │    subject=email.subject
  │                        │                     │    description=email.body
  │                        │                     │───────────────────→│
  │                        │  4. Ticket criado   │                    │
  │                        │←────────────────────│                    │
```

### Fluxo 4: Ticket Manual

```
Agente                  Frontend              Backend              Database
  │                        │                     │                    │
  │  1. Criar ticket       │                     │                    │
  │───────────────────────→│                     │                    │
  │                        │  2. POST /tickets   │                    │
  │                        │────────────────────→│                    │
  │                        │                     │  3. CREATE ticket  │
  │                        │                     │    source='portal' │
  │                        │                     │    status='novo'   │
  │                        │                     │───────────────────→│
  │                        │  4. Ticket criado   │                    │
  │                        │←────────────────────│                    │
  │  5. Confirmação        │                     │                    │
  │←───────────────────────│                     │                    │
```

---

## 🎨 UI/UX Design

### Card de Ticket Unificado

```
┌─────────────────────────────────────────────────────────┐
│ 📧 Email          │ 🛒 Catálogo      │ 📝 Manual        │
│ ─────────────────────────────────────────────────────── │
│ #TKT-20260118-1234                                      │
│ Problema com impressora                                 │
│                                                         │
│ Status: Em Progresso        Prioridade: Alta           │
│ Criado: 18/01/2026 10:30    Atualizado: 18/01 11:45   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Solicitante: João Silva (joao@empresa.com)       │ │
│ │ 👨‍💼 Responsável: Maria Santos                        │ │
│ │ 🏢 Departamento: TI                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Ver Detalhes]                                          │
└─────────────────────────────────────────────────────────┘
```

### Card de Ticket Aguardando Aprovação

```
┌─────────────────────────────────────────────────────────┐
│ 🛒 Catálogo - Aguardando Aprovação                      │
│ ─────────────────────────────────────────────────────── │
│ #TKT-20260118-5678                                      │
│ Novo Computador Dell XPS 15                             │
│                                                         │
│ ⏳ Aguardando Aprovação                                 │
│ Criado: 18/01/2026 09:15                               │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💰 Custo Estimado: R$ 8.500,00                      │ │
│ │ 📅 Prazo de Entrega: 15 dias                        │ │
│ │                                                      │ │
│ │ Especificações:                                      │ │
│ │ • Processador: Intel i7                             │ │
│ │ • RAM: 32GB                                         │ │
│ │ • SSD: 1TB                                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Ver Detalhes]                                          │
└─────────────────────────────────────────────────────────┘
```

### Página de Aprovação (Gestor)

```
┌─────────────────────────────────────────────────────────┐
│ Aprovar Solicitação                                     │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ Ticket: #TKT-20260118-5678                             │
│ Serviço: Novo Computador Dell XPS 15                   │
│ Solicitante: João Silva (TI)                           │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Dados da Solicitação:                               │ │
│ │                                                      │ │
│ │ Processador: Intel i7                               │ │
│ │ RAM: 32GB                                           │ │
│ │ SSD: 1TB                                            │ │
│ │ Justificativa: Desenvolvimento de aplicações        │ │
│ │                                                      │ │
│ │ Custo: R$ 8.500,00                                  │ │
│ │ Prazo: 15 dias                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Comentários (opcional):                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │                                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [✅ Aprovar]  [❌ Rejeitar]  [Cancelar]                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### Novos Endpoints

```javascript
// Criar ticket de catálogo
POST /api/catalog/items/:id/ticket
Body: { formData: {...} }
Response: { success: true, data: ticket }

// Listar meus tickets (unificado)
GET /api/tickets/my-tickets
Query: ?status=novo&source=email&page=1&limit=20
Response: { success: true, data: [...], pagination: {...} }

// Aprovar ticket
PATCH /api/tickets/:id/approve
Body: { comments: "Aprovado conforme solicitado" }
Response: { success: true, data: ticket }

// Rejeitar ticket
PATCH /api/tickets/:id/reject
Body: { reason: "Orçamento insuficiente" }
Response: { success: true, data: ticket }
```

### Endpoints Removidos

```javascript
// ❌ Remover
POST /api/catalog/items/:id/request
GET /api/catalog/requests
GET /api/catalog/requests/:id
```

---

## 📦 Estrutura de Dados

### Ticket de Catálogo (Exemplo)

```json
{
  "id": "uuid",
  "ticketNumber": "TKT-20260118-5678",
  "organizationId": "uuid",
  "clientId": "uuid",
  "subject": "Novo Computador Dell XPS 15",
  "description": "Solicitação de novo computador para desenvolvimento",
  "status": "aguardando_aprovacao",
  "priority": "media",
  "type": "service_request",
  "source": "catalog",
  "requesterType": "client",
  "requesterClientUserId": "uuid",
  "catalogItemId": "uuid",
  "catalogCategoryId": "uuid",
  "requiresApproval": true,
  "approvalStatus": "pending",
  "formData": {
    "processor": "Intel i7",
    "ram": "32GB",
    "ssd": "1TB",
    "justification": "Desenvolvimento de aplicações"
  },
  "estimatedCost": 8500.00,
  "estimatedDeliveryDays": 15,
  "createdAt": "2026-01-18T09:15:00Z",
  "updatedAt": "2026-01-18T09:15:00Z"
}
```

### Ticket de Email (Exemplo)

```json
{
  "id": "uuid",
  "ticketNumber": "TKT-20260118-1234",
  "organizationId": "uuid",
  "clientId": "uuid",
  "subject": "Problema com impressora",
  "description": "A impressora do 3º andar não está funcionando...",
  "status": "novo",
  "priority": "media",
  "type": "suporte",
  "source": "email",
  "requesterType": "client",
  "requesterClientUserId": "uuid",
  "directionId": "uuid",
  "departmentId": "uuid",
  "createdAt": "2026-01-18T10:30:00Z",
  "updatedAt": "2026-01-18T10:30:00Z"
}
```

---

## 🧪 Testes

### Testes Unitários

```javascript
describe('Ticket Unification', () => {
  describe('Create Ticket from Catalog', () => {
    it('should create ticket with approval required', async () => {
      const ticket = await createTicketFromCatalog({
        catalogItemId: 'uuid',
        formData: {...},
        requiresApproval: true
      });
      
      expect(ticket.status).toBe('aguardando_aprovacao');
      expect(ticket.requiresApproval).toBe(true);
      expect(ticket.source).toBe('catalog');
    });
    
    it('should create ticket without approval', async () => {
      const ticket = await createTicketFromCatalog({
        catalogItemId: 'uuid',
        formData: {...},
        requiresApproval: false
      });
      
      expect(ticket.status).toBe('novo');
      expect(ticket.requiresApproval).toBe(false);
    });
  });
  
  describe('Approve/Reject Ticket', () => {
    it('should approve ticket', async () => {
      const ticket = await approveTicket(ticketId, {
        approvedBy: 'uuid',
        comments: 'Aprovado'
      });
      
      expect(ticket.approvalStatus).toBe('approved');
      expect(ticket.status).toBe('novo');
      expect(ticket.approvedAt).toBeDefined();
    });
    
    it('should reject ticket', async () => {
      const ticket = await rejectTicket(ticketId, {
        rejectedBy: 'uuid',
        reason: 'Orçamento insuficiente'
      });
      
      expect(ticket.approvalStatus).toBe('rejected');
      expect(ticket.status).toBe('rejeitado');
      expect(ticket.rejectedAt).toBeDefined();
    });
  });
});
```

---

## 📈 Métricas de Sucesso

- ✅ 100% dos dados migrados sem perda
- ✅ Queries 50% mais rápidas
- ✅ Código 30% mais simples
- ✅ Zero downtime na migração
- ✅ Todos os testes passando

---

**Última atualização:** 18 de Janeiro de 2026
