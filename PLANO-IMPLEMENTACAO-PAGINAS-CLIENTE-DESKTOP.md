# Plano de Implementação - Páginas Cliente no Desktop-Agent

## Objetivo
Garantir que todos os menus e páginas do desktop-agent funcionem conforme o portal cliente empresa, com funcionalidades completas.

## Status Atual

### Páginas Existentes no Desktop-Agent:
1. ✅ **dashboard** - Dashboard com estatísticas
2. ✅ **tickets** - Lista de tickets (precisa adaptação para clientes)
3. ✅ **catalog** - Catálogo de serviços
4. ✅ **knowledge** - Base de conhecimento
5. ✅ **info** - Informações do sistema (precisa virar "Meus Equipamentos")
6. ✅ **notifications** - Notificações
7. ✅ **settings** - Configurações

### Páginas que Faltam:
1. ❌ **my-requests** - Minhas Solicitações (tickets do cliente)
2. ❌ **todos** - Minhas Tarefas (To-Do List)
3. ❌ **my-assets** - Meus Equipamentos (inventário do cliente)
4. ❌ **hours-bank** - Bolsa de Horas

## Análise das Páginas do Portal Cliente

### 1. My Requests (Minhas Solicitações)
**Funcionalidades:**
- Lista de tickets/solicitações do cliente
- Filtros por status (novo, em progresso, resolvido, etc.)
- Busca por nome, ID, ticket number
- Filtros avançados (data, tipo)
- Paginação
- Cards com informações do ticket
- Badge de origem (email, catálogo, manual)
- Link para ver detalhes do ticket

**Diferença da página Tickets:**
- Tickets: visão de organização (todos os tickets)
- My Requests: visão de cliente (apenas seus tickets)

### 2. TodoList (Minhas Tarefas)
**Funcionalidades:**
- Vista Kanban (A Fazer, Em Progresso, Concluído)
- Vista Lista
- Drag & Drop para mover tarefas
- Criar/Editar/Excluir tarefas
- Prioridades (baixa, média, alta)
- Data limite
- Colaboradores
- Busca e filtros
- Cores personalizadas

### 3. MyAssets (Meus Equipamentos)
**Funcionalidades:**
- Estatísticas (total, ativos, software, licenças)
- Lista de equipamentos do cliente
- Filtros por tipo (desktop, laptop, servidor, etc.)
- Busca por nome, hostname, modelo
- Cards com informações do equipamento
- Status (ativo, inativo, manutenção)
- Link para detalhes do equipamento
- Informações de antivírus

### 4. HoursBank (Bolsa de Horas)
**Funcionalidades:**
- Resumo (total disponível, consumido, contratado)
- Lista de pacotes de horas
- Progresso visual
- Histórico de transações
- Tipos de transação (adição, consumo, ajuste)
- Datas de início e fim
- Permite crédito negativo

## Estratégia de Implementação

### Fase 1: Adaptar Páginas Existentes
1. **tickets → my-requests** (para clientes)
   - Manter página tickets para organização
   - Criar lógica para mostrar apenas tickets do cliente
   - Adaptar filtros e visualização

2. **info → my-assets** (para clientes)
   - Manter página info para organização
   - Criar visualização de equipamentos do cliente
   - Adaptar para mostrar apenas assets do usuário

### Fase 2: Criar Páginas Novas
1. **todos** - Minhas Tarefas
   - Implementar vista Kanban
   - Implementar vista Lista
   - Drag & Drop
   - CRUD de tarefas

2. **hours-bank** - Bolsa de Horas
   - Resumo de horas
   - Lista de pacotes
   - Histórico de transações

### Fase 3: Integração com Backend
1. Criar/adaptar endpoints no backend
2. Implementar chamadas API no desktop-agent
3. Tratamento de erros
4. Loading states

### Fase 4: Testes
1. Testar como usuário de organização
2. Testar como usuário cliente
3. Testar troca de contexto
4. Testar todas as funcionalidades

## Arquivos a Modificar/Criar

### HTML (desktop-agent/src/renderer/index.html)
- Adicionar página `todosPage`
- Adicionar página `hoursBankPage`
- Adaptar página `ticketsPage` para clientes
- Adaptar página `infoPage` para clientes

### JavaScript (desktop-agent/src/renderer/app.js)
- Implementar funções para carregar todos
- Implementar funções para carregar hours bank
- Adaptar funções de tickets para clientes
- Adaptar funções de assets para clientes
- Implementar navegação condicional baseada em userType

### CSS (desktop-agent/src/renderer/styles.css)
- Estilos para Kanban board
- Estilos para cards de tarefas
- Estilos para drag & drop
- Estilos para progress bars

## Prioridades

1. **ALTA**: Adaptar sidebar para mostrar menus corretos
2. **ALTA**: Implementar my-requests (tickets do cliente)
3. **MÉDIA**: Implementar todos (tarefas)
4. **MÉDIA**: Adaptar my-assets (equipamentos)
5. **BAIXA**: Implementar hours-bank

## Próximos Passos Imediatos

1. ✅ Criar sidebarManager.js com menus diferentes
2. ✅ Integrar sidebarManager no app.js
3. ⏳ Criar página todosPage no HTML
4. ⏳ Implementar lógica de todos no app.js
5. ⏳ Criar página hoursBankPage no HTML
6. ⏳ Implementar lógica de hours bank no app.js
7. ⏳ Adaptar página tickets para clientes
8. ⏳ Adaptar página info para clientes

## Notas Técnicas

- Usar mesma estrutura de API do portal cliente
- Manter compatibilidade com sistema de contextos
- Implementar loading states
- Implementar tratamento de erros
- Usar mesmos ícones e estilos do portal

## Status

🔄 **EM PROGRESSO** - Sidebar implementada, faltam páginas específicas

## Data
15 de Março de 2026
