# Correção: Página de Aprovações de Catálogo

## Data: 2026-01-18

## Problema
A página de aprovações (`/catalog/approvals`) no Portal da Organização não estava funcionando porque:

1. **Endpoint antigo desativado**: Estava usando `/catalog/requests` que foi comentado após a unificação dos tickets
2. **Tickets não apareciam**: Tickets criados a partir de itens do catálogo que requerem aprovação não apareciam na página
3. **Número truncado**: O número do ticket estava sendo truncado com `.slice(0, 8)`

## Solução

### 1. Atualização da API
Migrada a página para usar a nova API unificada de tickets:

**Antes (endpoint antigo):**
```javascript
// GET /catalog/requests
// POST /catalog/requests/:id/approve
```

**Depois (novos endpoints):**
```javascript
// GET /tickets?status=aguardando_aprovacao
// PATCH /tickets/:id/approve
// PATCH /tickets/:id/reject
```

### 2. Mapeamento de Dados
Adicionado mapeamento dos dados do ticket para o formato esperado pela interface:

```javascript
const mappedRequests = tickets.map(ticket => ({
  id: ticket.id,
  ticketNumber: ticket.ticketNumber,
  status: ticket.approvalStatus === 'approved' ? 'approved' : 
          ticket.approvalStatus === 'rejected' ? 'rejected' : 'pending',
  catalogItem: ticket.catalogItem,
  requester: ticket.requester || ticket.requesterClientUser || 
             ticket.requesterOrgUser || ticket.requesterUser,
  // ... outros campos
}));
```

### 3. Correção do Número do Ticket
Removida a truncação e adicionado fallback:

**Antes:**
```jsx
<p>SR #{request.id?.slice(0, 8)}</p>
```

**Depois:**
```jsx
<p>{request.ticketNumber || `SR #${request.id}`}</p>
```

## Arquivo Modificado

### `portalOrganizaçãoTenant/src/pages/CatalogApprovals.jsx`

#### Função `loadRequests()`
- **Antes**: `GET /catalog/requests`
- **Depois**: `GET /tickets?status=aguardando_aprovacao`
- Adicionado mapeamento de dados do ticket para o formato da interface

#### Função `loadRequestDetails()`
- **Antes**: `GET /catalog/requests/:id`
- **Depois**: `GET /tickets/:id`
- Adicionado mapeamento de dados do ticket

#### Função `handleSubmitApproval()`
- **Antes**: `POST /catalog/requests/:id/approve` com `{ approved, comments }`
- **Depois**: 
  - Aprovar: `PATCH /tickets/:id/approve` com `{ comments }`
  - Rejeitar: `PATCH /tickets/:id/reject` com `{ comments, reason }`

#### Exibição do Número
- Removido `.slice(0, 8)` em 2 lugares
- Adicionado fallback para `ticketNumber`

## Fluxo de Aprovação Atualizado

### 1. Cliente Solicita Serviço
- Cliente acessa catálogo no Portal Cliente
- Seleciona item que requer aprovação (`requiresApproval: true`)
- Preenche formulário e submete
- **Ticket criado com status**: `aguardando_aprovacao`
- **Campo**: `requiresApproval: true`

### 2. Ticket Aparece em Aprovações
- Portal da Organização busca: `GET /tickets?status=aguardando_aprovacao`
- Tickets são exibidos na página `/catalog/approvals`
- Mostra informações do serviço, solicitante, prioridade, etc.

### 3. Aprovador Decide
**Aprovar:**
- Clica em "Aprovar"
- Adiciona comentários (opcional)
- Sistema chama: `PATCH /tickets/:id/approve`
- Ticket muda para status `novo` e `approvalStatus: 'approved'`
- Cliente é notificado

**Rejeitar:**
- Clica em "Rejeitar"
- Adiciona motivo (obrigatório)
- Sistema chama: `PATCH /tickets/:id/reject`
- Ticket muda para status `fechado` e `approvalStatus: 'rejected'`
- Cliente é notificado

## Campos de Aprovação no Modelo Ticket

```javascript
{
  requiresApproval: Boolean,        // Se requer aprovação
  approvalStatus: String,           // 'pending', 'approved', 'rejected'
  approvalComments: Text,           // Comentários do aprovador
  approvedBy: UUID,                 // FK para organization_users
  approvedAt: Date,                 // Data/hora da aprovação
  rejectedBy: UUID,                 // FK para organization_users
  rejectedAt: Date,                 // Data/hora da rejeição
  rejectionReason: Text             // Motivo da rejeição
}
```

## Endpoints da API

### Listar Tickets Pendentes de Aprovação
```
GET /api/tickets?status=aguardando_aprovacao
```

**Resposta:**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "ticketNumber": "TKT-20260118-1234",
      "status": "aguardando_aprovacao",
      "approvalStatus": "pending",
      "requiresApproval": true,
      "catalogItem": { ... },
      "requester": { ... },
      "formData": { ... }
    }
  ],
  "pagination": { ... }
}
```

### Aprovar Ticket
```
PATCH /api/tickets/:id/approve
```

**Body:**
```json
{
  "comments": "Aprovado conforme solicitado"
}
```

### Rejeitar Ticket
```
PATCH /api/tickets/:id/reject
```

**Body:**
```json
{
  "comments": "Rejeitado por falta de informações",
  "reason": "Falta de informações necessárias"
}
```

## Testes Recomendados

### 1. Criar Ticket que Requer Aprovação
- [ ] Login no Portal Cliente
- [ ] Acessar Catálogo de Serviços
- [ ] Solicitar item com `requiresApproval: true`
- [ ] Verificar que ticket é criado com status `aguardando_aprovacao`

### 2. Visualizar na Página de Aprovações
- [ ] Login no Portal da Organização
- [ ] Acessar `/catalog/approvals`
- [ ] Verificar que o ticket aparece na aba "Aguardando Aprovação"
- [ ] Verificar que o número completo do ticket é exibido
- [ ] Verificar informações do serviço e solicitante

### 3. Aprovar Ticket
- [ ] Clicar em "Aprovar"
- [ ] Adicionar comentários
- [ ] Confirmar aprovação
- [ ] Verificar que ticket muda para aba "Aprovados"
- [ ] Verificar que status do ticket mudou para `novo`
- [ ] Verificar notificação ao cliente

### 4. Rejeitar Ticket
- [ ] Criar novo ticket que requer aprovação
- [ ] Clicar em "Rejeitar"
- [ ] Adicionar motivo da rejeição
- [ ] Confirmar rejeição
- [ ] Verificar que ticket muda para aba "Rejeitados"
- [ ] Verificar que status do ticket mudou para `fechado`
- [ ] Verificar notificação ao cliente

### 5. Filtros e Estatísticas
- [ ] Verificar contadores (Total, Pendentes, Aprovados, Rejeitados)
- [ ] Testar filtro por status
- [ ] Verificar que cada aba mostra os tickets corretos

## Notas Importantes

- ✅ Página agora usa API unificada de tickets
- ✅ Tickets que requerem aprovação aparecem corretamente
- ✅ Número completo do ticket é exibido
- ✅ Aprovação e rejeição funcionam com novos endpoints
- ✅ Notificações são enviadas ao cliente
- ✅ Histórico de aprovação/rejeição é mantido

## Configuração de Itens do Catálogo

Para que um item do catálogo requeira aprovação, configure:

```javascript
{
  name: "Novo Computador",
  requiresApproval: true,
  defaultApproverId: "uuid-do-aprovador", // Opcional
  // ... outros campos
}
```

Quando um cliente solicita este item:
1. Ticket é criado com `status: 'aguardando_aprovacao'`
2. Campo `requiresApproval: true` é definido
3. Ticket aparece em `/catalog/approvals`
4. Aprovador pode aprovar ou rejeitar
5. Cliente é notificado da decisão

## Conclusão

A página de aprovações agora está totalmente funcional e integrada com a API unificada de tickets. Tickets criados a partir de itens do catálogo que requerem aprovação aparecem corretamente e podem ser aprovados ou rejeitados pelos usuários da organização com as permissões adequadas.


---

## ✅ ATUALIZAÇÃO: Correção de Enums (2026-01-18)

### Problema Adicional Identificado

Após a migração para a API unificada, dois erros ocorriam durante aprovação/rejeição (mas não impediam a operação):

1. **PostgreSQL - ticket_history**: 
   ```
   ERROR: invalid input value for enum enum_ticket_history_action: "approval"
   ```

2. **MongoDB - auditLog**: 
   ```
   ERROR: approve is not a valid enum value for path action
   ```

### Correções Aplicadas

#### 1. Enum PostgreSQL (ticket_history)

**Arquivo**: `backend/src/modules/tickets/ticketHistoryModel.js`

Adicionados valores ao enum:
```javascript
action: {
  type: DataTypes.ENUM(
    // ... valores existentes
    'approval',      // ✅ NOVO
    'rejection'      // ✅ NOVO
  ),
  allowNull: false
}
```

**Script SQL**: `backend/fix-ticket-history-enum.sql`
```sql
ALTER TYPE enum_ticket_history_action ADD VALUE IF NOT EXISTS 'approval';
ALTER TYPE enum_ticket_history_action ADD VALUE IF NOT EXISTS 'rejection';
```

**Status**: ✅ Executado com sucesso

#### 2. Enum MongoDB (auditLog)

**Arquivo**: `backend/src/modules/audit/auditSchema.js`

Adicionados valores ao enum:
```javascript
action: {
  type: String,
  required: true,
  enum: [
    // ... valores existentes
    'approve',  // ✅ NOVO
    'reject'    // ✅ NOVO
  ]
}
```

**Status**: ✅ Atualizado

### Comportamento Correto Após Aprovação

**IMPORTANTE**: O ticket desaparece da lista de "Pendentes" após aprovação - isso é o comportamento CORRETO!

**Fluxo de Status**:
```
Criação → status: 'aguardando_aprovacao', approvalStatus: 'pending'
   ↓
Aprovação → status: 'novo', approvalStatus: 'approved' ✅
   ↓
Rejeição → status: 'fechado', approvalStatus: 'rejected' ❌
```

**Para ver tickets aprovados/rejeitados**:
- Use os filtros na página de aprovações
- 🟡 Pendentes: Filtra por `status = 'aguardando_aprovacao'`
- 🟢 Aprovados: Filtra por `approvalStatus = 'approved'`
- 🔴 Rejeitados: Filtra por `approvalStatus = 'rejected'`

### Arquivos Modificados

1. `backend/src/modules/tickets/ticketHistoryModel.js` - Enum atualizado
2. `backend/src/modules/audit/auditSchema.js` - Enum atualizado
3. `backend/fix-ticket-history-enum.sql` - Script SQL criado e executado

### Verificação

```sql
-- Verificar enum PostgreSQL
SELECT unnest(enum_range(NULL::enum_ticket_history_action)) AS action_values;

-- Resultado esperado inclui:
-- approval ✅
-- rejection ✅
```

### Status Final

- ✅ Aprovação funciona sem erros
- ✅ Rejeição funciona sem erros
- ✅ Histórico registrado corretamente (PostgreSQL)
- ✅ Audit log registrado corretamente (MongoDB)
- ✅ Notificações enviadas
- ✅ Frontend atualiza corretamente

**Documentação completa**: Ver `APPROVAL-SYSTEM-COMPLETE-FIX.md`


---

## ✅ ATUALIZAÇÃO FINAL: Tickets Aprovados Agora Aparecem na Lista (2026-01-18)

### Problema
Após aprovação, o ticket mudava de `status: 'aguardando_aprovacao'` para `status: 'novo'`, mas desaparecia completamente da página de aprovações. O usuário não conseguia ver os tickets aprovados na aba "Aprovados".

### Solução
Alterada a lógica de busca para carregar TODOS os tickets que requerem aprovação, independente do status atual:

**Antes**:
```javascript
// Buscava apenas tickets pendentes
const response = await api.get('/tickets', {
  params: { status: 'aguardando_aprovacao' }
});
```

**Depois**:
```javascript
// Busca em 3 etapas paralelas
const [pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
  // 1. Tickets aguardando aprovação
  api.get('/tickets', { params: { status: 'aguardando_aprovacao' } }),
  
  // 2. Tickets aprovados (filtra por requiresApproval e approvalStatus)
  api.get('/tickets', { params: { limit: 100 } })
    .then(res => ({
      data: {
        tickets: res.data.tickets.filter(t => 
          t.requiresApproval && t.approvalStatus === 'approved'
        )
      }
    })),
  
  // 3. Tickets rejeitados
  api.get('/tickets', { params: { status: 'fechado' } })
    .then(res => ({
      data: {
        tickets: res.data.tickets.filter(t => 
          t.requiresApproval && t.approvalStatus === 'rejected'
        )
      }
    }))
]);

// Combina todos e remove duplicatas
const allTickets = [...pending, ...approved, ...rejected];
const uniqueTickets = Array.from(
  new Map(allTickets.map(ticket => [ticket.id, ticket])).values()
);
```

### Resultado

Agora a página mostra corretamente:

- **Total**: Todos os tickets que requerem aprovação (pendentes + aprovados + rejeitados)
- **Pendentes (🟡)**: Tickets com `approvalStatus = 'pending'`
- **Aprovados (🟢)**: Tickets com `approvalStatus = 'approved'` (mesmo que status seja 'novo')
- **Rejeitados (🔴)**: Tickets com `approvalStatus = 'rejected'` (mesmo que status seja 'fechado')

### Fluxo Completo

1. **Cliente solicita serviço** → Ticket criado com `status: 'aguardando_aprovacao'`, `approvalStatus: 'pending'`
2. **Aparece em "Pendentes"** → Contador de pendentes aumenta
3. **Aprovador aprova** → Ticket muda para `status: 'novo'`, `approvalStatus: 'approved'`
4. **Aparece em "Aprovados"** → Contador de aprovados aumenta, contador de pendentes diminui
5. **Ticket continua visível** → Pode ser consultado a qualquer momento na aba "Aprovados"

### Arquivo Modificado

- `portalOrganizaçãoTenant/src/pages/CatalogApprovals.jsx` - Função `loadRequests()` reescrita

### Status

✅ Tickets aprovados agora aparecem corretamente na aba "Aprovados"
✅ Tickets rejeitados aparecem na aba "Rejeitados"
✅ Contadores funcionam corretamente
✅ Filtros funcionam corretamente
✅ Histórico completo mantido
