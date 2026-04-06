# Correção: Subscrição - Restrições e Atualização de Dados

## Data: 2026-04-06

## Problemas Identificados

### 1. Informações da Subscrição Não Atualizam Após Pagamento

**Problema:**
- Após renovar o plano com pagamento bem-sucedido, a página de subscrição continuava mostrando:
  - Status: "Período de Teste"
  - Dias restantes: "0 dias"
  - Informações antigas do plano

**Causa:**
- O backend atualizava corretamente a subscrição no banco de dados
- O frontend não recarregava os dados após o pagamento ser processado
- Os modais fechavam sem chamar `onRenewComplete()` ou `onUpgradeComplete()`

**Solução Implementada:**
- Atualizado `RenewModal.jsx` e `UpgradeModal.jsx`
- Para pagamentos real-time (GPO e E-Kwanza):
  - Após sucesso, aguarda 2 segundos
  - Chama `onRenewComplete()` ou `onUpgradeComplete()` para recarregar dados
  - Fecha o modal com `handleClose()`
- Para pagamentos REF (pendente):
  - Mostra instruções de pagamento
  - Usuário fecha manualmente após fazer transferência

### 2. Sistema Sem Restrições Após Trial Expirar

**Problema:**
- Quando o período de teste expirava, o sistema continuava funcionando normalmente
- Usuários podiam criar tickets, clientes, etc. sem limitações
- Não havia bloqueio de acesso às funcionalidades

**Causa:**
- Middleware `checkSubscriptionStatus` existia mas não estava aplicado nas rotas
- Rotas de tickets, clientes e outras funcionalidades não verificavam status da subscrição
- Não havia verificação de limites de plano (tickets, clientes, usuários)

**Solução Implementada:**

#### Middleware de Verificação
O middleware `checkSubscriptionStatus` em `planLimitsMiddleware.js` verifica:
- Se a organização tem subscrição ativa
- Se a subscrição está cancelada ou suspensa → bloqueia acesso
- Se está em trial e expirou → bloqueia acesso com mensagem específica
- Retorna erro 402 (Payment Required) quando bloqueado

#### Rotas Protegidas

**Tickets (`backend/src/modules/tickets/ticketRoutes.js`):**
```javascript
// Verificar status da subscrição em todas as rotas
router.use(checkSubscriptionStatus);

// Verificar limite de tickets ao criar
router.post('/', checkTicketLimit(), validate(...), createTicket);
```

**Clientes (`backend/src/routes/clientRoutes.js`):**
```javascript
// Verificar status da subscrição em todas as rotas
router.use(checkSubscriptionStatus);

// Verificar limite de clientes ao criar
router.post('/', checkClientLimit(), requireSmartPermission(...), createClient);
```

## Arquivos Modificados

### Frontend
1. `portalOrganizaçãoTenant/src/components/subscription/RenewModal.jsx`
   - Corrigido callback após pagamento real-time
   - Chama `onRenewComplete()` antes de fechar

2. `portalOrganizaçãoTenant/src/components/subscription/UpgradeModal.jsx`
   - Corrigido callback após pagamento real-time
   - Chama `onUpgradeComplete()` antes de fechar

### Backend
3. `backend/src/modules/tickets/ticketRoutes.js`
   - Adicionado `checkSubscriptionStatus` em todas as rotas
   - Adicionado `checkTicketLimit()` na criação de tickets

4. `backend/src/routes/clientRoutes.js`
   - Adicionado `checkSubscriptionStatus` em todas as rotas
   - Adicionado `checkClientLimit()` na criação de clientes

## Comportamento Após Correção

### Quando Trial Expira
1. Usuário tenta acessar qualquer funcionalidade
2. Middleware verifica status da subscrição
3. Detecta que trial expirou
4. Retorna erro 402 com mensagem:
```json
{
  "success": false,
  "error": "Trial expirado",
  "details": {
    "type": "trial_expired",
    "message": "Seu período de trial expirou. Por favor, escolha um plano para continuar."
  }
}
```

### Quando Subscrição Está Suspensa/Cancelada
1. Usuário tenta acessar qualquer funcionalidade
2. Middleware verifica status
3. Retorna erro 402 com mensagem apropriada
4. Frontend deve mostrar modal/página de renovação

### Quando Atinge Limite do Plano
1. Usuário tenta criar ticket/cliente/usuário
2. Middleware verifica limite específico
3. Se excedido, retorna erro 402:
```json
{
  "success": false,
  "error": "Limite de plano excedido",
  "details": {
    "type": "ticket_limit",
    "message": "Você atingiu o limite de tickets do seu plano",
    "current": 100,
    "limit": 100,
    "plan": "Starter"
  }
}
```

### Após Pagamento Bem-Sucedido
1. Pagamento é processado (GPO/E-Kwanza real-time)
2. Backend atualiza subscrição:
   - `status: 'active'`
   - `currentPeriodStart: now`
   - `currentPeriodEnd: now + 1 month`
   - `lastPaymentDate: now`
3. Frontend aguarda 2 segundos
4. Chama `loadSubscription()` para recarregar dados
5. Página atualiza mostrando:
   - Status: "Ativo"
   - Dias restantes: 30 dias
   - Informações corretas do plano

## Próximos Passos Recomendados

### Frontend
1. **Tratamento de Erros 402**
   - Criar componente global para capturar erros 402
   - Mostrar modal de upgrade/renovação automaticamente
   - Redirecionar para página de subscrição

2. **Indicadores Visuais**
   - Mostrar banner quando próximo do limite
   - Alertas quando trial está expirando
   - Contador de uso em tempo real

### Backend
3. **Adicionar Verificações em Mais Rotas**
   - Rotas de usuários da organização
   - Rotas de projetos
   - Rotas de relatórios
   - Qualquer funcionalidade que deve ser restrita

4. **Job de Verificação Periódica**
   - Criar job que roda diariamente
   - Verifica trials expirados
   - Atualiza status para 'suspended'
   - Envia emails de notificação

5. **Logs e Auditoria**
   - Registrar quando acesso é bloqueado por limite
   - Registrar tentativas de uso após expiração
   - Útil para análise e suporte

## Testes Recomendados

### Teste 1: Renovação e Atualização
1. Criar subscrição em trial
2. Fazer pagamento de renovação (GPO)
3. Verificar se página atualiza automaticamente
4. Confirmar status mudou para "Ativo"
5. Confirmar dias restantes = 30

### Teste 2: Trial Expirado
1. Criar subscrição em trial
2. Alterar `trialEndsAt` para data passada no banco
3. Tentar criar ticket
4. Verificar erro 402 retornado
5. Verificar mensagem apropriada

### Teste 3: Limite de Tickets
1. Criar subscrição com plano Starter (100 tickets/mês)
2. Criar 100 tickets
3. Tentar criar 101º ticket
4. Verificar erro 402 com detalhes do limite
5. Fazer upgrade de plano
6. Verificar que pode criar mais tickets

### Teste 4: Subscrição Suspensa
1. Criar subscrição ativa
2. Alterar status para 'suspended' no banco
3. Tentar acessar qualquer funcionalidade
4. Verificar erro 402 retornado
5. Renovar subscrição
6. Verificar acesso restaurado

## Status

✅ Correções implementadas
✅ Middleware de verificação aplicado
✅ Atualização de dados após pagamento corrigida
⚠️ Requer testes funcionais completos
⚠️ Frontend precisa tratamento de erros 402
⚠️ Mais rotas precisam ser protegidas
