# Análise do Sistema de Subscrição

## Data: 04/04/2026

## Status Geral: ✅ IMPLEMENTADO (com melhorias necessárias)

O sistema de subscrição está implementado no backend e frontend, mas requer algumas melhorias e ajustes.

---

## 1. BACKEND - Sistema de Subscrição

### ✅ Models Implementados

#### 1.1 Plan (Planos)
**Arquivo:** `backend/src/models/Plan.js`

**Campos principais:**
- `name`: Nome do plano (starter, professional, enterprise)
- `displayName`: Nome de exibição
- `monthlyPrice`, `yearlyPrice`: Preços
- `currency`: Moeda (EUR, USD, BRL, AOA, etc.)
- `limits`: Limites do plano (JSON)
  - `maxUsers`: Máximo de usuários
  - `maxClients`: Máximo de clientes
  - `maxStorageGB`: Armazenamento
  - `maxTicketsPerMonth`: Tickets por mês
- `features`: Features habilitadas (JSON)
- `isActive`: Se está ativo para contratação
- `isDefault`: Se é o plano padrão

#### 1.2 Subscription (Subscrições)
**Arquivo:** `backend/src/models/Subscription.js`

**Campos principais:**
- `organizationId`: Organização (tenant)
- `planId`: Plano contratado
- `status`: Status da subscrição
  - `trial`: Período de teste
  - `active`: Ativa
  - `past_due`: Pagamento atrasado
  - `cancelled`: Cancelada
  - `suspended`: Suspensa
- `trialEndsAt`: Data de fim do trial
- `currentPeriodStart`, `currentPeriodEnd`: Período atual
- `cancelAtPeriodEnd`: Se cancela no fim do período
- `paymentMethod`: Método de pagamento (stripe, manual)
- `stripeCustomerId`, `stripeSubscriptionId`: IDs do Stripe

**Índices:**
- Uma subscrição por organização (unique)
- Índices em status, trial_ends_at, current_period_end

### ✅ Controller Implementado

**Arquivo:** `backend/src/modules/subscriptions/subscriptionController.js`

#### Endpoints para Portal SaaS (Admin)

1. **GET /api/subscriptions**
   - Listar todas as subscrições
   - Filtros: status, planId, search
   - Paginação
   - ✅ Implementado

2. **GET /api/subscriptions/pending**
   - Listar subscrições pendentes (trial, past_due)
   - ✅ Implementado

3. **GET /api/subscriptions/stats**
   - Estatísticas de subscrições
   - Total, por status, trials expirando
   - ✅ Implementado

4. **GET /api/subscriptions/:id**
   - Obter subscrição por ID
   - ✅ Implementado

5. **PUT /api/subscriptions/:id/plan**
   - Alterar plano da subscrição
   - ✅ Implementado

6. **PUT /api/subscriptions/:id/approve**
   - Aprovar subscrição (pagamento manual)
   - ✅ Implementado

7. **PUT /api/subscriptions/:id/reject**
   - Rejeitar subscrição
   - ✅ Implementado

8. **PUT /api/subscriptions/:id/cancel**
   - Cancelar subscrição
   - Opção: imediato ou no fim do período
   - ✅ Implementado

9. **PUT /api/subscriptions/:id/reactivate**
   - Reativar subscrição cancelada
   - ✅ Implementado

10. **PUT /api/subscriptions/:id/extend-trial**
    - Estender período de trial
    - ✅ Implementado

#### Endpoints para Portal Organização

1. **GET /api/subscription**
   - Obter subscrição da organização atual
   - Inclui: plano, uso atual, dias restantes de trial
   - ✅ Implementado

### ✅ Middleware de Controle

**Arquivo:** `backend/src/middleware/planLimitsMiddleware.js`

**Função:** `checkSubscriptionStatus`
- Verifica se subscrição está ativa ou em trial
- Bloqueia acesso se trial expirou
- Retorna erro 402 (Payment Required) se expirado
- ✅ Implementado

### ✅ Rotas Configuradas

**Arquivo:** `backend/src/routes/index.js`

```javascript
// Portal Organização
router.get('/subscription', authenticate, validateContext, injectContext, 
  subscriptionController.getCurrentOrganizationSubscription);

// Portal SaaS (Admin)
router.get('/subscriptions', authenticate, authorize('super-admin', 'provider-admin'), 
  subscriptionController.getSubscriptions);
router.get('/subscriptions/pending', authenticate, authorize('super-admin', 'provider-admin'), 
  subscriptionController.getPendingSubscriptions);
router.get('/subscriptions/stats', authenticate, authorize('super-admin', 'provider-admin'), 
  subscriptionController.getSubscriptionStats);
router.get('/subscriptions/:id', authenticate, authorize('super-admin', 'provider-admin'), 
  subscriptionController.getSubscriptionById);
router.put('/subscriptions/:id/plan', authenticate, authorize('super-admin', 'provider-admin'), 
  auditLog('update', 'subscription'), subscriptionController.changePlan);
router.put('/subscriptions/:id/approve', authenticate, authorize('super-admin', 'provider-admin'), 
  auditLog('update', 'subscription'), subscriptionController.approveSubscription);
router.put('/subscriptions/:id/reject', authenticate, authorize('super-admin', 'provider-admin'), 
  auditLog('update', 'subscription'), subscriptionController.rejectSubscription);
router.put('/subscriptions/:id/cancel', authenticate, authorize('super-admin', 'provider-admin'), 
  auditLog('update', 'subscription'), subscriptionController.cancelSubscription);
router.put('/subscriptions/:id/reactivate', authenticate, authorize('super-admin', 'provider-admin'), 
  auditLog('update', 'subscription'), subscriptionController.reactivateSubscription);
router.put('/subscriptions/:id/extend-trial', authenticate, authorize('super-admin', 'provider-admin'), 
  auditLog('update', 'subscription'), subscriptionController.extendTrial);
```

---

## 2. FRONTEND - Portal Organização

### ✅ Página de Subscrição

**Arquivo:** `portalOrganizaçãoTenant/src/pages/Subscription.jsx`

**Funcionalidades:**
- Exibir plano atual
- Mostrar status da subscrição
- Exibir uso atual vs limites
- Botão de upgrade de plano
- Histórico de pagamentos
- ✅ Implementado

**Componentes:**
- `PaymentHistory`: Histórico de pagamentos
- `UpgradeModal`: Modal para upgrade de plano

### ✅ Service de Subscrição

**Arquivo:** `portalOrganizaçãoTenant/src/services/subscriptionService.js`

**Métodos:**
- `getCurrentSubscription()`: Obter subscrição atual
- `getAvailablePlans()`: Listar planos disponíveis
- ✅ Implementado

### ✅ Modal de Upgrade

**Arquivo:** `portalOrganizaçãoTenant/src/components/subscription/UpgradeModal.jsx`

**Funcionalidades:**
- Listar planos superiores ao atual
- Calcular diferença de preço
- Calcular crédito do plano atual
- Selecionar método de pagamento
- ✅ Implementado

---

## 3. MELHORIAS NECESSÁRIAS

### ❌ 1. Sistema de Notificações para Subscrições Expirando

**Status:** PARCIALMENTE IMPLEMENTADO

**O que existe:**
- Middleware que bloqueia acesso quando trial expira
- Cálculo de dias restantes de trial

**O que falta:**
- ❌ Notificações automáticas para admins quando trial está próximo de expirar
- ❌ Notificações quando subscrição está próxima de expirar
- ❌ Alertas visuais no dashboard
- ❌ Emails automáticos de lembrete

**Implementação sugerida:**

```javascript
// backend/src/services/subscriptionNotificationService.js

export const checkExpiringSubscriptions = async () => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  // Trials expirando em 7, 3, 1 dia
  const expiringTrials = await Subscription.findAll({
    where: {
      status: 'trial',
      trialEndsAt: {
        [Op.between]: [now, in7Days]
      }
    },
    include: [
      { model: Organization, as: 'organization' },
      { model: Plan, as: 'plan' }
    ]
  });

  for (const subscription of expiringTrials) {
    const daysRemaining = Math.ceil(
      (new Date(subscription.trialEndsAt) - now) / (1000 * 60 * 60 * 24)
    );

    // Criar notificação para admins da organização
    await createNotificationForAdmins(
      subscription.organizationId,
      {
        type: 'subscription_expiring',
        title: `Trial expira em ${daysRemaining} dias`,
        message: `Seu período de trial expira em ${daysRemaining} dias. Escolha um plano para continuar.`,
        priority: daysRemaining <= 3 ? 'high' : 'medium',
        actionUrl: '/subscription'
      }
    );

    // Enviar email
    await sendTrialExpiringEmail(subscription, daysRemaining);
  }

  // Subscrições ativas expirando
  const expiringSubscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      currentPeriodEnd: {
        [Op.between]: [now, in7Days]
      }
    },
    include: [
      { model: Organization, as: 'organization' },
      { model: Plan, as: 'plan' }
    ]
  });

  for (const subscription of expiringSubscriptions) {
    const daysRemaining = Math.ceil(
      (new Date(subscription.currentPeriodEnd) - now) / (1000 * 60 * 60 * 24)
    );

    await createNotificationForAdmins(
      subscription.organizationId,
      {
        type: 'subscription_renewal',
        title: `Renovação em ${daysRemaining} dias`,
        message: `Sua subscrição será renovada em ${daysRemaining} dias.`,
        priority: 'medium',
        actionUrl: '/subscription'
      }
    );
  }
};

// Executar diariamente via cron job
// cron.schedule('0 9 * * *', checkExpiringSubscriptions);
```

### ❌ 2. Renovação de Subscrição

**Status:** NÃO IMPLEMENTADO

**O que falta:**
- ❌ Endpoint para renovar subscrição
- ❌ Interface no frontend para renovação
- ❌ Integração com gateway de pagamento

**Implementação sugerida:**

```javascript
// backend/src/modules/subscriptions/subscriptionController.js

export const renewSubscription = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { paymentMethod, paymentReference } = req.body;

    const subscription = await Subscription.findOne({
      where: { organizationId },
      include: [{ model: Plan, as: 'plan' }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscrição não encontrada'
      });
    }

    // Calcular próximo período
    const now = new Date();
    const nextPeriodEnd = new Date(now);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

    await subscription.update({
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: nextPeriodEnd,
      paymentMethod,
      paymentReference
    });

    // Criar registro de pagamento
    await PaymentTransaction.create({
      organizationId,
      subscriptionId: subscription.id,
      amount: subscription.plan.monthlyPrice,
      currency: subscription.plan.currency,
      status: 'completed',
      paymentMethod,
      paymentReference,
      description: `Renovação de subscrição - ${subscription.plan.displayName}`
    });

    res.json({
      success: true,
      message: 'Subscrição renovada com sucesso',
      subscription
    });
  } catch (error) {
    next(error);
  }
};
```

### ❌ 3. Alertas Visuais no Dashboard

**Status:** NÃO IMPLEMENTADO

**O que falta:**
- ❌ Banner de alerta quando trial está próximo de expirar
- ❌ Badge no menu de subscrição
- ❌ Modal de bloqueio quando subscrição expira

**Implementação sugerida:**

```jsx
// portalOrganizaçãoTenant/src/components/SubscriptionAlert.jsx

const SubscriptionAlert = () => {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    const response = await subscriptionService.getCurrentSubscription();
    if (response.success) {
      setSubscription(response.data.subscription);
    }
  };

  if (!subscription) return null;

  const isInTrial = subscription.status === 'trial';
  const daysRemaining = subscription.trialDaysRemaining;

  if (isInTrial && daysRemaining <= 7) {
    return (
      <div className={`p-4 rounded-lg mb-6 ${
        daysRemaining <= 3 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
      } border`}>
        <div className="flex items-center gap-3">
          <AlertCircle className={`w-5 h-5 ${
            daysRemaining <= 3 ? 'text-red-600' : 'text-yellow-600'
          }`} />
          <div className="flex-1">
            <h3 className="font-semibold">
              {daysRemaining === 0 
                ? 'Seu trial expira hoje!' 
                : `Seu trial expira em ${daysRemaining} dias`}
            </h3>
            <p className="text-sm text-gray-600">
              Escolha um plano para continuar usando o sistema.
            </p>
          </div>
          <Link
            to="/subscription"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Ver Planos
          </Link>
        </div>
      </div>
    );
  }

  return null;
};
```

### ❌ 4. Controle de Acesso ao Menu de Subscrição

**Status:** NÃO VERIFICADO

**O que verificar:**
- ❌ Menu de subscrição deve estar visível apenas para admins
- ❌ Usar `PermissionGate` ou verificar role

**Implementação sugerida:**

```jsx
// portalOrganizaçãoTenant/src/components/Sidebar.jsx

import { useAuthStore } from '../store/authStore';

const Sidebar = () => {
  const { user } = useAuthStore();
  const isAdmin = ['admin', 'super-admin', 'org-admin'].includes(user?.role);

  return (
    <nav>
      {/* Outros menus */}
      
      {/* Menu de Subscrição - Apenas para Admins */}
      {isAdmin && (
        <Link to="/subscription" className="nav-item">
          <CreditCard className="w-5 h-5" />
          <span>Subscrição</span>
        </Link>
      )}
    </nav>
  );
};
```

---

## 4. RESUMO DE IMPLEMENTAÇÃO

### ✅ O que está implementado:

1. Models de Plan e Subscription
2. Controller completo de subscrições
3. Endpoints para Portal SaaS (admin)
4. Endpoint para Portal Organização obter subscrição
5. Middleware de verificação de status
6. Página de subscrição no frontend
7. Modal de upgrade de plano
8. Histórico de pagamentos
9. Cálculo de uso vs limites

### ❌ O que falta implementar:

1. Sistema de notificações automáticas para subscrições expirando
2. Emails de lembrete de renovação
3. Endpoint de renovação de subscrição
4. Alertas visuais no dashboard
5. Banner de alerta quando trial está próximo de expirar
6. Modal de bloqueio quando subscrição expira
7. Controle de acesso ao menu (apenas admins)
8. Cron job para verificar subscrições expirando diariamente

---

## 5. PRIORIDADES DE IMPLEMENTAÇÃO

### Alta Prioridade:
1. ✅ Sistema de notificações para subscrições expirando
2. ✅ Alertas visuais no dashboard
3. ✅ Controle de acesso ao menu (apenas admins)

### Média Prioridade:
4. ✅ Endpoint de renovação de subscrição
5. ✅ Emails de lembrete

### Baixa Prioridade:
6. ✅ Melhorias na interface de upgrade
7. ✅ Relatórios de uso detalhados

---

## 6. ARQUIVOS RELEVANTES

### Backend:
- `backend/src/models/Plan.js`
- `backend/src/models/Subscription.js`
- `backend/src/modules/subscriptions/subscriptionController.js`
- `backend/src/middleware/planLimitsMiddleware.js`
- `backend/src/routes/index.js`

### Frontend:
- `portalOrganizaçãoTenant/src/pages/Subscription.jsx`
- `portalOrganizaçãoTenant/src/components/subscription/UpgradeModal.jsx`
- `portalOrganizaçãoTenant/src/components/subscription/PaymentHistory.jsx`
- `portalOrganizaçãoTenant/src/services/subscriptionService.js`

---

## 7. CONCLUSÃO

O sistema de subscrição está **bem implementado** no backend e frontend, com funcionalidades essenciais como:
- Gestão de planos
- Controle de subscrições
- Upgrade de plano
- Verificação de status

Porém, **faltam implementações importantes** para um SaaS completo:
- Notificações automáticas de expiração
- Alertas visuais para usuários
- Sistema de renovação automática
- Controle de acesso ao menu

Recomendo implementar as melhorias de **Alta Prioridade** primeiro para garantir uma experiência completa aos clientes.
