# Debug: Relatórios Não Aparecem Mesmo Com Tempo Trabalhado

## Situação

- ✅ Ticket TKT-20260309-4344 existe
- ✅ Ticket tem responsável atribuído
- ✅ Ticket está em progresso
- ✅ Ticket tem 10h 3m de tempo trabalhado (visível na interface)
- ❌ Dashboard de relatórios mostra 0 em todos os cards
- ❌ Nenhum gráfico aparece

## Possíveis Causas

### 1. Dados em Tabela Diferente

O tempo pode estar salvo em `time_entries` (novo modelo) em vez de `time_tracking` (modelo antigo).

**Verificação:**
```sql
-- Ver registros em time_entries
SELECT COUNT(*) FROM time_entries;

-- Ver registros em time_tracking
SELECT COUNT(*) FROM time_tracking;
```

### 2. OrganizationId Diferente

O `organizationId` do usuário logado pode ser diferente do `organizationId` dos registros de tempo.

**Verificação:**
```sql
-- Ver organizationId do ticket
SELECT "organizationId" FROM tickets WHERE "ticketNumber" = 'TKT-20260309-4344';

-- Ver organizationId dos registros de tempo
SELECT DISTINCT "organizationId" FROM time_tracking;
SELECT DISTINCT "organizationId" FROM time_entries;
```

### 3. Associação de Modelo Incorreta

O controller pode estar usando o modelo errado ou a associação pode estar quebrada.

### 4. Filtro de Data

O dashboard usa filtro de período (últimos 30 dias por padrão). Se o tempo foi registrado há mais de 30 dias, não aparecerá.

## Scripts de Diagnóstico

### Script 1: Verificar Dados no Banco

```bash
cd backend
psql -U postgres -d tdesk -f debug-relatorios.sql
```

### Script 2: Testar Query do Relatório

```bash
cd backend
node test-relatorios-query.js
```

Este script irá:
1. Buscar todos os registros de time_tracking
2. Encontrar o ticket TKT-20260309-4344
3. Executar a mesma query que o controller usa
4. Mostrar por que não está retornando dados

## Verificação Manual

### Passo 1: Verificar Tabelas

```sql
-- 1. Ver se time_tracking tem dados
SELECT 
  tt.id,
  tt."ticketId",
  tt."totalSeconds",
  tt.status,
  t."ticketNumber"
FROM time_tracking tt
LEFT JOIN tickets t ON tt."ticketId" = t.id
ORDER BY tt."createdAt" DESC
LIMIT 5;

-- 2. Ver se time_entries tem dados
SELECT 
  te.id,
  te."ticketId",
  te.duration,
  te.status,
  t."ticketNumber"
FROM time_entries te
LEFT JOIN tickets t ON te."ticketId" = t.id
WHERE te.status = 'stopped'
ORDER BY te."createdAt" DESC
LIMIT 5;
```

### Passo 2: Verificar OrganizationId

```sql
-- Ver organizationId do usuário logado
-- (você precisa saber o email do usuário)
SELECT id, email, "organizationId" 
FROM organization_users 
WHERE email = 'SEU_EMAIL@example.com';

-- Ver organizationId dos registros de tempo
SELECT DISTINCT 
  tt."organizationId",
  COUNT(*) as count
FROM time_tracking tt
GROUP BY tt."organizationId";
```

### Passo 3: Verificar Ticket Específico

```sql
-- Ver dados do ticket TKT-20260309-4344
SELECT 
  t.id,
  t."ticketNumber",
  t."organizationId",
  t.status,
  COUNT(tt.id) as time_tracking_count,
  COUNT(te.id) as time_entries_count
FROM tickets t
LEFT JOIN time_tracking tt ON t.id = tt."ticketId"
LEFT JOIN time_entries te ON t.id = te."ticketId" AND te.status = 'stopped'
WHERE t."ticketNumber" = 'TKT-20260309-4344'
GROUP BY t.id, t."ticketNumber", t."organizationId", t.status;
```

## Solução Mais Provável

### Problema: Controller Usa `time_tracking` Mas Dados Estão em `time_entries`

O sistema tem dois modelos de tempo:
- **`time_tracking`** - Modelo antigo (usado pelos relatórios)
- **`time_entries`** - Modelo novo (usado pelo TimeTracker)

Se o tempo foi registrado usando o modelo novo (`time_entries`), o controller de relatórios não vai encontrar porque está buscando em `time_tracking`.

### Solução: Atualizar Controller de Relatórios

O controller precisa ser atualizado para buscar dados de `time_entries` em vez de `time_tracking`.

**Arquivo:** `backend/src/modules/reports/reportsController.js`

**Mudança necessária:**
```javascript
// ANTES:
import TimeTracking from '../timeTracking/timeTrackingModel.js';

const report = await TimeTracking.findAll({
  where: whereClause,
  // ...
});

// DEPOIS:
import TimeEntry from '../tickets/timeEntryModel.js';

const report = await TimeEntry.findAll({
  where: {
    ...whereClause,
    status: 'stopped', // Apenas timers parados
    isActive: false    // Apenas finalizados
  },
  // ...
});
```

## Próximos Passos

1. **Executar script de diagnóstico:**
   ```bash
   cd backend
   node test-relatorios-query.js
   ```

2. **Verificar resultado:**
   - Se mostrar "0 registros" em `time_tracking` → Dados estão em `time_entries`
   - Se mostrar registros mas query não retorna → Problema de associação/filtro
   - Se mostrar organizationId diferente → Problema de contexto

3. **Aplicar correção apropriada** baseado no diagnóstico

## Arquivos Criados

- `backend/debug-relatorios.sql` - Queries SQL para diagnóstico
- `backend/test-relatorios-query.js` - Script Node.js para testar query
- `DEBUG-RELATORIOS-NAO-APARECEM.md` - Este documento

## Executar Diagnóstico

```bash
# 1. Testar query do relatório
cd backend
node test-relatorios-query.js

# 2. Ver output e identificar problema
# O script mostrará exatamente onde está o problema

# 3. Verificar no banco diretamente
psql -U postgres -d tdesk
\i debug-relatorios.sql
```

## Resultado Esperado

O script de teste deve mostrar:
- ✅ Quantos registros existem em time_tracking
- ✅ Se o ticket TKT-20260309-4344 foi encontrado
- ✅ Se a query retorna resultados
- ✅ Se não retorna, qual é o motivo (organizationId, associação, etc.)

Com essa informação, podemos aplicar a correção correta.
