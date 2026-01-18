# 📋 Requirements: Portal Cliente - Visibilidade de Tickets via Email

**Spec ID:** client-portal-email-tickets-visibility  
**Status:** 🔴 Em Desenvolvimento  
**Prioridade:** Alta  
**Data de Criação:** 18 de Janeiro de 2026

---

## 🎯 Objetivo

Garantir que tickets criados via email apareçam no portal do cliente (http://localhost:5174/my-requests), junto com as solicitações do catálogo de serviços.

---

## 📖 Contexto

### Situação Atual

O portal do cliente possui a página "Minhas Solicitações" (`/my-requests`) que atualmente mostra:
- ✅ Solicitações criadas via catálogo de serviços (service_requests)
- ❌ Tickets criados via email **NÃO aparecem**

### Problema

Quando um cliente envia um email para o sistema:
1. Email é processado pelo `emailProcessor.js`
2. Ticket é criado na tabela `tickets` com `source = 'email'`
3. Ticket **NÃO** tem `service_request` associado
4. Portal do cliente busca apenas `service_requests` via endpoint `/api/catalog/requests`
5. Cliente não vê o ticket criado por email

### Arquitetura Atual

```
┌──────────────────────────────────┐
│     TICKETS (tabela principal)   │
│  ✓ Tickets de email              │
│  ✓ Tickets de catálogo           │
│  ✓ Tickets manuais               │
└──────────────────────────────────┘
              ↑
              │ (referência opcional)
              │
┌──────────────────────────────────┐
│  SERVICE_REQUESTS (auxiliar)     │
│  ✓ Apenas solicitações catálogo  │
│  ✓ Workflow de aprovação         │
└──────────────────────────────────┘
```

---

## 👥 User Stories

### US-1: Ver Tickets de Email
**Como** cliente  
**Quero** ver todos os meus tickets na página "Minhas Solicitações"  
**Para** acompanhar todas as minhas interações com o suporte, independente da origem

**Critérios de Aceitação:**
- [ ] Tickets criados por email aparecem na lista
- [ ] Tickets criados via catálogo continuam aparecendo
- [ ] Tickets criados manualmente (se aplicável) aparecem
- [ ] Ordenação por data (mais recente primeiro)
- [ ] Filtros funcionam para todos os tipos de ticket

### US-2: Identificar Origem do Ticket
**Como** cliente  
**Quero** identificar visualmente a origem de cada ticket  
**Para** saber se foi criado por email, catálogo ou outro meio

**Critérios de Aceitação:**
- [ ] Badge ou ícone indica a origem (email, catálogo, portal)
- [ ] Cor ou estilo diferente para cada origem
- [ ] Tooltip com informação adicional

### US-3: Filtrar por Origem
**Como** cliente  
**Quero** filtrar tickets por origem  
**Para** ver apenas tickets de email ou apenas do catálogo

**Critérios de Aceitação:**
- [ ] Filtro "Origem" com opções: Todos, Email, Catálogo, Portal
- [ ] Filtro persiste ao navegar entre páginas
- [ ] Contador de tickets por origem

### US-4: Ver Detalhes do Ticket de Email
**Como** cliente  
**Quero** clicar em um ticket de email e ver seus detalhes  
**Para** acompanhar o progresso e adicionar comentários

**Critérios de Aceitação:**
- [ ] Redireciona para `/tickets/:id`
- [ ] Mostra assunto, descrição, status, prioridade
- [ ] Mostra histórico de comentários
- [ ] Permite adicionar novos comentários
- [ ] Mostra anexos (se houver)

---

## 🔧 Requisitos Técnicos

### RT-1: Backend - Endpoint Unificado

**Endpoint:** `GET /api/catalog/requests`

**Comportamento Atual:**
```javascript
// Busca apenas service_requests
const serviceRequests = await ServiceRequest.findAll({
  where: { organizationId, userId }
});
```

**Comportamento Esperado:**
```javascript
// 1. Buscar service_requests
const serviceRequests = await ServiceRequest.findAll(...);

// 2. Buscar tickets diretos (sem service_request)
const directTickets = await Ticket.findAll({
  where: {
    organizationId,
    requesterClientUserId: userId,
    // Tickets sem service_request associado
  }
});

// 3. Combinar e normalizar
const allRequests = [...serviceRequests, ...directTicketsAsRequests];
```

### RT-2: Frontend - Componente MyRequests

**Arquivo:** `portalClientEmpresa/src/pages/MyRequests.jsx`

**Mudanças Necessárias:**
- [ ] Aceitar tickets diretos no formato normalizado
- [ ] Renderizar ícone/badge de origem
- [ ] Adicionar filtro de origem
- [ ] Manter compatibilidade com service_requests existentes

### RT-3: Normalização de Dados

**Formato Unificado:**
```javascript
{
  id: string,                    // ID do service_request ou ticket
  organizationId: string,
  catalogItemId: string | null,  // null para tickets de email
  requesterId: string,
  status: string,                // Mapeado do status do ticket
  ticketId: string,              // ID do ticket
  createdAt: Date,
  updatedAt: Date,
  catalogItem: {                 // null ou objeto
    id: string | null,
    name: string,                // "Ticket sem título" para emails
    icon: string                 // "Mail" para emails
  },
  ticket: {
    id: string,
    ticketNumber: string,
    status: string
  },
  requester: {
    name: string,
    email: string
  },
  isDirect: boolean,             // true para tickets diretos
  source: string                 // 'email', 'portal', 'catalog'
}
```

### RT-4: Mapeamento de Status

```javascript
const statusMap = {
  'novo': 'approved',
  'aguardando_aprovacao': 'pending_approval',
  'em_progresso': 'in_progress',
  'aguardando_cliente': 'in_progress',
  'resolvido': 'completed',
  'fechado': 'completed',
  'cancelado': 'cancelled'
};
```

---

## 🎨 Requisitos de UI/UX

### RU-1: Card de Ticket de Email

**Visual:**
```
┌─────────────────────────────────────┐
│ 📧 Email                            │
│ ─────────────────────────────────── │
│ Problema com impressora             │
│ #TKT-20260118-1234                  │
│                                     │
│ Status: Em Progresso                │
│ Criado: 18/01/2026 10:30           │
│                                     │
│ [Ver Ticket]                        │
└─────────────────────────────────────┘
```

### RU-2: Card de Solicitação de Catálogo

**Visual:**
```
┌─────────────────────────────────────┐
│ 🛒 Catálogo                         │
│ ─────────────────────────────────── │
│ Novo Computador                     │
│ #TKT-20260118-5678                  │
│                                     │
│ Status: Aguardando Aprovação        │
│ Criado: 18/01/2026 09:15           │
│                                     │
│ [Ver Detalhes]                      │
└─────────────────────────────────────┘
```

### RU-3: Filtros

```
┌─────────────────────────────────────┐
│ Pesquisar: [____________] 🔍        │
│                                     │
│ Origem: [Todos ▼]                   │
│ Status: [Todos ▼]                   │
│ Data: [__/__/____] até [__/__/____] │
│                                     │
│ [Limpar Filtros]                    │
└─────────────────────────────────────┘
```

---

## 🔒 Requisitos de Segurança

### RS-1: Visibilidade de Tickets

**Regra:** Cliente só pode ver seus próprios tickets

**Validação Backend:**
```javascript
// Verificar se o ticket pertence ao cliente
if (ticket.requesterClientUserId !== req.user.id) {
  return res.status(403).json({ error: 'Acesso negado' });
}
```

### RS-2: Estrutura Organizacional

**Regra:** Respeitar hierarquia de direções/departamentos/seções

**Validação:**
- Cliente vê tickets da sua estrutura organizacional
- Cliente vê tickets onde é o requester
- Cliente vê tickets onde está como watcher

---

## 📊 Requisitos de Performance

### RP-1: Paginação

- [ ] Máximo 20 tickets por página
- [ ] Lazy loading ao rolar
- [ ] Cache de resultados (5 minutos)

### RP-2: Queries Otimizadas

- [ ] Usar índices em `requesterClientUserId`
- [ ] Usar índices em `organizationId`
- [ ] Limitar includes apenas ao necessário

### RP-3: Tempo de Resposta

- [ ] Endpoint responde em < 500ms
- [ ] Frontend renderiza em < 200ms
- [ ] Filtros aplicam em < 100ms

---

## ✅ Critérios de Aceitação Gerais

### Funcional

- [ ] Tickets de email aparecem na lista
- [ ] Tickets de catálogo continuam funcionando
- [ ] Filtros funcionam para todos os tipos
- [ ] Paginação funciona corretamente
- [ ] Busca funciona em todos os campos
- [ ] Ordenação por data funciona

### Técnico

- [ ] Código segue padrões do projeto
- [ ] Testes unitários passam
- [ ] Testes de integração passam
- [ ] Sem regressões em funcionalidades existentes
- [ ] Performance mantida ou melhorada

### UX

- [ ] Interface intuitiva
- [ ] Feedback visual claro
- [ ] Mensagens de erro amigáveis
- [ ] Loading states apropriados
- [ ] Responsivo (mobile, tablet, desktop)

---

## 🚫 Fora do Escopo

- Criar tickets via portal do cliente (já existe)
- Editar tickets (apenas comentários)
- Deletar tickets
- Exportar lista de tickets
- Notificações push
- Integração com WhatsApp

---

## 📚 Referências

- #[[file:backend/src/modules/catalog/catalogControllerEnhanced.js]]
- #[[file:portalClientEmpresa/src/pages/MyRequests.jsx]]
- #[[file:backend/src/modules/tickets/ticketModel.js]]
- #[[file:EMAIL-ROUTING-SYSTEM-EXPLAINED.md]]

---

## 📝 Notas

- Manter compatibilidade com código existente
- Não quebrar funcionalidade de service_requests
- Considerar migração futura para endpoint unificado `/api/tickets/my-tickets`
- Documentar mudanças no CHANGELOG.md

---

**Aprovado por:** Pendente  
**Data de Aprovação:** Pendente
