# Sistema de Relatórios de Horas

**Data:** 08/03/2026  
**Status:** ✅ IMPLEMENTADO

## Visão Geral

Sistema completo de relatórios para análise de horas trabalhadas em tickets, permitindo à organização ter visibilidade total sobre o tempo investido por usuários, tickets e clientes.

## Relatórios Disponíveis

### 1. Relatório de Horas por Ticket
**Endpoint:** `GET /api/reports/hours-by-ticket`

Mostra quantas horas foram consumidas em cada ticket e quantas pessoas foram envolvidas diretamente.

**Query Parameters:**
- `startDate` (opcional): Data inicial (formato ISO)
- `endDate` (opcional): Data final (formato ISO)
- `ticketId` (opcional): Filtrar por ticket específico
- `status` (opcional): Filtrar por status do ticket

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "ticketId": "uuid",
      "ticketNumber": "TKT-001",
      "ticketSubject": "Problema no sistema",
      "ticketStatus": "fechado",
      "ticketPriority": "alta",
      "clientId": "uuid",
      "clientName": "Empresa XYZ",
      "totalUsers": 3,
      "totalEntries": 15,
      "totalSeconds": 18000,
      "totalHours": 5.00,
      "totalMinutes": 300
    }
  ],
  "summary": {
    "totalTickets": 10,
    "totalHours": "50.00",
    "totalEntries": 150
  }
}
```

---

### 2. Relatório de Horas por Usuário (Mensal)
**Endpoint:** `GET /api/reports/hours-by-user`

Mostra as horas trabalhadas por cada usuário em um período específico.

**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `userId` (opcional): Filtrar por usuário específico
- `month` (opcional): Mês (1-12)
- `year` (opcional): Ano (ex: 2026)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "userName": "João Silva",
      "userEmail": "joao@empresa.com",
      "userRole": "org-agent",
      "totalTickets": 25,
      "totalEntries": 80,
      "totalSeconds": 144000,
      "totalHours": 40.00,
      "totalMinutes": 2400,
      "firstEntry": "2026-03-01T08:00:00Z",
      "lastEntry": "2026-03-31T18:00:00Z",
      "averageHoursPerTicket": "1.60"
    }
  ],
  "summary": {
    "totalUsers": 5,
    "totalHours": "200.00",
    "totalTickets": 125,
    "totalEntries": 400
  }
}
```

---

### 3. Relatório de Horas por Cliente/Empresa
**Endpoint:** `GET /api/reports/hours-by-client`

Mostra as horas consumidas por cada cliente.

**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `clientId` (opcional): Filtrar por cliente específico

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "clientId": "uuid",
      "clientName": "Empresa ABC",
      "totalUsers": 5,
      "totalTickets": 30,
      "totalEntries": 120,
      "totalSeconds": 216000,
      "totalHours": 60.00,
      "totalMinutes": 3600,
      "averageHoursPerTicket": "2.00"
    }
  ],
  "summary": {
    "totalClients": 10,
    "totalHours": "600.00",
    "totalTickets": 300,
    "totalEntries": 1200
  }
}
```

---

### 4. Relatório de Horas por Dia
**Endpoint:** `GET /api/reports/hours-by-day`

Mostra as horas trabalhadas por dia, com breakdown por usuário e/ou cliente.

**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `userId` (opcional): Filtrar por usuário
- `clientId` (opcional): Filtrar por cliente
- `groupBy` (opcional): `user` ou `client` para agrupar

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-03-08",
      "totalTickets": 5,
      "totalEntries": 20,
      "totalSeconds": 28800,
      "totalHours": 8.00,
      "totalMinutes": 480,
      "userId": "uuid",
      "userName": "João Silva"
    }
  ],
  "summary": {
    "totalDays": 20,
    "totalHours": "160.00",
    "totalTickets": 100,
    "totalEntries": 400,
    "averageHoursPerDay": "8.00"
  }
}
```

---

### 5. Resumo Básico por Cliente
**Endpoint:** `GET /api/reports/client-summary`

Visão geral simplificada das horas por cliente.

**Query Parameters:**
- `clientId` (opcional): Filtrar por cliente específico

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "clientId": "uuid",
      "clientName": "Empresa XYZ",
      "clientEmail": "contato@empresa.com",
      "totalTickets": 50,
      "openTickets": 10,
      "closedTickets": 40,
      "totalUsers": 5,
      "totalSeconds": 180000,
      "totalHours": 50.00,
      "averageHoursPerTicket": "1.00"
    }
  ],
  "summary": {
    "totalClients": 15,
    "totalTickets": 750,
    "totalHours": "750.00"
  }
}
```

---

### 6. Relatório Detalhado de Usuário
**Endpoint:** `GET /api/reports/user/:userId/detailed`

Detalhes completos das horas de um usuário específico.

**Path Parameters:**
- `userId` (obrigatório): ID do usuário

**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final

**Resposta:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@empresa.com",
    "role": "org-agent"
  },
  "data": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "ticketNumber": "TKT-001",
      "ticketSubject": "Problema no sistema",
      "clientName": "Empresa ABC",
      "startTime": "2026-03-08T09:00:00Z",
      "endTime": "2026-03-08T11:00:00Z",
      "totalSeconds": 7200,
      "totalHours": "2.00",
      "description": "Análise e correção do bug"
    }
  ],
  "summary": {
    "totalEntries": 50,
    "totalTickets": 20,
    "totalSeconds": 144000,
    "totalHours": 40.00,
    "averageHoursPerEntry": "0.80"
  }
}
```

## Permissões

Todos os endpoints requerem:
- Autenticação (`authenticate`)
- Permissão `reports:read` (via RBAC)

Roles com acesso:
- `org-admin` - Acesso total
- `org-manager` - Acesso total
- `org-agent` - Acesso limitado (apenas seus próprios dados)

## Casos de Uso

### 1. Análise de Produtividade
```bash
# Ver horas trabalhadas por usuário no mês atual
GET /api/reports/hours-by-user?month=3&year=2026
```

### 2. Faturamento por Cliente
```bash
# Ver total de horas consumidas por cliente
GET /api/reports/hours-by-client?startDate=2026-03-01&endDate=2026-03-31
```

### 3. Análise de Ticket Específico
```bash
# Ver detalhes de horas de um ticket
GET /api/reports/hours-by-ticket?ticketId=uuid
```

### 4. Relatório Diário
```bash
# Ver horas trabalhadas hoje por usuário
GET /api/reports/hours-by-day?startDate=2026-03-08&endDate=2026-03-08&groupBy=user
```

### 5. Resumo Executivo
```bash
# Visão geral de todos os clientes
GET /api/reports/client-summary
```

## Estrutura de Arquivos

```
backend/src/modules/reports/
├── reportsController.js    # Lógica dos relatórios
└── reportsRoutes.js         # Rotas e permissões
```

## Integração com Time Tracking

Os relatórios utilizam dados da tabela `time_tracking`:
- Apenas registros com `status = 'stopped'` são contabilizados
- `totalSeconds` armazena o tempo total trabalhado
- Suporta filtros por data, usuário, ticket e cliente

## Próximos Passos

1. ✅ Implementar endpoints de relatórios
2. ⏳ Criar interface no portal da organização
3. ⏳ Adicionar exportação para PDF/Excel
4. ⏳ Implementar gráficos e visualizações
5. ⏳ Adicionar relatórios agendados (envio por email)

## Notas Técnicas

- Queries otimizadas com agregações SQL
- Suporte a filtros múltiplos
- Formatação automática de horas/minutos
- Cálculos de médias e totais
- Agrupamento flexível por diferentes dimensões

---

**Implementado por:** Kiro AI  
**Data:** 08/03/2026
