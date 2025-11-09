# 🔐 RBAC - Exemplos de Uso no Frontend

## 📚 **Hook usePermissions**

### **Importação:**
```javascript
import { usePermissions } from '../hooks/usePermissions';
```

---

## 🎯 **Exemplos Práticos**

### **1. Verificar Permissão Simples**

```javascript
import { usePermissions } from '../hooks/usePermissions';

const TicketList = () => {
  const { can } = usePermissions();

  return (
    <div>
      <h1>Tickets</h1>
      
      {/* Mostrar botão apenas se pode criar tickets */}
      {can('tickets', 'create') && (
        <button onClick={createTicket}>
          Novo Ticket
        </button>
      )}
      
      {/* Mostrar opções de export apenas se pode exportar */}
      {can('tickets', 'export') && (
        <button onClick={exportTickets}>
          Exportar
        </button>
      )}
    </div>
  );
};
```

---

### **2. Verificar Múltiplas Permissões (OR)**

```javascript
const TicketActions = ({ ticket }) => {
  const { canAny } = usePermissions();

  // Mostrar se pode editar OU eliminar
  const canManage = canAny([
    ['tickets', 'update'],
    ['tickets', 'delete']
  ]);

  if (!canManage) return null;

  return (
    <div className="actions">
      <button>Editar</button>
      <button>Eliminar</button>
    </div>
  );
};
```

---

### **3. Verificar Múltiplas Permissões (AND)**

```javascript
const AdvancedSettings = () => {
  const { canAll } = usePermissions();

  // Precisa das DUAS permissões
  const canAccessAdvanced = canAll([
    ['settings', 'view'],
    ['settings', 'manage_roles']
  ]);

  if (!canAccessAdvanced) {
    return <div>Acesso Negado</div>;
  }

  return (
    <div>
      <h2>Configurações Avançadas</h2>
      {/* Conteúdo restrito */}
    </div>
  );
};
```

---

### **4. Verificar Role**

```javascript
const AdminPanel = () => {
  const { hasRole } = usePermissions();

  if (!hasRole('admin-org', 'gerente')) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <h2>Painel Administrativo</h2>
      {/* Conteúdo apenas para admin e gerente */}
    </div>
  );
};
```

---

### **5. Verificar Nível Hierárquico**

```javascript
const OrganizationSettings = () => {
  const { isLevel } = usePermissions();

  // Apenas para nível organização (admin-org, gerente, supervisor, agente)
  if (!isLevel('organization')) {
    return <div>Apenas para equipe interna</div>;
  }

  return (
    <div>
      <h2>Configurações da Organização</h2>
    </div>
  );
};
```

---

### **6. Usando Helpers**

```javascript
const UserMenu = () => {
  const { isAdmin, isClientAdmin, canAccessSettings } = usePermissions();

  return (
    <nav>
      {isAdmin && <Link to="/admin">Admin</Link>}
      {isClientAdmin && <Link to="/organization">Organização</Link>}
      {canAccessSettings && <Link to="/settings">Configurações</Link>}
    </nav>
  );
};
```

---

## 🛡️ **Componentes de Proteção**

### **1. ProtectedRoute - Proteger Rotas Inteiras**

```javascript
import { ProtectedRoute } from '../components/ProtectedRoute';

// No Router
<Routes>
  {/* Proteger por permissão */}
  <Route path="/tickets/new" element={
    <ProtectedRoute resource="tickets" action="create">
      <NewTicket />
    </ProtectedRoute>
  } />

  {/* Proteger por role */}
  <Route path="/admin" element={
    <ProtectedRoute roles={['admin-org']}>
      <AdminPanel />
    </ProtectedRoute>
  } />

  {/* Redirecionar para rota específica */}
  <Route path="/settings" element={
    <ProtectedRoute 
      resource="settings" 
      action="view" 
      redirectTo="/unauthorized"
    >
      <Settings />
    </ProtectedRoute>
  } />
</Routes>
```

---

### **2. CanAccess - Mostrar/Ocultar Elementos**

```javascript
import { CanAccess } from '../components/ProtectedRoute';

const TicketDetail = ({ ticket }) => {
  return (
    <div>
      <h1>{ticket.subject}</h1>
      <p>{ticket.description}</p>

      {/* Botão visível apenas com permissão */}
      <CanAccess resource="tickets" action="update">
        <button onClick={handleEdit}>
          Editar
        </button>
      </CanAccess>

      {/* Com fallback */}
      <CanAccess 
        resource="tickets" 
        action="delete"
        fallback={<span className="text-gray-400">Sem permissão</span>}
      >
        <button onClick={handleDelete}>
          Eliminar
        </button>
      </CanAccess>

      {/* Por role */}
      <CanAccess roles={['admin-org', 'gerente']}>
        <button onClick={handleTransfer}>
          Transferir
        </button>
      </CanAccess>
    </div>
  );
};
```

---

## 🎨 **Integração com Componentes Existentes**

### **Exemplo 1: Sidebar**

```javascript
// src/components/Sidebar.jsx
import { usePermissions } from '../hooks/usePermissions';

const Sidebar = () => {
  const { can, isClientAdmin } = usePermissions();

  const menuItems = [
    { path: '/', icon: Home, label: 'Início' },
    
    // Todos podem ver tickets
    can('tickets', 'read') && { 
      path: '/tickets', 
      icon: Ticket, 
      label: 'Meus Tickets' 
    },
    
    // Apenas com permissão
    can('catalog', 'read') && { 
      path: '/catalog', 
      icon: ShoppingCart, 
      label: 'Catálogo' 
    },
    
    can('knowledge', 'read') && { 
      path: '/knowledge', 
      icon: BookOpen, 
      label: 'Base de Conhecimento' 
    },
    
    can('assets', 'read') && { 
      path: '/assets', 
      icon: HardDrive, 
      label: 'Meus Equipamentos' 
    },
    
    can('hours_bank', 'view') && { 
      path: '/hours', 
      icon: Clock, 
      label: 'Bolsa de Horas' 
    },
    
    // Apenas para client-admin
    isClientAdmin && { 
      path: '/organization', 
      icon: Building2, 
      label: 'Organização' 
    }
  ].filter(Boolean); // Remover itens falsos

  return (
    <nav>
      {menuItems.map(item => (
        <Link key={item.path} to={item.path}>
          <item.icon />
          {item.label}
        </Link>
      ))}
    </nav>
  );
};
```

---

### **Exemplo 2: Tabela com Ações**

```javascript
import { usePermissions } from '../hooks/usePermissions';

const UsersTable = ({ users }) => {
  const { can } = usePermissions();

  const canEdit = can('client_users', 'update');
  const canDelete = can('client_users', 'delete');

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          {(canEdit || canDelete) && <th>Ações</th>}
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            {(canEdit || canDelete) && (
              <td>
                {canEdit && (
                  <button onClick={() => handleEdit(user)}>
                    Editar
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(user)}>
                    Eliminar
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

### **Exemplo 3: Formulário Condicional**

```javascript
const TicketForm = () => {
  const { can, canAny } = usePermissions();

  return (
    <form>
      {/* Campos básicos - todos podem ver */}
      <input name="subject" placeholder="Assunto" />
      <textarea name="description" placeholder="Descrição" />

      {/* Apenas agentes podem atribuir */}
      {can('tickets', 'assign') && (
        <select name="assigneeId">
          <option>Selecione um agente...</option>
          {/* Lista de agentes */}
        </select>
      )}

      {/* Apenas agentes podem definir prioridade interna */}
      {can('tickets', 'update_all') && (
        <select name="internalPriority">
          <option>Urgente</option>
          <option>Alta</option>
          <option>Normal</option>
        </select>
      )}

      {/* Qualquer utilizador com permissão de criar ou editar */}
      {canAny([['tickets', 'create'], ['tickets', 'update']]) && (
        <button type="submit">
          Guardar
        </button>
      )}
    </form>
  );
};
```

---

## 📊 **Verificação Dinâmica no Runtime**

```javascript
const DynamicActions = ({ resource, item }) => {
  const { can } = usePermissions();

  const actions = [
    {
      label: 'Ver',
      action: 'read',
      onClick: () => viewItem(item),
      icon: Eye
    },
    {
      label: 'Editar',
      action: 'update',
      onClick: () => editItem(item),
      icon: Edit
    },
    {
      label: 'Eliminar',
      action: 'delete',
      onClick: () => deleteItem(item),
      icon: Trash,
      variant: 'danger'
    }
  ];

  // Filtrar ações com base nas permissões
  const allowedActions = actions.filter(action => 
    can(resource, action.action)
  );

  if (allowedActions.length === 0) return null;

  return (
    <div className="actions">
      {allowedActions.map(action => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`btn ${action.variant || 'primary'}`}
        >
          <action.icon />
          {action.label}
        </button>
      ))}
    </div>
  );
};

// Uso
<DynamicActions resource="tickets" item={ticket} />
<DynamicActions resource="client_users" item={user} />
```

---

## 🧪 **Testes**

```javascript
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../store/authStore';

describe('usePermissions', () => {
  it('admin-org tem todas as permissões', () => {
    useAuthStore.setState({
      user: { role: 'admin-org', permissions: [] }
    });

    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.can('tickets', 'create')).toBe(true);
    expect(result.current.can('users', 'delete')).toBe(true);
  });

  it('verifica permissões específicas', () => {
    useAuthStore.setState({
      user: {
        role: 'client-user',
        permissions: [
          { resource: 'tickets', action: 'create' },
          { resource: 'tickets', action: 'read' }
        ]
      }
    });

    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.can('tickets', 'create')).toBe(true);
    expect(result.current.can('tickets', 'delete')).toBe(false);
  });
});
```

---

## ✅ **Checklist de Implementação**

- [ ] Importar hook `usePermissions`
- [ ] Substituir verificações de `user.role` por `can()` ou `hasRole()`
- [ ] Adicionar `<ProtectedRoute>` em rotas privadas
- [ ] Usar `<CanAccess>` para elementos condicionais
- [ ] Testar com diferentes roles
- [ ] Atualizar testes unitários

---

## 🚀 **Próximos Passos**

1. Atualizar componentes existentes
2. Criar página de gestão de roles (admin)
3. Implementar auditoria de acessos
4. Adicionar notificações de permissões negadas
