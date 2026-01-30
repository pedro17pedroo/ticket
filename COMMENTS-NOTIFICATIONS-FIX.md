# Correção de Notificações e Emails de Comentários

## Problema Identificado

Quando um usuário comentava em um ticket, as notificações e emails não eram enviados devido a um erro no banco de dados:

```
invalid input value for enum enum_notifications_actor_type: "provider"
```

### Causa Raiz

1. **authorType incorreto**: O código estava definindo `authorType = 'provider'` como default, mas o enum do banco de dados aceita apenas `['organization', 'client', 'system']`

2. **Mapeamento de roles incompleto**: O código verificava apenas roles legados `['gerente', 'supervisor', 'agente']`, mas os roles reais da organização são `['org-admin', 'org-manager', 'agent']`

## Correções Implementadas

### 1. ticketController.js (linhas 892-908)

**ANTES:**
```javascript
let authorType = 'provider'; // ❌ INVÁLIDO
let authorUserId = req.user.id;
let authorOrgUserId = null;
let authorClientUserId = null;

if (['gerente', 'supervisor', 'agente'].includes(req.user.role)) {
  authorType = 'organization';
  authorOrgUserId = req.user.id;
  authorUserId = null;
} else if (['client-admin', 'client-user', 'client-viewer'].includes(req.user.role)) {
  authorType = 'client';
  authorClientUserId = req.user.id;
  authorUserId = null;
}
```

**DEPOIS:**
```javascript
let authorType = 'organization'; // ✅ Default válido
let authorUserId = req.user.id;
let authorOrgUserId = null;
let authorClientUserId = null;

// Roles da organização (novos e legados)
if (['org-admin', 'org-manager', 'agent', 'gerente', 'supervisor', 'agente'].includes(req.user.role)) {
  authorType = 'organization';
  authorOrgUserId = req.user.id;
  authorUserId = null;
} 
// Roles de cliente
else if (['client-admin', 'client-user', 'client-viewer'].includes(req.user.role)) {
  authorType = 'client';
  authorClientUserId = req.user.id;
  authorUserId = null;
}
```

### 2. commentController.js (linhas 114-128)

**ANTES:**
```javascript
let authorType = 'provider'; // ❌ INVÁLIDO

if (req.user.userType === 'organization' || ['org-admin', 'org-technician', 'org-manager', 'gerente', 'supervisor', 'agente'].includes(req.user.role)) {
  authorType = 'organization';
  // ...
}
```

**DEPOIS:**
```javascript
let authorType = 'organization'; // ✅ Default válido

if (req.user.userType === 'organization' || ['org-admin', 'org-technician', 'org-manager', 'agent', 'gerente', 'supervisor', 'agente'].includes(req.user.role)) {
  authorType = 'organization';
  // ...
}
```

## Fluxo de Notificações Corrigido

### Quando um comentário é criado:

1. **ticketController.js** (linha 973-979):
   - Chama `notificationService.notifyNewComment()` com `authorType` correto

2. **notificationService.js** (linha 474-556):
   - Identifica destinatários (assignee e requester)
   - Cria notificações com `actorType` válido (`'organization'` ou `'client'`)
   - Chama `createBulkNotifications()`

3. **createBulkNotifications()** (linha 38-66):
   - Cria notificações no banco de dados
   - Envia emails em background
   - Emite notificações via WebSocket

## Valores Válidos do Enum

### actorType / recipientType
- `'organization'` - Usuários da organização (técnicos, gestores, admins)
- `'client'` - Usuários clientes
- `'system'` - Sistema (automático)

### Roles da Organização
- `'org-admin'` - Administrador da organização
- `'org-manager'` - Gestor da organização
- `'agent'` - Agente/Técnico
- `'gerente'`, `'supervisor'`, `'agente'` - Roles legados (mantidos para compatibilidade)

### Roles de Cliente
- `'client-admin'` - Administrador do cliente
- `'client-user'` - Usuário do cliente
- `'client-viewer'` - Visualizador do cliente
- `'client-manager'` - Gestor do cliente

## Testes Necessários

### 1. Comentário de Técnico → Cliente
- [ ] Técnico comenta em ticket do cliente
- [ ] Cliente recebe notificação na app
- [ ] Cliente recebe email
- [ ] Nome do técnico aparece corretamente

### 2. Comentário de Cliente → Técnico
- [ ] Cliente comenta em ticket
- [ ] Técnico responsável recebe notificação na app
- [ ] Técnico recebe email
- [ ] Nome do cliente aparece corretamente

### 3. Comentário Interno
- [ ] Técnico cria comentário interno
- [ ] Cliente NÃO recebe notificação
- [ ] Apenas técnicos da organização são notificados

## Arquivos Modificados

1. `backend/src/modules/tickets/ticketController.js` - Corrigido mapeamento de authorType
2. `backend/src/modules/comments/commentController.js` - Corrigido mapeamento de authorType e adicionado role 'agent'

## Status

✅ **CORREÇÕES IMPLEMENTADAS**
⏳ **AGUARDANDO TESTES**

---

**Data**: 29 de Janeiro de 2026
**Sistema**: T-Desk
