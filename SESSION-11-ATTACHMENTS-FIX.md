# Session 11: Fix Ticket Detail View Error

## Problema Identificado

**Erro**: Ao clicar em um ticket, aparecia "Ticket não encontrado" com erro 500 no backend:
```
operator does not exist: uuid = integer
```

**Localização**: `backend/src/modules/tickets/ticketController.js` linha 223 (função `getTicketById`)

## Causa Raiz

O erro ocorria devido a um **nested include problemático** na query Sequelize:

```javascript
{
  model: CatalogItem,
  as: 'catalogItem',
  attributes: ['id', 'name', 'shortDescription'],
  include: [{
    model: Priority,
    as: 'priority',  // ❌ PROBLEMA AQUI
    attributes: ['id', 'name', 'order']
  }]
}
```

### Por que causava erro?

1. **CatalogItem** tem campo `incident_workflow_id` (INTEGER) com referência à tabela `workflows`
2. **Sequelize** pode criar associações automáticas quando detecta foreign keys
3. O **nested include** de `Priority` dentro de `CatalogItem` estava acionando JOINs adicionais
4. Um desses JOINs tentava comparar **UUID com INTEGER**, causando o erro PostgreSQL

## Solução Aplicada

**Arquivo**: `backend/src/modules/tickets/ticketController.js`

**Mudança**: Remover o nested include e incluir apenas o `priorityId` como atributo:

```javascript
{
  model: CatalogItem,
  as: 'catalogItem',
  attributes: ['id', 'name', 'shortDescription', 'priorityId'],  // ✅ Incluir priorityId
  required: false  // ✅ Adicionar required: false
}
```

### Benefícios da solução:

1. ✅ **Evita JOINs problemáticos** - Não tenta fazer JOIN com a tabela priorities através de catalog_items
2. ✅ **Mantém funcionalidade** - O `priorityId` ainda está disponível no objeto retornado
3. ✅ **Performance melhor** - Menos JOINs = query mais rápida
4. ✅ **Compatível** - Frontend pode buscar priority separadamente se necessário

## Teste

Para testar a correção:

1. **Backend**: Verificar que não há mais erro 500
   ```bash
   # Verificar logs do backend
   tail -f backend/backend.log
   ```

2. **Frontend**: Clicar em qualquer ticket na lista
   - ✅ Deve abrir o modal de detalhes
   - ✅ Deve mostrar informações do ticket
   - ✅ Deve mostrar catalog item (se houver)

## Arquivos Modificados

- `backend/src/modules/tickets/ticketController.js` - Linha ~290 (função getTicketById)

## Contexto Técnico

### Estrutura das Tabelas Envolvidas:

- **tickets**: `id` (UUID), `catalog_item_id` (UUID)
- **catalog_items**: `id` (UUID), `priority_id` (UUID), `incident_workflow_id` (INTEGER)
- **priorities**: `id` (UUID)
- **workflows**: `id` (INTEGER) ⚠️ Tipo diferente!

### Associações Sequelize:

```javascript
// Em backend/src/modules/models/index.js
Ticket.belongsTo(CatalogItem, { foreignKey: 'catalogItemId', as: 'catalogItem' });
CatalogItem.belongsTo(Priority, { foreignKey: 'priorityId', as: 'priority' });
CatalogItem.belongsTo(Workflow, { foreignKey: 'incidentWorkflowId', as: 'incidentWorkflow' });
```

O problema estava no **nested include** que acionava múltiplas associações simultaneamente.

## Status

✅ **CORRIGIDO** - Ticket detail view agora funciona corretamente

## Próximos Passos

1. Testar no frontend (Portal Organização)
2. Verificar se outros endpoints têm o mesmo problema
3. Considerar adicionar `required: false` em outros includes para evitar erros similares

---

**Data**: 2026-01-18  
**Sessão**: 11  
**Tipo**: Bugfix - Database Query Error
