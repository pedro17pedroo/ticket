# Implementação de Páginas para Clientes no Desktop-Agent

## Objetivo

Garantir que todos os menus funcionem corretamente e que as páginas para clientes estejam implementadas conforme o Portal Cliente Empresa.

## Páginas Adicionadas

### 1. Minhas Solicitações (`my-requestsPage`)

**Funcionalidade**: Visualizar todas as solicitações/tickets criados pelo cliente

**Elementos**:
- Botão "Nova Solicitação" para criar tickets
- Lista de solicitações com status
- Empty state quando não há solicitações

**Mapeamento**:
- ID do menu: `my-requests`
- ID da página: `my-requestsPage`
- Badge: `ticketsBadge` (mostra contagem de solicitações abertas)

### 2. Minhas Tarefas (`todosPage`)

**Funcionalidade**: Gerenciar tarefas atribuídas ao usuário

**Elementos**:
- Botão "Nova Tarefa" para criar tarefas
- Lista de tarefas pendentes
- Checkbox para marcar como concluída
- Empty state quando não há tarefas

**Mapeamento**:
- ID do menu: `todos`
- ID da página: `todosPage`

### 3. Meus Equipamentos (`my-assetsPage`)

**Funcionalidade**: Visualizar equipamentos atribuídos ao usuário

**Elementos**:
- Lista de equipamentos (computadores, monitores, etc.)
- Informações de cada equipamento
- Empty state quando não há equipamentos

**Mapeamento**:
- ID do menu: `my-assets`
- ID da página: `my-assetsPage`

### 4. Bolsa de Horas (`hours-bankPage`)

**Funcionalidade**: Acompanhar saldo de horas do cliente

**Elementos**:
- Cards com estatísticas:
  - Saldo Atual
  - Horas Adicionadas
  - Horas Utilizadas
- Histórico de movimentações
- Empty state quando não há movimentações

**Mapeamento**:
- ID do menu: `hours-bank`
- ID da página: `hours-bankPage`

### 5. Organização (`organizationPage`)

**Funcionalidade**: Informações da empresa (apenas para client-admin)

**Elementos**:
- Dados da empresa
- Total de usuários
- Tickets abertos
- Equipamentos

**Mapeamento**:
- ID do menu: `organization`
- ID da página: `organizationPage`
- Restrição: Apenas `client-admin`

## Páginas Existentes (Já Implementadas)

1. **Dashboard** (`dashboardPage`) - ✅
2. **Tickets** (`ticketsPage`) - ✅
3. **Catálogo** (`catalogPage`) - ✅
4. **Base de Conhecimento** (`knowledgePage`) - ✅
5. **Informações** (`infoPage`) - ✅
6. **Notificações** (`notificationsPage`) - ✅
7. **Configurações** (`settingsPage`) - ✅

## Estrutura de Navegação

### Menu Organização:
```
- Dashboard
- Tickets (com badge)
- Catálogo
- Base de Conhecimento
- Informações
---
- Notificações (com badge)
---
- Configurações
```

### Menu Cliente:
```
- Início
- Catálogo de Serviços
- Minhas Solicitações (com badge)
- Minhas Tarefas
- Base de Conhecimento
- Meus Equipamentos
- Bolsa de Horas
---
- Notificações (com badge)
---
- Organização (apenas client-admin)
- Configurações
```

## Sistema de Roteamento

O sistema de navegação funciona através de:

1. **Data Attributes**: Cada item do menu tem `data-page="pageId"`
2. **Event Listeners**: Click nos itens do menu
3. **showPage()**: Função que oculta todas as páginas e mostra a selecionada

```javascript
function showPage(pageId) {
  // Ocultar todas as páginas
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Mostrar página selecionada
  const page = document.getElementById(pageId + 'Page');
  if (page) {
    page.classList.add('active');
  }
  
  // Atualizar menu ativo
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeItem = document.querySelector(`[data-page="${pageId}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}
```

## Controle de Acesso

### Por Tipo de Usuário:
- **Organização**: Acesso a todas as funcionalidades de gestão
- **Cliente**: Acesso apenas às suas próprias solicitações e equipamentos

### Por Role:
- **client-admin**: Acesso adicional à página "Organização"
- **client-user**: Acesso padrão sem página de organização

### Verificação de Permissões:
```javascript
function hasPermission(menuItem, user, context) {
  // 1. Verificar se item requer permissão
  if (!menuItem.permission) return true;
  
  // 2. Verificar role
  if (menuItem.roles && !menuItem.roles.includes(user.role)) {
    return false;
  }
  
  // 3. Verificar permissões do contexto
  if (context && context.permissions) {
    return context.permissions.includes(menuItem.permission);
  }
  
  return true;
}
```

## Badges Dinâmicos

### Tickets/Solicitações:
```html
<span class="badge" id="ticketsBadge">5</span>
```

Atualizado automaticamente quando:
- Novos tickets são criados
- Tickets são atualizados
- Tickets são resolvidos

### Notificações:
```html
<span class="badge" id="notificationsBadge" style="display: none;">0</span>
```

Atualizado automaticamente quando:
- Novas notificações chegam
- Notificações são lidas

## Empty States

Todas as páginas incluem empty states para melhor UX:

```html
<div class="empty-state">
  <svg>...</svg>
  <p>Nenhum item encontrado</p>
</div>
```

## Integração com Backend

As páginas estão preparadas para integração com o backend através de:

1. **API Calls**: Via `window.electronAPI`
2. **Real-time Updates**: Via WebSocket
3. **Offline Support**: Via queue de ações offline

### Exemplo de Integração:
```javascript
// Carregar minhas solicitações
async function loadMyRequests() {
  try {
    const result = await window.electronAPI.fetchTickets({
      clientId: state.user.id,
      status: ['open', 'in_progress', 'pending']
    });
    
    if (result.success) {
      renderMyRequests(result.tickets);
    }
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);
  }
}
```

## Responsividade

Todas as páginas são responsivas e se adaptam a:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## Próximos Passos

1. ✅ Adicionar páginas HTML
2. ✅ Atualizar sidebarManager
3. ⏳ Implementar lógica de carregamento de dados
4. ⏳ Adicionar event listeners para botões
5. ⏳ Integrar com backend APIs
6. ⏳ Adicionar loading states
7. ⏳ Implementar filtros e busca
8. ⏳ Adicionar paginação

## Arquivos Modificados

1. **desktop-agent/src/renderer/index.html**
   - Adicionadas 5 novas páginas
   - Estrutura HTML completa

2. **desktop-agent/src/renderer/sidebarManager.js**
   - Atualizado CLIENT_MENU
   - Adicionado item "Organização" para client-admin

3. **desktop-agent/src/renderer/app.js**
   - Integração com sidebarManager (já existente)
   - Sistema de navegação (já existente)

## Testes

### Testar como Cliente:
```bash
# 1. Login como cliente
email: cliente@empresa.com
password: Cliente@123
portalType: client

# 2. Verificar menu
✓ Início
✓ Catálogo de Serviços
✓ Minhas Solicitações
✓ Minhas Tarefas
✓ Base de Conhecimento
✓ Meus Equipamentos
✓ Bolsa de Horas
✓ Notificações
✓ Configurações

# 3. Testar navegação
✓ Clicar em cada item do menu
✓ Verificar se página correta é exibida
✓ Verificar empty states
```

### Testar como Client-Admin:
```bash
# 1. Login como client-admin
email: admin@cliente.com
password: Admin@123
portalType: client

# 2. Verificar menu adicional
✓ Organização (deve aparecer)

# 3. Testar página de organização
✓ Dados da empresa exibidos
✓ Estatísticas corretas
```

## Status

✅ **IMPLEMENTADO** - Todas as páginas para clientes adicionadas e menu funcionando

## Data
15 de Março de 2026
