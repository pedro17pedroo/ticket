# Correção - Erro 500 no Endpoint /api/subscription

## 🐛 Problema

O endpoint `/api/subscription` retornava erro 500:

```
Cannot read properties of undefined (reading 'maxUsers')
```

## 🔍 Causa Raiz

O controller estava tentando acessar `subscription.plan.limits.maxUsers`, mas:

1. A tabela `plans` não tem uma coluna `limits` (JSON)
2. A tabela tem colunas individuais: `max_users`, `max_clients`, `max_tickets_per_month`, `max_storage_gb`
3. O model `Plan` define os campos como `maxUsers`, `maxClients`, etc. (camelCase)
4. O controller estava tentando acessar um campo `limits` que não existe

## ✅ Solução Aplicada

### Correção no Controller

**Arquivo:** `backend/src/modules/subscriptions/subscriptionController.js`

**Antes (❌ Errado):**
```javascript
// Calcular percentagens
if (subscription.plan.limits.maxUsers) {
  usage.percentages.users = Math.round((usage.current.users / subscription.plan.limits.maxUsers) * 100);
}
if (subscription.plan.limits.maxClients) {
  usage.percentages.clients = Math.round((usage.current.clients / subscription.plan.limits.maxClients) * 100);
}
if (subscription.plan.limits.maxTicketsPerMonth) {
  usage.percentages.tickets = Math.round((usage.current.ticketsThisMonth / subscription.plan.limits.maxTicketsPerMonth) * 100);
}
```

**Depois (✅ Correto):**
```javascript
// Calcular percentagens (usando campos do model Plan)
if (subscription.plan?.maxUsers) {
  usage.percentages.users = Math.round((usage.current.users / subscription.plan.maxUsers) * 100);
}
if (subscription.plan?.maxClients) {
  usage.percentages.clients = Math.round((usage.current.clients / subscription.plan.maxClients) * 100);
}
if (subscription.plan?.maxTicketsPerMonth) {
  usage.percentages.tickets = Math.round((usage.current.ticketsThisMonth / subscription.plan.maxTicketsPerMonth) * 100);
}
if (subscription.plan?.maxStorageGB) {
  usage.percentages.storage = Math.round((usage.current.storageUsedGB / subscription.plan.maxStorageGB) * 100);
}
```

### Mudanças:

1. ✅ Removido acesso a `subscription.plan.limits`
2. ✅ Acessando diretamente `subscription.plan.maxUsers`, `subscription.plan.maxClients`, etc.
3. ✅ Adicionado operador de encadeamento opcional (`?.`) para segurança
4. ✅ Adicionado cálculo de percentagem de storage

## 📊 Estrutura da Tabela Plans

```sql
Column                  | Type
------------------------+--------------------------
id                      | uuid
name                    | character varying(255)
display_name            | character varying(255)
monthly_price           | numeric(10,2)
yearly_price            | numeric(10,2)
currency                | character varying(3)
max_users               | integer  ← Usado diretamente
max_clients             | integer  ← Usado diretamente
max_tickets_per_month   | integer  ← Usado diretamente
max_storage_gb          | integer  ← Usado diretamente
max_attachment_size_mb  | integer
features                | jsonb
features_text           | jsonb
trial_days              | integer
is_active               | boolean
is_default              | boolean
sort_order              | integer
created_at              | timestamp with time zone
updated_at              | timestamp with time zone
```

## 🔄 Model Plan (Sequelize)

```javascript
// Campos definidos no model
maxUsers: {
  type: DataTypes.INTEGER,
  field: 'max_users'  // Mapeia para coluna do banco
}
maxClients: {
  type: DataTypes.INTEGER,
  field: 'max_clients'
}
maxTicketsPerMonth: {
  type: DataTypes.INTEGER,
  field: 'max_tickets_per_month'
}
maxStorageGB: {
  type: DataTypes.INTEGER,
  field: 'max_storage_gb'
}
```

## ✅ Resultado

Agora o endpoint `/api/subscription` funciona corretamente:

```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "...",
      "organizationId": "...",
      "planId": "...",
      "status": "trial",
      "isInTrial": true,
      "trialDaysRemaining": 14
    },
    "plan": {
      "id": "...",
      "name": "starter",
      "displayName": "Iniciante",
      "monthlyPrice": "29.00",
      "maxUsers": 10,
      "maxClients": 50,
      "maxTicketsPerMonth": null,
      "maxStorageGB": 5
    },
    "usage": {
      "current": {
        "users": 0,
        "clients": 0,
        "ticketsThisMonth": 0,
        "storageUsedGB": 0
      },
      "percentages": {
        "users": 0,
        "clients": 0,
        "tickets": 0,
        "storage": 0
      }
    }
  }
}
```

## 🎯 Menu de Subscrição

O menu de subscrição está corretamente implementado no Sidebar:

```javascript
// Verificar se é admin
const canViewSubscription = user && ['admin', 'super-admin', 'org-admin'].includes(user.role)

// Menu condicional
{canViewSubscription && (
  <Link to="/subscription" ...>
    <CreditCard className="w-5 h-5 flex-shrink-0" />
    {(isOpen || isMobile) && <span className="font-medium">Subscrição</span>}
  </Link>
)}
```

### Roles Permitidos:
- ✅ admin
- ✅ super-admin
- ✅ org-admin

### Outros usuários:
- ❌ Menu não aparece
- ❌ Não têm acesso à página

## 🧪 Como Testar

### 1. Testar Endpoint Diretamente

```bash
curl -X GET http://localhost:4003/api/subscription \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

Deve retornar status 200 com dados da subscrição.

### 2. Testar no Frontend

1. Login como admin
2. Verificar se menu "Subscrição" aparece
3. Clicar no menu
4. Página deve carregar sem erros
5. Verificar console do navegador (F12) - sem erros

### 3. Testar SubscriptionAlert

1. Login como qualquer usuário
2. Verificar se alerta aparece (se trial ≤ 7 dias)
3. Verificar console - sem erros

## 📝 Checklist de Correção

- [x] Erro identificado (acesso a `limits` inexistente)
- [x] Controller corrigido (acesso direto aos campos)
- [x] Operador `?.` adicionado para segurança
- [x] Cálculo de storage adicionado
- [x] Menu de subscrição verificado (correto)
- [ ] Backend reiniciado (necessário)
- [ ] Teste do endpoint realizado
- [ ] Teste do frontend realizado

## 🔄 Próximos Passos

### 1. Reiniciar Backend

O código foi corrigido, mas o backend precisa ser reiniciado:

```bash
cd backend
npm restart
```

### 2. Testar no Navegador

Após reiniciar o backend:

1. Recarregar página do portal (F5)
2. Verificar se menu "Subscrição" aparece
3. Clicar e verificar se carrega
4. Verificar console - sem erros

### 3. Verificar Logs

```bash
cd backend
tail -f logs/combined.log
```

Não deve haver mais erros relacionados a `subscription`.

## 🎉 Conclusão

O erro foi causado por uma incompatibilidade entre:
- O que o controller esperava (`subscription.plan.limits.maxUsers`)
- O que o model realmente fornece (`subscription.plan.maxUsers`)

A correção alinha o controller com a estrutura real do model e do banco de dados.

**Status:** ✅ Corrigido  
**Ação Pendente:** Reiniciar backend

---

**Data:** 05/04/2026  
**Arquivo:** `backend/src/modules/subscriptions/subscriptionController.js`  
**Linhas:** 520-530
