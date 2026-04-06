# Correção do Filtro "Atribuído a"

## Data: 04/04/2026

## Problema Identificado

O filtro "Atribuído a" no componente AdvancedSearch não estava funcionando corretamente por dois motivos:

1. **Conflito de lógica:** Quando `ticketOriginFilter === 'all'`, o código removia o `assigneeId` dos parâmetros, mesmo que o usuário tivesse selecionado um valor no filtro avançado
2. **Valor incorreto:** O valor "unassigned" (não atribuído) não era convertido para "null" antes de enviar ao backend

## Correções Realizadas

### 1. Preservar assigneeId do Filtro Avançado

**Arquivo:** `portalOrganizaçãoTenant/src/pages/Tickets.jsx`

**Problema (antes):**
```javascript
} else {
  // Remover filtros quando 'all'
  delete params.hasCatalogItem
  delete params.assigneeId  // ❌ Remove mesmo se veio do filtro avançado
}
```

**Solução (depois):**
```javascript
} else {
  // Remover filtros quando 'all' - mas preservar assigneeId se veio do filtro avançado
  delete params.hasCatalogItem
  // Só remove assigneeId se não veio do filtro avançado
  if (!activeFilters.assigneeId) {
    delete params.assigneeId
  }
}
```

### 2. Converter "unassigned" para "null"

**Arquivo:** `portalOrganizaçãoTenant/src/pages/Tickets.jsx`

**Adicionado no início da função `loadTickets()`:**
```javascript
// Converter "unassigned" para "null" para o backend
if (params.assigneeId === 'unassigned') {
  params.assigneeId = 'null'
}
```

## Como Funciona Agora

### Fluxo do Filtro "Atribuído a"

1. **Usuário seleciona um agente no filtro avançado:**
   - Frontend envia: `assigneeId: "uuid-do-usuario"`
   - Backend filtra: `WHERE assigneeId = 'uuid-do-usuario'`

2. **Usuário seleciona "Não atribuído":**
   - Frontend envia: `assigneeId: "unassigned"`
   - Conversão: `assigneeId: "null"`
   - Backend filtra: `WHERE assigneeId IS NULL`

3. **Usuário seleciona "Todos":**
   - Frontend envia: `assigneeId: ""` (string vazia)
   - Backend ignora o filtro (não aplica WHERE)

### Integração com Abas de Filtro

- **Aba "Todos":** Respeita o filtro avançado de assigneeId
- **Aba "Solicitações":** Aplica `hasCatalogItem: true` + respeita assigneeId
- **Aba "Atribuídos a Mim":** Sobrescreve assigneeId com o ID do usuário logado

## Backend - Como Processa

```javascript
// backend/src/modules/tickets/ticketController.js (linha 44)
if (assigneeId) {
  where.assigneeId = assigneeId === 'null' ? null : assigneeId;
}
```

O backend converte a string `"null"` para `null` (valor SQL NULL) para buscar tickets não atribuídos.

## Endpoint de Usuários

**Endpoint:** `GET /api/users/assignable`

**Retorna:** Lista de `OrganizationUser` (usuários da organização) que podem ser atribuídos a tickets

**Estrutura:**
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "name": "Nome do Usuário",
      "email": "email@example.com",
      "role": "agent",
      "department": { "id": "uuid", "name": "TI" }
    }
  ]
}
```

## Impacto

✅ Filtro "Atribuído a" agora funciona corretamente
✅ Opção "Não atribuído" filtra tickets sem assignee
✅ Compatibilidade com abas de filtro (Todos, Solicitações, Atribuídos a Mim)
✅ Preserva seleção do usuário ao navegar entre abas

## Arquivos Modificados

1. `portalOrganizaçãoTenant/src/pages/Tickets.jsx`
   - Função `loadTickets()` (linhas ~84-110)
   - Adicionada conversão "unassigned" → "null"
   - Preservação de assigneeId do filtro avançado
