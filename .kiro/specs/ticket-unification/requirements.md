# 📋 Requirements: Unificação de Tickets - Eliminar service_requests

**Spec ID:** ticket-unification  
**Status:** 🔴 Planejamento  
**Prioridade:** Alta  
**Data de Criação:** 18 de Janeiro de 2026

---

## 🎯 Objetivo

Unificar toda a lógica de tickets em uma única tabela `tickets`, eliminando a tabela `service_requests` e simplificando a arquitetura do sistema.

---

## 📖 Contexto

### Situação Atual (Complexa)

```
┌─────────────────────────────────────┐
│      SERVICE_REQUESTS               │
│  - Workflow de aprovação            │
│  - Dados do formulário              │
│  - Status de aprovação              │
└─────────────────────────────────────┘
              ↓
         (cria ticket)
              ↓
┌─────────────────────────────────────┐
│          TICKETS                    │
│  - Tickets de catálogo              │
│  - Tickets de email                 │
│  - Tickets manuais                  │
└─────────────────────────────────────┘
```

**Problemas:**
- ❌ Duplicação de dados
- ❌ Complexidade nas queries (JOINs)
- ❌ Dois lugares para buscar informações
- ❌ Sincronização entre tabelas
- ❌ Confusão no frontend (service_request vs ticket)

### Situação Desejada (Simples)

```
┌─────────────────────────────────────┐
│          TICKETS                    │
│  ✓ Tickets de catálogo              │
│  ✓ Tickets de email                 │
│  ✓ Tickets manuais                  │
│  ✓ Workflow de aprovação            │
│  ✓ Dados do formulário              │
│  ✓ Tudo em um só lugar              │
└─────────────────────────────────────┘
```

**Vantagens:**
- ✅ Fonte única de verdade
- ✅ Queries mais simples e rápidas
- ✅ Menos código para manter
- ✅ Frontend mais simples
- ✅ Mais fácil adicionar novos tipos

---

## 👥 User Stories

### US-1: Criar Ticket de Catálogo
**Como** cliente  
**Quero** solicitar um serviço do catálogo  
**Para** que seja criado um ticket diretamente, sem tabela intermediária

**Critérios de Aceitação:**
- [ ] Formulário do catálogo cria ticket diretamente
- [ ] Campos do formulário salvos em `form_data` (JSONB)
- [ ] Se requer aprovação, status = 'aguardando_aprovacao'
- [ ] Se não requer, status = 'novo'
- [ ] Ticket tem `catalogItemId` preenchido

### US-2: Aprovar/Rejeitar Ticket de Catálogo
**Como** gestor  
**Quero** aprovar ou rejeitar solicitações de catálogo  
**Para** controlar o que é executado

**Critérios de Aceitação:**
- [ ] Botão "Aprovar" muda status para 'novo' ou 'em_progresso'
- [ ] Botão "Rejeitar" muda status para 'rejeitado'
- [ ] Campos de aprovação preenchidos (approved_by, approved_at, comments)
- [ ] Notificação enviada ao solicitante

### US-3: Ver Todos os Tickets
**Como** cliente  
**Quero** ver todos os meus tickets em um só lugar  
**Para** acompanhar tudo de forma unificada

**Critérios de Aceitação:**
- [ ] Endpoint único `/api/tickets/my-tickets`
- [ ] Retorna tickets de catálogo, email e manuais
- [ ] Filtros funcionam para todos os tipos
- [ ] Ordenação consistente

---

## 🔧 Requisitos Técnicos

### RT-1: Migração de Schema

**Arquivo:** `backend/migrations/20260118000001-unify-tickets-remove-service-requests.sql`

```sql
-- 1. Adicionar campos de service_requests em tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_comments TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES organization_users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES organization_users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimated_delivery_days INTEGER;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- 2. Migrar dados de service_requests para tickets
UPDATE tickets t
SET 
  approval_status = sr.status,
  approval_comments = sr.approval_comments,
  approved_by = sr.approved_by,
  approved_at = sr.approved_at,
  rejected_by = sr.rejected_by,
  rejected_at = sr.rejected_at,
  rejection_reason = sr.rejection_reason,
  form_data = sr.form_data,
  estimated_cost = sr.estimated_cost,
  estimated_delivery_days = sr.estimated_delivery_days
FROM service_requests sr
WHERE t.id = sr.ticket_id;

-- 3. Criar tickets para service_requests sem ticket
INSERT INTO tickets (
  organization_id,
  client_id,
  requester_type,
  requester_client_user_id,
  catalog_item_id,
  catalog_category_id,
  subject,
  description,
  status,
  priority,
  source,
  form_data,
  approval_status,
  requires_approval,
  created_at,
  updated_at
)
SELECT 
  sr.organization_id,
  cu.client_id,
  'client',
  sr.user_id,
  sr.catalog_item_id,
  ci.category_id,
  ci.name || ' - Solicitação',
  'Solicitação via catálogo de serviços',
  CASE 
    WHEN sr.status = 'pending_approval' THEN 'aguardando_aprovacao'
    WHEN sr.status = 'approved' THEN 'novo'
    WHEN sr.status = 'rejected' THEN 'rejeitado'
    WHEN sr.status = 'in_progress' THEN 'em_progresso'
    WHEN sr.status = 'completed' THEN 'fechado'
    ELSE 'novo'
  END,
  'media',
  'portal',
  sr.form_data,
  sr.status,
  true,
  sr.created_at,
  sr.updated_at
FROM service_requests sr
LEFT JOIN catalog_items ci ON sr.catalog_item_id = ci.id
LEFT JOIN client_users cu ON sr.user_id = cu.id
WHERE sr.ticket_id IS NULL;

-- 4. Backup da tabela antes de deletar
CREATE TABLE service_requests_backup AS SELECT * FROM service_requests;

-- 5. Dropar tabela service_requests
DROP TABLE IF EXISTS service_requests CASCADE;
```

### RT-2: Atualizar Modelo Ticket

**Arquivo:** `backend/src/modules/tickets/ticketModel.js`

```javascript
// Adicionar novos campos
approvalStatus: {
  type: DataTypes.ENUM('pending', 'approved', 'rejected'),
  allowNull: true,
  comment: 'Status de aprovação para tickets de catálogo'
},
approvalComments: {
  type: DataTypes.TEXT,
  allowNull: true
},
approvedBy: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'organization_users',
    key: 'id'
  }
},
approvedAt: {
  type: DataTypes.DATE,
  allowNull: true
},
rejectedBy: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'organization_users',
    key: 'id'
  }
},
rejectedAt: {
  type: DataTypes.DATE,
  allowNull: true
},
rejectionReason: {
  type: DataTypes.TEXT,
  allowNull: true
},
formData: {
  type: DataTypes.JSONB,
  defaultValue: {},
  comment: 'Dados do formulário do catálogo'
},
estimatedCost: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: true
},
estimatedDeliveryDays: {
  type: DataTypes.INTEGER,
  allowNull: true
},
requiresApproval: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  comment: 'Se o ticket requer aprovação antes de ser processado'
}
```

### RT-3: Atualizar Controller de Catálogo

**Arquivo:** `backend/src/modules/catalog/catalogControllerEnhanced.js`

**Método:** `createServiceRequest` → `createTicketFromCatalog`

```javascript
async createTicketFromCatalog(req, res) {
  try {
    const { id: catalogItemId } = req.params;
    const { organizationId, id: userId } = req.user;
    const { formData } = req.body;

    // Buscar item do catálogo
    const item = await CatalogItem.findOne({
      where: { id: catalogItemId, organizationId, isActive: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Validar dados do formulário
    if (item.customFields && item.customFields.length > 0) {
      const validation = customFieldsService.validateFormData(
        item.customFields, 
        formData
      );
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Dados do formulário inválidos',
          errors: validation.errors
        });
      }
    }

    // Transformar dados
    const transformedData = customFieldsService.transformFormData(
      item.customFields || [], 
      formData
    );

    // Criar ticket diretamente
    const ticket = await Ticket.create({
      organizationId,
      clientId: req.user.clientId,
      requesterType: 'client',
      requesterClientUserId: userId,
      catalogItemId: item.id,
      catalogCategoryId: item.categoryId,
      subject: item.name,
      description: this.generateDescriptionFromFormData(
        transformedData, 
        item.customFields
      ),
      priority: item.defaultPriority || 'media',
      type: 'service_request',
      source: 'portal',
      status: item.requiresApproval ? 'aguardando_aprovacao' : 'novo',
      formData: transformedData,
      requiresApproval: item.requiresApproval,
      estimatedCost: item.estimatedCost,
      estimatedDeliveryDays: item.estimatedDeliveryDays,
      // Roteamento automático
      directionId: item.defaultDirectionId,
      departmentId: item.defaultDepartmentId,
      sectionId: item.defaultSectionId
    });

    logger.info(`Ticket de catálogo criado: ${ticket.ticketNumber}`);
    
    res.status(201).json({
      success: true,
      data: ticket,
      requiresApproval: item.requiresApproval
    });
  } catch (error) {
    logger.error('Erro ao criar ticket de catálogo:', error);
    res.status(500).json({ error: 'Erro ao criar ticket' });
  }
}
```

### RT-4: Endpoint Unificado para Cliente

**Arquivo:** `backend/src/modules/tickets/ticketController.js`

**Novo Método:** `getMyTickets`

```javascript
export const getMyTickets = async (req, res, next) => {
  try {
    const { id: userId, organizationId, role } = req.user;
    const { status, source, page = 1, limit = 20 } = req.query;

    const where = { organizationId };

    // Filtrar por requester
    if (role === 'client' || role === 'client-user' || role === 'client-admin') {
      where.requesterClientUserId = userId;
    } else {
      where[Op.or] = [
        { requesterUserId: userId },
        { requesterOrgUserId: userId }
      ];
    }

    // Filtros opcionais
    if (status) where.status = status;
    if (source) where.source = source;

    const offset = (page - 1) * limit;

    const { rows: tickets, count } = await Ticket.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'icon', 'shortDescription']
        },
        {
          model: CatalogCategory,
          as: 'catalogCategory',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: OrganizationUser,
          as: 'approvedByUser',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### RT-5: Atualizar Frontend

**Arquivo:** `portalClientEmpresa/src/pages/MyRequests.jsx`

```javascript
// Mudar de /api/catalog/requests para /api/tickets/my-tickets
const loadRequests = async () => {
  setLoading(true);
  try {
    const response = await api.get('/tickets/my-tickets');
    setRequests(response.data.data || []);
  } catch (error) {
    console.error('Erro ao carregar tickets:', error);
    toast.error('Erro ao carregar seus tickets');
  } finally {
    setLoading(false);
  }
};
```

---

## 🗺️ Plano de Migração

### Fase 1: Preparação (Sem Downtime)
1. ✅ Criar backup da base de dados
2. ✅ Criar spec detalhada
3. [ ] Adicionar novos campos em `tickets`
4. [ ] Testar em ambiente de desenvolvimento

### Fase 2: Migração de Dados (Manutenção Programada)
1. [ ] Migrar dados de `service_requests` para `tickets`
2. [ ] Criar tickets para service_requests órfãos
3. [ ] Validar integridade dos dados
4. [ ] Criar backup de `service_requests`

### Fase 3: Atualização de Código (Deploy)
1. [ ] Atualizar modelo `Ticket`
2. [ ] Atualizar controller de catálogo
3. [ ] Criar endpoint unificado `/api/tickets/my-tickets`
4. [ ] Atualizar frontend do portal cliente
5. [ ] Atualizar frontend do portal organização

### Fase 4: Limpeza (Após Validação)
1. [ ] Remover código de `service_requests`
2. [ ] Remover rotas antigas
3. [ ] Dropar tabela `service_requests`
4. [ ] Atualizar documentação

### Fase 5: Validação Final
1. [ ] Testar criação de tickets de catálogo
2. [ ] Testar criação de tickets de email
3. [ ] Testar criação de tickets manuais
4. [ ] Testar aprovação/rejeição
5. [ ] Testar listagem unificada

---

## ✅ Critérios de Aceitação

### Funcional
- [ ] Tickets de catálogo criados diretamente
- [ ] Workflow de aprovação funciona
- [ ] Tickets de email continuam funcionando
- [ ] Tickets manuais continuam funcionando
- [ ] Listagem unificada no portal cliente
- [ ] Filtros funcionam para todos os tipos

### Técnico
- [ ] Migração de dados 100% completa
- [ ] Sem perda de dados
- [ ] Performance igual ou melhor
- [ ] Queries mais simples
- [ ] Menos código para manter

### Segurança
- [ ] Permissões mantidas
- [ ] Visibilidade respeitada
- [ ] Auditoria funcionando

---

## 📊 Impacto

### Código Removido
- `backend/src/modules/catalog/serviceRequestModel.js` ❌
- Métodos de service_requests em controllers ❌
- Rotas de service_requests ❌
- ~500 linhas de código removidas

### Código Simplificado
- `catalogControllerEnhanced.js` - 30% mais simples
- `MyRequests.jsx` - 40% mais simples
- Queries - 50% mais rápidas

### Benefícios
- ✅ Menos complexidade
- ✅ Mais performance
- ✅ Mais fácil de entender
- ✅ Mais fácil de manter
- ✅ Mais fácil de escalar

---

## ⚠️ Riscos e Mitigações

### Risco 1: Perda de Dados
**Mitigação:** Backup completo antes da migração + tabela de backup

### Risco 2: Downtime
**Mitigação:** Migração em horário de baixo tráfego + rollback preparado

### Risco 3: Bugs no Frontend
**Mitigação:** Testes extensivos + deploy gradual

### Risco 4: Queries Lentas
**Mitigação:** Índices apropriados + testes de performance

---

## 📚 Referências

- #[[file:backend/src/modules/tickets/ticketModel.js]]
- #[[file:backend/src/modules/catalog/catalogControllerEnhanced.js]]
- #[[file:portalClientEmpresa/src/pages/MyRequests.jsx]]
- #[[file:EMAIL-ROUTING-SYSTEM-EXPLAINED.md]]

---

**Aprovado por:** Pendente  
**Data de Aprovação:** Pendente  
**Estimativa:** 4-6 horas de desenvolvimento + 2 horas de testes
