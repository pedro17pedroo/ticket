# Diagrama de Fluxo - Onboarding com Pagamento

## Fluxo Visual Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PORTAL SAAS - ONBOARDING                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   STEP 0    │
│  Empresa    │  ← Dados da empresa, setor, tamanho
│  🏢         │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   STEP 1    │
│    Admin    │  ← Nome, email, telefone do administrador
│  👤         │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   STEP 2    │
│ Verificação │  ← Código de 6 dígitos enviado por email
│  📧         │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   STEP 3    │
│   Senha     │  ← Definir senha de acesso
│  🔑         │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         STEP 4 - PAGAMENTO 💳                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              INFORMAÇÕES DO PLANO                           │  │
│  │  Nome: Professional                                         │  │
│  │  Preço: Kz 15.000/mês                                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  🎉 14 dias de teste grátis                                │  │
│  │  Experimente todos os recursos sem compromisso             │  │
│  │                                                             │  │
│  │                    [Iniciar Teste Grátis] ──────────┐      │  │
│  └─────────────────────────────────────────────────────│──────┘  │
│                                                         │          │
│                                                         │          │
│  ┌──────────────────────────────────────────────────┐  │          │
│  │  SELECIONE O MÉTODO DE PAGAMENTO                │  │          │
│  │                                                  │  │          │
│  │  ○ e-Kwanza (QR Code)                          │  │          │
│  │  ○ Multicaixa Express (GPO)                    │  │          │
│  │  ○ Referência Multicaixa (REF)                 │  │          │
│  │                                                  │  │          │
│  │  [Voltar]              [Processar Pagamento]   │  │          │
│  └──────────────────────────────────────────────────┘  │          │
│                                                         │          │
└─────────────────────────────────────────────────────────┼──────────┘
                                                          │
                    ┌─────────────────────────────────────┤
                    │                                     │
                    ▼                                     ▼
        ┌───────────────────────┐          ┌──────────────────────┐
        │  PAGAMENTO NECESSÁRIO │          │   PULAR PAGAMENTO    │
        │                       │          │   (Trial/Gratuito)   │
        └───────┬───────────────┘          └──────────┬───────────┘
                │                                     │
                ▼                                     │
    ┌───────────────────────┐                        │
    │ CRIAR TRANSAÇÃO       │                        │
    │ TPagamento API        │                        │
    └───────┬───────────────┘                        │
            │                                         │
            ▼                                         │
    ┌───────────────────────┐                        │
    │ EXIBIR INSTRUÇÕES     │                        │
    │ - QR Code (e-Kwanza)  │                        │
    │ - Referência (MC)     │                        │
    │ - Instruções (GPO)    │                        │
    └───────┬───────────────┘                        │
            │                                         │
            ▼                                         │
    ┌───────────────────────┐                        │
    │ AGUARDAR CONFIRMAÇÃO  │                        │
    │ (Polling Status)      │                        │
    └───────┬───────────────┘                        │
            │                                         │
            ├─────────┬─────────┐                    │
            │         │         │                    │
            ▼         ▼         ▼                    │
        ┌────┐   ┌────┐   ┌────┐                   │
        │ ✓  │   │ ✗  │   │ ⏱  │                   │
        │Pago│   │Falha│  │Exp.│                   │
        └─┬──┘   └─┬──┘   └─┬──┘                   │
          │        │        │                       │
          │        └────────┴───► [Voltar]          │
          │                                         │
          └─────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ CRIAR ORGANIZAÇÃO     │
                  │ + Dados de Pagamento  │
                  │ saasAPI.create()      │
                  └───────┬───────────────┘
                          │
                          ▼
                  ┌───────────────────────┐
                  │     STEP 5            │
                  │     SUCESSO! 🚀       │
                  │                       │
                  │ - URL de acesso       │
                  │ - Credenciais         │
                  │ - Info da subscription│
                  │                       │
                  │ [Acessar Portal]      │
                  └───────────────────────┘
```

## Decisões de Fluxo

### 1. Quando Pular Pagamento?

```javascript
const canSkipPayment = 
  selectedPlanData?.trialDays > 0 ||  // Tem período de trial
  selectedPlanData?.priceValue === 0;  // É plano gratuito
```

**Exemplos:**
- ✅ Starter (Grátis) → Pula pagamento
- ✅ Professional (14 dias trial) → Pode pular
- ❌ Enterprise (Sem trial, pago) → Obrigatório pagar

### 2. Quando Criar Organização?

A organização é criada **APENAS** após:

1. **Plano Gratuito/Trial**: Usuário clica em "Pular Pagamento"
2. **Plano Pago**: Pagamento é confirmado (status = 'paid')

### 3. Dados Enviados ao Backend

```javascript
// Payload completo
{
  // Step 0
  companyName: "TechSolutions Lda",
  tradeName: "TechSol",
  email: "contato@techsol.com",
  phone: "+244 923 456 789",
  industry: "Tecnologia",
  companySize: "11-50",
  
  // Step 1
  adminName: "João Silva",
  adminEmail: "joao@techsol.com",
  adminPhone: "+244 923 456 789",
  
  // Step 3
  adminPassword: "********",
  
  // Plano
  plan: "professional",
  
  // Step 4 - NOVO
  paymentData: {
    transactionId: "uuid-123-456",
    paidAt: "2026-03-08T10:30:00Z",
    paymentMethod: "ekwanza"
  } // ou null se pulou pagamento
}
```

## Estados do Pagamento

```
┌──────────────┐
│   pending    │  ← Transação criada, aguardando pagamento
└──────┬───────┘
       │
       ├─────► ┌──────────────┐
       │       │   expired    │  ← Tempo limite excedido
       │       └──────────────┘
       │
       ├─────► ┌──────────────┐
       │       │    failed    │  ← Pagamento rejeitado
       │       └──────────────┘
       │
       └─────► ┌──────────────┐
               │     paid     │  ← Pagamento confirmado ✓
               └──────────────┘
```

## Métodos de Pagamento Suportados

### 1. e-Kwanza (QR Code)

```
┌─────────────────────────────────┐
│  Escaneie o QR Code             │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ████  ██  ████  ██  ██ │   │
│  │  ██  ████  ██  ████  ██ │   │
│  │  ████  ██  ████  ██  ██ │   │
│  └─────────────────────────┘   │
│                                 │
│  Código: 578496825              │
│  Valor: Kz 15.000,00           │
│                                 │
│  Aguardando confirmação...      │
└─────────────────────────────────┘
```

### 2. Multicaixa Express (GPO)

```
┌─────────────────────────────────┐
│  Pagamento via Multicaixa       │
│                                 │
│  1. Abra o app Multicaixa       │
│  2. Selecione "Pagamentos"      │
│  3. Autorize o pagamento        │
│                                 │
│  Valor: Kz 15.000,00           │
│                                 │
│  Aguardando autorização...      │
└─────────────────────────────────┘
```

### 3. Referência Multicaixa (REF)

```
┌─────────────────────────────────┐
│  Pague em qualquer ATM          │
│                                 │
│  Entidade: 00348                │
│  Referência: 848428366          │
│  Valor: Kz 15.000,00           │
│                                 │
│  Válido até: 10/03/2026         │
│                                 │
│  Aguardando pagamento...        │
└─────────────────────────────────┘
```

## Tratamento de Erros

### Erro ao Criar Pagamento

```
┌─────────────────────────────────┐
│  ⚠️ Erro ao processar pagamento │
│                                 │
│  Erro: Método de pagamento      │
│  temporariamente indisponível   │
│                                 │
│  [Tentar Novamente]             │
└─────────────────────────────────┘
```

### Pagamento Expirado

```
┌─────────────────────────────────┐
│  ⏱️ Pagamento Expirado           │
│                                 │
│  O tempo limite foi excedido.   │
│  Por favor, tente novamente.    │
│                                 │
│  [Escolher Outro Método]        │
└─────────────────────────────────┘
```

### Pagamento Falhou

```
┌─────────────────────────────────┐
│  ❌ Pagamento Falhou             │
│                                 │
│  O pagamento não foi autorizado.│
│  Verifique seus dados e tente   │
│  novamente.                     │
│                                 │
│  [Tentar Novamente]             │
└─────────────────────────────────┘
```

## Navegação

### Botões de Navegação por Step

| Step | Botão Voltar | Botão Avançar |
|------|--------------|---------------|
| 0 - Empresa | - | "Continuar" |
| 1 - Admin | "Voltar" | "Continuar" |
| 2 - Email | "Voltar" | "Verificar" |
| 3 - Senha | "Voltar" | "Continuar" |
| 4 - Pagamento | "Voltar" | "Processar Pagamento" ou "Pular" |
| 5 - Sucesso | - | "Acessar Portal" |

### Regras de Navegação

- ✅ Pode voltar para steps anteriores (exceto no sucesso)
- ❌ Não pode avançar sem preencher campos obrigatórios
- ❌ Não pode pular o step de pagamento (exceto trial/gratuito)
- ✅ Pode alterar plano em qualquer step antes do pagamento

---

**Legenda:**
- 🏢 Empresa
- 👤 Administrador
- 📧 Email
- 🔑 Senha
- 💳 Pagamento
- 🚀 Sucesso
- ✓ Confirmado
- ✗ Falhou
- ⏱ Expirado
- ⚠️ Erro
