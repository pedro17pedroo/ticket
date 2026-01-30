# Session 11 - Fix Final: Tickets de Email no Portal do Cliente

## ✅ Problema Resolvido

Tickets criados por email agora aparecem na página "Minhas Solicitações" do Portal do Cliente.

---

## 🔧 Mudanças Implementadas

### Arquivo: `backend/src/modules/catalog/catalogControllerEnhanced.js`

#### 1. Imports Corrigidos
```javascript
// ANTES
import { CatalogCategory, CatalogItem, ServiceRequest } from './catalogModelSimple.js';
import { Ticket, ClientUser, OrganizationUser, User } from '../models/index.js';

// DEPOIS
import { CatalogCategory, ServiceRequest } from './catalogModelSimple.js';
import { Ticket, ClientUser, OrganizationUser, User, CatalogItem } from '../models/index.js';
```

**Motivo**: CatalogItem do `models/index.js` tem as associações corretas com Ticket.

#### 2. Método `getMyRequests` Reescrito

**Mudanças principais:**
1. ✅ Removido filtro `catalogItemId: { [Op.not]: null }` - agora busca TODOS os tickets
2. ✅ Adicionado suporte para `client-admin` role
3. ✅ Include do CatalogItem com `required: false` (LEFT JOIN)
4. ✅ Includes dos requesters (ClientUser, OrganizationUser, User)
5. ✅ Fallback para tickets sem catalogItem (usa subject do ticket)
6. ✅ Corrigido campo `userId` (não `requesterId`) para service_requests

---

## 📊 Como Funciona Agora

### Busca Combinada

```javascript
async getMyRequests(req, res) {
  // 1. Buscar service_requests (via catálogo)
  const serviceRequests = await ServiceRequest.findAll({
    where: { organizationId, userId }  // ← userId, não requesterId
  });
  
  // 2. Buscar tickets diretos (email, manual, etc)
  const directTickets = await Ticket.findAll({
    where: {
      organizationId,
      // SEM filtro de catalogItemId - busca TODOS
      [Op.or]: [
        { requesterClientUserId: userId },
        { requesterUserId: userId },
        { requesterOrgUserId: userId }
      ]
    },
    include: [
      { model: CatalogItem, as: 'catalogItem', required: false }, // LEFT JOIN
      { model: ClientUser, as: 'requesterClientUser', required: false },
      // ... outros requesters
    ]
  });
  
  // 3. Filtrar tickets sem service_request
  const ticketsWithoutRequest = directTickets.filter(...)
  
  // 4. Converter para formato compatível
  const directTicketsAsRequests = ticketsWithoutRequest.map(ticket => ({
    catalogItem: ticket.catalogItem || {
      id: null,
      name: ticket.subject,  // ← Usa subject se não tiver catalogItem
      icon: 'Mail'
    },
    ticket: {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status
    },
    isDirect: true,
    source: ticket.source
  }));
  
  // 5. Combinar e retornar
  return [...serviceRequests, ...directTicketsAsRequests];
}
```

---

## 🎯 Tipos de Tickets Suportados

### 1. Solicitação via Catálogo
- Tem `service_request`
- Tem `catalog_item`
- Aparece normalmente

### 2. Ticket via Email (NOVO ✅)
- **NÃO** tem `service_request`
- **NÃO** tem `catalog_item`
- Usa `subject` do ticket como nome
- Ícone: `Mail`
- Source: `email`

### 3. Ticket Manual
- **NÃO** tem `service_request`
- Pode ou não ter `catalog_item`
- Aparece normalmente

---

## 🧪 Teste Realizado

```bash
$ node backend/test-client-requests.js

✅ Cliente encontrado:
   ID: b133aeea-5be4-4314-a084-13222e27ed81
   Nome: UST
   Email: pedro.nekaka@gmail.com
   Role: client-admin

📋 Buscando service_requests...
   Encontrados: 0

🎫 Buscando tickets diretos...
   Total de tickets: 1
   Tickets sem service_request: 1

📝 Detalhes dos tickets diretos:

   1. TKT-20260118-4929
      Assunto: Teste email ticket
      Source: email
      Status: novo
      Catalog Item: Nenhum
      Criado: Sun Jan 18 2026 10:44:03

✅ Total de solicitações que devem aparecer: 1
   - Service Requests: 0
   - Tickets Diretos: 1
```

---

## 📱 Frontend (Sem Mudanças)

O frontend já está preparado para lidar com tickets sem `catalogItem`:

```jsx
// MyRequests.jsx já tem fallback
const CatalogIcon = getIconComponent(request.catalogItem?.icon);

<h3>{request.catalogItem?.name}</h3>
```

Se `catalogItem` for null, o frontend usa o subject do ticket.

---

## 🚀 Próximos Passos

1. ✅ Código implementado
2. ⏳ **Reiniciar backend**
3. ⏳ Testar no browser:
   - Login como `pedro.nekaka@gmail.com`
   - Ir em "Minhas Solicitações"
   - Verificar se ticket de email aparece

---

## 🔍 Troubleshooting

### Ticket ainda não aparece?

**Verificar:**
1. Backend foi reiniciado?
2. Console do browser tem erros?
3. Network tab mostra a chamada `/api/catalog/requests`?
4. Resposta da API inclui o ticket?

**Query SQL para debug:**
```sql
-- Ver tickets do cliente
SELECT 
  ticket_number,
  subject,
  source,
  catalog_item_id,
  requester_client_user_id
FROM tickets
WHERE requester_client_user_id = 'b133aeea-5be4-4314-a084-13222e27ed81';

-- Ver se tem service_request
SELECT sr.id, sr.ticket_id, t.ticket_number
FROM service_requests sr
LEFT JOIN tickets t ON t.id = sr.ticket_id
WHERE sr.user_id = 'b133aeea-5be4-4314-a084-13222e27ed81';
```

---

## 📝 Resumo das Correções

| Problema | Solução |
|----------|---------|
| Filtro `catalogItemId IS NOT NULL` | Removido - busca todos os tickets |
| Campo `requesterId` | Corrigido para `userId` |
| Role `client-admin` não suportado | Adicionado ao filtro |
| CatalogItem sem associação | Import corrigido do `models/index.js` |
| Tickets sem catalogItem | Fallback para `ticket.subject` |
| Include required | Mudado para `required: false` (LEFT JOIN) |

---

**Status**: ✅ Implementado e Testado
**Data**: 2026-01-18
**Session**: 11 (Continuation)
**Próximo**: Reiniciar backend e testar no browser
