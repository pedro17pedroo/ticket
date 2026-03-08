# 🐛 Problema: Permissões Vazias no Frontend

**Data**: 02 de Março de 2026  
**Status**: 🔍 EM INVESTIGAÇÃO

---

## 🎯 Sintoma

Frontend mostra aviso:
```
⚠️ Permissões não carregadas do backend. Usuário terá acesso limitado.
```

Menus e funcionalidades não aparecem.

---

## 🔍 Investigação Realizada

### 1. Verificação do Banco de Dados ✅

```bash
node src/scripts/check-permissions.js
```

**Resultado**:
- ✅ 46 roles criados
- ✅ 26 permissões cadastradas
- ✅ 96 associações role-permission
- ✅ org-admin tem 17 permissões associadas

**Conclusão**: Banco de dados está correto.

### 2. Verificação do Frontend ✅

**Fluxo**:
1. Login → `authService.selectContext()`
2. Backend retorna `response.user.permissions`
3. Frontend chama `setAuth(response.user, response.token)`
4. `authStore` salva `user.permissions` em `permissions`
5. `usePermissions` hook lê `permissions` do store

**Problema identificado**: `response.user.permissions` está vazio ou undefined.

### 3. Verificação do Backend 🔍

**authController.js** (linha ~108-112):
```javascript
// Carregar permissões do utilizador (RBAC)
let permissions = selectedContext.permissions || [];
try {
  const permissionService = (await import('../../services/permissionService.js')).default;
  permissions = await permissionService.getUserPermissions(selectedContext.userId);
  debug('✅ Permissões carregadas:', permissions);
} catch (error) {
  // Ignora se RBAC não estiver inicializado
}
```

**permissionService.js** (linha ~282-398):
```javascript
async getUserPermissions(userId) {
  // 1. Busca usuário (User, OrganizationUser ou ClientUser)
  // 2. Busca role via findRoleByHierarchy()
  // 3. Retorna role.permissions
}
```

**findRoleByHierarchy()** (linha ~201-280):
```javascript
async findRoleByHierarchy(roleName, organizationId, clientId = null) {
  // 1. Busca role do cliente (se clientId)
  // 2. Busca role da organização (se organizationId)
  // 3. Busca role global
  
  // ⚠️ PROBLEMA POTENCIAL: Associação Role-Permission
  const role = await Role.findOne({
    where: { ... },
    include: [{
      model: Permission,
      as: 'permissions',
      through: {
        where: { granted: true },
        attributes: []
      }
    }]
  });
}
```

### 4. Teste de Associações ❌

**Erro encontrado**:
```
EagerLoadingError: Permission is not associated to Role!
```

**Causa**: Quando os models são importados dinamicamente no script de teste, as associações não estão carregadas.

**Mas**: No servidor real, as associações devem estar funcionando porque são definidas em `modules/models/index.js`.

---

## 🎯 Hipóteses

### Hipótese 1: Associações não carregadas no servidor ⚠️

**Possível causa**: O servidor pode não estar carregando as associações corretamente ao iniciar.

**Como verificar**:
1. Adicionar logs no `permissionService.getUserPermissions()`
2. Verificar se `role.permissions` está vazio
3. Verificar logs do backend durante login

### Hipótese 2: Erro silencioso no try/catch ⚠️

**Possível causa**: O `try/catch` no authController pode estar engolindo erros.

**Como verificar**:
1. Adicionar logs no catch
2. Verificar se há erros sendo ignorados

### Hipótese 3: userId incorreto ⚠️

**Possível causa**: O `selectedContext.userId` pode estar incorreto.

**Como verificar**:
1. Adicionar log do userId antes de chamar `getUserPermissions()`
2. Verificar se o userId existe na tabela correta

---

## 🔧 Próximos Passos

### Passo 1: Adicionar Logs Detalhados

Modificar `authController.js` para adicionar mais logs:

```javascript
// Carregar permissões do utilizador (RBAC)
let permissions = selectedContext.permissions || [];
console.log('🔍 DEBUG: Carregando permissões para userId:', selectedContext.userId);
console.log('🔍 DEBUG: Contexto:', {
  userType: selectedContext.userType,
  organizationId: selectedContext.organizationId,
  clientId: selectedContext.clientId,
  role: selectedContext.role
});

try {
  const permissionService = (await import('../../services/permissionService.js')).default;
  permissions = await permissionService.getUserPermissions(selectedContext.userId);
  console.log('✅ Permissões carregadas:', permissions);
  console.log('✅ Total de permissões:', permissions.length);
} catch (error) {
  console.error('❌ Erro ao carregar permissões:', error);
  console.error('❌ Stack:', error.stack);
  // Não ignora mais o erro
  throw error;
}
```

### Passo 2: Adicionar Logs no permissionService

Modificar `permissionService.getUserPermissions()`:

```javascript
async getUserPermissions(userId) {
  try {
    console.log('🔍 getUserPermissions: Buscando usuário:', userId);
    
    let user = null;
    let userType = null;
    
    // ... busca do usuário ...
    
    if (!user) {
      console.error('❌ getUserPermissions: Usuário não encontrado:', userId);
      return [];
    }
    
    console.log('✅ getUserPermissions: Usuário encontrado:', {
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      clientId: user.clientId
    });
    
    // Buscar role
    const role = await this.findRoleByHierarchy(
      user.role,
      user.organizationId,
      user.clientId
    );
    
    if (!role) {
      console.error('❌ getUserPermissions: Role não encontrado:', user.role);
      return [];
    }
    
    console.log('✅ getUserPermissions: Role encontrado:', {
      id: role.id,
      name: role.name,
      permissionsCount: role.permissions?.length || 0
    });
    
    if (!role.permissions || role.permissions.length === 0) {
      console.warn('⚠️ getUserPermissions: Role sem permissões associadas');
      return [];
    }
    
    // ... resto do código ...
  } catch (error) {
    console.error('❌ getUserPermissions: Erro:', error);
    console.error('❌ Stack:', error.stack);
    return [];
  }
}
```

### Passo 3: Verificar Logs do Backend

1. Reiniciar backend
2. Fazer login no frontend
3. Verificar logs do backend
4. Identificar onde o fluxo está falhando

### Passo 4: Verificar Associações no Servidor

Adicionar log no `modules/models/index.js` após definir associações:

```javascript
// Após todas as associações
console.log('✅ Associações carregadas:');
console.log('   Role.associations:', Object.keys(Role.associations));
console.log('   Permission.associations:', Object.keys(Permission.associations));
```

---

## 📊 Checklist de Verificação

- [ ] Adicionar logs no authController
- [ ] Adicionar logs no permissionService
- [ ] Adicionar logs nas associações
- [ ] Reiniciar backend
- [ ] Fazer login no frontend
- [ ] Analisar logs do backend
- [ ] Identificar ponto de falha
- [ ] Aplicar correção
- [ ] Testar novamente

---

## 🎯 Solução Esperada

Após identificar o problema, a solução deve:

1. Garantir que as associações Role-Permission estão carregadas
2. Garantir que `getUserPermissions()` retorna array de permissões
3. Garantir que o authController passa as permissões para o frontend
4. Garantir que o frontend recebe e armazena as permissões

**Resultado esperado**:
```javascript
response.user.permissions = [
  'tickets.read',
  'tickets.create',
  'tickets.update',
  // ... mais permissões
]
```

---

**Próximo passo**: Adicionar logs detalhados e reiniciar backend para debug.

---

**Criado por**: Kiro AI Assistant  
**Data**: 02 de Março de 2026
