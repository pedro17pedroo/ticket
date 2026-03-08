# Design - Integração de Pagamentos TPagamento

## Arquitetura

### Backend

#### 1. Modelos de Dados

```javascript
// Payment Model
{
  id: UUID,
  organizationId: UUID,
  subscriptionId: UUID,
  amount: DECIMAL,
  currency: STRING (default: 'AOA'),
  paymentMethod: ENUM('ekwanza', 'gpo', 'ref'),
  status: ENUM('pending', 'processing', 'completed', 'failed', 'expired'),
  paymentId: STRING, // ID retornado pelo TPagamento
  referenceCode: STRING, // Código de referência
  customerName: STRING,
  customerEmail: STRING,
  customerPhone: STRING,
  description: STRING,
  metadata: JSONB,
  paidAt: DATE,
  expiresAt: DATE,
  createdAt: DATE,
  updatedAt: DATE
}

// PaymentMethod Model (métodos salvos)
{
  id: UUID,
  organizationId: UUID,
  type: ENUM('ekwanza', 'gpo', 'ref'),
  isDefault: BOOLEAN,
  customerName: STRING,
  customerEmail: STRING,
  customerPhone: STRING,
  lastUsedAt: DATE,
  createdAt: DATE,
  updatedAt: DATE
}
```

#### 2. Serviço TPagamento

```
backend/src/services/tpagamentoService.js
- createEKwanzaPayment()
- createMulticaixaExpressPayment()
- createReferenciaMulticaixaPayment()
- checkPaymentStatus()
- createPayment() // unified
- getPaymentStatus() // unified
```

#### 3. Endpoints

```
POST   /api/payments/create           - Criar pagamento
GET    /api/payments/:id              - Obter pagamento
GET    /api/payments/:id/status       - Verificar status
POST   /api/payments/webhook          - Webhook TPagamento
GET    /api/payments/organization     - Listar pagamentos da org
GET    /api/payments/:id/receipt      - Gerar recibo

POST   /api/payment-methods           - Salvar método
GET    /api/payment-methods           - Listar métodos
PUT    /api/payment-methods/:id       - Atualizar método
DELETE /api/payment-methods/:id       - Remover método
```

#### 4. Atualização do Onboarding

```javascript
// saasController.js - createTenantOrganization
// Adicionar lógica:
1. Se plano.trialDays > 0 e skipPayment=true:
   - Criar org com subscription status='trial'
   - Não processar pagamento
   
2. Se plano.trialDays === 0 ou skipPayment=false:
   - Processar pagamento antes de criar org
   - Aguardar confirmação
   - Criar org com subscription status='active'
```

### Frontend

#### 1. Portal SaaS - Onboarding

**Componentes:**
```
portalSaaS/src/pages/Onboarding/
├── OnboardingWizard.jsx (atualizar)
├── steps/
│   ├── CompanyInfo.jsx
│   ├── AdminInfo.jsx
│   ├── PlanSelection.jsx
│   ├── PaymentStep.jsx (NOVO)
│   └── Confirmation.jsx
└── components/
    ├── PaymentMethodSelector.jsx (NOVO)
    ├── EKwanzaPayment.jsx (NOVO)
    ├── MulticaixaExpressPayment.jsx (NOVO)
    ├── ReferenciaMulticaixaPayment.jsx (NOVO)
    └── PaymentStatus.jsx (NOVO)
```

**Fluxo do PaymentStep:**
1. Verificar se plano tem trial
2. Se sim: mostrar botão "Pular e iniciar período de teste"
3. Mostrar 3 opções de pagamento
4. Ao selecionar método, mostrar formulário específico
5. Processar pagamento
6. Polling de status (a cada 5s por 2 minutos)
7. Redirecionar após confirmação

#### 2. Portal Organização - Gestão de Subscrição

**Componentes:**
```
portalOrganizaçãoTenant/src/pages/Subscription/
├── SubscriptionManagement.jsx (NOVO)
├── components/
│   ├── CurrentPlan.jsx
│   ├── UsageLimits.jsx
│   ├── PaymentMethods.jsx
│   ├── AddPaymentMethod.jsx
│   ├── PaymentHistory.jsx
│   ├── UpgradePlan.jsx
│   └── Receipt.jsx
```

**Seções da Página:**
1. Plano Atual
   - Nome do plano
   - Valor mensal
   - Status (trial/active/past_due)
   - Dias restantes de trial
   - Botão "Upgrade"

2. Limites e Uso
   - Usuários: X/Y
   - Clientes: X/Y
   - Tickets/mês: X/Y
   - Armazenamento: X GB/Y GB
   - Barras de progresso

3. Métodos de Pagamento
   - Lista de métodos salvos
   - Botão "Adicionar método"
   - Marcar como padrão
   - Remover método

4. Histórico de Pagamentos
   - Tabela com:
     - Data
     - Valor
     - Método
     - Status
     - Ação (Download recibo)
   - Paginação

## Fluxo de Dados

### Criar Pagamento

```
Frontend → POST /api/payments/create
{
  method: 'gpo',
  amount: 5000,
  customer: {
    name: 'Pedro Nekaka',
    email: 'pedro@example.com',
    phone: '935095730'
  },
  description: 'Pagamento Plano Professional'
}

Backend → TPagamento API
POST /api/v1/payments
{
  amount: 5000,
  currency: 'AOA',
  paymentMethod: 'gpo',
  customerName: 'Pedro Nekaka',
  customerEmail: 'pedro@example.com',
  customerPhone: '935095730',
  description: 'Pagamento Plano Professional',
  metadata: { gateway: 'appypay', method: 'gpo' },
  expiresIn: 30
}

TPagamento → Backend
{
  success: true,
  data: {
    id: 'pay_123',
    reference: 'REF-456',
    status: 'pending'
  }
}

Backend → Database
INSERT INTO payments (
  paymentId: 'pay_123',
  referenceCode: 'REF-456',
  status: 'pending',
  ...
)

Backend → Frontend
{
  success: true,
  payment: {
    id: 'uuid',
    paymentId: 'pay_123',
    referenceCode: 'REF-456',
    status: 'pending'
  }
}
```

### Verificar Status (Polling)

```
Frontend → GET /api/payments/:id/status (a cada 5s)

Backend → TPagamento API
GET /api/v1/payments/pay_123

TPagamento → Backend
{
  success: true,
  data: {
    id: 'pay_123',
    status: 'completed',
    paidAt: '2026-03-05T10:30:00Z'
  }
}

Backend → Database
UPDATE payments SET status='completed', paidAt='...'

Backend → Frontend
{
  success: true,
  status: 'completed',
  paidAt: '...'
}
```

### Webhook

```
TPagamento → POST /api/payments/webhook
{
  event: 'payment.completed',
  data: {
    id: 'pay_123',
    status: 'completed',
    paidAt: '2026-03-05T10:30:00Z'
  }
}

Backend:
1. Validar webhook secret
2. Buscar payment no DB
3. Atualizar status
4. Se subscription em trial e pagamento completo:
   - Atualizar subscription para 'active'
5. Enviar notificação ao usuário
```

## UI/UX

### PaymentStep - Onboarding

```
┌─────────────────────────────────────────┐
│  Pagamento                              │
├─────────────────────────────────────────┤
│                                         │
│  Plano Selecionado: Professional        │
│  Valor: Kz 5.000,00 / mês              │
│                                         │
│  ✓ 30 dias de teste grátis             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ [Pular e iniciar período de teste]│ │
│  └───────────────────────────────────┘ │
│                                         │
│  ou escolha um método de pagamento:     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ○ E-Kwanza                      │   │
│  │   Pagamento via código          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ● Multicaixa Express (GPO)      │   │
│  │   Pagamento instantâneo         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ○ Referência Multicaixa         │   │
│  │   Pagamento por referência      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Formulário do método selecionado]     │
│                                         │
│  [Voltar]              [Processar]      │
└─────────────────────────────────────────┘
```

### Gestão de Subscrição - Portal Organização

```
┌─────────────────────────────────────────┐
│  Gestão de Subscrição                   │
├─────────────────────────────────────────┤
│                                         │
│  Plano Atual: Professional              │
│  Status: Ativo                          │
│  Valor: Kz 5.000,00 / mês              │
│  Próximo pagamento: 05/04/2026          │
│                                         │
│  [Upgrade de Plano]                     │
│                                         │
├─────────────────────────────────────────┤
│  Uso Atual                              │
│                                         │
│  Usuários:  [████████░░] 8/10           │
│  Clientes:  [████░░░░░░] 20/50          │
│  Tickets:   [██████░░░░] 150/250        │
│                                         │
├─────────────────────────────────────────┤
│  Métodos de Pagamento                   │
│                                         │
│  ● Multicaixa Express                   │
│    pedro@example.com                    │
│    [Padrão] [Remover]                   │
│                                         │
│  [+ Adicionar Método]                   │
│                                         │
├─────────────────────────────────────────┤
│  Histórico de Pagamentos                │
│                                         │
│  Data       Valor      Método  Status   │
│  05/03/26   Kz 5.000   GPO     Pago ✓   │
│  05/02/26   Kz 5.000   GPO     Pago ✓   │
│  05/01/26   Kz 5.000   REF     Pago ✓   │
│                                         │
│  [Ver Mais]                             │
└─────────────────────────────────────────┘
```

## Variáveis de Ambiente

```env
# Payment Gateway - TPagamento (Angola)
TPAGAMENTO_API_URL=https://tpagamento-backend.tatusolutions.com/api/v1
TPAGAMENTO_API_KEY=pk_test_ttb_sandbox_key
TPAGAMENTO_WEBHOOK_SECRET=your-webhook-secret
```

## Segurança

1. **API Key**: Nunca expor no frontend
2. **Webhook Secret**: Validar todas as requisições
3. **HTTPS**: Todas as comunicações via HTTPS
4. **Dados Sensíveis**: Não armazenar dados de cartão
5. **Logs**: Não logar dados sensíveis
6. **Rate Limiting**: Limitar requisições de pagamento

## Tratamento de Erros

```javascript
// Erros comuns
- Network timeout → Retry automático (3x)
- Payment expired → Mostrar mensagem e permitir novo pagamento
- Payment failed → Mostrar erro e sugerir outro método
- Invalid data → Validar no frontend antes de enviar
- Webhook invalid → Rejeitar e logar
```
