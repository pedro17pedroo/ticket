# Implementação de Relatórios de Horas

**Data:** 08/03/2026  
**Status:** ✅ IMPLEMENTADO

## Visão Geral

Sistema completo de relatórios de horas trabalhadas, permitindo análises detalhadas por ticket, usuário, cliente e período.

## Relatórios Implementados

### 1. Relatório de Horas por Ticket
**Endpoint:** `GET /api/reports/hours-by-ticket`

**Descrição:** Mostra quantas horas foram consumidas em cada ticket e quantas pessoas foram envolvidas.

**Query Parameters:**
- `startDate` (opcional): Data inicial (formato ISO)
- `endDate` (opcional): Data final (formato ISO)
- `ticketId` (opcional): ID de um ticket específico
- `status` (opcional): Status do ticket (aberto, em_andamento, fechado, etc)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "ticket": {
        "id": "uuid",
        "ticketNumber": "TKT-001",
        "subject": "Problema no sistema",
        "status": "em_andamento",
        "priority": "alta",
        "client": {
          "id": "uuid",
          "name": "Cliente ABC"
        }
      },
      "totalUsers": 3,
      "totalSessions": 15,
      "totalSeconds": 18000,
      "totalHours": 5,
      "totalMinutes": 0,
      "formattedTime": "5h 0m"
    }
  ],
  "summary": {
    "totalTickets": 10,
    "totalHours": 50,
    "totalUsers": 5
  }
}
```

---

### 2. Relatório de Horas por Usuário
**Endpoint:** `GET /api/reports/hours-by-user`

**Descrição:** Mostra o total de horas trabalhadas por cada usuário.

**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `userId` (opcional): ID de um usuário específico

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@empresa.com",
        "avatar": "url",
        "role": "agent"
      },
      "totalTickets": 25,
      "totalSessions": 80,
      "totalSeconds": 144000,
      "totalHours": 40,
      "totalMinutes": 0,
      "formattedTime": "40h 0m"
    }
  ],
  "summary": {
    "totalUsers": 5,
    "totalHours": 200,
    "totalTickets": 100
  }
}
```

---

### 3. Relatório Mensal por Usuário
**Endpoint:** `GET /api/reports/monthly-by-user`

**Descrição:** Agrupa horas por mês para cada usuário.

**Query Parameters:**
- `year` (opcional): Ano para filtrar (ex: 2026)
- `userId` (opcional): ID de um usuário específico

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "userName": "João Silva",
      "userEmail": "joao@empresa.com",
      "year": 2026,
      "month": 3,
      "monthName": "março",
      "totalTickets": 15,
      "totalSessions": 45,
      "totalSeconds": 108000,
      "totalHours": 30,
      "totalMinutes": 0,
      "formattedTime": "30h 0m"
    }
  ],
  "summary": {
    "totalMonths": 3,
    "totalHours": 90
  }
}
```

---

### 4. Relatório de Horas por Cliente
**Endpoint:** `GET /api/reports/hours-by-client`

**Descrição:** Mostra horas consumidas por cada cliente empresa.

**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `clientId` (opcional): ID de um cliente específico

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "client": {
        "id": "uuid",
        "name": "Cliente ABC",
        "email": "contato@clienteabc.com",
        "phone": "+244 900 000 000",
        "address": "Luanda, Angola"
      },
      "totalTickets": 50,
      "totalUsers": 8,
      "totalSessions": 150,
      "totalSeconds": 360000,
      "totalHours": 100,
      "totalMinutes": 0,
      "formattedTime": "100h 0m"
    }
  ],
  "summary": {
    "totalClients": 10,
    "totalHours": 500,
    "totalTickets": 200
  }
}
```

---

### 5. Relatório Diário de Horas
**Endpoint:** `GET /api/reports/daily`

**Descrição:** Agrupa horas por dia, com filtros por usuário e cliente.

**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `userId` (opcional): Filtrar por usuário
- `clientId` (opcional): Filtrar por cliente

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-03-08",
      "totalTickets": 10,
      "totalUsers": 5,
      "totalSessions": 25,
      "totalSeconds": 28800,
      "totalHours": 8,
      "totalMinutes": 0,
      "formattedTime": "8h 0m"
    }
  ],
  "summary": {
    "totalDays": 20,
    "totalHours": 160,
    "averageHoursPerDay": "8.00"
  }
}
```

---

### 6. Resumo Básico por Cliente
**Endpoint:** `GET /api/reports/client-summary`

**Descrição:** Informações consolidadas de cada cliente (tickets + horas).

**Query Parameters:**
- `clientId` (opcional): ID de um cliente específico

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "client": {
        "id": "uuid",
        "name": "Cliente ABC",
        "email": "contato@clienteabc.com",
        "phone": "+244 900 000 000"
      },
      "tickets": {
        "total": 50,
        "open": 10,
        "inProgress": 15,
        "closed": 25
      },
      "timeTracking": {
        "totalUsersInvolved": 8,
        "totalSessions": 150,
        "totalSeconds": 360000,
        "totalHours": 100,
        "totalMinutes": 0,
        "formattedTime": "100h 0m"
      }
    }
  ],
  "summary": {
    "totalClients": 10,
    "totalHours": 500,
    "totalTickets": 200
  }
}
```

---

### 7. Relatório Detalhado de Ticket
**Endpoint:** `GET /api/reports/ticket/:ticketId/detailed`

**Descrição:** Mostra todas as sessões de tempo de um ticket específico.

**Resposta:**
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "ticketNumber": "TKT-001",
    "subject": "Problema no sistema",
    "status": "em_andamento"
  },
  "sessions": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@empresa.com",
        "avatar": "url"
      },
      "startTime": "2026-03-08T10:00:00Z",
      "endTime": "2026-03-08T12:00:00Z",
      "status": "stopped",
      "description": "Análise do problema",
      "totalSeconds": 7200,
      "totalHours": 2,
      "totalMinutes": 0,
      "formattedTime": "2h 0m",
      "pausedTime": 300
    }
  ],
  "summary": {
    "totalSessions": 15,
    "totalUsers": 3,
    "totalSeconds": 18000,
    "totalHours": 5,
    "totalMinutes": 0,
    "formattedTime": "5h 0m"
  }
}
```

---

## Permissões

Todos os relatórios requerem a permissão `reports.view`.

Para adicionar a permissão aos roles:

```sql
-- Adicionar permissão de relatórios para org-admin
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'org-admin' 
  AND p.resource = 'reports' 
  AND p.action = 'view'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Adicionar permissão de relatórios para org-manager
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'org-manager' 
  AND p.resource = 'reports' 
  AND p.action = 'view'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
```

---

## Estrutura de Arquivos

```
backend/src/modules/reports/
├── reportsController.js    # Controllers dos relatórios
└── reportsRoutes.js         # Rotas dos relatórios
```

---

## Casos de Uso

### 1. Faturamento por Cliente
Use `GET /api/reports/hours-by-client` para calcular quanto cobrar de cada cliente baseado nas horas trabalhadas.

### 2. Produtividade da Equipe
Use `GET /api/reports/hours-by-user` para avaliar a produtividade de cada membro da equipe.

### 3. Análise Mensal
Use `GET /api/reports/monthly-by-user` para relatórios mensais de horas trabalhadas.

### 4. Controle Diário
Use `GET /api/reports/daily` para acompanhamento diário das horas.

### 5. Análise de Ticket
Use `GET /api/reports/ticket/:ticketId/detailed` para ver detalhes de tempo de um ticket específico.

---

## Exemplos de Uso

### Exemplo 1: Relatório do mês atual
```bash
curl -X GET "http://localhost:4003/api/reports/monthly-by-user?year=2026" \
  -H "Authorization: Bearer TOKEN"
```

### Exemplo 2: Horas de um usuário específico
```bash
curl -X GET "http://localhost:4003/api/reports/hours-by-user?userId=UUID&startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer TOKEN"
```

### Exemplo 3: Resumo de um cliente
```bash
curl -X GET "http://localhost:4003/api/reports/client-summary?clientId=UUID" \
  -H "Authorization: Bearer TOKEN"
```

### Exemplo 4: Relatório diário da última semana
```bash
curl -X GET "http://localhost:4003/api/reports/daily?startDate=2026-03-01&endDate=2026-03-08" \
  -H "Authorization: Bearer TOKEN"
```

---

## Próximos Passos

1. ✅ Implementar backend dos relatórios
2. ⏳ Criar interface no portal da organização
3. ⏳ Adicionar exportação para PDF/Excel
4. ⏳ Implementar gráficos visuais
5. ⏳ Adicionar agendamento de relatórios automáticos

---

## Notas Técnicas

- Todos os cálculos de tempo são feitos em segundos e convertidos para horas/minutos
- As queries usam agregações SQL para melhor performance
- Suporte a filtros por data, usuário, cliente e ticket
- Respostas incluem sempre um resumo (summary) com totalizadores
