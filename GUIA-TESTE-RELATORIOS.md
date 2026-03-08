# Guia de Teste - Relatórios de Horas

**Data:** 08/03/2026

## Pré-requisitos

1. Backend rodando na porta 4003
2. Usuário autenticado com role `org-admin` ou `org-manager`
3. Dados de time tracking existentes no banco

## Testes Básicos

### 1. Testar Relatório de Horas por Ticket

```bash
# Obter token de autenticação
TOKEN="seu_token_aqui"

# Testar relatório de horas por ticket
curl -X GET "http://localhost:4003/api/reports/hours-by-ticket" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Com filtros
curl -X GET "http://localhost:4003/api/reports/hours-by-ticket?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": [...],
  "summary": {
    "totalTickets": 10,
    "totalHours": 50,
    "totalUsers": 5
  }
}
```

---

### 2. Testar Relatório de Horas por Usuário

```bash
curl -X GET "http://localhost:4003/api/reports/hours-by-user" \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por período
curl -X GET "http://localhost:4003/api/reports/hours-by-user?startDate=2026-03-01&endDate=2026-03-08" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Testar Relatório Mensal

```bash
# Relatório do ano atual
curl -X GET "http://localhost:4003/api/reports/monthly-by-user?year=2026" \
  -H "Authorization: Bearer $TOKEN"

# Relatório de um usuário específico
curl -X GET "http://localhost:4003/api/reports/monthly-by-user?year=2026&userId=UUID_DO_USUARIO" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Testar Relatório por Cliente

```bash
curl -X GET "http://localhost:4003/api/reports/hours-by-client" \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por cliente específico
curl -X GET "http://localhost:4003/api/reports/hours-by-client?clientId=UUID_DO_CLIENTE" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Testar Relatório Diário

```bash
# Últimos 7 dias
curl -X GET "http://localhost:4003/api/reports/daily?startDate=2026-03-01&endDate=2026-03-08" \
  -H "Authorization: Bearer $TOKEN"

# Por usuário
curl -X GET "http://localhost:4003/api/reports/daily?userId=UUID_DO_USUARIO&startDate=2026-03-01" \
  -H "Authorization: Bearer $TOKEN"

# Por cliente
curl -X GET "http://localhost:4003/api/reports/daily?clientId=UUID_DO_CLIENTE&startDate=2026-03-01" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Testar Resumo por Cliente

```bash
# Todos os clientes
curl -X GET "http://localhost:4003/api/reports/client-summary" \
  -H "Authorization: Bearer $TOKEN"

# Cliente específico
curl -X GET "http://localhost:4003/api/reports/client-summary?clientId=UUID_DO_CLIENTE" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7. Testar Relatório Detalhado de Ticket

```bash
curl -X GET "http://localhost:4003/api/reports/ticket/UUID_DO_TICKET/detailed" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testes de Permissão

### Testar sem autenticação (deve retornar 401)

```bash
curl -X GET "http://localhost:4003/api/reports/hours-by-ticket"
```

**Resposta esperada:** `401 Unauthorized`

---

### Testar com usuário sem permissão (deve retornar 403)

```bash
# Login como agent (sem permissão de relatórios)
curl -X GET "http://localhost:4003/api/reports/hours-by-ticket" \
  -H "Authorization: Bearer $TOKEN_AGENT"
```

**Resposta esperada:** `403 Forbidden`

---

## Testes de Validação

### 1. Testar com datas inválidas

```bash
curl -X GET "http://localhost:4003/api/reports/hours-by-ticket?startDate=data-invalida" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Testar com UUID inválido

```bash
curl -X GET "http://localhost:4003/api/reports/ticket/uuid-invalido/detailed" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Verificar Logs do Backend

```bash
# Terminal onde o backend está rodando
# Deve mostrar:
# GET /api/reports/hours-by-ticket 200
# GET /api/reports/hours-by-user 200
# etc.
```

---

## Checklist de Testes

- [ ] Relatório de horas por ticket funciona
- [ ] Relatório de horas por usuário funciona
- [ ] Relatório mensal funciona
- [ ] Relatório por cliente funciona
- [ ] Relatório diário funciona
- [ ] Resumo por cliente funciona
- [ ] Relatório detalhado de ticket funciona
- [ ] Filtros por data funcionam
- [ ] Filtros por usuário funcionam
- [ ] Filtros por cliente funcionam
- [ ] Permissões estão corretas (401/403)
- [ ] Respostas incluem summary
- [ ] Tempos estão formatados corretamente (horas e minutos)

---

## Troubleshooting

### Erro 404 - Rota não encontrada
- Verificar se o backend foi reiniciado após adicionar as rotas
- Verificar se as rotas foram registradas em `backend/src/routes/index.js`

### Erro 403 - Permissão negada
- Executar script: `node backend/src/scripts/add-reports-permission.js`
- Verificar se o usuário tem role `org-admin` ou `org-manager`

### Erro 500 - Erro interno
- Verificar logs do backend
- Verificar se as associações dos modelos estão corretas
- Verificar se há dados de time tracking no banco

### Dados vazios
- Criar algumas sessões de time tracking primeiro
- Usar o cronômetro em alguns tickets
- Verificar se os filtros de data não estão muito restritivos

---

## Próximos Passos

Após validar que todos os endpoints funcionam:

1. Criar interface no portal da organização
2. Adicionar gráficos visuais
3. Implementar exportação para PDF/Excel
4. Adicionar agendamento de relatórios automáticos
