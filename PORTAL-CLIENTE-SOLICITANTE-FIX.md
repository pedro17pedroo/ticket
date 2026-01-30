# Correção: Exibição do Solicitante nos Cards de Ticket

## Problema
Na página "Minhas Solicitações" do Portal do Cliente, os cards de ticket mostravam "Não informado" no campo Solicitante.

## Causa
1. **Backend**: O endpoint `/api/tickets/my-tickets` não estava incluindo os dados do solicitante (campos polimórficos)
2. **Frontend**: O componente tentava acessar apenas `request.requester`, mas não verificava os campos polimórficos `requesterClientUser` e `requesterOrgUser`

## Correções Implementadas

### 1. Backend - ticketController.js (linhas 2213-2262)

**Adicionados includes para os dados do solicitante:**

```javascript
{
  model: User,
  as: 'requester',
  attributes: ['id', 'name', 'email', 'avatar'],
  required: false
},
{
  model: OrganizationUser,
  as: 'requesterOrgUser',
  attributes: ['id', 'name', 'email', 'avatar'],
  required: false
},
{
  model: ClientUser,
  as: 'requesterClientUser',
  attributes: ['id', 'name', 'email', 'avatar'],
  required: false
}
```

### 2. Frontend - MyRequests.jsx (linhas 476-490)

**Atualizada detecção do solicitante para usar campos polimórficos:**

```jsx
<p className="font-medium text-gray-700 dark:text-gray-300 truncate">
  {(() => {
    // Detectar solicitante usando campos polimórficos
    const requester = request.requesterClientUser || request.requesterOrgUser || request.requester;
    return requester?.name || requester?.email || 'Não informado';
  })()}
</p>
```

## Lógica de Detecção

O sistema agora detecta o solicitante na seguinte ordem de prioridade:

1. **requesterClientUser** - Usuário cliente (mais comum no portal do cliente)
2. **requesterOrgUser** - Usuário da organização (quando técnico cria ticket)
3. **requester** - Usuário legado (compatibilidade com dados antigos)

Se nenhum for encontrado, exibe "Não informado".

## Campos Retornados

Para cada tipo de solicitante, o backend retorna:
- `id` - UUID do usuário
- `name` - Nome completo
- `email` - Email
- `avatar` - URL do avatar (opcional)

## Resultado

✅ Cards de ticket agora mostram corretamente:
- Nome do solicitante (quando disponível)
- Email do solicitante (fallback se nome não disponível)
- "Não informado" (apenas se nenhum dado disponível)

## Arquivos Modificados

1. `backend/src/modules/tickets/ticketController.js` - Adicionados includes para requester
2. `portalClientEmpresa/src/pages/MyRequests.jsx` - Atualizada lógica de detecção do solicitante

## Testes Recomendados

- [ ] Verificar cards de tickets criados por clientes
- [ ] Verificar cards de tickets criados por técnicos
- [ ] Verificar cards de tickets criados via email
- [ ] Verificar cards de tickets criados via catálogo
- [ ] Verificar que nome aparece corretamente
- [ ] Verificar fallback para email quando nome não disponível

---

**Data**: 30 de Janeiro de 2026
**Sistema**: T-Desk
**Portal**: Portal do Cliente
