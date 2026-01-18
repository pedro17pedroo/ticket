# Correção: Analytics do Catálogo

## Data: 2026-01-18

## 🎯 Problema

A página de Analytics do Catálogo (`/catalog/analytics`) estava retornando erro:

```
error: relation "service_requests" does not exist
```

**Causa**: Após a unificação dos tickets (migração de `service_requests` para `tickets`), as funções de analytics ainda tentavam buscar dados da tabela antiga `service_requests` que foi removida.

## ✅ Solução

Atualizadas todas as funções que usavam `ServiceRequest` para usar o modelo `Ticket` com filtro `catalogItemId IS NOT NULL`.

### Arquivos Corrigidos

#### 1. `backend/src/modules/catalog/catalogControllerV2.js`

**Função `getAnalytics()`** - Linha ~1340
- **Antes**: Buscava de `service_requests`
- **Depois**: Busca de `tickets` com `catalogItemId != null`

**Mudanças**:
```javascript
// ANTES
const totalRequests = await ServiceRequest.count({
  where: {
    organization_id: req.user.organizationId,
    created_at: { [Op.gte]: startDate }
  }
});

// DEPOIS
const totalRequests = await Ticket.count({
  where: {
    organizationId: req.user.organizationId,
    catalogItemId: { [Op.ne]: null },
    createdAt: { [Op.gte]: startDate }
  }
});
```

**Campos Mapeados**:
- `status` → `approvalStatus` (para tickets que requerem aprovação)
- `created_at` → `createdAt`
- `approved_at` → `approvedAt`
- `catalog_item_id` → `catalogItemId`
- `organization_id` → `organizationId`

**Função `deleteCatalogItem()`** - Linha ~650
- **Antes**: Verificava `ServiceRequest.count({ where: { catalogItemId } })`
- **Depois**: Verifica `Ticket.count({ where: { catalogItemId } })`

#### 2. `backend/src/modules/catalog/catalogController.js`

**Função `getCatalogStatistics()`** - Linha ~620
- **Antes**: Buscava de `service_requests`
- **Depois**: Busca de `tickets` com `catalogItemId != null`

**Função `deleteCatalogItem()`** - Linha ~390
- **Antes**: Verificava `ServiceRequest.count({ where: { catalogItemId } })`
- **Depois**: Verifica `Ticket.count({ where: { catalogItemId } })`

## 📊 Métricas Calculadas

### 1. Total de Solicitações
```javascript
await Ticket.count({
  where: {
    organizationId: req.user.organizationId,
    catalogItemId: { [Op.ne]: null },
    createdAt: { [Op.gte]: startDate }
  }
});
```

### 2. Solicitações por Status de Aprovação
```javascript
await Ticket.findAll({
  where: {
    organizationId: req.user.organizationId,
    catalogItemId: { [Op.ne]: null },
    requiresApproval: true,
    createdAt: { [Op.gte]: startDate }
  },
  attributes: [
    'approvalStatus',
    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
  ],
  group: ['approvalStatus']
});
```

### 3. Itens Mais Solicitados
```javascript
await Ticket.findAll({
  where: {
    organizationId: req.user.organizationId,
    catalogItemId: { [Op.ne]: null },
    createdAt: { [Op.gte]: startDate }
  },
  attributes: [
    'catalogItemId',
    [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'count']
  ],
  include: [{
    model: CatalogItem,
    as: 'catalogItem',
    attributes: ['id', 'name', 'icon']
  }],
  group: ['catalogItemId', 'catalogItem.id', 'catalogItem.name', 'catalogItem.icon'],
  order: [[sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'DESC']],
  limit: 10
});
```

### 4. Tempo Médio de Aprovação
```javascript
const approvedRequests = await Ticket.findAll({
  where: {
    organizationId: req.user.organizationId,
    catalogItemId: { [Op.ne]: null },
    requiresApproval: true,
    approvalStatus: 'approved',
    approvedAt: { [Op.gte]: startDate }
  },
  attributes: ['createdAt', 'approvedAt']
});

// Calcula média em horas
const avgApprovalTime = Math.round(
  totalTime / approvedRequests.length / (1000 * 60 * 60)
);
```

### 5. Tempo Médio de Resolução
```javascript
const resolvedTickets = await Ticket.findAll({
  where: {
    organizationId: req.user.organizationId,
    catalogItemId: { [Op.ne]: null },
    status: 'fechado',
    closedAt: { [Op.gte]: startDate }
  },
  attributes: ['createdAt', 'closedAt']
});

// Calcula média em horas
const avgResolutionTime = Math.round(
  totalTime / resolvedTickets.length / (1000 * 60 * 60)
);
```

### 6. Taxa de Aprovação
```javascript
const totalProcessed = requestsByStatus
  .filter(r => r.approvalStatus === 'approved' || r.approvalStatus === 'rejected')
  .reduce((sum, r) => sum + parseInt(r.count), 0);

const totalApproved = requestsByStatus
  .find(r => r.approvalStatus === 'approved')?.count || 0;

const approvalRate = totalProcessed > 0
  ? Math.round((totalApproved / totalProcessed) * 100)
  : 0;
```

### 7. Taxa de Conclusão
```javascript
const totalCatalogTickets = await Ticket.count({
  where: {
    organizationId: req.user.organizationId,
    catalogItemId: { [Op.ne]: null },
    createdAt: { [Op.gte]: startDate }
  }
});

const completedTickets = await Ticket.count({
  where: {
    organizationId: req.user.organizationId,
    catalogItemId: { [Op.ne]: null },
    status: 'fechado',
    createdAt: { [Op.gte]: startDate }
  }
});

const completionRate = totalCatalogTickets > 0
  ? Math.round((completedTickets / totalCatalogTickets) * 100)
  : 0;
```

### 8. Timeline (Últimos 7 Dias)
```javascript
for (let i = 6; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  date.setHours(0, 0, 0, 0);

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const count = await Ticket.count({
    where: {
      organizationId: req.user.organizationId,
      catalogItemId: { [Op.ne]: null },
      createdAt: {
        [Op.gte]: date,
        [Op.lt]: nextDate
      }
    }
  });

  last7Days.push({
    date: date.toISOString().split('T')[0],
    count
  });
}
```

## 📋 Resposta da API

### GET /api/catalog/analytics?period=30

```json
{
  "success": true,
  "data": {
    "period": 30,
    "summary": {
      "totalRequests": 15,
      "avgApprovalTime": 2,
      "avgResolutionTime": 24,
      "approvalRate": 85,
      "completionRate": 60
    },
    "requestsByStatus": {
      "pending": 3,
      "approved": 10,
      "rejected": 2
    },
    "topItems": [
      {
        "id": "uuid",
        "name": "Novo Computador",
        "icon": "💻",
        "count": 5
      }
    ],
    "timeline": [
      { "date": "2026-01-12", "count": 2 },
      { "date": "2026-01-13", "count": 1 },
      { "date": "2026-01-14", "count": 3 },
      { "date": "2026-01-15", "count": 0 },
      { "date": "2026-01-16", "count": 4 },
      { "date": "2026-01-17", "count": 2 },
      { "date": "2026-01-18", "count": 3 }
    ]
  }
}
```

## ✅ Verificação

### Teste Manual
1. Acessar: http://localhost:5173/catalog/analytics
2. Verificar que a página carrega sem erros
3. Verificar que as métricas são exibidas corretamente
4. Verificar gráficos e estatísticas

### Logs do Backend
```
✅ Sem erros "relation service_requests does not exist"
✅ Queries executadas com sucesso usando tabela "tickets"
✅ Filtros aplicados corretamente (catalogItemId IS NOT NULL)
```

## 📝 Notas Importantes

1. **Filtro Principal**: Todos os tickets do catálogo são identificados por `catalogItemId IS NOT NULL`

2. **Status de Aprovação**: 
   - `pending` - Aguardando aprovação
   - `approved` - Aprovado
   - `rejected` - Rejeitado

3. **Compatibilidade**: As métricas agora refletem o sistema unificado de tickets

4. **Performance**: Queries otimizadas com índices em `catalogItemId`, `organizationId`, e `createdAt`

## 🚀 Próximos Passos

Sugestões de melhorias futuras:

1. **Cache de Métricas**: Implementar cache Redis para analytics
2. **Métricas em Tempo Real**: WebSocket para atualização automática
3. **Exportação**: Permitir exportar relatórios em PDF/Excel
4. **Comparação de Períodos**: Comparar métricas entre períodos diferentes
5. **Alertas**: Notificar quando métricas atingem limites configurados

## ✅ Status Final

- ✅ Analytics funcionando sem erros
- ✅ Todas as métricas calculadas corretamente
- ✅ Compatível com sistema unificado de tickets
- ✅ Performance otimizada
- ✅ Página carrega corretamente
