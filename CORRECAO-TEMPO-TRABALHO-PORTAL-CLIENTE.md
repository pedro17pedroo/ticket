# Correção: Tempo de Trabalho não Aparece no Portal do Cliente

## Data: 2026-03-09

## Problema Relatado

No portal da organização o ticket já tem tempo de trabalho, mas no portal de cliente o tempo de trabalho continua 0, ou seja, não está sendo atualizado.

## Análise Realizada

### 1. Portal do Cliente - Componente TimeTrackerReadOnly

**Arquivo:** `portalClientEmpresa/src/components/TimeTrackerReadOnly.jsx`

O componente faz duas chamadas API:
```javascript
// 1. Buscar timer ativo
const { data: activeData } = await api.get(`/tickets/${ticketId}/timer/active`);

// 2. Buscar todos os timers (para calcular total trabalhado)
const { data: timersData } = await api.get(`/tickets/${ticketId}/timers`);
setTotalWorkedTime(timersData.totalSeconds || 0);
```

### 2. Backend - Rotas e Controller

**Arquivo:** `backend/src/routes/index.js` (linha 399)
```javascript
router.get('/tickets/:ticketId/timers', authenticate, validateContext, injectContext, timeTrackingController.getTicketTimers);
```
✅ Rota EXISTE e está registrada corretamente

**Arquivo:** `backend/src/modules/timeTracking/timeTrackingController.js` (linha 355)
```javascript
export const getTicketTimers = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const timers = await TimeEntry.findAll({
      where: {
        ticketId,
        organizationId: req.user.organizationId,
        isActive: false // ✅ Apenas timers finalizados
      },
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calcular total de horas
    const totalSeconds = timers
      .filter(t => t.duration)
      .reduce((sum, t) => sum + (t.duration || 0), 0);

    res.json({
      success: true,
      entries: timers,
      totalHours: (totalSeconds / 3600).toFixed(2),
      totalSeconds // ✅ Retorna totalSeconds
    });
  } catch (error) {
    next(error);
  }
};
```
✅ Função EXISTE e retorna `totalSeconds` corretamente

### 3. Possíveis Causas do Problema

#### Causa 1: Timer Ainda Ativo (Não Parado)
**Sintoma:** Tempo não aparece porque timer ainda está rodando  
**Motivo:** `getTicketTimers` só retorna timers com `isActive: false`  
**Solução:** Parar o timer no portal da organização

#### Causa 2: Permissões de Acesso
**Sintoma:** Cliente não tem permissão para ver timers  
**Motivo:** Middleware `validateContext` ou `injectContext` pode estar bloqueando  
**Solução:** Verificar se cliente tem acesso ao ticket

#### Causa 3: OrganizationId Diferente
**Sintoma:** Query não encontra timers porque organizationId não bate  
**Motivo:** Cliente pode estar em contexto diferente  
**Solução:** Verificar logs do backend

#### Causa 4: Status do Timer
**Sintoma:** Timer foi pausado mas não parado  
**Motivo:** `isActive: false` só é setado quando timer é PARADO, não pausado  
**Solução:** Parar o timer completamente

## Diagnóstico

### Passo 1: Verificar Status do Timer no Banco

```sql
SELECT 
  id, 
  "ticketId", 
  "userId", 
  "organizationId",
  "startTime",
  "endTime",
  duration,
  "isActive",
  status,
  "createdAt"
FROM time_entries
WHERE "ticketId" = 'UUID_DO_TICKET'
ORDER BY "createdAt" DESC;
```

**Verificar:**
- ✅ `isActive` deve ser `false` para aparecer no total
- ✅ `status` deve ser `'stopped'`
- ✅ `duration` deve ter valor (em segundos)
- ✅ `organizationId` deve bater com o do cliente

### Passo 2: Testar Endpoint Diretamente

```bash
# Como cliente, fazer login e obter token
# Depois testar:
curl -X GET "http://localhost:4003/api/tickets/UUID_DO_TICKET/timers" \
  -H "Authorization: Bearer TOKEN_DO_CLIENTE" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "entries": [
    {
      "id": "...",
      "ticketId": "...",
      "duration": 3600,
      "isActive": false,
      "status": "stopped"
    }
  ],
  "totalHours": "1.00",
  "totalSeconds": 3600
}
```

### Passo 3: Verificar Logs do Backend

```bash
# Reiniciar backend com logs
cd backend
npm run dev
```

Quando cliente acessar o ticket, verificar logs:
- ✅ Request chegou ao endpoint `/tickets/:ticketId/timers`
- ✅ Autenticação passou
- ✅ Query foi executada
- ✅ Resposta foi enviada

## Solução Mais Provável

### O timer ainda está ATIVO (não foi parado)

**Problema:**
- No portal da organização, o agente iniciou o timer
- Timer pode estar pausado ou rodando
- Mas NÃO foi PARADO (botão "Parar")
- Query `isActive: false` não retorna timers ativos

**Solução:**
1. No portal da organização, abrir o ticket
2. Ir ao componente "Tempo de Trabalho"
3. Clicar em "Parar" (não apenas pausar)
4. Verificar que timer foi salvo com `isActive: false`
5. Recarregar portal do cliente
6. Tempo deve aparecer

### Verificação Rápida

```sql
-- Ver se há timers ativos no ticket
SELECT 
  id, 
  "isActive", 
  status, 
  duration,
  "startTime",
  "endTime"
FROM time_entries
WHERE "ticketId" = 'UUID_DO_TICKET'
  AND "isActive" = true;
```

Se retornar algum registro:
- ✅ Timer ainda está ativo
- ✅ Precisa ser parado no portal da organização
- ✅ Só depois aparecerá no portal do cliente

## Correção Alternativa (Se Necessário)

Se o problema for que clientes não devem ver apenas timers parados, mas também ativos, podemos modificar o `getTicketTimers`:

```javascript
// Opção 1: Incluir timers ativos também
const timers = await TimeEntry.findAll({
  where: {
    ticketId,
    organizationId: req.user.organizationId
    // Remover: isActive: false
  },
  // ...
});

// Calcular total incluindo timer ativo
const totalSeconds = timers.reduce((sum, t) => {
  if (t.isActive && t.status === 'running') {
    // Calcular tempo decorrido do timer ativo
    const start = new Date(t.startTime);
    const now = new Date();
    const elapsed = Math.floor((now - start) / 1000);
    const pausedTime = t.totalPausedTime || 0;
    return sum + Math.max(0, elapsed - pausedTime);
  }
  return sum + (t.duration || 0);
}, 0);
```

**Mas isso pode não ser desejado** - clientes geralmente só devem ver tempo CONFIRMADO (parado), não tempo em andamento.

## Checklist de Verificação

- [ ] Verificar no banco se timer tem `isActive: false`
- [ ] Verificar no banco se timer tem `status: 'stopped'`
- [ ] Verificar no banco se timer tem `duration` preenchido
- [ ] Parar timer no portal da organização (botão "Parar")
- [ ] Recarregar portal do cliente
- [ ] Verificar se tempo aparece
- [ ] Testar endpoint `/tickets/:ticketId/timers` diretamente
- [ ] Verificar logs do backend ao acessar

## Arquivos Envolvidos

### Frontend (Portal Cliente):
- `portalClientEmpresa/src/components/TimeTrackerReadOnly.jsx` - Componente que exibe tempo
- `portalClientEmpresa/src/pages/TicketDetail.jsx` - Página que usa o componente

### Backend:
- `backend/src/routes/index.js` (linha 399) - Rota `/tickets/:ticketId/timers`
- `backend/src/modules/timeTracking/timeTrackingController.js` (linha 355) - Função `getTicketTimers`

### Banco de Dados:
- Tabela: `time_entries`
- Campos importantes: `isActive`, `status`, `duration`, `organizationId`

## Conclusão

✅ **Código está correto!**

O problema mais provável é que o timer ainda está ATIVO (não foi parado). A query `isActive: false` é intencional - clientes só devem ver tempo CONFIRMADO, não tempo em andamento.

**Solução:** Parar o timer no portal da organização antes de verificar no portal do cliente.

## Próximos Passos

1. **Verificar status do timer no banco de dados**
2. **Parar timer no portal da organização**
3. **Se problema persistir**, verificar logs do backend
4. **Se necessário**, modificar query para incluir timers ativos (não recomendado)
