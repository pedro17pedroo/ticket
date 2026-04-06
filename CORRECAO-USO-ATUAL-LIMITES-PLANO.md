# Correção: Uso Atual e Limites do Plano

## Data: 2026-04-06

## Problema Identificado

### Sintoma
- Seção "Uso Atual" mostra limites incorretos após upgrade
- Exemplo: Mostra "0/7 usuários" quando deveria mostrar "0/100 usuários" após upgrade
- Limites não atualizam mesmo após mudança de plano
- Percentagens de uso incorretas

### Causa Raiz
O controller `getCurrentOrganizationSubscription` tinha dois problemas críticos:

1. **Dados Hardcoded**: Retornava valores fixos (0) em vez de buscar dados reais
2. **TODOs Não Implementados**: Queries para contar usuários, clientes e tickets não estavam implementadas

**Código Problemático:**
```javascript
// TODO: Implementar queries reais para obter uso atual
const usage = {
  current: {
    users: 0,  // ❌ HARDCODED
    clients: 0,  // ❌ HARDCODED
    ticketsThisMonth: 0,  // ❌ HARDCODED
    storageUsedGB: 0  // ❌ HARDCODED
  }
};
```

Resultado: Sempre mostrava 0/X independente do uso real ou do plano.

## Solução Implementada

### 1. Queries Reais para Uso Atual

Implementadas queries para buscar dados reais do banco:

```javascript
// Contar usuários ativos da organização
const usersCount = await User.count({
  where: { 
    organizationId,
    status: { [Op.ne]: 'deleted' }
  }
});

// Contar clientes ativos da organização
const clientsCount = await Client.count({
  where: { 
    organizationId,
    isActive: true
  }
});

// Contar tickets criados este mês
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const ticketsThisMonth = await Ticket.count({
  where: {
    organizationId,
    createdAt: { [Op.gte]: startOfMonth }
  }
});
```

### 2. Limites do Plano Corretos

Agora usa os limites do plano atual da subscrição:

```javascript
const plan = subscription.plan;

// Calcular percentagens usando limites do plano ATUAL
if (plan.maxUsers && plan.maxUsers > 0) {
  usage.percentages.users = Math.round((usersCount / plan.maxUsers) * 100);
}

if (plan.maxClients && plan.maxClients > 0) {
  usage.percentages.clients = Math.round((clientsCount / plan.maxClients) * 100);
}

if (plan.maxTicketsPerMonth && plan.maxTicketsPerMonth > 0) {
  usage.percentages.tickets = Math.round((ticketsThisMonth / plan.maxTicketsPerMonth) * 100);
}
```

### 3. Logs de Debug

Adicionado log detalhado para facilitar debug:

```javascript
console.log('[SubscriptionController] Returning subscription data:', {
  subscriptionId: subscription.id,
  planId: subscription.planId,
  planName: plan.name,
  status: subscription.status,
  usage: usage.current,
  limits: {
    maxUsers: plan.maxUsers,
    maxClients: plan.maxClients,
    maxTicketsPerMonth: plan.maxTicketsPerMonth,
    maxStorageGB: plan.maxStorageGB
  }
});
```

## Fluxo Completo Corrigido

### Antes do Upgrade
1. Subscrição com plano Starter
2. Limites: 7 usuários, 50 clientes, 100 tickets/mês
3. Uso: 0 usuários, 0 clientes, 0 tickets
4. Mostra: "0/7 usuários", "0/50 clientes", "0/100 tickets"

### Após Upgrade para Professional
1. Pagamento processado
2. Backend atualiza: `planId = 2` (Professional)
3. Frontend recarrega dados
4. Backend busca plano Professional:
   - maxUsers: 100
   - maxClients: 500
   - maxTicketsPerMonth: 1000
5. Backend conta uso real:
   - users: 0
   - clients: 0
   - ticketsThisMonth: 0
6. Backend calcula percentagens com novos limites
7. ✅ Frontend mostra: "0/100 usuários", "0/500 clientes", "0/1000 tickets"

### Com Uso Real
Se a organização tem:
- 5 usuários criados
- 20 clientes cadastrados
- 15 tickets este mês

Plano Professional (limites):
- maxUsers: 100
- maxClients: 500
- maxTicketsPerMonth: 1000

Frontend mostra:
- ✅ "5/100 usuários" (5%)
- ✅ "20/500 clientes" (4%)
- ✅ "15/1000 tickets" (1.5%)

## Estrutura de Dados Retornada

```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": 123,
      "organizationId": 456,
      "planId": 2,
      "status": "active",
      "amount": 75000,
      "currentPeriodStart": "2026-04-06",
      "currentPeriodEnd": "2026-05-06",
      "trialEndsAt": null,
      "isInTrial": false,
      "trialDaysRemaining": 0
    },
    "plan": {
      "id": 2,
      "name": "Professional",
      "displayName": "Professional",
      "monthlyPrice": 75000,
      "maxUsers": 100,
      "maxClients": 500,
      "maxTicketsPerMonth": 1000,
      "maxStorageGB": 50
    },
    "usage": {
      "current": {
        "users": 5,
        "clients": 20,
        "ticketsThisMonth": 15,
        "storageUsedGB": 0
      },
      "percentages": {
        "users": 5,
        "clients": 4,
        "tickets": 1,
        "storage": 0
      }
    }
  }
}
```

## Verificação de Limites nos Middlewares

Os middlewares agora usam os limites corretos do plano:

### checkUserLimit
```javascript
const result = await PlanService.canAddUsers(organizationId, quantity);
// Busca subscription → plan → maxUsers
// Compara com contagem real de usuários
```

### checkClientLimit
```javascript
const result = await PlanService.canAddClients(organizationId, quantity);
// Busca subscription → plan → maxClients
// Compara com contagem real de clientes
```

### checkTicketLimit
```javascript
const result = await PlanService.canCreateTickets(organizationId, quantity);
// Busca subscription → plan → maxTicketsPerMonth
// Compara com contagem de tickets este mês
```

## Como Testar

### Teste 1: Verificar Uso Atual
1. Criar alguns usuários, clientes e tickets
2. Acessar página de subscrição
3. Verificar seção "Uso Atual"
4. ✅ Deve mostrar contagens reais, não zeros

### Teste 2: Verificar Limites Após Upgrade
1. Anotar limites do plano atual
2. Fazer upgrade para plano superior
3. Aguardar página recarregar
4. Verificar seção "Uso Atual"
5. ✅ Limites devem ser do novo plano
6. ✅ Uso deve ser o mesmo (contagem real)

### Teste 3: Verificar Logs Backend
1. Fazer requisição para `/api/subscriptions/current`
2. Verificar logs do backend:
```
[SubscriptionController] Returning subscription data: {
  subscriptionId: 123,
  planId: 2,
  planName: 'Professional',
  status: 'active',
  usage: { users: 5, clients: 20, ticketsThisMonth: 15, storageUsedGB: 0 },
  limits: { maxUsers: 100, maxClients: 500, maxTicketsPerMonth: 1000, maxStorageGB: 50 }
}
```

### Teste 4: Verificar Restrições
1. Criar usuários até atingir limite do plano
2. Tentar criar mais um usuário
3. ✅ Deve retornar erro 402 com mensagem de limite excedido
4. Fazer upgrade para plano superior
5. Tentar criar usuário novamente
6. ✅ Deve permitir (novo limite maior)

## Arquivo Modificado

**backend/src/modules/subscriptions/subscriptionController.js**
- Função `getCurrentOrganizationSubscription`
- Implementadas queries reais para:
  - Contar usuários ativos
  - Contar clientes ativos
  - Contar tickets do mês atual
- Cálculo de percentagens usando limites do plano atual
- Log detalhado de dados retornados

## Benefícios da Correção

### Antes (QUEBRADO)
- ❌ Sempre mostrava 0/X independente do uso real
- ❌ Limites não atualizavam após upgrade
- ❌ Impossível saber uso real do sistema
- ❌ Percentagens sempre 0%
- ❌ Usuário não sabia quando estava próximo do limite

### Depois (CORRIGIDO)
- ✅ Mostra contagens reais de uso
- ✅ Limites atualizam automaticamente após upgrade
- ✅ Usuário vê exatamente quanto está usando
- ✅ Percentagens corretas (ex: 5% de 100 usuários)
- ✅ Alertas visuais quando próximo do limite (>75% = laranja, >90% = vermelho)
- ✅ Decisões informadas sobre quando fazer upgrade

## Próximas Melhorias

### 1. Armazenamento (Storage)
Atualmente retorna 0. Implementar:
```javascript
const { Attachment } = await import('../models/index.js');

const attachments = await Attachment.findAll({
  where: { organizationId },
  attributes: [[sequelize.fn('SUM', sequelize.col('size')), 'totalSize']]
});

const totalBytes = attachments[0]?.totalSize || 0;
const storageUsedGB = totalBytes / (1024 * 1024 * 1024);
```

### 2. Cache de Uso
Para melhor performance:
- Cachear contagens por 5-10 minutos
- Invalidar cache quando criar/deletar recursos
- Usar Redis para cache distribuído

### 3. Histórico de Uso
- Salvar snapshots diários de uso
- Gráficos de tendência
- Previsão de quando atingirá limites

### 4. Alertas Proativos
- Email quando atingir 75% do limite
- Email quando atingir 90% do limite
- Sugestão automática de upgrade

## Status

✅ Queries reais implementadas
✅ Limites do plano corretos
✅ Percentagens calculadas corretamente
✅ Logs de debug adicionados
✅ Uso atualiza após upgrade
⚠️ Storage ainda retorna 0 (TODO)
⚠️ Considerar implementar cache
⚠️ Considerar alertas proativos
