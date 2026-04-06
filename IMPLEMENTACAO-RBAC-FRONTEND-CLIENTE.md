# Implementação RBAC no Frontend - Portal Cliente

## Objetivo

Ocultar menus, botões e funcionalidades quando o usuário não tiver as permissões necessárias no Portal Cliente Empresa.

## Alterações Realizadas

### 1. Sidebar.jsx - Filtrar Menus por Permissão

**Arquivo:** `portalClientEmpresa/src/components/Sidebar.jsx`

**Alterações:**
- Importado hook `usePermissions`
- Adicionado campo `permission` em cada item do menu
- Filtrado itens do menu baseado em permissões do usuário

**Permissões por Menu:**
- Início (Dashboard) - Sempre visível
- Catálogo de Serviços - `catalog.view`
- Minhas Solicitações - `tickets.view`
- Minhas Tarefas - Sempre visível
- Base de Conhecimento - `knowledge.view`
- Meus Equipamentos - `assets.view`
- Bolsa de Horas - `hours_bank.view`
- Desktop Agent - Sempre visível
- Organização - `directions.view` + Admin only

### 2. Organization.jsx - Filtrar Tabs por Permissão

**Arquivo:** `portalClientEmpresa/src/pages/Organization.jsx`

**Alterações:**
- Importado hook `usePermissions`
- Adicionado campo `permission` em cada tab
- Filtrado tabs baseado em permissões do usuário
- Adicionado mensagem quando não há tabs disponíveis
- Tab ativa inicial é a primeira com permissão

**Permissões por Tab:**
- Utilizadores - `client_users.view`
- Direções - `directions.view`
- Departamentos - `departments.view`
- Secções - `sections.view`

### 3. UsersTab.jsx - Ocultar Botões de Ação

**Arquivo:** `portalClientEmpresa/src/components/organization/UsersTab.jsx`

**Alterações Necessárias:**
- Importar hook `usePermissions`
- Ocultar botão "Novo Utilizador" se não tiver `client_users.create`
- Ocultar botão "Editar" se não tiver `client_users.update`
- Ocultar botão "Desativar" se não tiver `client_users.delete`

### 4. DirectionsTab.jsx, DepartmentsTab.jsx, SectionsTab.jsx

**Alterações Necessárias:**
- Importar hook `usePermissions`
- Ocultar botões de criar/editar/eliminar baseado em permissões
- Permissões necessárias:
  - Criar: `{resource}.create`
  - Editar: `{resource}.update`
  - Eliminar: `{resource}.delete`

## Mapeamento de Permissões

### Recursos e Ações

| Recurso | Ações Disponíveis | Descrição |
|---------|-------------------|-----------|
| `catalog` | view | Ver catálogo de serviços |
| `tickets` | view, create, update | Gerir tickets/solicitações |
| `knowledge` | view, read | Ver base de conhecimento |
| `assets` | view, read, read_all | Ver equipamentos |
| `hours_bank` | view | Ver bolsa de horas |
| `client_users` | view, read, create, update, delete | Gerir utilizadores cliente |
| `directions` | view, read, create, update, delete | Gerir direções |
| `departments` | view, read, create, update, delete | Gerir departamentos |
| `sections` | view, read, create, update, delete | Gerir secções |

### Roles e Permissões

#### client-admin
- Todas as permissões de visualização (view/read)
- Permissões de criação/edição/eliminação para:
  - client_users
  - directions
  - departments
  - sections
- Permissões de criação/edição para tickets

#### client-user
- Permissões de visualização (view/read) para:
  - catalog
  - tickets
  - knowledge
  - assets
  - hours_bank
- Permissão de criar tickets

## Hook usePermissions

### Métodos Disponíveis

```javascript
const {
  can,              // Verificar permissão específica
  canAny,           // Verificar se tem qualquer uma das permissões
  canAll,           // Verificar se tem todas as permissões
  hasRole,          // Verificar role
  isLevel,          // Verificar nível hierárquico
  getPermissions,   // Obter todas as permissões
  isAdmin,          // Verificar se é admin
  isClientAdmin,    // Verificar se é cliente admin
  canAccessSettings,// Verificar acesso a configurações
  user              // Dados do usuário
} = usePermissions()
```

### Exemplos de Uso

```javascript
// Verificar permissão simples
if (can('tickets', 'create')) {
  // Mostrar botão criar ticket
}

// Verificar múltiplas permissões (OR)
if (canAny([['tickets', 'update'], ['tickets', 'delete']])) {
  // Mostrar opções de gestão
}

// Verificar múltiplas permissões (AND)
if (canAll([['tickets', 'update'], ['comments', 'create']])) {
  // Permitir ação complexa
}

// Verificar role
if (hasRole('client-admin')) {
  // Funcionalidade apenas para admin
}

// Verificar se é admin
if (isClientAdmin) {
  // Funcionalidade admin
}
```

## Padrão de Implementação

### 1. Importar Hook

```javascript
import { usePermissions } from '../hooks/usePermissions'
```

### 2. Usar no Componente

```javascript
const MyComponent = () => {
  const { can, isClientAdmin } = usePermissions()
  
  // ... resto do código
}
```

### 3. Condicionar Renderização

```javascript
{/* Botão visível apenas com permissão */}
{can('resource', 'action') && (
  <button onClick={handleAction}>
    Ação
  </button>
)}

{/* Menu item visível apenas para admin */}
{isClientAdmin && (
  <MenuItem>Admin Only</MenuItem>
)}
```

## Próximos Passos

1. ✅ Sidebar - Filtrar menus
2. ✅ Organization - Filtrar tabs
3. ⏳ UsersTab - Ocultar botões de ação
4. ⏳ DirectionsTab - Ocultar botões de ação
5. ⏳ DepartmentsTab - Ocultar botões de ação
6. ⏳ SectionsTab - Ocultar botões de ação
7. ⏳ Outras páginas - Aplicar verificações conforme necessário

## Testes

### Cenários de Teste

1. **client-user** (permissões limitadas):
   - ✅ Deve ver apenas: Dashboard, Catálogo, Solicitações, Tarefas, Conhecimento, Equipamentos, Bolsa de Horas, Desktop Agent
   - ❌ Não deve ver: Organização

2. **client-admin** (permissões completas):
   - ✅ Deve ver todos os menus
   - ✅ Deve ver todas as tabs em Organização
   - ✅ Deve ver todos os botões de ação

3. **Sem permissões específicas**:
   - ❌ Menus/tabs/botões devem estar ocultos
   - ✅ Mensagem informativa deve aparecer quando aplicável

---
**Data:** 04/04/2026  
**Status:** Em Implementação  
**Desenvolvedor:** Kiro AI Assistant
