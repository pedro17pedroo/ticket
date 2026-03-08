# 🧪 Guia de Teste - Integração TPagamento

## 📋 Pré-requisitos

1. Backend rodando: `cd backend && npm run dev`
2. Portal SaaS rodando: `cd portalSaaS && npm run dev`
3. Portal Organização rodando: `cd portalOrganizaçãoTenant && npm run dev`
4. Migrations executadas: `cd backend && npm run migrate`
5. Variáveis de ambiente configuradas no `backend/.env`

---

## ✅ Checklist de Configuração

### Backend (.env)

```env
# Payment Gateway - TPagamento (Angola)
TPAGAMENTO_API_URL=https://tpagamento-backend.tatusolutions.com/api/v1
TPAGAMENTO_API_KEY=pk_test_ttb_sandbox_key
TPAGAMENTO_WEBHOOK_SECRET=your-webhook-secret
```

### Verificar Migrations

```bash
cd backend
npm run migrate

# Deve criar as tabelas:
# - payment_transactions
# - payment_receipts
```

---

## 🧪 Testes Backend

### 1. Testar Criação de Pagamento

```bash
# Obter token de autenticação primeiro
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "senha123"
  }'

# Usar o token retornado
export TOKEN="seu_token_aqui"

# Criar pagamento E-Kwanza
curl -X POST http://localhost:4003/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "ekwanza",
    "customerName": "João Silva",
    "customerEmail": "joao@example.com",
    "customerPhone": "923456789",
    "description": "Teste de pagamento E-Kwanza"
  }'

# Criar pagamento GPO (Multicaixa Express)
curl -X POST http://localhost:4003/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "gpo",
    "customerName": "João Silva",
    "customerEmail": "joao@example.com",
    "customerPhone": "923456789",
    "description": "Teste de pagamento GPO"
  }'

# Criar pagamento REF (Referência Multicaixa)
curl -X POST http://localhost:4003/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "ref",
    "customerName": "João Silva",
    "customerEmail": "joao@example.com",
    "customerPhone": "923456789",
    "description": "Teste de pagamento REF"
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Pagamento criado com sucesso",
  "data": {
    "transactionId": "uuid",
    "paymentId": "pay_123",
    "referenceCode": "REF-456",
    "amount": 5000,
    "currency": "AOA",
    "paymentMethod": "gpo",
    "status": "pending",
    "expiresAt": "2026-03-06T11:30:00Z"
  }
}
```

### 2. Testar Verificação de Status

```bash
# Usar o transactionId retornado
export TRANSACTION_ID="uuid_da_transacao"

curl -X GET http://localhost:4003/api/payments/$TRANSACTION_ID/status \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "status": "pending",
    "amount": 5000,
    "currency": "AOA",
    "paymentMethod": "gpo",
    "paidAt": null,
    "expiresAt": "2026-03-06T11:30:00Z"
  }
}
```

### 3. Testar Histórico de Pagamentos

```bash
# Listar todos os pagamentos
curl -X GET http://localhost:4003/api/payments/history \
  -H "Authorization: Bearer $TOKEN"

# Com filtros
curl -X GET "http://localhost:4003/api/payments/history?status=completed&method=gpo&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Testar Webhook (Simulação)

```bash
# Simular webhook de pagamento concluído
curl -X POST http://localhost:4003/api/webhooks/tpagamento \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: test_signature" \
  -d '{
    "event": "payment.completed",
    "data": {
      "id": "pay_123",
      "reference": "REF-456",
      "amount": 5000,
      "paidAt": "2026-03-06T10:30:00Z"
    }
  }'
```

### 5. Testar Cálculo de Upgrade

```bash
# Calcular valor proporcional para upgrade
curl -X POST http://localhost:4003/api/payments/calculate-upgrade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPlanId": "uuid_do_novo_plano"
  }'
```

### 6. Testar Endpoint de Subscrição

```bash
# Obter subscrição da organização atual
curl -X GET http://localhost:4003/api/subscription \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "status": "active",
      "isInTrial": false,
      "trialDaysRemaining": 0,
      "currentPeriodStart": "2026-03-01",
      "currentPeriodEnd": "2026-04-01"
    },
    "plan": {
      "id": "uuid",
      "name": "professional",
      "displayName": "Professional",
      "monthlyPrice": 15000,
      "limits": {
        "maxUsers": 50,
        "maxClients": 100,
        "maxTicketsPerMonth": 1000,
        "maxStorageGB": 50
      }
    },
    "usage": {
      "current": {
        "users": 5,
        "clients": 10,
        "ticketsThisMonth": 50,
        "storageUsedGB": 2.5
      },
      "percentages": {
        "users": 10,
        "clients": 10,
        "tickets": 5,
        "storage": 5
      }
    }
  }
}
```

---

## 🎨 Testes Frontend

### Portal SaaS - Onboarding

1. Acesse: `http://localhost:5173`
2. Clique em "Começar Agora"
3. Preencha dados da empresa
4. Preencha dados do admin
5. Verifique email (use código de teste)
6. Defina senha
7. **Teste Step de Pagamento:**
   - Se plano tem trial: deve mostrar opção "Pular e iniciar período de teste"
   - Selecione um método de pagamento (E-Kwanza, GPO ou REF)
   - Clique em "Continuar"
   - Deve mostrar instruções de pagamento
   - Deve iniciar polling automático (10s)
   - Código/referência deve ser copiável

### Portal Organização - Gestão de Subscrição

1. Acesse: `http://localhost:5174` (ou porta configurada)
2. Faça login como org-admin
3. Navegue para página de Subscrição
4. **Verificar:**
   - Plano atual exibido corretamente
   - Status da subscrição (ativo, trial, etc)
   - Barras de progresso de uso
   - Botão "Upgrade de Plano"

5. **Testar Histórico de Pagamentos:**
   - Deve listar pagamentos anteriores
   - Filtros devem funcionar (status, método, data)
   - Paginação deve funcionar
   - Botão "Download Recibo" deve aparecer para pagamentos concluídos

6. **Testar Upgrade de Plano:**
   - Clicar em "Upgrade de Plano"
   - Selecionar novo plano
   - Deve calcular valor proporcional
   - Selecionar método de pagamento
   - Processar pagamento
   - Verificar atualização da subscrição

---

## 🐛 Troubleshooting

### Erro: "Transaction not found"
- Verificar se o usuário está associado a uma organização
- Verificar se a transação pertence à organização do usuário

### Erro: "Invalid payment method"
- Métodos válidos: `ekwanza`, `gpo`, `ref`
- Verificar se está usando lowercase

### Erro: "TPagamento API error"
- Verificar se `TPAGAMENTO_API_URL` está correto
- Verificar se `TPAGAMENTO_API_KEY` é válida
- Verificar conectividade com API TPagamento

### Webhook não funciona
- Verificar se `TPAGAMENTO_WEBHOOK_SECRET` está configurado
- Verificar se a URL do webhook está configurada no dashboard TPagamento
- Verificar logs do backend para erros de validação de assinatura

### Polling não atualiza status
- Verificar se o frontend está fazendo requisições a cada 10s
- Verificar se o backend está respondendo corretamente
- Verificar CORS se frontend e backend estão em domínios diferentes

---

## 📊 Logs para Monitorar

### Backend
```bash
# Logs de pagamento
[PaymentService] Creating payment transaction
[TPagamento] Creating GPO payment
[TPagamento] GPO payment response

# Logs de webhook
[Webhook] Received TPagamento webhook
[Webhook] Processing payment.completed
[Webhook] Transaction marked as completed
[Webhook] Payment processed successfully

# Logs de status
[PaymentService] Checking payment status
[TPagamento] Checking payment status for ID
[TPagamento] Payment status response
```

### Frontend
```javascript
// Console do navegador
console.log('Creating payment:', paymentData);
console.log('Payment created:', result);
console.log('Checking payment status:', transactionId);
console.log('Payment status:', status);
```

---

## ✅ Checklist de Validação

### Backend
- [ ] Migrations executadas com sucesso
- [ ] Endpoint `/api/payments/create` funciona para os 3 métodos
- [ ] Endpoint `/api/payments/:id/status` retorna status correto
- [ ] Endpoint `/api/payments/history` lista pagamentos
- [ ] Endpoint `/api/payments/:id/receipt` retorna recibo
- [ ] Endpoint `/api/payments/calculate-upgrade` calcula valor
- [ ] Endpoint `/api/subscription` retorna subscrição atual
- [ ] Webhook `/api/webhooks/tpagamento` processa eventos
- [ ] Logs aparecem corretamente no console

### Frontend Portal SaaS
- [ ] Step de pagamento aparece no onboarding
- [ ] Opção de pular pagamento aparece quando há trial
- [ ] 3 métodos de pagamento são exibidos
- [ ] Instruções de pagamento aparecem após criar pagamento
- [ ] Polling de status funciona (10s)
- [ ] Código/referência é copiável
- [ ] Countdown de expiração funciona
- [ ] Redirecionamento após pagamento confirmado

### Frontend Portal Organização
- [ ] Página de subscrição carrega corretamente
- [ ] Plano atual é exibido
- [ ] Status da subscrição é exibido
- [ ] Barras de progresso de uso funcionam
- [ ] Histórico de pagamentos lista transações
- [ ] Filtros de histórico funcionam
- [ ] Paginação funciona
- [ ] Modal de upgrade abre
- [ ] Cálculo proporcional funciona
- [ ] Processo de pagamento no upgrade funciona

---

## 🚀 Próximos Passos

Após validar todos os testes:

1. **Configurar Webhook no TPagamento:**
   - Acessar dashboard TPagamento
   - Configurar URL: `https://seu-dominio.com/api/webhooks/tpagamento`
   - Configurar secret (mesmo do .env)
   - Ativar eventos: `payment.completed`, `payment.failed`, `payment.expired`

2. **Testar em Staging:**
   - Deploy em ambiente de staging
   - Testar com API de sandbox do TPagamento
   - Validar todos os fluxos

3. **Deploy em Produção:**
   - Atualizar variáveis de ambiente para produção
   - Usar API key de produção do TPagamento
   - Configurar webhook de produção
   - Monitorar logs

4. **Monitoramento:**
   - Configurar alertas para pagamentos falhados
   - Monitorar taxa de conversão
   - Acompanhar pagamentos pendentes
   - Verificar webhooks recebidos

---

## 📞 Suporte

- Documentação completa: `PAYMENT-INTEGRATION-COMPLETE.md`
- Documentação TPagamento: https://docs.tpagamento.com
- Suporte TPagamento: suporte@tpagamento.com

---

**Última atualização:** 06/03/2026
