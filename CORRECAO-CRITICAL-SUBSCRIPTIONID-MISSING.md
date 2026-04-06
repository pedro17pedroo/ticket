# Correção CRÍTICA: subscriptionId Faltando nos Pagamentos

## Data: 2026-04-06

## Problema Crítico Identificado

### Sintoma
- Após renovar ou fazer upgrade do plano, as informações da subscrição NÃO atualizavam
- Página continuava mostrando "Período de Teste" e "0 dias"
- Status não mudava para "Ativo"
- Restrições não eram removidas

### Causa Raiz
**Os modais de pagamento (RenewModal e UpgradeModal) NÃO estavam enviando o `subscriptionId` para o backend!**

Fluxo com problema:
1. Cliente faz pagamento → Frontend envia dados SEM `subscriptionId`
2. Backend cria transação de pagamento
3. Backend processa pagamento com sucesso
4. Backend tenta atualizar subscrição usando `transaction.subscriptionId`
5. **`transaction.subscriptionId` é NULL** → subscrição NÃO é atualizada
6. Pagamento registrado mas subscrição continua em trial/expirada

### Código Problemático

**RenewModal.jsx (ANTES):**
```javascript
const paymentData = {
  amount: subscription.amount || currentPlan.monthlyPrice,
  paymentMethod: selectedMethod,
  customerName: ...,
  customerEmail: ...,
  customerPhone: ...,
  description: `Renovação do plano ${currentPlan.displayName}`
  // ❌ FALTANDO: subscriptionId
};
```

**UpgradeModal.jsx (ANTES):**
```javascript
const paymentData = {
  amount: calculation?.amountToPay || selectedPlan.priceValue,
  paymentMethod: selectedMethod,
  customerName: ...,
  customerEmail: ...,
  customerPhone: ...,
  description: `Upgrade para ${selectedPlan.name}`
  // ❌ FALTANDO: subscriptionId
};
```

**Backend - paymentService.js:**
```javascript
async processSuccessfulPayment(transaction) {
  // Update subscription if exists
  if (transaction.subscriptionId) {  // ❌ SEMPRE NULL!
    const subscription = await Subscription.findByPk(transaction.subscriptionId);
    // ... atualizar subscrição
  }
  // ❌ Se subscriptionId é null, subscrição NUNCA é atualizada!
}
```

## Solução Implementada

### 1. Adicionar subscriptionId nos Modais

**RenewModal.jsx (CORRIGIDO):**
```javascript
const paymentData = {
  subscriptionId: subscription.id,  // ✅ ADICIONADO
  amount: subscription.amount || currentPlan.monthlyPrice,
  paymentMethod: selectedMethod,
  customerName: selectedMethod === 'ekwanza' ? 'Cliente' : customerName,
  customerEmail: selectedMethod === 'ekwanza' ? 'cliente@example.com' : customerEmail,
  customerPhone: selectedMethod === 'ekwanza' ? phoneNumber : customerPhone,
  description: `Renovação do plano ${currentPlan.displayName || currentPlan.name}`
};
```

**UpgradeModal.jsx (CORRIGIDO):**
```javascript
// Adicionar subscription nas props
const UpgradeModal = ({ isOpen, currentPlan, subscription, onClose, onUpgradeComplete }) => {

// Usar subscription.id no paymentData
const paymentData = {
  subscriptionId: subscription?.id,  // ✅ ADICIONADO
  amount: calculation?.amountToPay || selectedPlan.priceValue,
  paymentMethod: selectedMethod,
  customerName: selectedMethod === 'ekwanza' ? 'Cliente' : customerName,
  customerEmail: selectedMethod === 'ekwanza' ? 'cliente@example.com' : customerEmail,
  customerPhone: selectedMethod === 'ekwanza' ? phoneNumber : customerPhone,
  description: `Upgrade para ${selectedPlan.name}`
};
```

**Subscription.jsx (CORRIGIDO):**
```javascript
<UpgradeModal
  isOpen={showUpgradeModal}
  currentPlan={plan}
  subscription={sub}  // ✅ ADICIONADO
  onClose={() => setShowUpgradeModal(false)}
  onUpgradeComplete={loadSubscription}
/>
```

### 2. Melhorar Logs e Remover Trial

**paymentService.js (MELHORADO):**
```javascript
async processSuccessfulPayment(transaction) {
  if (transaction.subscriptionId) {
    const subscription = await Subscription.findByPk(transaction.subscriptionId);

    if (subscription) {
      const now = new Date();
      const nextPeriodEnd = new Date(now);
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

      const updateData = {
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: nextPeriodEnd,
        lastPaymentDate: transaction.paidAt || now,
        lastPaymentAmount: transaction.amount,
        trialEndsAt: null  // ✅ REMOVER TRIAL
      };

      await subscription.update(updateData);

      info('[PaymentService] Subscription activated:', {
        subscriptionId: subscription.id,
        status: 'active',
        currentPeriodEnd: nextPeriodEnd,
        trialRemoved: subscription.trialEndsAt !== null  // ✅ LOG
      });
    } else {
      warn('[PaymentService] Subscription not found:', {
        subscriptionId: transaction.subscriptionId
      });
    }
  } else {
    warn('[PaymentService] No subscriptionId in transaction:', {
      transactionId: transaction.id
    });
  }
  // ... resto do código
}
```

## Fluxo Corrigido

### Renovação de Plano
1. Cliente abre RenewModal
2. Seleciona método de pagamento e preenche dados
3. Clica em "Processar Renovação"
4. Frontend envia para backend:
   ```json
   {
     "subscriptionId": 123,  // ✅ AGORA INCLUSO
     "amount": 25000,
     "paymentMethod": "gpo",
     "customerName": "João Silva",
     "customerEmail": "joao@example.com",
     "customerPhone": "923456789",
     "description": "Renovação do plano Starter"
   }
   ```
5. Backend cria transação COM subscriptionId
6. TPagamento processa pagamento (real-time para GPO)
7. Backend detecta status 'completed'
8. Backend chama `processSuccessfulPayment(transaction)`
9. Backend encontra subscription usando `transaction.subscriptionId`
10. Backend atualiza subscription:
    - `status: 'active'`
    - `currentPeriodStart: now`
    - `currentPeriodEnd: now + 1 month`
    - `trialEndsAt: null`
11. Frontend aguarda 2 segundos
12. Frontend chama `onRenewComplete()` → `loadSubscription()`
13. Página recarrega dados atualizados
14. ✅ Mostra: Status "Ativo", 30 dias restantes

### Upgrade de Plano
1. Cliente abre UpgradeModal
2. Seleciona novo plano
3. Seleciona método de pagamento e preenche dados
4. Clica em "Processar Upgrade"
5. Frontend envia para backend COM subscriptionId
6. Backend processa igual ao fluxo de renovação
7. Backend atualiza subscription para novo plano
8. Frontend recarrega dados
9. ✅ Mostra novo plano ativo

## Arquivos Modificados

1. **portalOrganizaçãoTenant/src/components/subscription/RenewModal.jsx**
   - Adicionado `subscriptionId: subscription.id` no paymentData

2. **portalOrganizaçãoTenant/src/components/subscription/UpgradeModal.jsx**
   - Adicionado prop `subscription`
   - Adicionado `subscriptionId: subscription?.id` no paymentData

3. **portalOrganizaçãoTenant/src/pages/Subscription.jsx**
   - Passado `subscription={sub}` para UpgradeModal

4. **backend/src/services/paymentService.js**
   - Adicionado `trialEndsAt: null` na atualização
   - Melhorados logs de debug e warning
   - Adicionado log quando subscriptionId está faltando

## Impacto da Correção

### Antes (QUEBRADO)
- ❌ Pagamentos processados mas subscrição não atualizada
- ❌ Cliente paga mas continua vendo "Trial expirado"
- ❌ Sistema continua bloqueando acesso mesmo após pagamento
- ❌ Dados da subscrição desatualizados
- ❌ Impossível sair do período de teste

### Depois (CORRIGIDO)
- ✅ Pagamento processa E atualiza subscrição
- ✅ Status muda para "Ativo" imediatamente
- ✅ Trial é removido (trialEndsAt = null)
- ✅ Período de 30 dias é configurado
- ✅ Restrições são removidas
- ✅ Dados atualizados na interface
- ✅ Sistema funciona normalmente após pagamento

## Testes Necessários

### Teste 1: Renovação com GPO
1. Criar subscrição em trial expirado
2. Abrir modal de renovação
3. Selecionar GPO e preencher dados
4. Processar pagamento
5. ✅ Verificar que status mudou para "Ativo"
6. ✅ Verificar que mostra "30 dias restantes"
7. ✅ Verificar que "Período de Teste" desapareceu
8. ✅ Verificar no banco: trialEndsAt = null

### Teste 2: Upgrade com E-Kwanza
1. Criar subscrição Starter ativa
2. Abrir modal de upgrade
3. Selecionar plano Professional
4. Selecionar E-Kwanza e inserir telefone
5. Processar pagamento
6. ✅ Verificar que plano mudou para Professional
7. ✅ Verificar que limites aumentaram
8. ✅ Verificar que período foi renovado

### Teste 3: Verificar Logs Backend
1. Fazer pagamento
2. Verificar logs do backend:
   ```
   [PaymentService] Creating payment transaction: { subscriptionId: 123, ... }
   [PaymentService] Payment status from TPagamento: { status: 'completed', ... }
   [PaymentService] Processing real-time payment immediately
   [PaymentService] Subscription activated: { subscriptionId: 123, status: 'active', trialRemoved: true }
   ```
3. ✅ Confirmar que subscriptionId está presente
4. ✅ Confirmar que subscription foi atualizada

### Teste 4: Verificar Banco de Dados
Antes do pagamento:
```sql
SELECT id, status, trialEndsAt, currentPeriodEnd 
FROM subscriptions 
WHERE id = 123;
-- status: 'trial'
-- trialEndsAt: '2026-04-06'
-- currentPeriodEnd: '2026-04-06'
```

Depois do pagamento:
```sql
SELECT id, status, trialEndsAt, currentPeriodEnd 
FROM subscriptions 
WHERE id = 123;
-- status: 'active'
-- trialEndsAt: NULL  ✅
-- currentPeriodEnd: '2026-05-06'  ✅
```

## Status

✅ Correção crítica implementada
✅ subscriptionId agora é enviado pelos modais
✅ Backend atualiza subscrição corretamente
✅ Trial é removido após pagamento
✅ Logs melhorados para debug
⚠️ REQUER TESTES IMEDIATOS
⚠️ Bug crítico que impedia funcionamento do sistema de pagamentos
