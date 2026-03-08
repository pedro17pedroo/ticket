# Guia de Teste - Pagamento no Onboarding

**Data:** 08/03/2026  
**Versão:** 1.0

## Como Testar a Implementação

### Pré-requisitos

1. ✅ Backend rodando na porta 3000
2. ✅ Frontend (Portal SaaS) rodando
3. ✅ PostgreSQL conectado
4. ✅ MongoDB conectado (opcional)
5. ✅ Redis conectado
6. ✅ Credenciais TPagamento configuradas

### Comandos para Iniciar

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Portal SaaS
cd portalSaaS
npm run dev
```

---

## Cenários de Teste

### 🧪 TESTE 1: Plano Gratuito (Starter)

**Objetivo:** Verificar que planos gratuitos pulam o pagamento

**Passos:**
1. Acesse `http://localhost:5173/onboarding?plan=starter`
2. Preencha Step 0 (Informações da Empresa)
3. Preencha Step 1 (Utilizador Administrador)
4. Verifique email no Step 2
5. Defina senha no Step 3
6. **No Step 4:**
   - ✅ Deve exibir "Plano Gratuito"
   - ✅ Deve ter botão "Continuar"
   - ✅ NÃO deve exibir seletor de métodos
7. Clique em "Continuar"
8. **Resultado Esperado:**
   - ✅ Organização criada imediatamente
   - ✅ Redirecionado para Step 5 (Sucesso)
   - ✅ Subscrição com status "active"

---

### 🧪 TESTE 2: Plano com Trial (Professional)

**Objetivo:** Verificar que planos com trial permitem pular pagamento

**Passos:**
1. Acesse `http://localhost:5173/onboarding?plan=professional`
2. Preencha Steps 0-3
3. **No Step 4:**
   - ✅ Deve exibir "🎉 14 dias de teste grátis"
   - ✅ Deve ter botão "Iniciar Teste Grátis"
   - ✅ NÃO deve exibir seletor de métodos
4. Clique em "Iniciar Teste Grátis"
5. **Resultado Esperado:**
   - ✅ Organização criada imediatamente
   - ✅ Subscrição com status "trial"
   - ✅ Campo `trialEndsAt` preenchido (14 dias no futuro)

---

### 🧪 TESTE 3: Pagamento E-Kwanza

**Objetivo:** Testar fluxo completo de pagamento com E-Kwanza

**Passos:**
1. Acesse onboarding com plano pago SEM trial
2. Preencha Steps 0-3
3. **No Step 4:**
   - ✅ Deve exibir seletor de métodos
   - ✅ Selecione "E-Kwanza"
   - ✅ Clique em "Processar Pagamento"
4. **Instruções de Pagamento:**
   - ✅ Deve exibir código de 9 dígitos
   - ✅ Deve exibir timer de expiração
   - ✅ Deve ter botão "Copiar"
   - ✅ Deve iniciar polling automático
5. **Simular Pagamento:**
   - Abra Postman/Insomnia
   - Faça requisição para atualizar status:
   ```bash
   PATCH http://localhost:3000/api/payments/{transactionId}/status
   {
     "status": "completed",
     "paidAt": "2026-03-08T10:00:00Z"
   }
   ```
6. **Resultado Esperado:**
   - ✅ Polling detecta mudança de status
   - ✅ Toast de sucesso exibido
   - ✅ Organização criada automaticamente
   - ✅ Redirecionado para Step 5
   - ✅ Subscrição com status "active"
   - ✅ Pagamento vinculado à subscrição

---

### 🧪 TESTE 4: Pagamento Multicaixa Express

**Objetivo:** Testar pagamento instantâneo com GPO

**Passos:**
1. Acesse onboarding com plano pago
2. Preencha Steps 0-3
3. **No Step 4:**
   - ✅ Selecione "Multicaixa Express"
   - ✅ Clique em "Processar Pagamento"
4. **No Backend:**
   - Use número de teste: `244900000000` (sucesso)
5. **Resultado Esperado:**
   - ✅ Pagamento aprovado instantaneamente
   - ✅ Status muda para "completed" imediatamente
   - ✅ Organização criada automaticamente

**Números de Teste:**
- `244900000000` - Sucesso
- `244900000001` - Saldo Insuficiente
- `244900000002` - Timeout
- `244900000003` - Rejeitado

---

### 🧪 TESTE 5: Pagamento Referência Multicaixa

**Objetivo:** Testar geração de referência EMIS

**Passos:**
1. Acesse onboarding com plano pago
2. Preencha Steps 0-3
3. **No Step 4:**
   - ✅ Selecione "Referência Multicaixa"
   - ✅ Clique em "Processar Pagamento"
4. **Instruções:**
   - ✅ Deve exibir referência de 9 dígitos
   - ✅ Deve exibir entidade (00348)
   - ✅ Deve ter validade de 3 dias
5. **Simular Pagamento:**
   - Atualizar status via API (como no Teste 3)
6. **Resultado Esperado:**
   - ✅ Organização criada após confirmação

---

### 🧪 TESTE 6: Pagamento Expirado

**Objetivo:** Verificar tratamento de expiração

**Passos:**
1. Crie um pagamento
2. **Simular Expiração:**
   ```bash
   PATCH http://localhost:3000/api/payments/{transactionId}/status
   {
     "status": "expired"
   }
   ```
3. **Resultado Esperado:**
   - ✅ Toast de erro exibido
   - ✅ Callback `onExpired` chamado
   - ✅ Volta para seleção de método
   - ✅ Permite criar novo pagamento

---

### 🧪 TESTE 7: Pagamento Falhou

**Objetivo:** Verificar tratamento de falha

**Passos:**
1. Crie um pagamento
2. **Simular Falha:**
   ```bash
   PATCH http://localhost:3000/api/payments/{transactionId}/status
   {
     "status": "failed",
     "failureReason": "Saldo insuficiente"
   }
   ```
3. **Resultado Esperado:**
   - ✅ Toast de erro exibido
   - ✅ Mensagem de erro clara
   - ✅ Volta para seleção de método
   - ✅ Permite nova tentativa

---

### 🧪 TESTE 8: Alterar Plano Durante Onboarding

**Objetivo:** Verificar mudança de plano

**Passos:**
1. Inicie onboarding com plano "Starter"
2. No Step 0 ou 3, clique em "Alterar" no card do plano
3. **Modal de Seleção:**
   - ✅ Deve exibir todos os planos
   - ✅ Plano atual deve estar marcado
   - ✅ Selecione outro plano
   - ✅ Clique em "Confirmar Plano"
4. **Resultado Esperado:**
   - ✅ Plano atualizado em todos os steps
   - ✅ URL atualizada com novo plano
   - ✅ Step 4 reflete novo plano e preço

---

### 🧪 TESTE 9: Voltar do Step de Pagamento

**Objetivo:** Verificar navegação reversa

**Passos:**
1. Chegue ao Step 4 (Pagamento)
2. Clique em "← Voltar"
3. **Resultado Esperado:**
   - ✅ Volta para Step 3 (Senha)
   - ✅ Dados preenchidos mantidos
   - ✅ Pode avançar novamente

---

### 🧪 TESTE 10: Copiar Código de Pagamento

**Objetivo:** Verificar funcionalidade de copiar

**Passos:**
1. Crie um pagamento
2. Nas instruções, clique no botão "Copiar"
3. **Resultado Esperado:**
   - ✅ Código copiado para clipboard
   - ✅ Toast "Copiado!" exibido
   - ✅ Ícone muda para check (✓)
   - ✅ Volta para ícone de copiar após 2s

---

## Checklist de Validação

### Interface (UI/UX)

- [ ] Plano selecionado exibido corretamente
- [ ] Botão "Alterar plano" funciona
- [ ] Seletor de métodos visível apenas para planos pagos
- [ ] Instruções claras por método
- [ ] Timer de expiração funcionando
- [ ] Botão copiar funciona
- [ ] Loading states durante processamento
- [ ] Mensagens de erro claras
- [ ] Navegação entre steps fluida
- [ ] Responsivo em mobile

### Funcionalidade

- [ ] Planos gratuitos pulam pagamento
- [ ] Planos com trial permitem pular
- [ ] Criação de pagamento funciona
- [ ] Polling de status funciona (10s)
- [ ] Pagamento confirmado cria organização
- [ ] Pagamento falho permite retry
- [ ] Pagamento expirado volta à seleção
- [ ] Dados de pagamento salvos na subscrição
- [ ] Email de confirmação enviado

### Integração Backend

- [ ] Endpoint `/api/payments/create` funciona
- [ ] Endpoint `/api/payments/{id}/status` funciona
- [ ] Endpoint `/api/saas/onboarding` aceita paymentData
- [ ] TPagamento integrado corretamente
- [ ] Transações salvas no banco
- [ ] Recibos gerados
- [ ] Webhooks configurados (se aplicável)

### Segurança

- [ ] Validação de valores no backend
- [ ] Prevenção de duplicação de pagamento
- [ ] Timeout de expiração respeitado
- [ ] Dados sensíveis não expostos no frontend
- [ ] HTTPS em produção

---

## Logs para Monitorar

### Console do Frontend

```javascript
// Criação de pagamento
📤 Criando pagamento: { amount, method, customer }

// Polling
🔄 Verificando status do pagamento: {transactionId}

// Sucesso
✅ Pagamento confirmado: {transactionId}

// Criação de organização
📤 Criando organização com pagamento: { ...payload }
```

### Console do Backend

```
✅ PostgreSQL conectado com sucesso
✅ MongoDB conectado com sucesso
✅ Redis conectado com sucesso

POST /api/payments/create
  → Criando pagamento TPagamento
  → Método: ekwanza
  → Valor: 49.00 AOA
  ✅ Pagamento criado: {transactionId}

GET /api/payments/{id}/status
  → Verificando status
  ✅ Status: completed

POST /api/saas/onboarding
  → Criando organização
  → Com pagamento: {transactionId}
  ✅ Organização criada: {organizationId}
  ✅ Subscrição criada: {subscriptionId}
  ✅ Pagamento vinculado
```

---

## Troubleshooting

### Problema: Pagamento não é criado

**Possíveis Causas:**
- Backend não está rodando
- Credenciais TPagamento inválidas
- Método de pagamento não selecionado

**Solução:**
1. Verificar console do backend
2. Verificar `.env` do backend
3. Testar endpoint diretamente com Postman

### Problema: Polling não detecta mudança

**Possíveis Causas:**
- Intervalo muito longo
- Endpoint de status com erro
- TransactionId incorreto

**Solução:**
1. Verificar console do frontend
2. Verificar network tab (DevTools)
3. Reduzir intervalo de polling para teste

### Problema: Organização não é criada

**Possíveis Causas:**
- Erro no backend
- Dados incompletos
- Validação falhando

**Solução:**
1. Verificar console do backend
2. Verificar payload enviado
3. Verificar logs do PostgreSQL

### Problema: Step 4 não aparece

**Possíveis Causas:**
- Arquivo não salvo
- Erro de sintaxe
- Componente não importado

**Solução:**
1. Verificar console do frontend
2. Verificar `getDiagnostics`
3. Reiniciar dev server

---

## Comandos Úteis

### Verificar Status do Backend
```bash
curl http://localhost:3000/api/health
```

### Criar Pagamento Manual (Postman)
```bash
POST http://localhost:3000/api/payments/create
Content-Type: application/json

{
  "amount": 49.00,
  "paymentMethod": "ekwanza",
  "customerName": "João Silva",
  "customerEmail": "joao@empresa.com",
  "customerPhone": "+244900000000",
  "description": "Teste de pagamento"
}
```

### Atualizar Status de Pagamento
```bash
PATCH http://localhost:3000/api/payments/{transactionId}/status
Content-Type: application/json

{
  "status": "completed",
  "paidAt": "2026-03-08T10:00:00Z"
}
```

### Verificar Organização Criada
```bash
GET http://localhost:3000/api/organizations/{organizationId}
```

---

## Próximos Passos Após Testes

1. ✅ Validar todos os cenários
2. ⏳ Corrigir bugs encontrados
3. ⏳ Adicionar testes automatizados
4. ⏳ Documentar edge cases
5. ⏳ Preparar para produção

---

**Guia criado em:** 08/03/2026  
**Última atualização:** 08/03/2026  
**Versão:** 1.0
