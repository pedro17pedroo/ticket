# Correção do Filtro "Solicitante"

## Data: 04/04/2026

## Problema Identificado

O filtro "Solicitante" estava usando o campo `requesterId` em vez de `clientId`, causando incompatibilidade com o backend que espera `clientId` para filtrar tickets por empresa cliente.

## Objetivo do Filtro

Filtrar tickets de uma empresa cliente específica pertencente à organização.

## Correções Realizadas

### 1. Estado Inicial dos Filtros

**Arquivo:** `portalOrganizaçãoTenant/src/components/AdvancedSearch.jsx`

**Antes:**
```javascript
const [filters, setFilters] = useState({
  // ...
  requesterId: '',  // ❌ Campo incorreto
  // ...
});
```

**Depois:**
```javascript
const [filters, setFilters] = useState({
  // ...
  clientId: '',  // ✅ Campo correto
  // ...
});
```

### 2. Select de Solicitante

**Arquivo:** `portalOrganizaçãoTenant/src/components/AdvancedSearch.jsx`

**Antes:**
```javascript
<select
  value={filters.requesterId}  // ❌ Campo incorreto
  onChange={(e) => handleFilterChange('requesterId', e.target.value)}
  // ...
>
```

**Depois:**
```javascript
<select
  value={filters.clientId}  // ✅ Campo correto
  onChange={(e) => handleFilterChange('clientId', e.target.value)}
  // ...
>
```

## Como Funciona

### Fluxo do Filtro

1. **Carregamento de Dados:**
   - Endpoint: `GET /api/clients-b2b`
   - Retorna: Lista de empresas clientes da organização

2. **Seleção do Usuário:**
   - Usuário seleciona uma empresa cliente no dropdown
   - Frontend envia: `clientId: "uuid-da-empresa"`

3. **Processamento no Backend:**
   ```javascript
   // backend/src/modules/tickets/ticketController.js
   if (clientId) where.clientId = clientId;
   ```
   - Backend filtra: `WHERE clientId = 'uuid-da-empresa'`

### Estrutura do Ticket

```javascript
// backend/src/modules/tickets/ticketModel.js
clientId: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'clients',
    key: 'id'
  },
  comment: 'Empresa cliente - preenchido quando requester é um client_user'
}
```

## Endpoint de Clientes

**Endpoint:** `GET /api/clients-b2b`

**Retorna:** Lista de empresas clientes (Client) da organização

**Estrutura:**
```json
{
  "success": true,
  "clients": [
    {
      "id": "uuid",
      "name": "Nome da Empresa Cliente",
      "email": "contato@empresa.com",
      "organizationId": "uuid-org"
    }
  ]
}
```

## Diferença entre Campos

### clientId (Correto para este filtro)
- **Tipo:** UUID da empresa cliente
- **Uso:** Filtrar todos os tickets de uma empresa cliente específica
- **Exemplo:** Todos os tickets da empresa "ACME Corp"

### requesterClientUserId (Outro campo)
- **Tipo:** UUID do usuário específico
- **Uso:** Filtrar tickets de um usuário específico de uma empresa cliente
- **Exemplo:** Tickets criados por "João Silva" da empresa "ACME Corp"

### requesterOrgUserId (Outro campo)
- **Tipo:** UUID do usuário da organização
- **Uso:** Filtrar tickets criados por usuários internos da organização
- **Exemplo:** Tickets criados pelo agente "Maria Santos"

## Impacto

✅ Filtro "Solicitante" agora funciona corretamente
✅ Filtra tickets por empresa cliente
✅ Compatibilidade com backend estabelecida
✅ Dropdown carrega empresas clientes corretamente

## Arquivos Modificados

1. `portalOrganizaçãoTenant/src/components/AdvancedSearch.jsx`
   - Linha ~17: Estado inicial - `requesterId` → `clientId`
   - Linha ~236-237: Select value e onChange - `requesterId` → `clientId`
