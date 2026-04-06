# Implementação de Sidebar Multi-Contexto no Desktop-Agent

## Objetivo

Implementar sidebars diferentes no desktop-agent baseadas no tipo de usuário (Organização vs Cliente) com controle de acesso e permissões, replicando a funcionalidade dos portais web.

## Arquitetura

### 1. SidebarManager (Novo Componente)

Arquivo: `desktop-agent/src/renderer/components/SidebarManager.js`

Responsabilidades:
- Gerenciar renderização de sidebars diferentes
- Controlar acesso baseado em permissões
- Filtrar itens de menu por role e permissões
- Atualizar sidebar quando contexto mudar

### 2. Tipos de Sidebar

#### Sidebar Organização
Baseada em: `portalOrganizaçãoTenant/src/components/Sidebar.jsx`

Itens de menu:
- Dashboard
- Novo Ticket
- Tickets
- Catálogo de Serviços
- Base de Conhecimento
- Minhas Tarefas (To-Do)
- Inventário
- Notificações
- Configurações

Permissões verificadas:
- `dashboard.view`
- `tickets.create`
- `tickets.view`
- `catalog.view`
- `knowledge.view`
- `inventory.view`

#### Sidebar Cliente
Baseada em: `portalClientEmpresa/src/components/Sidebar.jsx`

Itens de menu:
- Início
- Catálogo de Serviços
- Minhas Solicitações
- Minhas Tarefas
- Base de Conhecimento
- Meus Equipamentos
- Notificações
- Organização (apenas para client-admin)
- Configurações

Sem permissões específicas (todos os clientes têm acesso)

## Sistema de Permissões

### Verificação de Permissões

```javascript
hasPermission(permission) {
  // Sem permissão específica = todos podem acessar
  if (!permission) return true;
  
  // Verificar permissão exata
  if (this.permissions.includes(permission)) return true;
  
  // Verificar wildcard (ex: tickets.* permite tickets.view, tickets.create)
  const wildcardPermission = permission.split('.')[0] + '.*';
  if (this.permissions.includes(wildcardPermission)) return true;
  
  // Admin tem todas as permissões
  if (this.permissions.includes('*')) return true;
  
  return false;
}
```

### Filtro de Menu

```javascript
filterByPermission(items) {
  return items.filter(item => this.hasPermission(item.permission));
}
```

## Integração com app.js

### 1. Importação

```javascript
import { sidebarManager } from './components/SidebarManager.js';
```

### 2. Inicialização no Login

Na função `updateUIForContext(context)`:

```javascript
sidebarManager.initialize({
  user: state.user,
  context: context,
  permissions: context.permissions || []
});
```

### 3. Atualização no Context Switch

A função `switchContext()` já chama `updateUIForContext()`, que reinicializa o sidebar automaticamente.

## Fluxo de Funcionamento

### Login

1. Usuário faz login e seleciona contexto
2. `completeLogin()` é chamado
3. `updateUIForContext()` inicializa o sidebarManager
4. Sidebar apropriada é renderizada baseada em:
   - `context.contextType` (organization ou client)
   - `user.role` (org-admin, org-technician, client-admin, client-user)
   - `context.permissions` (array de permissões)

### Context Switch

1. Usuário troca de contexto
2. `switchContext()` é chamado
3. Novo contexto é carregado do backend
4. `updateUIForContext()` reinicializa o sidebarManager
5. Nova sidebar é renderizada

## Estrutura de Dados

### Context Object

```javascript
{
  contextId: 1,
  contextType: 'organization', // ou 'client'
  organizationId: 1,
  organizationName: 'Organização Principal',
  clientId: null, // ou ID do cliente
  clientName: null, // ou nome do cliente
  role: 'org-admin', // ou org-technician, client-admin, client-user
  permissions: [
    'dashboard.view',
    'tickets.*',
    'catalog.view',
    // ...
  ]
}
```

### User Object

```javascript
{
  id: 1,
  name: 'Admin Organização',
  email: 'admin@organizacao.com',
  role: 'org-admin',
  userType: 'organization' // ou 'client'
}
```

## Ícones SVG

O SidebarManager inclui ícones SVG para cada tipo de menu:
- dashboard
- home
- ticket
- file-plus
- shopping-cart
- shopping-bag
- check-square
- book
- hard-drive
- bell
- settings
- building

## Badges

Badges são adicionados automaticamente para:
- **Tickets/Minhas Solicitações**: Mostra número de tickets abertos
- **Notificações**: Mostra número de notificações não lidas

## Responsividade

O sidebar mantém a funcionalidade de:
- Colapsar/expandir (desktop)
- Overlay mobile
- Ícones quando colapsado
- Labels quando expandido

## Testes

Para testar:

1. **Login como Organização**:
   ```
   Email: admin@organizacao.com
   Password: Admin@123
   Tipo: Organização
   ```
   
   Deve mostrar: Dashboard, Novo Ticket, Tickets, Catálogo, etc.

2. **Login como Cliente**:
   ```
   Email: cliente@empresa.com
   Password: Cliente@123
   Tipo: Cliente
   ```
   
   Deve mostrar: Início, Catálogo de Serviços, Minhas Solicitações, etc.

3. **Context Switch**:
   - Fazer login com usuário que tem múltiplos contextos
   - Trocar entre contextos
   - Verificar se sidebar muda apropriadamente

## Arquivos Modificados

1. **Novo**: `desktop-agent/src/renderer/components/SidebarManager.js`
2. **Modificado**: `desktop-agent/src/renderer/app.js`
   - Adicionada importação do sidebarManager
   - Modificada função `updateUIForContext()` para inicializar sidebar

## Próximos Passos

1. ✅ Implementar SidebarManager
2. ✅ Integrar com app.js
3. ⏳ Testar com diferentes tipos de usuário
4. ⏳ Implementar páginas específicas para clientes (Minhas Solicitações, Meus Equipamentos)
5. ⏳ Implementar controle de acesso nas páginas (não apenas no menu)
6. ⏳ Adicionar permissões granulares no backend

## Controle de Acesso nas Páginas

Além do menu, é necessário implementar controle de acesso nas próprias páginas:

```javascript
// Exemplo de verificação de acesso em uma página
function showTicketsPage() {
  if (!sidebarManager.hasPermission('tickets.view')) {
    showNotification('Você não tem permissão para acessar esta página', 'error');
    showPage('dashboard');
    return;
  }
  
  // Renderizar página de tickets
  // ...
}
```

## Status

✅ **IMPLEMENTADO** - Sidebar multi-contexto com controle de permissões

## Data
15 de Março de 2026
