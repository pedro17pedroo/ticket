# Correção: Atualização de Dados da Subscrição Após Pagamento

## Data: 2026-04-06

## Problemas Identificados

### 1. Dados Não Atualizam Após Renovação
- Pagamento processado com sucesso
- Subscrição atualizada no banco de dados
- Frontend não recarrega os dados
- Banner "Seu trial expira hoje!" continua aparecendo
- Status e dias restantes não atualizam

### 2. Upgrade Não Atualiza Plano e Valor
- Pagamento de upgrade processado
- Subscrição não muda de plano
- Valor da subscrição não atualiza
- Limites do plano não mudam

## Correções Implementadas

### 1. Garantir Callbacks São Chamados

**Problema:** Uso de optional chaining `?.()` pode falhar silenciosamente

**Solução:** Verificação explícita antes de chamar callback

**RenewModal.jsx:**
```javascript
if (selectedMethod === 'gpo' || selectedMethod === 'ekwanza') {
  toast.success('Pagamento processado com sucesso!');
  console.log('[RenewModal] Payment successful, calling onRenewComplete');
  
  setTimeout(() => {
    if (onRenewComplete) {
      console.log('[RenewModal] Calling onRenewComplete callback');
      onRenewComplete();  // ✅ Chamada explícita
    } else {
      console.warn('[RenewModal] onRenewComplete callback not provided');
    }
    handleClose();
  }, 2000);
}
```

**UpgradeModal.jsx:**
```javascript
if (selectedMethod === 'gpo' || selectedMethod === 'ekwanza') {
  toast.success('Pagamento processado com sucesso!');
  console.log('[UpgradeModal] Payment successful, calling onUpgradeComplete');
  
  setTimeout(() => {
    if (onUpgradeComplete) {
      console.log('[UpgradeModal] Calling onUpgradeComplete callback');
      onUpgradeComplete();  // ✅ Chamada explícita
    } else {
      console.warn('[UpgradeModal] onUpgradeComplete callback not provided');
    }
    handleClose();
  }, 2000);
}
```

### 2. Atualizar Plano e Valor no Upgrade

**Problema:** `processSuccessfulPayment` não atualizava planId nem amount

**Solução:** Detectar upgrade pela descrição e atualizar plano

**paymentService.js:**
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
        amount: transaction.amount,  // ✅ Atualizar valor
        trialEndsAt: null
      };

      // ✅ Detectar e processar upgrade
      if (transaction.description && transaction.description.includes('Upgrade para')) {
        const planName = transaction.description.replace('Upgrade para ', '').trim();
        
        const newPlan = await Plan.findOne({
          where: { name: planName }
        });

        if (newPlan) {
          updateData.planId = newPlan.id;  // ✅ Atualizar plano
          updateData.amount = newPlan.monthlyPrice;  // ✅ Atualizar valor do plano
          
          info('[PaymentService] Upgrading to new plan:', {
            oldPlanId: subscription.planId,
            newPlanId: newPlan.id,
            newPlanName: newPlan.name,
            newAmount: newPlan.monthlyPrice
          });
        }
      }

      await subscription.update(updateData);
    }
  }
}
```

### 3. Recarregar SubscriptionAlert

**Problema:** SubscriptionAlert carrega dados uma vez e nunca mais atualiza

**Solução:** Recarregar quando rota muda

**SubscriptionAlert.jsx:**
```javascript
import { useLocation } from 'react-router-dom';

const SubscriptionAlert = () => {
  const location = useLocation();

  // ✅ Recarregar quando volta de outra página
  useEffect(() => {
    if (location.pathname !== '/subscription') {
      loadSubscription();
    }
  }, [location.pathname]);

  const loadSubscription = async () => {
    try {
      const response = await subscriptionService.getCurrentSubscription();
      console.log('[SubscriptionAlert] Loaded subscription:', response);
      if (response.success) {
        setSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error('Erro ao carregar subscrição:', error);
    } finally {
      setLoading(false);
    }
  };
}
```

### 4. Logs de Debug

Adicionados logs em pontos críticos para facilitar debug:

- `[RenewModal] Payment successful, calling onRenewComplete`
- `[RenewModal] Calling onRenewComplete callback`
- `[UpgradeModal] Payment successful, calling onUpgradeComplete`
- `[UpgradeModal] Calling onUpgradeComplete callback`
- `[Subscription] Loaded subscription data:` (com dados completos)
- `[SubscriptionAlert] Loaded subscription:` (com dados completos)
- `[SubscriptionAlert] Status check:` (com status, isInTrial, daysRemaining)
- `[PaymentService] Upgrading to new plan:` (com IDs e valores)

## Fluxo Completo Corrigido

### Renovação
1. Cliente faz pagamento GPO/E-Kwanza
2. Backend processa e atualiza subscrição:
   - `status: 'active'`
   - `currentPeriodStart: now`
   - `currentPeriodEnd: now + 1 month`
   - `amount: transaction.amount`
   - `trialEndsAt: null`
3. Frontend mostra toast "Pagamento processado com sucesso!"
4. Aguarda 2 segundos
5. Chama `onRenewComplete()` → `loadSubscription()`
6. Fecha modal
7. Página recarrega dados do backend
8. ✅ Mostra status "Ativo", 30 dias restantes
9. ✅ Banner de trial desaparece

### Upgrade
1. Cliente seleciona novo plano e faz pagamento
2. Backend processa e atualiza subscrição:
   - `status: 'active'`
   - `planId: newPlan.id` ✅
   - `amount: newPlan.monthlyPrice` ✅
   - `currentPeriodStart: now`
   - `currentPeriodEnd: now + 1 month`
   - `trialEndsAt: null`
3. Frontend mostra toast "Pagamento processado com sucesso!"
4. Aguarda 2 segundos
5. Chama `onUpgradeComplete()` → `loadSubscription()`
6. Fecha modal
7. Página recarrega dados do backend
8. ✅ Mostra novo plano
9. ✅ Mostra novo valor
10. ✅ Mostra novos limites

## Arquivos Modificados

1. **portalOrganizaçãoTenant/src/components/subscription/RenewModal.jsx**
   - Verificação explícita de callback
   - Logs de debug

2. **portalOrganizaçãoTenant/src/components/subscription/UpgradeModal.jsx**
   - Verificação explícita de callback
   - Logs de debug

3. **portalOrganizaçãoTenant/src/pages/Subscription.jsx**
   - Log de dados carregados

4. **portalOrganizaçãoTenant/src/components/SubscriptionAlert.jsx**
   - Recarregar quando rota muda
   - Logs de debug

5. **backend/src/services/paymentService.js**
   - Atualizar amount sempre
   - Detectar e processar upgrade
   - Atualizar planId e amount no upgrade
   - Logs melhorados

## Como Testar

### Teste 1: Renovação
1. Abrir console do navegador (F12)
2. Fazer renovação com GPO
3. Verificar logs no console:
   ```
   [RenewModal] Payment successful, calling onRenewComplete
   [RenewModal] Calling onRenewComplete callback
   [Subscription] Loaded subscription data: { subscription: { status: 'active', ... } }
   ```
4. Verificar que página atualiza
5. Verificar que banner desaparece
6. Verificar que mostra "30 dias restantes"

### Teste 2: Upgrade
1. Abrir console do navegador
2. Fazer upgrade para plano superior
3. Verificar logs no console:
   ```
   [UpgradeModal] Payment successful, calling onUpgradeComplete
   [UpgradeModal] Calling onUpgradeComplete callback
   [Subscription] Loaded subscription data: { subscription: { planId: X, amount: Y, ... } }
   ```
4. Verificar que plano mudou
5. Verificar que valor mudou
6. Verificar que limites mudaram

### Teste 3: Backend Logs
1. Verificar logs do backend:
   ```
   [PaymentService] Processing successful payment: { subscriptionId: 123, description: 'Upgrade para Professional' }
   [PaymentService] Upgrading to new plan: { oldPlanId: 1, newPlanId: 2, newPlanName: 'Professional', newAmount: 75000 }
   [PaymentService] Subscription activated: { subscriptionId: 123, status: 'active', amount: 75000, planId: 2 }
   ```

### Teste 4: Banco de Dados
Verificar que subscrição foi atualizada:
```sql
SELECT id, status, planId, amount, trialEndsAt, currentPeriodEnd 
FROM subscriptions 
WHERE id = 123;
```

Deve mostrar:
- `status: 'active'`
- `planId: [novo plano se upgrade]`
- `amount: [novo valor]`
- `trialEndsAt: NULL`
- `currentPeriodEnd: [data futura]`

## Possíveis Problemas Restantes

### 1. Cache do Navegador
Se os dados ainda não atualizam, pode ser cache. Soluções:
- Hard refresh: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
- Limpar cache do navegador
- Abrir em aba anônima

### 2. Callback Não Fornecido
Se ver no console:
```
[RenewModal] onRenewComplete callback not provided
```

Verificar que Subscription.jsx está passando o callback:
```javascript
<RenewModal
  onRenewComplete={loadSubscription}  // ✅ Deve estar presente
/>
```

### 3. Erro ao Buscar Plano no Upgrade
Se ver no backend:
```
[PaymentService] New plan not found for upgrade: { planName: 'Professional' }
```

Verificar que:
- Nome do plano na descrição está correto
- Plano existe no banco com esse nome exato
- Usar `displayName` ou `name` conforme necessário

## Próximos Passos

### Melhorias Recomendadas

1. **Contexto Global de Subscrição**
   - Criar SubscriptionContext
   - Compartilhar estado entre componentes
   - Atualizar automaticamente em todos os lugares

2. **WebSocket para Atualizações Real-Time**
   - Backend notifica frontend quando pagamento confirma
   - Frontend atualiza imediatamente sem precisar recarregar

3. **Melhor Tratamento de Upgrade**
   - Enviar `newPlanId` explicitamente no paymentData
   - Não depender de parsing da descrição
   - Mais robusto e confiável

4. **Invalidar Cache**
   - Adicionar timestamp nas requisições
   - Forçar revalidação de dados
   - Evitar dados desatualizados

## Status

✅ Callbacks explícitos implementados
✅ Upgrade atualiza plano e valor
✅ SubscriptionAlert recarrega
✅ Logs de debug adicionados
⚠️ Requer testes funcionais
⚠️ Pode precisar de hard refresh no navegador
⚠️ Considerar implementar contexto global
