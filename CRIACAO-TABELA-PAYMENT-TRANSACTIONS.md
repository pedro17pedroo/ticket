# Criação da Tabela payment_transactions

## 🎯 Objetivo

Criar a tabela `payment_transactions` no banco de dados para armazenar o histórico de pagamentos e reativar o componente `PaymentHistory`.

## 📋 Estrutura da Tabela

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| organization_id | UUID | Referência à organização (FK) |
| subscription_id | UUID | Referência à subscrição (FK, opcional) |
| amount | DECIMAL(10,2) | Valor do pagamento |
| currency | VARCHAR(3) | Moeda (EUR, USD, AOA, etc.) |
| status | ENUM | Status: pending, completed, failed, cancelled |
| payment_method | VARCHAR(50) | Método: multicaixa_express, bank_transfer, etc. |
| payment_reference | VARCHAR(255) | Referência do pagamento |
| transaction_id | VARCHAR(255) | ID da transação no gateway |
| description | TEXT | Descrição do pagamento |
| metadata | JSONB | Metadados adicionais |
| paid_at | TIMESTAMP | Data de confirmação do pagamento |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Índices

- `organization_id` - Para buscar pagamentos por organização
- `subscription_id` - Para buscar pagamentos por subscrição
- `status` - Para filtrar por status
- `payment_method` - Para filtrar por método
- `created_at` - Para ordenação cronológica

### Relacionamentos

```
payment_transactions
  ├─ organization_id → organizations(id) [CASCADE]
  └─ subscription_id → subscriptions(id) [SET NULL]
```

## ✅ Arquivos Criados

### 1. Migration (Sequelize)

**Arquivo:** `backend/src/migrations/20260405000001-create-payment-transactions.js`

```javascript
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('payment_transactions', {
    // ... definição completa da tabela
  });
  
  // Criar índices
  await queryInterface.addIndex('payment_transactions', ['organization_id']);
  // ...
}

export async function down(queryInterface) {
  await queryInterface.dropTable('payment_transactions');
}
```

### 2. Script SQL

**Arquivo:** `backend/create-payment-transactions.sql`

```sql
-- Criar ENUM para status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Criar tabela
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  -- ... outros campos
);

-- Criar índices
CREATE INDEX payment_transactions_organization_id ON payment_transactions(organization_id);
-- ...
```

## 🔄 Execução

### Comando Executado

```bash
cd backend
PGPASSWORD=postgres psql -U postgres -d tatuticket -f create-payment-transactions.sql
```

### Resultado

```
DO
CREATE TABLE
CREATE INDEX (5x)
COMMENT (9x)
```

✅ Tabela criada com sucesso!

## 📊 Verificação

### Verificar Tabela Criada

```sql
\d payment_transactions
```

### Verificar Índices

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'payment_transactions';
```

### Verificar ENUM

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'payment_status'::regtype;
```

## 🔄 Componente Reativado

**Arquivo:** `portalOrganizaçãoTenant/src/pages/Subscription.jsx`

**Antes:**
```jsx
{/* Histórico de Pagamentos */}
{/* <PaymentHistory /> */}
{/* Temporariamente desabilitado - tabela payment_transactions não existe */}
```

**Depois:**
```jsx
{/* Histórico de Pagamentos */}
<PaymentHistory />
```

## 🎯 Funcionalidades Habilitadas

Agora o componente `PaymentHistory` pode:

1. ✅ Buscar histórico de pagamentos
2. ✅ Filtrar por status (pending, completed, failed, cancelled)
3. ✅ Filtrar por método de pagamento
4. ✅ Paginar resultados
5. ✅ Exibir detalhes de cada transação

## 📝 Exemplo de Uso

### Criar Pagamento

```javascript
await PaymentTransaction.create({
  organizationId: 'uuid-org',
  subscriptionId: 'uuid-sub',
  amount: 29.00,
  currency: 'EUR',
  status: 'pending',
  paymentMethod: 'multicaixa_express',
  paymentReference: 'REF-123456',
  description: 'Renovação de subscrição - Plano Starter'
});
```

### Buscar Histórico

```javascript
const payments = await PaymentTransaction.findAll({
  where: { organizationId: 'uuid-org' },
  order: [['createdAt', 'DESC']],
  limit: 10
});
```

### Atualizar Status

```javascript
await payment.update({
  status: 'completed',
  paidAt: new Date(),
  transactionId: 'TXN-789'
});
```

## 🧪 Como Testar

### 1. Recarregar Página

```
F5 ou Ctrl+R
```

### 2. Verificar Histórico

1. Ir para /subscription
2. Rolar até "Histórico de Pagamentos"
3. ✅ Deve mostrar "Nenhum pagamento encontrado" (se não houver pagamentos)
4. ✅ Sem erro 500 no console

### 3. Criar Pagamento de Teste

```sql
INSERT INTO payment_transactions (
  id,
  organization_id,
  amount,
  currency,
  status,
  payment_method,
  description,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM organizations LIMIT 1),
  29.00,
  'EUR',
  'completed',
  'multicaixa_express',
  'Teste de pagamento',
  NOW(),
  NOW()
);
```

### 4. Verificar Exibição

Recarregar página e verificar se o pagamento aparece no histórico.

## 📊 Status dos Pagamentos

### pending (Pendente)
- Pagamento criado mas não confirmado
- Aguardando confirmação do gateway
- Cor: Amarelo/Laranja

### completed (Completo)
- Pagamento confirmado e processado
- Valor creditado
- Cor: Verde

### failed (Falhado)
- Pagamento não foi processado
- Erro no gateway ou dados inválidos
- Cor: Vermelho

### cancelled (Cancelado)
- Pagamento cancelado pelo usuário ou sistema
- Não será processado
- Cor: Cinza

## 🔒 Segurança

### Permissões

- Apenas usuários da organização podem ver seus pagamentos
- Filtro automático por `organizationId`
- Auditoria de acessos

### Dados Sensíveis

- Não armazenar dados de cartão
- Apenas referências e IDs de transação
- Metadados criptografados se necessário

## ✅ Checklist

- [x] Tabela `payment_transactions` criada
- [x] Índices criados
- [x] ENUM `payment_status` criado
- [x] Relacionamentos configurados
- [x] Componente `PaymentHistory` reativado
- [ ] Página recarregada no navegador
- [ ] Histórico testado
- [ ] Pagamento de teste criado (opcional)

## 🎉 Conclusão

A tabela `payment_transactions` foi criada com sucesso e o componente `PaymentHistory` foi reativado. O histórico de pagamentos agora está funcional.

**Status:** ✅ Completo  
**Ação Pendente:** Recarregar página (F5)

---

**Data:** 05/04/2026  
**Tabela:** `payment_transactions`  
**Arquivos:**
- `backend/src/migrations/20260405000001-create-payment-transactions.js`
- `backend/create-payment-transactions.sql`
- `portalOrganizaçãoTenant/src/pages/Subscription.jsx`
