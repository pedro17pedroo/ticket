# 🔐 Sistema RBAC - Guia de Implementação

## 📋 **Visão Geral**

Sistema de **Role-Based Access Control (RBAC)** de 3 níveis hierárquicos para arquitetura multi-tenant.

---

## 🏗️ **Arquitetura de 3 Níveis**

```
NÍVEL 1: ORGANIZAÇÃO (Service Provider)
↓ gerencia
NÍVEL 2: CLIENTE (Empresa B2B)
↓ gerencia  
NÍVEL 3: UTILIZADORES FINAIS
```

### **Tabelas do Sistema:**

1. **`roles`** - Definição de papéis (roles)
2. **`permissions`** - Permissões disponíveis no sistema
3. **`role_permissions`** - Relação N:N entre roles e permissões
4. **`user_permissions`** - Permissões específicas por utilizador (override)

---

## 👥 **Roles Padrão do Sistema**

### **Nível 1: Organização**
- `admin-org` - Administrador (prioridade: 1000)
- `gerente` - Gerente (prioridade: 800)
- `supervisor` - Supervisor (prioridade: 700)
- `agente` - Agente de Suporte (prioridade: 600)

### **Nível 2: Cliente**
- `client-admin` - Administrador do Cliente (prioridade: 500)
- `client-manager` - Gerente do Cliente (prioridade: 400)

### **Nível 3: Utilizador**
- `client-user` - Utilizador Padrão (prioridade: 100)
- `client-viewer` - Apenas Visualização (prioridade: 50)

---

## 🎯 **Scopes de Permissões**

| Scope | Descrição | Exemplo |
|-------|-----------|---------|
| `global` | Acesso a todos os recursos | Ver catálogo público |
| `organization` | Recursos da organização | Ver todos os tickets da org |
| `client` | Recursos do cliente | Ver tickets da empresa |
| `own` | Apenas recursos próprios | Ver meus tickets |

---

## 🔧 **Instalação e Configuração**

### **1. Executar Migração**

```bash
cd backend
npm run migrate
```

### **2. Popular Permissões e Roles Padrão**

```bash
node src/seeds/permissions-seed.js
```

### **3. Atualizar models/index.js**

Adicionar os novos models e associações:

```javascript
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import UserPermission from '../models/UserPermission.js';

// Associações
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

User.belongsTo(Role, { foreignKey: 'role', targetKey: 'name', as: 'roleObject' });
User.hasMany(UserPermission, { foreignKey: 'userId', as: 'customPermissions' });

export { Role, Permission, RolePermission, UserPermission };
```

---

## 💻 **Uso nos Controllers**

### **Exemplo 1: Proteger Rota com Permissão Simples**

```javascript
import { requirePermission } from '../middleware/permission.js';

// Apenas quem pode criar tickets
router.post('/tickets', 
  authenticate, 
  requirePermission('tickets', 'create'),
  ticketController.createTicket
);
```

### **Exemplo 2: Verificar Múltiplas Permissões (OR)**

```javascript
import { requireAnyPermission } from '../middleware/permission.js';

// Gerente OU Supervisor
router.get('/reports/advanced',
  authenticate,
  requireAnyPermission(
    ['reports', 'create'],
    ['reports', 'export']
  ),
  reportController.getAdvancedReports
);
```

### **Exemplo 3: Verificar Múltiplas Permissões (AND)**

```javascript
import { requireAllPermissions } from '../middleware/permission.js';

// Precisa das duas permissões
router.delete('/users/:id',
  authenticate,
  requireAllPermissions(
    ['users', 'delete'],
    ['settings', 'manage_roles']
  ),
  userController.deleteUser
);
```

### **Exemplo 4: Verificar Acesso a Recursos de Outro Utilizador**

```javascript
import { canAccessUserResource } from '../middleware/permission.js';

router.get('/users/:userId/tickets',
  authenticate,
  canAccessUserResource('tickets', 'read'),
  ticketController.getUserTickets
);
```

### **Exemplo 5: Verificar Nível Hierárquico**

```javascript
import { requireLevel } from '../middleware/permission.js';

// Apenas Organização (nível 1)
router.get('/admin/settings',
  authenticate,
  requireLevel('organization'),
  settingsController.getSettings
);
```

### **Exemplo 6: Uso Direto no Controller**

```javascript
import permissionService from '../services/permissionService.js';

export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByPk(id);
    
    // Verificar se pode editar ticket de outro utilizador
    const canEdit = await permissionService.canAccessUserResource(
      req.user,
      ticket.requesterId,
      'tickets',
      'update'
    );
    
    if (!canEdit) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    
    // Continuar com atualização...
  } catch (error) {
    next(error);
  }
};
```

### **Exemplo 7: Verificação Condicional**

```javascript
export const getTickets = async (req, res, next) => {
  try {
    let where = { organizationId: req.user.organizationId };
    
    // Verificar se pode ver todos os tickets
    const canViewAll = await permissionService.hasPermission(
      req.user,
      'tickets',
      'read_all'
    );
    
    // Se não pode ver todos, filtrar apenas os próprios
    if (!canViewAll) {
      where.requesterId = req.user.id;
    }
    
    const tickets = await Ticket.findAll({ where });
    res.json({ tickets });
  } catch (error) {
    next(error);
  }
};
```

---

## 🛠️ **Gestão de Roles e Permissões**

### **Criar Role Customizado**

```javascript
import permissionService from '../services/permissionService.js';

const roleData = {
  name: 'suporte-n1',
  displayName: 'Suporte Nível 1',
  description: 'Suporte básico',
  level: 'organization',
  priority: 550
};

const permissions = [
  'perm-id-1',
  'perm-id-2',
  'perm-id-3'
];

const customRole = await permissionService.createCustomRole(
  organizationId,
  roleData,
  permissions
);
```

### **Conceder Permissão Específica a Utilizador**

```javascript
// Conceder temporariamente
await permissionService.grantPermissionToUser(
  userId,
  permissionId,
  grantedByUserId,
  {
    expiresAt: new Date('2025-12-31'),
    reason: 'Acesso temporário para projeto X'
  }
);
```

### **Revogar Permissão**

```javascript
await permissionService.revokePermissionFromUser(userId, permissionId);
```

### **Obter Todas as Permissões de um Utilizador**

```javascript
const permissions = await permissionService.getUserPermissions(userId);
console.log(permissions); // Array de objetos Permission
```

---

## 📊 **Matriz de Permissões por Role**

| Permissão | admin-org | gerente | supervisor | agente | client-admin | client-manager | client-user |
|-----------|:---------:|:-------:|:----------:|:------:|:------------:|:--------------:|:-----------:|
| **Tickets** |
| tickets.create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| tickets.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| tickets.read_all | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| tickets.update_all | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| tickets.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| tickets.assign | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Utilizadores** |
| users.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users.read | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| users.manage_roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Clientes** |
| client_users.create | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| client_users.read | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Estrutura** |
| directions.create | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| departments.create | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Relatórios** |
| reports.view | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| reports.export | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Configurações** |
| settings.update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings.manage_roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🎨 **Frontend - Verificação de Permissões**

### **Hook React para Permissões**

```javascript
// hooks/usePermissions.js
import { useAuthStore } from '../store/authStore';
import { useMemo } from 'react';

export const usePermissions = () => {
  const { user } = useAuthStore();
  
  const can = useMemo(() => {
    return (resource, action) => {
      if (!user || !user.permissions) return false;
      
      // admin-org tem tudo
      if (user.role === 'admin-org') return true;
      
      // Verificar nas permissões
      return user.permissions.some(p => 
        p.resource === resource && p.action === action
      );
    };
  }, [user]);
  
  return { can, user };
};
```

### **Uso no Componente**

```javascript
import { usePermissions } from '../hooks/usePermissions';

const TicketList = () => {
  const { can } = usePermissions();
  
  return (
    <div>
      {can('tickets', 'create') && (
        <button onClick={createTicket}>Novo Ticket</button>
      )}
      
      {can('tickets', 'export') && (
        <button onClick={exportTickets}>Exportar</button>
      )}
    </div>
  );
};
```

---

## ✅ **Checklist de Implementação**

- [ ] Executar migração (`npm run migrate`)
- [ ] Executar seed de permissões (`node src/seeds/permissions-seed.js`)
- [ ] Atualizar `models/index.js` com novos models
- [ ] Substituir `authorize('role')` por `requirePermission('resource', 'action')`
- [ ] Atualizar todos os controllers com novas verificações
- [ ] Criar endpoints para gestão de roles (admin)
- [ ] Implementar hook `usePermissions` no frontend
- [ ] Atualizar componentes com verificações de permissão
- [ ] Testar todos os cenários de acesso
- [ ] Documentar roles customizados criados

---

## 🚀 **Próximos Passos**

1. **Dashboard de Gestão de Roles** - Interface admin para criar/editar roles
2. **Auditoria de Acessos** - Log de quem tentou acessar o quê
3. **Permissões Temporárias** - Sistema de expiração automática
4. **Grupos de Utilizadores** - Atribuir permissões a grupos
5. **IP Whitelisting** - Restringir acesso por IP
6. **2FA** - Autenticação de dois fatores

---

## 📞 **Suporte**

Para dúvidas ou problemas, consulte a documentação completa ou contacte a equipa de desenvolvimento.
