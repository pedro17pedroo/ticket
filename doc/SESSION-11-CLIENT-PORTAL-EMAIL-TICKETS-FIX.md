# Session 11 - Fix: Tickets de Email Não Aparecem no Portal do Cliente

## 🐛 Problema Identificado

Tickets criados por email não apareciam na página "Minhas Solicitações" do Portal do Cliente.

### Causa Raiz

O método `getMyRequests` no backend estava buscando apenas na tabela `service_requests`, mas:

1. **Tickets via catálogo**: Criam `service_request` → depois criam `ticket`
2. **Tickets via email**: Criam `ticket` diretamente (SEM `service_request`)

Resultado: Tickets de email ficavam "invisíveis" no portal do cliente.

---

## ✅ Solução Implementada

### Arquivo Modificado
`backend/src/modules/catalog/catalogControllerEnhanced.js`

### Mudanças

#### 1. Import Adicionado
```javascript
import { Ticket } from '../models/index.js';
```

#### 2. Método `getMyRequests` Reescrito

**Antes:**
```javascript
async getMyRequests(req, res) {
  // Buscava APENAS service_requests
  const requests = await ServiceRequest.findAll({
    where: { organizationId, requesterId: userId }
  });
  res.json({ success: true, data: requests });
}
```

**Depois:**
```javascript
async getMyRequests(req, res) {
  // 1. Buscar service_requests (via catálogo)
  const serviceRequests = await ServiceRequest.findAll({...});
  
  // 2. Buscar tickets diretos (via email) SEM service_request
  const directTickets = await Ticket.findAll({
    where: {
      organizationId,
      catalogItemId: { [Op.not]: null },
      [Op.or]: [
        { requesterClientUserId: userId },  // Cliente
        { requesterUserId: userId },        // Usuário provider
        { requesterOrgUserId: userId }      // Usuário organização
      ]
    }
  });
  
  // 3. Filtrar tickets que NÃO têm service_request
  const ticketsWithoutRequest = [];
  for (const ticket of directTickets) {
    const hasRequest = await ServiceRequest.findOne({
      where: { ticketId: ticket.id }
    });
    if (!hasRequest) {
      ticketsWithoutRequest.push(ticket);
    }
  }
  
  // 4. Converter tickets para formato de request (compatibilidade)
  const directTicketsAsRequests = ticketsWithoutRequest.map(ticket => ({
    id: ticket.id,
    status: this.mapTicketStatusToRequestStatus(ticket.status),
    ticketId: ticket.id,
    catalogItem: ticket.catalogItem,
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status
    },
    isDirect: true,
    source: ticket.source || 'email'
  }));
  
  // 5. Combinar e ordenar
  const allRequests = [...serviceRequests, ...directTicketsAsRequests]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ success: true, data: allRequests });
}
```

#### 3. Método Auxiliar Adicionado

```javascript
mapTicketStatusToRequestStatus(ticketStatus) {
  const statusMap = {
    'novo': 'approved',
    'aguardando_aprovacao': 'pending_approval',
    'em_progresso': 'in_progress',
    'aguardando_cliente': 'in_progress',
    'resolvido': 'completed',
    'fechado': 'completed',
    'cancelado': 'cancelled'
  };
  return statusMap[ticketStatus] || 'in_progress';
}
```

---

## 🎯 Como Funciona Agora

### Fluxo de Busca

```
Cliente acede "Minhas Solicitações"
         ↓
Backend: getMyRequests()
         ↓
    ┌────────────────────────────────┐
    │  1. Buscar service_requests    │
    │     (solicitações via catálogo)│
    └────────────────────────────────┘
         ↓
    ┌────────────────────────────────┐
    │  2. Buscar tickets diretos     │
    │     (criados por email)        │
    │     - Tem catalogItemId        │
    │     - Não tem service_request  │
    └────────────────────────────────┘
         ↓
    ┌────────────────────────────────┐
    │  3. Converter tickets para     │
    │     formato de request         │
    │     (compatibilidade frontend) │
    └────────────────────────────────┘
         ↓
    ┌────────────────────────────────┐
    │  4. Combinar e ordenar por data│
    └────────────────────────────────┘
         ↓
    Frontend exibe TUDO
```

### Identificação de Origem

Cada item retornado tem:
- `isDirect: true` → Ticket criado diretamente (email)
- `isDirect: false/undefined` → Service request normal (catálogo)
- `source: 'email'` → Origem do ticket

---

## 📊 Tipos de Tickets Suportados

### 1. Solicitação via Catálogo (Normal)
```json
{
  "id": "sr-uuid",
  "status": "approved",
  "ticketId": "ticket-uuid",
  "catalogItem": {...},
  "ticket": {
    "ticketNumber": "TKT-000123",
    "status": "novo"
  }
}
```

### 2. Ticket via Email (Novo)
```json
{
  "id": "ticket-uuid",
  "status": "approved",
  "ticketId": "ticket-uuid",
  "catalogItem": {...},
  "ticket": {
    "ticketNumber": "TKT-000124",
    "status": "novo"
  },
  "isDirect": true,
  "source": "email"
}
```

---

## 🔍 Filtros Aplicados

### Tickets Diretos (Email)

**Incluídos:**
- ✅ Tem `catalogItemId` (relacionado ao catálogo)
- ✅ Criado pelo cliente (`requesterClientUserId`)
- ✅ NÃO tem `service_request` associado

**Excluídos:**
- ❌ Tickets manuais sem catálogo
- ❌ Tickets que já têm `service_request`
- ❌ Tickets de outros clientes

### Identificação de Cliente

O método verifica o `role` do usuário:
- `client` ou `client-user` → Busca por `requesterClientUserId`
- Outros roles → Busca por `requesterUserId` ou `requesterOrgUserId`

---

## 🎨 Frontend (Sem Mudanças)

O frontend **não precisa de alterações** porque:
1. Recebe o mesmo formato de dados
2. Já exibe `ticket.ticketNumber` corretamente
3. Já tem lógica para mostrar status e detalhes

---

## 🧪 Testes Necessários

### Cenário 1: Cliente com Solicitações Mistas
1. Cliente faz solicitação via catálogo
2. Cliente envia email (cria ticket direto)
3. Aceder "Minhas Solicitações"
4. ✅ Deve ver AMBOS os tickets

### Cenário 2: Filtros de Status
1. Aplicar filtro "Em Andamento"
2. ✅ Deve mostrar tickets de email com status mapeado

### Cenário 3: Pesquisa
1. Pesquisar por número de ticket (TKT-XXXXXX)
2. ✅ Deve encontrar tickets de email

### Cenário 4: Detalhes do Ticket
1. Clicar em ticket de email
2. ✅ Deve abrir página de detalhes corretamente

---

## 📝 Mapeamento de Status

| Status do Ticket       | Status da Request    |
|------------------------|----------------------|
| novo                   | approved             |
| aguardando_aprovacao   | pending_approval     |
| em_progresso           | in_progress          |
| aguardando_cliente     | in_progress          |
| resolvido              | completed            |
| fechado                | completed            |
| cancelado              | cancelled            |

---

## 🚀 Próximos Passos

1. ✅ Código implementado
2. ⏳ Reiniciar backend
3. ⏳ Testar com cliente que tem tickets de email
4. ⏳ Verificar se aparecem na lista
5. ⏳ Verificar se filtros funcionam
6. ⏳ Verificar se detalhes abrem corretamente

---

## 🔧 Troubleshooting

### Tickets de email ainda não aparecem?

**Verificar:**
1. Ticket tem `catalogItemId` preenchido?
2. Ticket tem `requesterClientUserId` correto?
3. Backend foi reiniciado?
4. Console do browser mostra erros?

**Query SQL para debug:**
```sql
SELECT 
  id, 
  ticket_number, 
  catalog_item_id, 
  requester_client_user_id,
  source,
  status
FROM tickets
WHERE requester_client_user_id = 'USER_ID_AQUI'
  AND catalog_item_id IS NOT NULL;
```

---

**Status**: ✅ Implementado - Aguardando Teste
**Data**: 2026-01-18
**Session**: 11 (Continuation)
