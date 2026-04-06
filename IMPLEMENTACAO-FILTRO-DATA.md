# Implementação do Filtro por Data

## Data: 04/04/2026

## Objetivo

Permitir filtrar tickets por período de criação usando os campos "Data De" e "Data Até".

## Implementação Realizada

### Backend - Processamento dos Filtros de Data

**Arquivo:** `backend/src/modules/tickets/ticketController.js`

**Adicionado:**

1. **Parâmetros de query:**
```javascript
const {
  // ... outros parâmetros
  dateFrom,
  dateTo
} = req.query;
```

2. **Lógica de filtro:**
```javascript
// Filtros de data
if (dateFrom || dateTo) {
  where.createdAt = {};
  if (dateFrom) {
    where.createdAt[Op.gte] = new Date(dateFrom);
  }
  if (dateTo) {
    // Adicionar 23:59:59 ao dateTo para incluir todo o dia
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    where.createdAt[Op.lte] = endDate;
  }
}
```

## Como Funciona

### Fluxo do Filtro

1. **Usuário seleciona datas:**
   - Data De: `04/01/2026`
   - Data Até: `04/04/2026`

2. **Frontend envia:**
   ```
   GET /api/tickets?dateFrom=2026-01-04&dateTo=2026-04-04
   ```

3. **Backend processa:**
   ```javascript
   WHERE createdAt >= '2026-01-04 00:00:00'
     AND createdAt <= '2026-04-04 23:59:59.999'
   ```

### Cenários Suportados

#### 1. Apenas Data De
- **Input:** `dateFrom=2026-01-04`
- **SQL:** `WHERE createdAt >= '2026-01-04 00:00:00'`
- **Resultado:** Todos os tickets criados a partir de 04/01/2026

#### 2. Apenas Data Até
- **Input:** `dateTo=2026-04-04`
- **SQL:** `WHERE createdAt <= '2026-04-04 23:59:59.999'`
- **Resultado:** Todos os tickets criados até 04/04/2026

#### 3. Período Completo
- **Input:** `dateFrom=2026-01-04&dateTo=2026-04-04`
- **SQL:** `WHERE createdAt >= '2026-01-04 00:00:00' AND createdAt <= '2026-04-04 23:59:59.999'`
- **Resultado:** Tickets criados entre 04/01/2026 e 04/04/2026 (inclusive)

## Detalhes Técnicos

### Ajuste de Horário no dateTo

O código adiciona `23:59:59.999` ao `dateTo` para incluir todo o dia:

```javascript
const endDate = new Date(dateTo);
endDate.setHours(23, 59, 59, 999);
where.createdAt[Op.lte] = endDate;
```

**Por quê?**
- Sem ajuste: `dateTo=2026-04-04` seria interpretado como `2026-04-04 00:00:00`
- Com ajuste: `dateTo=2026-04-04` vira `2026-04-04 23:59:59.999`
- Resultado: Inclui todos os tickets criados no dia 04/04/2026

### Operadores Sequelize

- `Op.gte` (Greater Than or Equal): `>=`
- `Op.lte` (Less Than or Equal): `<=`

### Campo Filtrado

- **Campo:** `createdAt` (data de criação do ticket)
- **Tipo:** `TIMESTAMP`
- **Formato:** ISO 8601 (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ss`)

## Frontend - Componente AdvancedSearch

**Arquivo:** `portalOrganizaçãoTenant/src/components/AdvancedSearch.jsx`

**Campos já existentes:**
```javascript
const [filters, setFilters] = useState({
  // ...
  dateFrom: '',
  dateTo: ''
});
```

**Inputs HTML:**
```jsx
{/* Date From */}
<div>
  <label className="block text-sm font-medium mb-2">Data De</label>
  <input
    type="date"
    value={filters.dateFrom}
    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
  />
</div>

{/* Date To */}
<div>
  <label className="block text-sm font-medium mb-2">Data Até</label>
  <input
    type="date"
    value={filters.dateTo}
    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
  />
</div>
```

## Exemplos de Uso

### Exemplo 1: Tickets do último mês
```
Data De: 04/03/2026
Data Até: 04/04/2026
```

### Exemplo 2: Tickets de 2026
```
Data De: 01/01/2026
Data Até: 31/12/2026
```

### Exemplo 3: Tickets até hoje
```
Data De: (vazio)
Data Até: 04/04/2026
```

### Exemplo 4: Tickets a partir de hoje
```
Data De: 04/04/2026
Data Até: (vazio)
```

## Combinação com Outros Filtros

Os filtros de data funcionam em conjunto com outros filtros:

```
GET /api/tickets?status=novo&priority=Alta&dateFrom=2026-01-04&dateTo=2026-04-04
```

**SQL gerado:**
```sql
WHERE organizationId = 'uuid'
  AND status = 'novo'
  AND priority = 'Alta'
  AND createdAt >= '2026-01-04 00:00:00'
  AND createdAt <= '2026-04-04 23:59:59.999'
```

## Impacto

✅ Filtro por data de criação implementado
✅ Suporta período completo, apenas início ou apenas fim
✅ Inclui todo o dia final (23:59:59)
✅ Compatível com outros filtros
✅ Frontend já preparado (inputs existentes)

## Arquivos Modificados

1. `backend/src/modules/tickets/ticketController.js`
   - Adicionados parâmetros `dateFrom` e `dateTo`
   - Implementada lógica de filtro por `createdAt`
   - Ajuste de horário para incluir todo o dia final
