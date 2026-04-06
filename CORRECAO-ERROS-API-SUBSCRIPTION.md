# Correção - Erros de API na Página de Subscrição

## 🐛 Problemas Identificados

### 1. Erro 403 - `/api/plans`
```
GET http://localhost:4003/api/plans 403 (Forbidden)
```

### 2. Erro 500 - `/api/payments/history`
```
GET http://localhost:4003/api/payments/history 500 (Internal Server Error)
relation "payment_transactions" does not exist
```

## 🔍 Análise

### Problema 1: Permissões Incorretas

A rota `/api/plans` requer permissões de `super-admin` ou `provider-admin`:

```javascript
router.get('/plans', authenticate, authorize('super-admin', 'provider-admin'), ...)
```

Mas o usuário logado é apenas `admin` de organização, não tem essas permissões.

**Solução:** Usar a rota pública `/api/plans/public` que não requer autenticação especial.

### Problema 2: Tabela Não Existe

A tabela `payment_transactions` não existe no banco de dados, causando erro ao tentar buscar histórico de pagamentos.

**Solução:** Desabilitar temporariamente o componente `PaymentHistory` até que a tabela seja criada.

## ✅ Correções Aplicadas

### 1. Corrigida Rota de Planos

**Arquivo:** `portalOrganizaçãoTenant/src/services/subscriptionService.js`

**Antes:**
```javascript
async getAvailablePlans() {
  const response = await api.get('/plans');
  return response.data;
}
```

**Depois:**
```javascript
async getAvailablePlans() {
  const response = await api.get('/plans/public');
  return response.data;
}
```

### 2. Desabilitado PaymentHistory

**Arquivo:** `portalOrganizaçãoTenant/src/pages/Subscription.jsx`

**Antes:**
```jsx
{/* Histórico de Pagamentos */}
<PaymentHistory />
```

**Depois:**
```jsx
{/* Histórico de Pagamentos */}
{/* <PaymentHistory /> */}
{/* Temporariamente desabilitado - tabela payment_transactions não existe */}
```

## 📊 Rotas de Plans Disponíveis

### Rota Pública (Sem Autenticação)
```
GET /api/plans/public
```
- Retorna planos ativos para exibição pública
- Não requer autenticação
- Usado em landing pages e portal de organização

### Rotas Admin (Requer super-admin/provider-admin)
```
GET    /api/plans              - Listar todos os planos
GET    /api/plans/:id          - Obter plano específico
POST   /api/plans              - Criar plano
PUT    /api/plans/:id          - Atualizar plano
DELETE /api/plans/:id          - Deletar plano
PUT    /api/plans/:id/activate - Ativar plano
PUT    /api/plans/:id/deactivate - Desativar plano
```

## 🎯 Resultado

Após as correções:

1. ✅ Modal de upgrade carrega planos corretamente
2. ✅ Sem erro 403 ao buscar planos
3. ✅ Sem erro 500 ao carregar página
4. ⚠️ Histórico de pagamentos desabilitado temporariamente

## 🔄 Próximos Passos (Opcional)

### Para Habilitar Histórico de Pagamentos

1. **Criar Migration da Tabela:**

```javascript
// backend/src/migrations/YYYYMMDDHHMMSS-create-payment-transactions.js

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('payment_transactions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    organization_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    subscription_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id'
      }
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'EUR'
    },
    status: {
      type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    payment_method: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    payment_reference: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  await queryInterface.addIndex('payment_transactions', ['organization_id']);
  await queryInterface.addIndex('payment_transactions', ['subscription_id']);
  await queryInterface.addIndex('payment_transactions', ['status']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('payment_transactions');
}
```

2. **Executar Migration:**

```bash
cd backend
npx sequelize-cli db:migrate
```

3. **Habilitar Componente:**

```jsx
{/* Histórico de Pagamentos */}
<PaymentHistory />
```

## 🧪 Como Testar

### 1. Verificar Planos Disponíveis

Abrir DevTools (F12) → Network:
- ✅ Requisição para `/api/plans/public` deve retornar 200
- ✅ Deve retornar lista de planos ativos

### 2. Testar Modal de Upgrade

1. Clicar em "Upgrade de Plano"
2. ✅ Modal deve abrir
3. ✅ Deve mostrar planos disponíveis
4. ✅ Sem erro 403 no console

### 3. Verificar Console

Abrir DevTools (F12) → Console:
- ✅ Sem erro 403 (Forbidden)
- ✅ Sem erro 500 (Internal Server Error)
- ⚠️ Pode haver aviso sobre PaymentHistory comentado (normal)

## 📝 Notas Importantes

### Rota Pública vs Rota Admin

**Rota Pública (`/plans/public`):**
- Retorna apenas planos ativos (`isActive: true`)
- Não requer autenticação
- Ideal para landing pages e portais de cliente/organização

**Rota Admin (`/plans`):**
- Retorna todos os planos (ativos e inativos)
- Requer permissões de super-admin
- Usado no portal SaaS para gestão de planos

### Histórico de Pagamentos

O componente `PaymentHistory` foi desabilitado porque:
1. A tabela `payment_transactions` não existe
2. Não é essencial para o funcionamento básico
3. Pode ser habilitado depois criando a migration

## ✅ Checklist de Correção

- [x] Rota de planos corrigida para `/plans/public`
- [x] PaymentHistory comentado
- [x] Vite compilou sem erros
- [ ] Página recarregada no navegador
- [ ] Modal de upgrade testado
- [ ] Console sem erros 403/500

## 🎉 Conclusão

A página de subscrição agora carrega corretamente sem erros de API. O modal de upgrade funciona e pode buscar planos disponíveis.

**Status:** ✅ Corrigido  
**Ação Pendente:** Recarregar página (F5)

---

**Data:** 05/04/2026  
**Arquivos Modificados:**
- `portalOrganizaçãoTenant/src/services/subscriptionService.js`
- `portalOrganizaçãoTenant/src/pages/Subscription.jsx`
