# Correção de Erros no Backend de Relatórios

## Problemas Identificados

### 1. Erro "Cannot access 'exportToPDF' before initialization" (Frontend)
- **Status:** ✅ Resolvido
- **Causa:** Export default estava antes da declaração da função
- **Solução:** Reorganizado o arquivo `reportsService.js` com export default no final
- **Ação:** Cache do Vite limpo com `rm -rf node_modules/.vite`

### 2. Erros SQL no Backend (Nomes de Colunas)
- **Status:** ✅ Resolvido
- **Erros encontrados:**
  ```
  error: column "ticketId" does not exist
  error: column TimeTracking.userId does not exist
  ```

## Causa Raiz dos Erros SQL

O controller de relatórios estava usando nomes de atributos do modelo Sequelize nas funções SQL `col()`, mas quando usamos o prefixo do modelo (ex: `TimeTracking.userId`), o Sequelize NÃO faz a conversão automática de camelCase para snake_case.

**Regra Importante:** Dentro de funções SQL (`fn`, `col`), sempre use os nomes das colunas do banco (snake_case), não os atributos do modelo (camelCase).

- ❌ Errado: `col('TimeTracking.userId')` - atributo do modelo
- ❌ Errado: `col('TimeTracking.ticketId')` - atributo do modelo  
- ❌ Errado: `col('TimeTracking.totalSeconds')` - atributo do modelo
- ✅ Correto: `col('TimeTracking.user_id')` - nome da coluna no banco
- ✅ Correto: `col('TimeTracking.ticket_id')` - nome da coluna no banco
- ✅ Correto: `col('TimeTracking.total_seconds')` - nome da coluna no banco

## Correções Implementadas

### Arquivo: `backend/src/modules/reports/reportsController.js`

#### 1. Função `getHoursByTicket` (Linha ~36)
```javascript
// ANTES (ERRADO):
[fn('COUNT', fn('DISTINCT', col('TimeTracking.userId'))), 'totalUsers'],
[fn('SUM', col('TimeTracking.totalSeconds')), 'totalSeconds'],

// DEPOIS (CORRETO):
[fn('COUNT', fn('DISTINCT', col('TimeTracking.user_id'))), 'totalUsers'],
[fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
```

#### 2. Função `getHoursByUser` (Linha ~119)
```javascript
// ANTES (ERRADO):
[fn('COUNT', fn('DISTINCT', col('TimeTracking.ticketId'))), 'totalTickets'],
[fn('SUM', col('TimeTracking.totalSeconds')), 'totalSeconds'],

// DEPOIS (CORRETO):
[fn('COUNT', fn('DISTINCT', col('TimeTracking.ticket_id'))), 'totalTickets'],
[fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
```

#### 3. Função `getHoursByClient` (Linha ~270)
```javascript
// ANTES (ERRADO):
[fn('COUNT', fn('DISTINCT', col('TimeTracking.userId'))), 'totalUsers'],
[fn('SUM', col('TimeTracking.totalSeconds')), 'totalSeconds'],

// DEPOIS (CORRETO):
[fn('COUNT', fn('DISTINCT', col('TimeTracking.user_id'))), 'totalUsers'],
[fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
```

#### 4. Correções no ORDER BY (3 funções)
```javascript
// ANTES (ERRADO):
order: [[fn('SUM', col('TimeTracking.totalSeconds')), 'DESC']]

// DEPOIS (CORRETO):
order: [[fn('SUM', col('TimeTracking.total_seconds')), 'DESC']]
```

## Modelo TimeTracking

O modelo usa camelCase para os atributos:
```javascript
{
  id: UUID,
  ticketId: UUID,        // ← camelCase
  userId: UUID,          // ← camelCase
  organizationId: UUID,  // ← camelCase
  startTime: DATE,
  endTime: DATE,
  totalSeconds: INTEGER, // ← camelCase
  status: ENUM,
  // ...
}
```

O Sequelize mapeia automaticamente para snake_case no banco:
- `ticketId` → `ticket_id`
- `userId` → `user_id`
- `totalSeconds` → `total_seconds`

## Regra Importante

Ao usar `col()` em queries Sequelize com agregações:
- ✅ Use o nome da coluna do banco (snake_case) quando usar prefixo do modelo
- ✅ Exemplo correto: `col('TimeTracking.user_id')`
- ❌ Não use o nome do atributo do modelo: `col('TimeTracking.userId')`

**Por quê?** O Sequelize só faz a conversão automática de camelCase → snake_case nos atributos do `where`, `attributes` (sem funções), etc. Dentro de funções SQL como `fn()` e `col()`, você precisa usar os nomes reais das colunas do banco.

## Teste

Para testar as correções:

1. Reiniciar o backend (se necessário)
2. Acessar: http://localhost:5173/reports/time
3. Selecionar período e gerar relatórios
4. Verificar que não há mais erros SQL no console do backend

## Arquivos Modificados

- ✅ `backend/src/modules/reports/reportsController.js` - Corrigidos nomes de colunas
- ✅ `portalOrganizaçãoTenant/src/services/reportsService.js` - Reorganizado export default

## Status Final

✅ Todos os erros corrigidos
✅ Backend deve funcionar corretamente agora
✅ Frontend com cache limpo
⏳ Aguardando teste na interface
