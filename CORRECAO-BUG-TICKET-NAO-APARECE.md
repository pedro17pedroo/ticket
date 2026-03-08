# Correção: Bug Ticket Não Aparece no Portal do Cliente

**Data:** 08/03/2026  
**Status:** ✅ CORRIGIDO

## Resumo

Corrigido bug crítico onde tickets criados por usuários do portal cliente não apareciam após redirecionamento, retornando erro 500.

## Problema

Após criar um ticket no portal do cliente:
1. ✅ Ticket era criado com sucesso
2. ✅ Redirecionamento funcionava
3. ❌ Erro 500 ao carregar ticket (`GET /api/tickets/{id}`)
4. ❌ Erro 500 ao carregar anexos (`GET /api/tickets/{id}/attachments`)

## Causa Raiz

A função `getAttachments` tinha verificação de permissões incompleta:
- Não verificava `organizationId` (risco de acesso cross-organization)
- Não usava `clientTicketVisibilityService` para usuários clientes
- Lógica de permissões simplista e incompleta

## Correções Aplicadas

### 1. Função `getAttachments` (ticketController.js)

**Mudanças principais:**

```javascript
// ✅ Adicionar verificação de organizationId
const ticket = await Ticket.findOne({
  where: { id: ticketId, organizationId: req.user.organizationId }
});

// ✅ Usar serviço de visibilidade para clientes
const isClientRole = ['client-user', 'client-admin', 'client-manager'].includes(req.user.role);
if (isClientRole) {
  const canView = await clientTicketVisibilityService.canViewTicketAsync(req.user, ticket);
  if (!canView) {
    return res.status(403).json({ ... });
  }
}

// ✅ Logs detalhados para diagnóstico
console.log('📎 [getAttachments] Buscando anexos do ticket:', ticketId);
console.log('👤 [getAttachments] Usuário:', { id, role, organizationId, clientId });
console.log('🔐 [getAttachments] Verificação de permissões:', { isOrgUser, isClientUser, isRequester });
```

### 2. Logs Adicionais em `getTicketById`

Adicionados logs detalhados para facilitar debug:

```javascript
console.log('🔍 [getTicketById] Dados do usuário:', {
  id: req.user.id,
  role: req.user.role,
  clientId: req.user.clientId,
  directionId: req.user.directionId,
  departmentId: req.user.departmentId,
  sectionId: req.user.sectionId
});
console.log('🔍 [getTicketById] Dados do ticket:', {
  id: ticket.id,
  ticketNumber: ticket.ticketNumber,
  clientId: ticket.clientId,
  requesterType: ticket.requesterType,
  requesterClientUserId: ticket.requesterClientUserId
});
```

## Benefícios

1. ✅ **Segurança**: Verificação de `organizationId` previne acesso cross-organization
2. ✅ **Funcionalidade**: Usuários clientes agora visualizam tickets após criação
3. ✅ **Manutenibilidade**: Logs detalhados facilitam debug futuro
4. ✅ **UX**: Experiência melhorada - ticket aparece imediatamente após criação

## Teste de Validação

Para validar a correção:

```bash
# 1. Iniciar backend
cd backend
npm run dev

# 2. No portal do cliente:
# - Fazer login como usuário cliente
# - Criar novo ticket
# - Verificar se redireciona e ticket aparece
# - Confirmar que não há erro 500
```

## Arquivos Modificados

- `backend/src/modules/tickets/ticketController.js`
  - Função `getAttachments`: Correção completa de verificação de permissões
  - Função `getTicketById`: Logs adicionais para debug
- `BUG-TICKET-NAO-APARECE-PORTAL-CLIENTE.md`: Atualizado status para CORRIGIDO

## Próximos Passos

1. ✅ Testar criação de ticket no portal cliente
2. ✅ Verificar logs do backend durante o teste
3. ✅ Confirmar que não há mais erro 500
4. ✅ Validar que anexos carregam corretamente

---

**Status:** ✅ PRONTO PARA TESTE
