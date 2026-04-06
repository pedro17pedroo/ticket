# Correção - Erro plan.limits no Subscription.jsx

## 🐛 Problema

A página de subscrição (`Subscription.jsx`) estava gerando erro ao tentar acessar `plan.limits.maxUsers`:

```
Uncaught TypeError: Cannot read properties of undefined (reading 'maxUsers')
at Subscription (Subscription.jsx:208:54)
```

## 🔍 Causa

O mesmo problema do controller: o código estava tentando acessar `plan.limits.maxUsers`, mas o campo `limits` não existe no model Plan. Os limites estão em campos individuais.

## ✅ Solução Aplicada

Corrigidas **6 ocorrências** de `plan.limits` para acesso direto aos campos:

### 1. Usuários (Linha 208)

**Antes:**
```javascript
{usage.current.users} / {plan.limits.maxUsers}
```

**Depois:**
```javascript
{usage.current.users} / {plan.maxUsers}
```

### 2. Clientes (Linha 228)

**Antes:**
```javascript
{usage.current.clients} / {plan.limits.maxClients}
```

**Depois:**
```javascript
{usage.current.clients} / {plan.maxClients}
```

### 3. Tickets por Mês (Linha 248)

**Antes:**
```javascript
{usage.current.ticketsThisMonth} / {plan.limits.maxTicketsPerMonth || '∞'}
```

**Depois:**
```javascript
{usage.current.ticketsThisMonth} / {plan.maxTicketsPerMonth || '∞'}
```

### 4. Armazenamento - Label (Linha 268)

**Antes:**
```javascript
{usage.current.storageUsedGB} GB / {plan.limits.maxStorageGB} GB
```

**Depois:**
```javascript
{usage.current.storageUsedGB} GB / {plan.maxStorageGB} GB
```

### 5. Armazenamento - Barra de Progresso (Linha 275)

**Antes:**
```javascript
width: `${Math.min((usage.current.storageUsedGB / plan.limits.maxStorageGB) * 100, 100)}%`
```

**Depois:**
```javascript
width: `${Math.min((usage.current.storageUsedGB / plan.maxStorageGB) * 100, 100)}%`
```

### 6. Armazenamento - Percentagem (Linha 280)

**Antes:**
```javascript
{Math.round((usage.current.storageUsedGB / plan.limits.maxStorageGB) * 100)}% usado
```

**Depois:**
```javascript
{Math.round((usage.current.storageUsedGB / plan.maxStorageGB) * 100)}% usado
```

## 📊 Resumo das Mudanças

| Campo | Antes | Depois |
|-------|-------|--------|
| Usuários | `plan.limits.maxUsers` | `plan.maxUsers` |
| Clientes | `plan.limits.maxClients` | `plan.maxClients` |
| Tickets | `plan.limits.maxTicketsPerMonth` | `plan.maxTicketsPerMonth` |
| Storage | `plan.limits.maxStorageGB` | `plan.maxStorageGB` |

## 🎯 Resultado

Agora a página de subscrição deve carregar corretamente e exibir:

- ✅ Informações do plano atual
- ✅ Status da subscrição (trial, active, etc.)
- ✅ Uso atual vs limites do plano
- ✅ Barras de progresso de uso
- ✅ Percentagens de uso
- ✅ Botão de renovação (se necessário)

## 🧪 Como Testar

### 1. Recarregar Página

O Vite deve ter atualizado automaticamente. Se não:
```
F5 ou Ctrl+R
```

### 2. Verificar Console

Abrir DevTools (F12) → Console:
- ✅ Sem erros de "Cannot read properties of undefined"
- ✅ Sem erros na linha 208

### 3. Verificar Página

A página deve mostrar:

```
┌─────────────────────────────────────┐
│ Plano Atual: Iniciante              │
│ Status: Trial                       │
│ Dias Restantes: 14                  │
├─────────────────────────────────────┤
│ Uso de Recursos                     │
│                                     │
│ Usuários: 0 / 10                   │
│ [████░░░░░░] 0% usado              │
│                                     │
│ Clientes: 0 / 50                   │
│ [░░░░░░░░░░] 0% usado              │
│                                     │
│ Tickets/Mês: 0 / ∞                 │
│ [░░░░░░░░░░] 0% usado              │
│                                     │
│ Armazenamento: 0 GB / 5 GB         │
│ [░░░░░░░░░░] 0% usado              │
└─────────────────────────────────────┘
```

## 📝 Estrutura do Objeto Plan

Para referência, o objeto `plan` retornado pela API tem esta estrutura:

```javascript
{
  id: "uuid",
  name: "starter",
  displayName: "Iniciante",
  monthlyPrice: 29.00,
  yearlyPrice: 290.00,
  currency: "EUR",
  maxUsers: 10,              // ← Acesso direto
  maxClients: 50,            // ← Acesso direto
  maxTicketsPerMonth: null,  // ← Acesso direto (null = ilimitado)
  maxStorageGB: 5,           // ← Acesso direto
  maxAttachmentSizeMB: 10,
  features: { ... },
  trialDays: 14,
  isActive: true,
  isDefault: false
}
```

## ✅ Checklist de Correção

- [x] 6 ocorrências de `plan.limits` corrigidas
- [x] Acesso direto aos campos implementado
- [x] Vite compilou sem erros
- [ ] Página recarregada no navegador
- [ ] Teste visual realizado
- [ ] Console sem erros

## 🔄 Arquivos Corrigidos

Esta é a **terceira correção** relacionada ao mesmo problema (`plan.limits`):

1. ✅ `backend/src/modules/subscriptions/subscriptionController.js` - Controller
2. ✅ `portalOrganizaçãoTenant/src/components/subscription/UpgradeModal.jsx` - Modal
3. ✅ `portalOrganizaçãoTenant/src/pages/Subscription.jsx` - Página (este arquivo)

## 🎉 Conclusão

Todas as referências a `plan.limits` foram corrigidas em todo o sistema. A página de subscrição agora deve funcionar perfeitamente.

**Status:** ✅ Corrigido  
**Ação Pendente:** Recarregar página no navegador

---

**Data:** 05/04/2026  
**Arquivo:** `portalOrganizaçãoTenant/src/pages/Subscription.jsx`  
**Linhas Corrigidas:** 208, 228, 248, 268, 275, 280
