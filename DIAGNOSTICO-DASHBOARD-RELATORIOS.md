# Diagnóstico: Dashboard de Relatórios Vazio

## Data: 2026-03-09

## Problema Relatado

No portal da organização existem dois tickets criados (um pelo cliente e outro pela organização), mas o dashboard de relatórios não mostra nenhuma informação - todos os cards mostram 0 ou NaN.

## Causa Raiz

O dashboard de relatórios busca dados da tabela `time_tracking`, que só contém registros quando há **tempo trabalhado** nos tickets.

### Como Funciona:

1. **Tickets são criados** → Salvos na tabela `tickets` ✅
2. **Agente inicia timer** → Cria registro em `time_tracking` com `status='running'`
3. **Agente para timer** → Atualiza registro com `status='stopped'` e `totalSeconds`
4. **Dashboard busca dados** → Consulta `time_tracking` onde `status='stopped'`

### O Problema:

Se os tickets foram criados mas **nenhum timer foi iniciado e parado**, a tabela `time_tracking` estará vazia, resultando em:
- Total de Horas: 0
- Tickets Trabalhados: 0
- Usuários Ativos: 0
- Todos os gráficos vazios

## Verificação

### Passo 1: Verificar se há tickets

```sql
SELECT COUNT(*) FROM tickets;
```

**Resultado esperado:** 2 (os dois tickets criados)

### Passo 2: Verificar se há time tracking

```sql
SELECT COUNT(*) FROM time_tracking WHERE status = 'stopped';
```

**Resultado esperado:** 0 (nenhum timer foi parado)

### Passo 3: Executar script de diagnóstico

```bash
# Conectar ao PostgreSQL
psql -U postgres -d tdesk

# Executar script
\i backend/verificar-time-tracking.sql
```

## Solução

### Opção 1: Trabalhar nos Tickets (Recomendado)

Para que o dashboard mostre dados, é necessário:

1. **No portal da organização:**
   - Abrir um dos tickets
   - Ir à seção "Tempo de Trabalho" (sidebar direita)
   - Clicar em "Iniciar" para começar o timer
   - Trabalhar no ticket (ou aguardar alguns segundos)
   - Clicar em "Parar" para finalizar o timer

2. **Recarregar o dashboard:**
   - Ir para "Relatórios" → "Dashboard"
   - Os dados devem aparecer agora

### Opção 2: Criar Dados de Teste (Para Desenvolvimento)

Se quiser popular o dashboard com dados de teste:

```sql
-- Inserir tempo de trabalho de teste
-- Substitua os UUIDs pelos IDs reais dos seus tickets e usuários

INSERT INTO time_tracking (
  id,
  "ticketId",
  "userId",
  "organizationId",
  "startTime",
  "endTime",
  "totalSeconds",
  status,
  "createdAt",
  "updatedAt"
) VALUES
-- Ticket 1: 2 horas de trabalho
(
  gen_random_uuid(),
  'UUID_DO_TICKET_1',
  'UUID_DO_USUARIO',
  'UUID_DA_ORGANIZACAO',
  NOW() - INTERVAL '2 hours',
  NOW(),
  7200, -- 2 horas em segundos
  'stopped',
  NOW(),
  NOW()
),
-- Ticket 2: 1.5 horas de trabalho
(
  gen_random_uuid(),
  'UUID_DO_TICKET_2',
  'UUID_DO_USUARIO',
  'UUID_DA_ORGANIZACAO',
  NOW() - INTERVAL '1.5 hours',
  NOW(),
  5400, -- 1.5 horas em segundos
  'stopped',
  NOW(),
  NOW()
);
```

### Opção 3: Modificar Dashboard para Mostrar Tickets Sem Tempo

Se quiser que o dashboard mostre tickets mesmo sem tempo trabalhado, seria necessário modificar o controller para buscar dados da tabela `tickets` em vez de `time_tracking`.

**Não recomendado** porque o dashboard é especificamente para **relatórios de tempo trabalhado**, não para estatísticas gerais de tickets.

## Comportamento Esperado

### Dashboard de Relatórios:
- ✅ Mostra apenas tickets com tempo trabalhado
- ✅ Calcula horas baseado em timers parados
- ✅ Exibe produtividade dos usuários
- ✅ Mostra distribuição de tempo por cliente

### Para Ver Todos os Tickets:
- Use a página "Tickets" (lista todos os tickets)
- Use filtros para ver tickets por status
- Dashboard de relatórios é específico para análise de tempo

## Teste Completo

### 1. Criar Tempo de Trabalho:

```bash
# No portal da organização:
1. Login como agente/admin
2. Abrir ticket TKT-20260309-XXXX
3. Sidebar direita → "Tempo de Trabalho"
4. Clicar "Iniciar"
5. Aguardar 30 segundos
6. Clicar "Parar"
7. Confirmar que tempo foi salvo
```

### 2. Verificar Dashboard:

```bash
# No portal da organização:
1. Ir para "Relatórios" → "Dashboard"
2. Verificar cards:
   - Total de Horas: deve mostrar ~0.01h
   - Tickets Trabalhados: deve mostrar 1
   - Usuários Ativos: deve mostrar 1
3. Verificar gráficos:
   - Devem aparecer com dados
```

### 3. Verificar no Banco:

```sql
-- Ver o registro criado
SELECT 
  t."ticketNumber",
  tt."totalSeconds",
  ROUND(tt."totalSeconds"::numeric / 3600, 2) as horas,
  tt.status,
  u.name as usuario
FROM time_tracking tt
INNER JOIN tickets t ON tt."ticketId" = t.id
INNER JOIN organization_users u ON tt."userId" = u.id
WHERE tt.status = 'stopped'
ORDER BY tt."createdAt" DESC
LIMIT 5;
```

## Checklist de Validação

- [ ] Verificar que tickets existem na tabela `tickets`
- [ ] Verificar que tabela `time_tracking` está vazia
- [ ] Iniciar timer em um ticket
- [ ] Parar timer após alguns segundos
- [ ] Verificar que registro foi criado em `time_tracking`
- [ ] Recarregar dashboard de relatórios
- [ ] Verificar que dados aparecem nos cards
- [ ] Verificar que gráficos são exibidos
- [ ] Testar com segundo ticket

## Arquivos Envolvidos

### Frontend:
- `portalOrganizaçãoTenant/src/pages/ReportsDashboard.jsx` - Dashboard de relatórios
- `portalOrganizaçãoTenant/src/services/reportsService.js` - Serviço de API
- `portalOrganizaçãoTenant/src/components/TimeTracker.jsx` - Componente de timer

### Backend:
- `backend/src/modules/reports/reportsController.js` - Controller de relatórios
- `backend/src/modules/timeTracking/timeTrackingController.js` - Controller de time tracking
- `backend/src/modules/timeTracking/timeTrackingModel.js` - Modelo TimeTracking

### Banco de Dados:
- Tabela: `tickets` - Tickets criados
- Tabela: `time_tracking` - Tempo trabalhado (fonte dos relatórios)
- Tabela: `organization_users` - Usuários que trabalham

## Notas Importantes

### Por Que o Dashboard Está Vazio?

O dashboard de relatórios é especificamente para **análise de tempo trabalhado**, não para estatísticas gerais de tickets. Ele responde perguntas como:
- Quanto tempo foi gasto em cada ticket?
- Quais usuários são mais produtivos?
- Como o tempo está distribuído entre clientes?
- Qual a evolução do tempo ao longo dos dias?

### Diferença Entre Páginas:

| Página | Fonte de Dados | Mostra |
|--------|----------------|--------|
| **Tickets** | Tabela `tickets` | Todos os tickets (com ou sem tempo) |
| **Dashboard de Relatórios** | Tabela `time_tracking` | Apenas tickets com tempo trabalhado |
| **Relatórios de Horas** | Tabela `time_tracking` | Análises detalhadas de tempo |

### Quando o Dashboard Mostra Dados?

✅ Quando há registros em `time_tracking` com `status='stopped'`  
❌ Não mostra tickets sem tempo trabalhado  
❌ Não mostra timers ativos (apenas parados)  
❌ Não mostra tickets apenas criados  

## Conclusão

✅ **Comportamento está correto!**

O dashboard de relatórios está funcionando como esperado. Ele mostra dados apenas quando há **tempo trabalhado** registrado. Para ver dados no dashboard:

1. Inicie e pare timers nos tickets
2. Ou insira dados de teste no banco
3. Recarregue o dashboard

**Não é um bug** - é o comportamento esperado de um dashboard de análise de tempo trabalhado.

## Próximos Passos

1. **Trabalhar nos tickets** para gerar dados reais
2. **Ou criar dados de teste** para desenvolvimento
3. **Documentar** para usuários que dashboard só mostra tickets com tempo
4. **Considerar** adicionar mensagem explicativa quando dashboard está vazio
