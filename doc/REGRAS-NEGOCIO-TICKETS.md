# 📋 Regras de Negócio - Ciclo de Vida dos Tickets

**Data:** 11/11/2025 - 21:45  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Objetivo

Implementar regras de negócio para garantir o fluxo correto dos tickets, desde a criação até a conclusão, com controles de atribuição, cronômetro e comentários.

---

## 📊 Estados do Ticket

### **Status Disponíveis:**

```
novo → aguardando_aprovacao → em_progresso → aguardando_cliente → resolvido/fechado
```

### **Estados Finais (Concluídos):**
- `resolvido` - Problema resolvido
- `fechado` - Ticket encerrado

---

## 🔒 Regras de Negócio

### **1. Ticket NÃO Atribuído**

**Restrições:**
- ❌ **Não pode** iniciar cronômetro
- ❌ **Não pode** adicionar comentários (agentes/admin)
- ✅ **Pode** ser atribuído a alguém
- ✅ **Cliente pode** adicionar comentários

**Validação:**
- Frontend: Botões desabilitados + alerta visual
- Backend: Retorna erro 403

**Mensagem:**
```
⚠️ Ticket não atribuído. Atribua o ticket a alguém antes de [ação].
```

---

### **2. Ticket Concluído (Fechado/Resolvido)**

**Restrições:**
- ❌ **Não pode** iniciar cronômetro
- ❌ **Não pode** adicionar comentários
- ❌ **Não pode** ser atribuído
- ❌ **Não pode** ser transferido
- ❌ **Não pode** ser mesclado
- ✅ **Pode** visualizar histórico

**Ações Automáticas:**
- ⏹️ Cronômetro é **parado automaticamente**
- 📅 `closedAt` ou `resolvedAt` é preenchido

**Validação:**
- Frontend: Botões desabilitados + alerta visual
- Backend: Retorna erro 403

**Mensagem:**
```
ℹ️ Ticket concluído. Não é possível realizar esta ação.
```

---

### **3. Atribuição de Ticket**

**O que acontece ao atribuir:**

1. ✅ **Primeira Resposta:**
   - Campo `firstResponseAt` é preenchido automaticamente
   - Registrado apenas na **primeira atribuição**

2. ✅ **Histórico:**
   - Ação registrada: "Ticket atribuído a [Nome]"
   - Timestamp da atribuição
   - Usuário que fez a atribuição

3. ✅ **Permissões Desbloqueadas:**
   - Agente pode iniciar cronômetro
   - Agente pode adicionar comentários

**Backend:**
```javascript
// ticketController.js - updateTicket()
if (updates.assigneeId && !oldTicket.assigneeId && !ticket.firstResponseAt) {
  updateData.firstResponseAt = new Date();
  logger.info(`Primeira resposta registrada para ticket ${ticket.ticketNumber}`);
}
```

---

### **4. Mudança de Status para Concluído**

**O que acontece automaticamente:**

1. ⏹️ **Cronômetro Parado:**
   - Todos os timers ativos são parados
   - Tempo trabalhado é calculado e salvo
   - Status do timer: `stopped`

2. 📅 **Datas Preenchidas:**
   - `resolvedAt` se status = `resolvido`
   - `closedAt` se status = `fechado`

3. 🔒 **Ações Bloqueadas:**
   - Cronômetro não pode mais ser iniciado
   - Comentários não podem ser adicionados
   - Ticket não pode ser atribuído/transferido/mesclado

**Backend:**
```javascript
// ticketController.js - updateTicket()
const isBeingClosed = (updates.status === 'fechado' || updates.status === 'resolvido') && 
                      oldTicket.status !== updates.status;
if (isBeingClosed) {
  // Para todos os timers ativos automaticamente
  const activeTimers = await TimeEntry.findAll({ where: { ticketId: id, isActive: true } });
  for (const timer of activeTimers) {
    await timer.update({ isActive: false, status: 'stopped', endTime: now });
  }
}
```

---

## 🚫 Validações Implementadas

### **Backend:**

#### **Helper:** `/backend/src/utils/ticketValidations.js`

```javascript
// Verificar se ticket está fechado
export const isTicketClosed = (ticket) => {
  return ['fechado', 'resolvido'].includes(ticket.status);
};

// Verificar se ticket está atribuído
export const isTicketAssigned = (ticket) => {
  return ticket.assigneeId !== null && ticket.assigneeId !== undefined;
};

// Verificar se ação pode ser realizada
export const canPerformAction = (ticket, action) => {
  const closed = isTicketClosed(ticket);
  const assigned = isTicketAssigned(ticket);

  const rules = {
    'start_timer': !closed && assigned,
    'add_comment': !closed && assigned,
    'assign': !closed,
    'merge': !closed,
    'transfer': !closed,
  };

  return rules[action] ?? true;
};
```

---

#### **Cronômetro:** `/backend/src/modules/timeTracking/timeTrackingController.js`

```javascript
export const startTimer = async (req, res, next) => {
  // ...
  
  // ✅ VALIDAÇÃO: Ticket não pode estar fechado/resolvido
  if (isTicketClosed(ticket)) {
    return res.status(403).json({ 
      error: 'Não é possível iniciar cronômetro em ticket concluído',
      reason: 'ticket_closed',
      status: ticket.status
    });
  }

  // ✅ VALIDAÇÃO: Ticket deve estar atribuído
  if (!isTicketAssigned(ticket)) {
    return res.status(403).json({ 
      error: 'Ticket deve ser atribuído antes de iniciar o cronômetro',
      reason: 'ticket_not_assigned'
    });
  }
};
```

---

#### **Comentários:** `/backend/src/modules/tickets/ticketController.js`

```javascript
export const addComment = async (req, res, next) => {
  // ...
  
  // ✅ VALIDAÇÃO: Ticket concluído não pode receber comentários
  if (isTicketClosed(ticket)) {
    return res.status(403).json({ 
      error: 'Não é possível adicionar comentários em ticket concluído',
      reason: 'ticket_closed'
    });
  }

  // ✅ VALIDAÇÃO: Ticket deve estar atribuído (exceto clientes)
  if (!isClientUser && !isTicketAssigned(ticket)) {
    return res.status(403).json({ 
      error: 'Ticket deve ser atribuído antes de adicionar comentários',
      reason: 'ticket_not_assigned'
    });
  }
};
```

---

### **Frontend:**

#### **TimeTracker:** `/portalOrganizaçãoTenant/src/components/TimeTracker.jsx`

```javascript
const TimeTracker = ({ ticketId, ticket }) => {
  // Verificar se ticket está atribuído e não está concluído
  const isTicketAssigned = ticket?.assigneeId !== null && ticket?.assigneeId !== undefined;
  const isTicketClosed = ['fechado', 'resolvido'].includes(ticket?.status);
  const canUseTimer = isTicketAssigned && !isTicketClosed;

  return (
    <div>
      {/* Alerta visual */}
      {!canUseTimer && (
        <div className="alert">
          {isTicketClosed ? (
            <>ℹ️ Ticket concluído. Cronômetro não disponível.</>
          ) : (
            <>⚠️ Ticket não atribuído. Atribua antes de usar o cronômetro.</>
          )}
        </div>
      )}

      {/* Botão Iniciar desabilitado */}
      <button
        onClick={handleStart}
        disabled={loading || !canUseTimer}
        title={!canUseTimer ? (isTicketClosed ? 'Ticket concluído' : 'Ticket não atribuído') : ''}
      >
        Iniciar
      </button>
    </div>
  );
};
```

---

#### **TicketDetail:** `/portalOrganizaçãoTenant/src/pages/TicketDetail.jsx`

```javascript
const handleAddComment = async (e) => {
  e.preventDefault();

  // ✅ Validar se ticket está concluído
  const isTicketClosed = ['fechado', 'resolvido'].includes(ticket.status);
  if (isTicketClosed) {
    toast.error('Não é possível adicionar comentários em ticket concluído');
    return;
  }

  // ✅ Validar se ticket está atribuído (apenas para agentes)
  const isAgent = ['admin-org', 'agente'].includes(user.role);
  const isTicketAssigned = ticket.assigneeId !== null && ticket.assigneeId !== undefined;
  if (isAgent && !isTicketAssigned) {
    toast.error('Ticket deve ser atribuído antes de adicionar comentários');
    return;
  }

  // Continuar com adição de comentário...
};
```

**Botões Atribuir/Transferir/Mesclar:**
```javascript
const isTicketClosed = ['fechado', 'resolvido'].includes(ticket.status);

<button
  onClick={() => setShowAssignModal(true)}
  disabled={isTicketClosed}
  title={isTicketClosed ? 'Não é possível atribuir ticket concluído' : 'Atribuir ticket'}
>
  Atribuir
</button>
```

---

## 📊 Fluxo Completo

### **Cenário 1: Ticket Novo → Atribuído → Trabalhado → Concluído**

```
1. 📝 Ticket criado (status: novo)
   ├─ assigneeId: null
   ├─ firstResponseAt: null
   └─ Comentários: Bloqueados (agente)
   └─ Cronômetro: Bloqueado

2. 👤 Ticket atribuído a "João"
   ├─ assigneeId: uuid-joao
   ├─ firstResponseAt: 2025-11-11 10:00:00 ✅
   ├─ Histórico: "Atribuído a João"
   └─ Comentários: Desbloqueados
   └─ Cronômetro: Desbloqueado

3. ⏱️ João inicia cronômetro
   ├─ Timer criado (status: running)
   ├─ startTime: 2025-11-11 10:05:00
   └─ totalPausedTime: 0

4. 💬 João adiciona comentários
   └─ Status pode mudar para "em_progresso"

5. ⏸️ João pausa cronômetro
   ├─ Timer (status: paused)
   └─ lastPauseStart: 2025-11-11 11:00:00

6. ▶️ João retoma cronômetro
   ├─ Timer (status: running)
   └─ totalPausedTime: calculado

7. ✅ João marca como "resolvido"
   ├─ Status: resolvido
   ├─ resolvedAt: 2025-11-11 12:00:00 ✅
   ├─ Timer parado automaticamente ✅
   └─ Ações bloqueadas:
       ├─ ❌ Cronômetro
       ├─ ❌ Comentários
       ├─ ❌ Atribuir
       ├─ ❌ Transferir
       └─ ❌ Mesclar
```

---

### **Cenário 2: Cliente Cria Ticket**

```
1. 📝 Cliente cria ticket
   ├─ assigneeId: null
   └─ Cliente PODE adicionar comentários ✅

2. 💬 Cliente adiciona mais detalhes
   └─ Comentário salvo normalmente

3. 👤 Agente atribui a si mesmo
   ├─ firstResponseAt: preenchido ✅
   └─ Agente pode trabalhar

4. 💬 Agente responde
   └─ Cliente recebe notificação

5. ✅ Agente resolve
   └─ Cliente recebe notificação
   └─ Cliente NÃO pode mais comentar ❌
```

---

## 🎨 Interface do Usuário

### **Alertas Visuais:**

#### **Ticket Não Atribuído:**
```
┌────────────────────────────────────────┐
│ ⚠️ Ticket não atribuído.               │
│ Atribua o ticket a alguém antes de     │
│ adicionar comentários.                 │
└────────────────────────────────────────┘
[Cor: Amarelo/Warning]
```

#### **Ticket Concluído:**
```
┌────────────────────────────────────────┐
│ ℹ️ Ticket concluído.                    │
│ Não é possível adicionar comentários.  │
└────────────────────────────────────────┘
[Cor: Cinza/Info]
```

---

### **Botões Desabilitados:**

```
Status: Concluído (fechado/resolvido)

┌─────────────────────┐
│ [🔒 Atribuir]       │  ← disabled, opacity 50%
│ [🔒 Transferir]     │  ← disabled, opacity 50%
│ [🔒 Mesclar]        │  ← disabled, opacity 50%
│ [🔒 Iniciar Timer]  │  ← disabled, opacity 50%
└─────────────────────┘
```

**Tooltip ao hover:**
```
"Não é possível [ação] em ticket concluído"
```

---

## 📝 Campos do Modelo Ticket

### **Campos Relacionados:**

```javascript
{
  assigneeId: UUID | null,        // Atribuído a
  firstResponseAt: Date | null,   // Primeira resposta (atribuição)
  resolvedAt: Date | null,        // Data de resolução
  closedAt: Date | null,          // Data de fechamento
  status: ENUM(                   // Status atual
    'novo',
    'aguardando_aprovacao',
    'em_progresso',
    'aguardando_cliente',
    'resolvido',
    'fechado'
  )
}
```

---

## 🧪 Como Testar

### **Teste 1: Ticket Não Atribuído**

1. Criar ticket novo
2. Tentar iniciar cronômetro → ❌ Bloqueado
3. Tentar adicionar comentário → ❌ Bloqueado (agente)
4. Atribuir a alguém
5. Iniciar cronômetro → ✅ Funciona
6. Adicionar comentário → ✅ Funciona

**Resultado Esperado:**
- Alerta amarelo "Ticket não atribuído"
- Botões desabilitados
- `firstResponseAt` preenchido ao atribuir

---

### **Teste 2: Ticket Concluído**

1. Ter ticket em progresso com cronômetro ativo
2. Marcar status como "resolvido"
3. Verificar cronômetro → ⏹️ Parado automaticamente
4. Tentar adicionar comentário → ❌ Bloqueado
5. Tentar iniciar cronômetro → ❌ Bloqueado
6. Tentar atribuir a outra pessoa → ❌ Bloqueado

**Resultado Esperado:**
- Alerta cinza "Ticket concluído"
- Todos os botões desabilitados
- `resolvedAt` ou `closedAt` preenchido
- Timer.isActive = false

---

### **Teste 3: Cliente vs Agente**

**Cliente:**
- ✅ Pode adicionar comentários (mesmo não atribuído)
- ❌ Não pode adicionar comentários (se concluído)
- ❌ Não vê cronômetro

**Agente:**
- ❌ Não pode adicionar comentários (se não atribuído)
- ❌ Não pode adicionar comentários (se concluído)
- ❌ Não pode iniciar cronômetro (se não atribuído)
- ❌ Não pode iniciar cronômetro (se concluído)

---

## 📊 Resposta de Erros (API)

### **403 - Ticket Não Atribuído:**
```json
{
  "error": "Ticket deve ser atribuído antes de iniciar o cronômetro",
  "reason": "ticket_not_assigned"
}
```

### **403 - Ticket Concluído:**
```json
{
  "error": "Não é possível adicionar comentários em ticket concluído",
  "reason": "ticket_closed",
  "status": "fechado"
}
```

---

## ✅ Checklist de Implementação

### **Backend:**
- [x] Helper `ticketValidations.js` criado
- [x] Validação em `startTimer` (cronômetro)
- [x] Validação em `addComment` (comentários)
- [x] Validação em `updateTicket` (atribuição)
- [x] Lógica `firstResponseAt` na atribuição
- [x] Parada automática do cronômetro ao concluir
- [x] Bloqueio de atribuição em tickets concluídos

### **Frontend:**
- [x] TimeTracker recebe prop `ticket`
- [x] Validação `canUseTimer` implementada
- [x] Alerta visual no TimeTracker
- [x] Validação no `handleAddComment`
- [x] Alerta visual no formulário de comentários
- [x] Botões Atribuir/Transferir/Mesclar desabilitados
- [x] Tooltips informativos

### **UX:**
- [x] Alertas amarelos para "não atribuído"
- [x] Alertas cinza para "concluído"
- [x] Botões desabilitados visualmente
- [x] Mensagens de erro claras

---

## 🚀 Resultado Final

✅ **Ticket não atribuído** → Cronômetro e comentários bloqueados  
✅ **Primeira atribuição** → `firstResponseAt` preenchido + histórico  
✅ **Ticket concluído** → Cronômetro parado automaticamente  
✅ **Ticket concluído** → Todas ações bloqueadas (atribuir, mesclar, comentar)  
✅ **Cliente** → Pode comentar independente de atribuição  
✅ **Interface clara** → Alertas visuais e mensagens informativas  

---

**SISTEMA IMPLEMENTADO COM SUCESSO!** 🎉✅

Todas as regras de negócio foram implementadas com validações no backend e feedback visual no frontend.
