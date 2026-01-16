# Correção do Status "Aguardando Aprovação" no Kanban

## Problema Identificado

Ao arrastar tickets no Kanban para a coluna "Aguardando Aprovação", o sistema retornava erro 400:

```json
{
  "error": "Erro de validação",
  "details": [{
    "field": "status",
    "message": "\"status\" must be one of [novo, em_progresso, aguardando_cliente, resolvido, fechado]"
  }]
}
```

## Causa Raiz

O status `aguardando_aprovacao` estava:
- ✅ Definido no modelo do banco de dados (`ticketModel.js`)
- ✅ Implementado no frontend (Kanban)
- ❌ **FALTANDO** no schema de validação Joi (`validate.js`)

## Solução Aplicada

### Arquivo: `backend/src/middleware/validate.js`

Adicionado `aguardando_aprovacao` na lista de status válidos:

```javascript
updateTicket: Joi.object({
  subject: Joi.string().min(5).max(255).optional(),
  description: Joi.string().min(10).optional(),
  status: Joi.string().valid(
    'novo', 
    'aguardando_aprovacao',  // ✅ ADICIONADO
    'em_progresso', 
    'aguardando_cliente', 
    'resolvido', 
    'fechado'
  ).optional(),
  priority: Joi.string().optional(),
  assigneeId: Joi.string().uuid().allow(null).optional(),
  departmentId: Joi.string().uuid().allow(null).optional()
}),
```

## Validações Existentes

O sistema já possui validações de negócio para o status `aguardando_aprovacao`:

1. **Apenas para solicitações de serviço**: Tickets devem ter `catalogItemId`
2. **Apenas para serviços com aprovação**: O item do catálogo deve ter `requiresApproval = true`

Essas validações estão em `ticketController.js` (linhas 657-673) e continuam funcionando corretamente.

## Status

✅ **Corrigido e testado**
- Backend reiniciado com sucesso
- Validação Joi atualizada
- Sistema pronto para uso

## Como Testar

1. Acesse o Kanban: `http://localhost:5173/tickets/kanban`
2. Arraste um ticket de solicitação de serviço para "Aguardando Aprovação"
3. O ticket deve mudar de status sem erros
4. Tickets normais (sem `catalogItemId`) ainda serão bloqueados pela validação de negócio
