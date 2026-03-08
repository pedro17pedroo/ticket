# Diagrama de Fluxo - Pagamento no Onboarding

## Fluxo Visual Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    PORTAL SAAS - ONBOARDING                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 0: Informações da Empresa                                  │
│ ─────────────────────────────────────────────────────────────── │
│ • Nome da Empresa                                               │
│ • Nome Comercial                                                │
│ • Email e Telefone                                              │
│ • Setor/Indústria                                               │
│ • Tamanho da Empresa                                            │
│                                                                 │
│ [Plano Selecionado: Professional - €49/mês] [Alterar]          │
│                                                                 │
│                                        [Continuar →]            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Utilizador Administrador                                │
│ ─────────────────────────────────────────────────────────────── │
│ • Nome Completo                                                 │
│ • Email                                                         │
│ • Telefone                                                      │
│                                                                 │
│ [← Voltar]                             [Continuar →]            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Verificação de Email                                    │
│ ─────────────────────────────────────────────────────────────── │
│ Email enviado para: joao@empresa.com                            │
│                                                                 │
│ Digite o código de 6 dígitos:                                   │
│ ┌─────────────┐                                                 │
│ │  [ 0 0 0 0 0 0 ]  │                                           │
│ └─────────────┘                                                 │
│                                                                 │
│ Não recebeu? [Reenviar]                                         │
│                                                                 │
│ [← Voltar]                             [Verificar →]            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Senha de Acesso                                         │
│ ─────────────────────────────────────────────────────────────── │
│ [Plano: Professional - €49/mês] [Alterar]                       │
│ 14 dias de trial grátis incluídos                               │
│                                                                 │
│ • Senha (mínimo 8 caracteres)                                   │
│ • Confirmar Senha                                               │
│                                                                 │
│ [← Voltar]                             [Continuar →]            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: PAGAMENTO ⭐ NOVO                                        │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Professional                              €49.00             │ │
│ │ Plano completo para empresas                por mês          │ │
│ │                                                              │ │
│ │ 🎉 14 dias de teste grátis                                   │ │
│ │ Experimente todos os recursos    [Iniciar Teste Grátis]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                    OU (se não tiver trial)                      │
│                                                                 │
│ Selecione o Método de Pagamento:                                │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📱 E-Kwanza                                          ✓       │ │
│ │    Pagamento via código E-Kwanza                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💳 Multicaixa Express                                        │ │
│ │    Pagamento instantâneo via GPO                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📄 Referência Multicaixa                                     │ │
│ │    Pagamento por referência EMIS                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [← Voltar]                    [💳 Processar Pagamento]          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
            Trial/Gratuito      Pago
                    │               │
                    ↓               ↓
        ┌───────────────┐   ┌─────────────────────────────────────┐
        │ Criar         │   │ Instruções de Pagamento             │
        │ Organização   │   │ ─────────────────────────────────── │
        │ Imediatamente │   │ Método: E-Kwanza                    │
        └───────────────┘   │                                     │
                │           │ ⏱️ Tempo restante: 14:32             │
                │           │                                     │
                │           │ 1. Abra o app E-Kwanza              │
                │           │ 2. Selecione "Pagar com Código"     │
                │           │ 3. Digite o código:                 │
                │           │                                     │
                │           │ ┌─────────────────────────────────┐ │
                │           │ │  578496825          [📋 Copiar] │ │
                │           │ └─────────────────────────────────┘ │
                │           │                                     │
                │           │ 4. Confirme Kz 49.00                │
                │           │                                     │
                │           │ 🔄 Verificando pagamento...         │
                │           │                                     │
                │           │ [← Escolher Outro Método]           │
                │           └─────────────────────────────────────┘
                │                           ↓
                │                   Polling (10s)
                │                           ↓
                │                   ┌───────┴───────┐
                │                   │               │
                │               Confirmado      Falhou/Expirou
                │                   │               │
                │                   ↓               ↓
                │           ┌───────────────┐   ┌─────────────┐
                │           │ Criar         │   │ Mensagem    │
                │           │ Organização   │   │ de Erro     │
                │           │ com Pagamento │   │ + Retry     │
                │           └───────────────┘   └─────────────┘
                │                   │
                └───────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Sucesso!                                                │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│                    🚀                                           │
│         Organização Criada com Sucesso!                         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ URL de Acesso:                                              │ │
│ │ https://empresa-teste.t-desk.com          [📋 Copiar]       │ │
│ │                                                              │ │
│ │ Email: joao@empresa.com                   [📋 Copiar]       │ │
│ │                                                              │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ Plano Contratado                                            │ │
│ │                                                              │ │
│ │ Professional                              [Trial]           │ │
│ │ Usuários: 50    Clientes: 1000                              │ │
│ │ Trial termina: 22/03/2026                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Próximos Passos:                                                │
│ • Verifique seu email                                           │
│ • Acesse o portal                                               │
│ • Configure usuários                                            │
│ • Comece a usar                                                 │
│                                                                 │
│                    [🔗 Acessar Portal]                          │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Decisão - Step 4 (Pagamento)

```
                    ┌─────────────────────┐
                    │   STEP 4: PAGAMENTO │
                    └──────────┬──────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │ Verificar Plano      │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ↓                             ↓
    ┌───────────────────────┐     ┌──────────────────────┐
    │ Trial > 0 OU          │     │ Plano Pago           │
    │ Preço = 0             │     │ (sem trial)          │
    └───────────┬───────────┘     └──────────┬───────────┘
                │                             │
                ↓                             ↓
    ┌───────────────────────┐     ┌──────────────────────┐
    │ Exibir Botão:         │     │ Exibir Seletor de    │
    │ "Iniciar Teste"       │     │ Método de Pagamento  │
    │ ou "Continuar"        │     │                      │
    └───────────┬───────────┘     └──────────┬───────────┘
                │                             │
                ↓                             ↓
    ┌───────────────────────┐     ┌──────────────────────┐
    │ handleSkipPayment()   │     │ Usuário Seleciona    │
    │                       │     │ Método               │
    └───────────┬───────────┘     └──────────┬───────────┘
                │                             │
                │                             ↓
                │                 ┌──────────────────────┐
                │                 │ handleCreatePayment()│
                │                 └──────────┬───────────┘
                │                             │
                │                             ↓
                │                 ┌──────────────────────┐
                │                 │ paymentService       │
                │                 │ .createPayment()     │
                │                 └──────────┬───────────┘
                │                             │
                │                             ↓
                │                 ┌──────────────────────┐
                │                 │ Exibir Instruções    │
                │                 │ PaymentInstructions  │
                │                 └──────────┬───────────┘
                │                             │
                │                             ↓
                │                 ┌──────────────────────┐
                │                 │ Polling Status       │
                │                 │ (cada 10s)           │
                │                 └──────────┬───────────┘
                │                             │
                │                 ┌───────────┴───────────┐
                │                 │                       │
                │                 ↓                       ↓
                │     ┌──────────────────┐   ┌──────────────────┐
                │     │ Status:          │   │ Status:          │
                │     │ completed        │   │ failed/expired   │
                │     └────────┬─────────┘   └────────┬─────────┘
                │              │                       │
                │              ↓                       ↓
                │     ┌──────────────────┐   ┌──────────────────┐
                │     │ handlePayment    │   │ Exibir Erro      │
                │     │ Complete()       │   │ + Permitir Retry │
                │     └────────┬─────────┘   └──────────────────┘
                │              │
                └──────────────┴───────────────┐
                                               │
                                               ↓
                               ┌───────────────────────────┐
                               │ createOrganization        │
                               │ WithPayment()             │
                               └───────────┬───────────────┘
                                           │
                                           ↓
                               ┌───────────────────────────┐
                               │ saasAPI                   │
                               │ .createOrganization()     │
                               └───────────┬───────────────┘
                                           │
                                           ↓
                               ┌───────────────────────────┐
                               │ STEP 5: SUCESSO           │
                               └───────────────────────────┘
```

## Componentes e Responsabilidades

```
┌─────────────────────────────────────────────────────────────────┐
│                    OnboardingNew.jsx                             │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ PaymentStep Component                                  │    │
│  │ ────────────────────────────────────────────────────── │    │
│  │                                                         │    │
│  │  • Estado: selectedMethod, transaction, loading        │    │
│  │  • Lógica: handleCreatePayment, handleSkipPayment      │    │
│  │  • Renderiza:                                          │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ PaymentMethodSelector                            │  │    │
│  │  │ ──────────────────────────────────────────────── │  │    │
│  │  │ • Exibe 3 métodos                                │  │    │
│  │  │ • Callback: onSelectMethod                       │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ PaymentInstructions                              │  │    │
│  │  │ ──────────────────────────────────────────────── │  │    │
│  │  │ • Exibe instruções por método                    │  │    │
│  │  │ • Timer de expiração                             │  │    │
│  │  │ • Polling de status (10s)                        │  │    │
│  │  │ • Callbacks: onSuccess, onFailed, onExpired      │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ paymentService                                         │    │
│  │ ────────────────────────────────────────────────────── │    │
│  │ • createPayment()                                      │    │
│  │ • checkPaymentStatus()                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ saasAPI                                                │    │
│  │ ────────────────────────────────────────────────────── │    │
│  │ • createOrganization()                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Estados de Pagamento

```
┌─────────────┐
│   PENDING   │ ← Estado inicial após criar pagamento
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ↓                                     ↓
┌─────────────┐                      ┌─────────────┐
│  COMPLETED  │ → Criar Organização  │   FAILED    │ → Permitir Retry
└─────────────┘                      └─────────────┘
       
       ↓
┌─────────────┐
│   EXPIRED   │ → Voltar à seleção
└─────────────┘
```

## Integração com Backend

```
Frontend (Portal SaaS)                    Backend (API)
─────────────────────                     ─────────────

┌─────────────────────┐
│ PaymentStep         │
│ handleCreatePayment │
└──────────┬──────────┘
           │
           │ POST /api/payments/create
           │ {
           │   amount: 49.00,
           │   paymentMethod: "ekwanza",
           │   customerName: "João Silva",
           │   customerEmail: "joao@empresa.com",
           │   customerPhone: "+244900000000",
           │   description: "Pagamento Plano Professional"
           │ }
           │
           ↓
                                          ┌─────────────────────┐
                                          │ paymentController   │
                                          │ .createPayment()    │
                                          └──────────┬──────────┘
                                                     │
                                                     ↓
                                          ┌─────────────────────┐
                                          │ tpagamentoService   │
                                          │ .createEKwanza()    │
                                          └──────────┬──────────┘
                                                     │
                                                     ↓
                                          ┌─────────────────────┐
                                          │ TPagamento API      │
                                          └──────────┬──────────┘
           ↑                                         │
           │                                         │
           │ Response:                               │
           │ {                                       │
           │   success: true,                        │
           │   data: {                               │
           │     transactionId: "uuid",              │
           │     referenceCode: "578496825",         │
           │     qrCode: "base64...",                │
           │     expiresAt: "2026-03-08T10:15:00Z"   │
           │   }                                     │
           │ }                                       │
           │◄────────────────────────────────────────┘
           │
┌──────────┴──────────┐
│ PaymentInstructions │
│ Polling (10s)       │
└──────────┬──────────┘
           │
           │ GET /api/payments/{id}/status
           │
           ↓
                                          ┌─────────────────────┐
                                          │ paymentController   │
                                          │ .checkStatus()      │
                                          └──────────┬──────────┘
                                                     │
                                                     ↓
                                          ┌─────────────────────┐
                                          │ Database            │
                                          │ PaymentTransaction  │
                                          └──────────┬──────────┘
           ↑                                         │
           │ Response:                               │
           │ {                                       │
           │   data: {                               │
           │     status: "completed",                │
           │     paidAt: "2026-03-08T10:12:00Z"      │
           │   }                                     │
           │ }                                       │
           │◄────────────────────────────────────────┘
           │
┌──────────┴──────────┐
│ handlePayment       │
│ Complete()          │
└──────────┬──────────┘
           │
           │ POST /api/saas/onboarding
           │ {
           │   ...companyData,
           │   ...adminData,
           │   adminPassword: "***",
           │   plan: "professional",
           │   paymentData: {
           │     transactionId: "uuid",
           │     paidAt: "2026-03-08T10:12:00Z",
           │     paymentMethod: "ekwanza"
           │   }
           │ }
           │
           ↓
                                          ┌─────────────────────┐
                                          │ saasController      │
                                          │ .createOrganization │
                                          └──────────┬──────────┘
                                                     │
                                                     ↓
                                          ┌─────────────────────┐
                                          │ Create:             │
                                          │ • Organization      │
                                          │ • User (Admin)      │
                                          │ • Subscription      │
                                          │ • Link Payment      │
                                          └──────────┬──────────┘
           ↑                                         │
           │ Response:                               │
           │ {                                       │
           │   data: {                               │
           │     organization: {...},                │
           │     user: {...},                        │
           │     subscription: {...},                │
           │     portalUrl: "https://..."            │
           │   }                                     │
           │ }                                       │
           │◄────────────────────────────────────────┘
           │
┌──────────┴──────────┐
│ setCurrentStep(5)   │
│ SUCESSO!            │
└─────────────────────┘
```

---

**Diagrama gerado em:** 08/03/2026  
**Versão:** 1.0
