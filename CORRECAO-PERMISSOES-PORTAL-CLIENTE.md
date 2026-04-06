# Correção de Permissões - Portal Cliente Empresa

## Problema Identificado

O Portal Cliente Empresa não estava carregando as permissões dos usuários. O erro no console mostrava:
```
⚠️ Permissões não carregadas do backend. Usuário terá acesso limitado.
```

## Causa Raiz

O backend estava retornando as permissões como **array de strings**:
```javascript
["tickets.view", "tickets.create", "comments.view"]
```

Mas o Portal Cliente esperava **array de objetos**:
```javascript
[
  { resource: "tickets", action: "view" },
  { resource: "tickets", action: "create" },
  { resource: "comments", action: "view" }
]
```

## Solução Implementada

### 1. Atualização do `authController.js`

Modificamos 4 funções no arquivo `backend/src/modules/auth/authController.js` para converter o formato das permissões:

#### Função `login()` (linha ~110)
```javascript
const permissionStrings = await permissionService.getUserPermissions(selectedContext.userId);

// Converter strings para objetos {resource, action}
permissions = permissionStrings.map(perm => {
  const [resource, action] = perm.split('.');
  return { resource, action };
});
```

#### Função `selectContext()` (linha ~260)
```javascript
const permissionStrings = await permissionService.getUserPermissions(contextData.userId);

// Converter strings para objetos {resource, action}
permissions = permissionStrings.map(perm => {
  const [resource, action] = perm.split('.');
  return { resource, action };
});
```

#### Função `switchContext()` (linha ~780)
```javascript
const permissionStrings = await permissionService.getUserPermissions(newContextData.userId);

// Converter strings para objetos {resource, action}
permissions = permissionStrings.map(perm => {
  const [resource, action] = perm.split('.');
  return { resource, action };
});
```

#### Função `getProfile()` (linha ~605)
```javascript
const permissionStrings = await permissionService.getUserPermissions(id);

// Converter strings para objetos {resource, action}
permissions = permissionStrings.map(perm => {
  const [resource, action] = perm.split('.');
  return { resource, action };
});
```

## Permissões Configuradas

### Role: `client-admin`
- dashboard.view
- tickets.view, tickets.create, tickets.update
- comments.view, comments.create
- directions.view
- departments.view
- sections.view
- catalog.view
- assets.view
- knowledge.view
- hours_bank.view
- reports.view

### Role: `client-user`
- dashboard.view
- tickets.view, tickets.create
- comments.view, comments.create
- catalog.view
- assets.view
- knowledge.view
- hours_bank.view

## Teste de Validação

### Usuário Cliente (client-user)
```bash
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@clientedemo.com", "password": "password123", "portalType": "client"}'
```

**Resultado:** ✅ 9 permissões carregadas no formato correto

### Admin Cliente (client-admin)
```bash
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@clientedemo.com", "password": "password123", "portalType": "client"}'
```

**Resultado:** ✅ 14 permissões carregadas no formato correto

## Credenciais de Teste

### Portal Cliente Empresa
- **Admin:** admin@clientedemo.com / password123
- **User:** user@clientedemo.com / password123

## Arquivos Modificados

1. `backend/src/modules/auth/authController.js` - Conversão de formato de permissões
2. `backend/scripts/update-client-password.js` - Script auxiliar para atualizar senhas

## Status

✅ **CORRIGIDO** - As permissões agora são carregadas corretamente no Portal Cliente Empresa no formato esperado pelo frontend.

## Próximos Passos

1. Testar login no Portal Cliente Empresa via interface web
2. Verificar se todas as funcionalidades respeitam as permissões
3. Validar que o hook `usePermissions` está funcionando corretamente
4. Testar troca de contexto (se aplicável)

---
**Data:** 04/04/2026
**Desenvolvedor:** Kiro AI Assistant
