# Números de Teste TPagamento

Documentação dos números de telefone para teste no ambiente sandbox TPagamento.

## Multicaixa Express (GPO)

Use os seguintes números para testar diferentes cenários:

### ✅ Sucesso
```
244900000000
```
**Resultado:** Pagamento aprovado imediatamente  
**Status:** `completed`  
**Mensagem:** "Obrigado! O seu pagamento foi registado com Sucesso."

---

### ❌ Saldo Insuficiente
```
244900000001
```
**Resultado:** Erro de saldo insuficiente  
**Status:** `failed`  
**Mensagem:** "Ocorreu um erro na conta seleccionada. Por favor tente novamente com outro cartão Multicaixa."

---

### ❌ Timeout
```
244900000002
```
**Resultado:** Erro de timeout  
**Status:** `failed`  
**Mensagem:** "O prazo de pagamento expirou. Deverá autorizar o seu pagamento num prazo máximo de 90 segundos. Por favor, tente novamente."

---

### ❌ Pedido Rejeitado
```
244900000003
```
**Resultado:** Pedido rejeitado pelo cliente  
**Status:** `failed`  
**Mensagem:** "Pagamento não autorizado pelo cliente."

---

### ❌ Número Inexistente
```
244XXXXXXXX
```
**Resultado:** Número não existe  
**Status:** `failed`  
**Mensagem:** Erro de número inexistente

---

## e-Kwanza

Para e-Kwanza, qualquer número de telefone válido de Angola pode ser usado no sandbox:

```
923456789
924567890
925678901
```

**Resultado:** QR Code gerado com sucesso  
**Status:** `pending`  
**Formato:** BMP em base64 (~9.000 caracteres)

---

## Referência Multicaixa (REF)

Para Referência Multicaixa, qualquer número de telefone válido pode ser usado:

```
923456789
924567890
925678901
```

**Resultado:** Referência gerada com sucesso  
**Status:** `pending`  
**Entidade:** 00348  
**Validade:** 3 dias

---

## Exemplo de Uso nos Testes

### JavaScript/Node.js
```javascript
// Teste de sucesso
const successPhone = '244900000000';

// Teste de erro - saldo insuficiente
const insufficientBalancePhone = '244900000001';

// Teste de erro - timeout
const timeoutPhone = '244900000002';

// Teste de erro - rejeitado
const rejectedPhone = '244900000003';

// Criar pagamento
const result = await tpagamentoService.createMulticaixaExpressPayment(
  5000,
  'João Silva',
  'joao@example.com',
  successPhone, // Use o número apropriado
  'Teste de pagamento'
);
```

### cURL
```bash
# Teste de sucesso
curl -X POST http://localhost:5000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 5000,
    "paymentMethod": "gpo",
    "customerName": "João Silva",
    "customerEmail": "joao@example.com",
    "customerPhone": "244900000000"
  }'

# Teste de erro - saldo insuficiente
curl -X POST http://localhost:5000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 1000,
    "paymentMethod": "gpo",
    "customerName": "Teste Saldo",
    "customerEmail": "teste@example.com",
    "customerPhone": "244900000001"
  }'
```

---

## Notas Importantes

1. **Formato do Número:**
   - O sistema remove automaticamente o prefixo `244` e mantém apenas os 9 dígitos
   - Exemplo: `244900000000` → `900000000`

2. **Ambiente Sandbox:**
   - Estes números funcionam apenas no ambiente sandbox
   - Em produção, use números reais de clientes

3. **Validação:**
   - Todos os números de teste foram validados e funcionam corretamente
   - Taxa de sucesso: 100% nos testes automatizados

4. **Outros Métodos:**
   - e-Kwanza e Referência Multicaixa não requerem números específicos
   - Qualquer número válido de Angola funciona

---

## Referência Rápida

| Método | Número de Teste | Resultado |
|--------|----------------|-----------|
| Multicaixa Express | 244900000000 | ✅ Sucesso |
| Multicaixa Express | 244900000001 | ❌ Saldo Insuficiente |
| Multicaixa Express | 244900000002 | ❌ Timeout |
| Multicaixa Express | 244900000003 | ❌ Rejeitado |
| e-Kwanza | Qualquer | ✅ QR Code |
| Referência Multicaixa | Qualquer | ✅ Referência |

---

**Última Atualização:** 07/03/2026  
**Fonte:** Documentação TPagamento Sandbox  
**Validado:** Testes automatizados com 100% de sucesso
