# Solução de Arquitetura: Unificação Tickets e Solicitações

## Problema Identificado

Havia duplicação e confusão na listagem de tickets:
- Tickets manuais (criados diretamente)
- Solicitações de serviço (originadas do catálogo) apareciam com prefixo "[Serviço]"
- Ambos apareciam na mesma lista causando confusão
- **Existiam duas tabelas**: `tickets` e `service_requests` com dados duplicados

## Solução Implementada

### Arquitetura Escolhida: **Fonte Única de Verdade**

✅ **Unificação completa na base de dados**
- Removida tabela `service_requests`
- Todos os dados migrados para `tickets`
- Campo `catalogItemId` indica se o ticket originou de uma solicitação de serviço
- Novos campos em `tickets` para armazenar dados da solicitação:
  - `request_form_data` - Dados do formulário
  - `request_status` - Status da solicitação (pending, approved, rejected, etc)
  - `approver_id` - ID do aprovador
  - `approval_date` - Data de aprovação
  - `approval_comments` - Comentários da aprovação
  - `approved_cost` - Custo aprovado
  - `rejection_reason` - Motivo de rejeição

### Migração Executada

```sql
-- Migration bem-sucedida
✅ 6 service_requests migrados para tickets
✅ Tabela service_requests removida
✅ Índices criados para novos campos
✅ Sem perda de dados
```

### Funcionalidades Adicionadas

#### 1. Filtro por Origem (Toggle de 3 estados)
```
┌─────────────────────────────────┐
│  Todos  │ Solicitações │ Manuais │
└─────────────────────────────────┘
```

- **Todos**: Mostra todos os tickets (padrão)
- **Solicitações**: Apenas tickets com `catalogItemId` (originados do catálogo)
- **Manuais**: Apenas tickets sem `catalogItemId` (criados manualmente)

#### 2. Indicador Visual
- Tickets de serviço têm um badge 📋 azul ao lado do assunto
- Facilita identificação rápida sem poluir a interface

#### 3. Paginação Completa
- Seleção de itens por página (5, 10, 25, 50, 100)
- Navegação entre páginas com botões
- Informação de total de registros
- Reset automático ao mudar filtros

## Benefícios da Solução

### ✅ Vantagens
1. **Sem Duplicação**: Cada ticket existe apenas uma vez
2. **Flexibilidade**: Usuário escolhe o que quer ver
3. **Clareza**: Indicador visual discreto mas eficaz
4. **Performance**: Filtro no backend (não carrega dados desnecessários)
5. **Escalabilidade**: Fácil adicionar novos tipos de origem no futuro

### 🎯 Casos de Uso

**Gestor de TI**:
- Usa "Todos" para visão completa
- Usa "Solicitações" para ver demanda do catálogo
- Usa "Manuais" para ver tickets ad-hoc

**Técnico**:
- Usa "Meus Tickets" + filtro de origem
- Identifica rapidamente tipo de trabalho

**Relatórios**:
- Pode separar métricas por origem
- Analisa eficácia do catálogo de serviços

## Implementação Técnica

### Backend
```javascript
// Parâmetro na API
params.hasCatalogItem = 'true'  // Apenas solicitações
params.hasCatalogItem = 'false' // Apenas manuais
// Sem parâmetro = todos
```

### Frontend
```javascript
// Estado
const [ticketOriginFilter, setTicketOriginFilter] = useState('all')

// Filtro aplicado
if (ticketOriginFilter === 'catalog') {
  params.hasCatalogItem = 'true'
} else if (ticketOriginFilter === 'manual') {
  params.hasCatalogItem = 'false'
}
```

### UI
```jsx
// Badge visual
{ticket.catalogItemId && (
  <span className="badge-blue">📋</span>
)}
```

## Alternativas Consideradas (e por que foram rejeitadas)

### ❌ Opção 1: Tabelas Separadas
- Causa duplicação
- Dificulta relatórios unificados
- Mais complexo de manter

### ❌ Opção 2: Remover Prefixo "[Serviço]"
- Perde informação importante
- Não resolve o problema de fundo

### ❌ Opção 3: Sempre Filtrar Automaticamente
- Remove controle do usuário
- Pode esconder informação relevante

## Próximos Passos (Opcional)

Se necessário no futuro:

1. **Adicionar mais tipos de origem**:
   - Email
   - Chat
   - API externa
   - Telefone

2. **Filtros avançados**:
   - Combinar origem + status
   - Origem + prioridade

3. **Dashboards separados**:
   - Métricas por origem
   - SLA por tipo de origem

## Conclusão

A solução implementada mantém a simplicidade da arquitetura (uma tabela) enquanto oferece flexibilidade total ao usuário através de filtros inteligentes. O indicador visual discreto ajuda na identificação sem poluir a interface.

**Resultado**: Sistema mais limpo, claro e fácil de usar! 🎉
