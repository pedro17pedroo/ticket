# Transições Automáticas de Status de Tickets

## Visão Geral

O sistema agora implementa transições automáticas de status baseadas em ações dos usuários, melhorando o fluxo de trabalho e reduzindo a necessidade de atualização manual de status.

## Estados do Ticket

```
novo → em_progresso → aguardando_cliente → resolvido → fechado
         ↑__________________|
```

### Estados Disponíveis

1. **novo** - Ticket recém-criado, aguardando atribuição ou início de trabalho
2. **aguardando_aprovacao** - Ticket aguardando aprovação (catálogo de serviços)
3. **em_progresso** - Ticket sendo trabalhado ativamente
4. **aguardando_cliente** - Aguardando resposta ou ação do cliente
5. **resolvido** - Problema resolvido, aguardando confirmação
6. **fechado** - Ticket finalizado

## Regras de Transição Automática

### 1. Novo → Em Progresso

**Quando:** Membro da organização interage com ticket no status 'novo'

**Ações que acionam:**
- ✅ Adicionar comentário
- ✅ Iniciar cronômetro (timer)
- ✅ Adicionar tempo manual

**Quem pode acionar:**
- Responsável atribuído (assignee)
- Qualquer membro da organização (org-admin, org-manager, agent)

**Exemplo:**
```javascript
// Ticket #123 está com status 'novo'
// Agente João adiciona um comentário
// Status muda automaticamente para 'em_progresso'
```

**Log:**
```
✅ Status do ticket TKT-20260309-1234 alterado automaticamente: 
   novo → em_progresso. 
   Motivo: Membro da organização iniciou trabalho no ticket (comment)
```

### 2. Aguardando Cliente → Em Progresso

**Quando:** Cliente responde a um ticket que está aguardando sua resposta

**Ações que acionam:**
- ✅ Cliente adiciona comentário

**Quem pode acionar:**
- Usuários com role: client-admin, client-user

**Exemplo:**
```javascript
// Ticket #456 está com status 'aguardando_cliente'
// Cliente Maria adiciona uma resposta
// Status muda automaticamente para 'em_progresso'
```

**Log:**
```
✅ Status do ticket TKT-20260309-4567 alterado automaticamente: 
   aguardando_cliente → em_progresso. 
   Motivo: Cliente respondeu ao ticket
```

## Proteções Implementadas

### Tickets Concluídos

Tickets com status **'fechado'** ou **'resolvido'** NÃO sofrem transições automáticas.

```javascript
// Ticket #789 está 'fechado'
// Tentativa de adicionar comentário → BLOQUEADO
// Erro: "Não é possível adicionar comentários em ticket concluído"
```

### Validações

1. **Comentários:** Tickets fechados/resolvidos não aceitam novos comentários
2. **Timer:** Não é possível iniciar cronômetro em tickets concluídos
3. **Tempo Manual:** Não é possível adicionar tempo em tickets concluídos

## Implementação Técnica

### Arquivo Principal

`backend/src/utils/ticketStatusTransitions.js`

### Funções Principais

#### checkStatusTransition()

Verifica se o ticket deve ter seu status alterado.

```javascript
const transition = await checkStatusTransition(ticket, user, 'comment');
// Retorna: { shouldUpdate: boolean, newStatus: string|null, reason: string }
```

#### applyStatusTransition()

Aplica a transição de status se necessário.

```javascript
const result = await applyStatusTransition(ticket, user, 'timer_start');
// Retorna: { updated: boolean, oldStatus: string, newStatus: string|null }
```

### Pontos de Integração

#### 1. Comentários

**Arquivo:** `backend/src/modules/tickets/ticketController.js`
**Função:** `addComment()`

```javascript
// Após criar o comentário
const { applyStatusTransition } = await import('../../utils/ticketStatusTransitions.js');
const statusTransition = await applyStatusTransition(ticket, req.user, 'comment');
```

#### 2. Iniciar Timer

**Arquivo:** `backend/src/modules/timeTracking/timeTrackingController.js`
**Função:** `startTimer()`

```javascript
// Após iniciar o timer
const { applyStatusTransition } = await import('../../utils/ticketStatusTransitions.js');
const statusTransition = await applyStatusTransition(ticket, req.user, 'timer_start');
```

#### 3. Tempo Manual

**Arquivo:** `backend/src/modules/timeTracking/timeTrackingController.js`
**Função:** `addManualTime()`

```javascript
// Após adicionar tempo manual
const { applyStatusTransition } = await import('../../utils/ticketStatusTransitions.js');
const statusTransition = await applyStatusTransition(ticket, req.user, 'manual_time');
```

## Tipos de Ação

```javascript
const ACTION_TYPES = {
  COMMENT: 'comment',           // Adicionar comentário
  TIMER_START: 'timer_start',   // Iniciar cronômetro
  TIMER_STOP: 'timer_stop',     // Parar cronômetro (não aciona transição)
  MANUAL_TIME: 'manual_time'    // Adicionar tempo manual
};
```

## Logs e Monitoramento

### Logs de Sucesso

```
✅ Status do ticket TKT-20260309-1234 alterado automaticamente: 
   novo → em_progresso. 
   Motivo: Responsável iniciou trabalho no ticket (timer_start)
```

### Logs de Debug

```
Status do ticket TKT-20260309-5678 não alterado: 
Nenhuma transição automática aplicável
```

### Logs de Erro

```
Erro ao aplicar transição de status no ticket TKT-20260309-9012: 
[mensagem de erro]
```

## Fluxo de Trabalho Típico

### Cenário 1: Novo Ticket

```
1. Cliente cria ticket → Status: 'novo'
2. Ticket é atribuído ao Agente João → Status: 'novo'
3. João adiciona comentário "Vou verificar" → Status: 'em_progresso' ✅
4. João inicia cronômetro → Status: 'em_progresso' (já estava)
5. João para cronômetro → Status: 'em_progresso' (não muda)
6. João muda manualmente para 'aguardando_cliente'
7. Cliente responde → Status: 'em_progresso' ✅
8. João resolve e muda para 'resolvido'
9. Cliente confirma e fecha → Status: 'fechado'
```

### Cenário 2: Múltiplos Agentes

```
1. Ticket criado → Status: 'novo'
2. Agente Maria (não é assignee) adiciona comentário → Status: 'em_progresso' ✅
3. Ticket é atribuído ao Agente Pedro
4. Pedro inicia timer → Status: 'em_progresso' (já estava)
```

## Benefícios

1. **Redução de Trabalho Manual:** Status atualiza automaticamente
2. **Consistência:** Regras aplicadas uniformemente
3. **Rastreabilidade:** Logs detalhados de todas as transições
4. **Experiência do Usuário:** Fluxo mais natural e intuitivo
5. **Prevenção de Erros:** Validações impedem ações em tickets concluídos

## Extensibilidade

Para adicionar novas regras de transição:

1. Editar `backend/src/utils/ticketStatusTransitions.js`
2. Adicionar nova condição em `checkStatusTransition()`
3. Documentar a nova regra neste arquivo
4. Adicionar testes unitários

### Exemplo de Nova Regra

```javascript
// REGRA 4: Ticket em progresso há mais de 7 dias → aguardando_cliente
if (currentStatus === 'em_progresso' && daysSinceLastUpdate > 7) {
  return {
    shouldUpdate: true,
    newStatus: 'aguardando_cliente',
    reason: 'Ticket sem atualização há mais de 7 dias'
  };
}
```

## Testes

### Teste Manual

1. Criar ticket novo
2. Adicionar comentário como agente → Verificar mudança para 'em_progresso'
3. Mudar para 'aguardando_cliente'
4. Adicionar comentário como cliente → Verificar mudança para 'em_progresso'
5. Iniciar timer → Verificar que status permanece 'em_progresso'
6. Fechar ticket → Tentar adicionar comentário → Verificar bloqueio

### Teste Automatizado

```javascript
describe('Transições Automáticas de Status', () => {
  it('deve mudar de novo para em_progresso ao adicionar comentário', async () => {
    const ticket = await Ticket.create({ status: 'novo', ... });
    const result = await applyStatusTransition(ticket, agent, 'comment');
    expect(result.updated).to.be.true;
    expect(result.newStatus).to.equal('em_progresso');
  });
});
```

## Arquivos Modificados

- ✅ `backend/src/utils/ticketStatusTransitions.js` (NOVO)
- ✅ `backend/src/modules/tickets/ticketController.js`
- ✅ `backend/src/modules/timeTracking/timeTrackingController.js`

## Status

✅ Implementado
✅ Testado
✅ Documentado
✅ Em produção
