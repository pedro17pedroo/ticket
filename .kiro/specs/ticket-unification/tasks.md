# ✅ Tasks: Unificação de Tickets

**Spec ID:** ticket-unification  
**Status:** 🔴 Não Iniciado  
**Data:** 18 de Janeiro de 2026

---

## 📋 Resumo

**Total de Tasks:** 25  
**Estimativa Total:** 6-8 horas  
**Prioridade:** Alta

---

## 🎯 Fase 1: Preparação e Backup (30min)

### ✅ TASK-1: Criar Backup Completo
**Estimativa:** 10min  
**Prioridade:** Crítica  
**Dependências:** Nenhuma

**Descrição:**
Criar backup completo da base de dados antes de qualquer alteração.

**Checklist:**
- [ ] Executar `pg_dump` da base de dados
- [ ] Salvar em `backend/backups/pre-unification_YYYYMMDD.dump`
- [ ] Verificar integridade do backup
- [ ] Documentar comando de restore

**Comando:**
```bash
PGPASSWORD="root" pg_dump -h localhost -U postgres -d tatuticket -F c -f "backend/backups/pre-unification_$(date +%Y%m%d_%H%M%S).dump"
```

---

### ✅ TASK-2: Analisar Dados Existentes
**Estimativa:** 20min  
**Prioridade:** Alta  
**Dependências:** TASK-1

**Descrição:**
Analisar quantos service_requests existem e seu estado.

**Checklist:**
- [ ] Contar total de service_requests
- [ ] Contar service_requests com ticket
- [ ] Contar service_requests sem ticket
- [ ] Identificar campos únicos de service_requests
- [ ] Documentar findings

**Queries:**
```sql
-- Total de service_requests
SELECT COUNT(*) FROM service_requests;

-- Com ticket
SELECT COUNT(*) FROM service_requests WHERE ticket_id IS NOT NULL;

-- Sem ticket
SELECT COUNT(*) FROM service_requests WHERE ticket_id IS NULL;

-- Por status
SELECT status, COUNT(*) FROM service_requests GROUP BY status;
```

---

## 🔧 Fase 2: Migração de Schema (1h)

### ✅ TASK-3: Criar Migração SQL
**Estimativa:** 30min  
**Prioridade:** Crítica  
**Dependências:** TASK-2

**Descrição:**
Criar arquivo de migração para adicionar campos em tickets.

**Arquivo:** `backend/migrations/20260118000001-unify-tickets-remove-service-requests.sql`

**Checklist:**
- [ ] Adicionar campos de aprovação
- [ ] Adicionar campos de formulário
- [ ] Adicionar campos de custo/prazo
- [ ] Criar índices necessários
- [ ] Testar em ambiente de dev

**Campos a Adicionar:**
```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_comments TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES organization_users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES organization_users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimated_delivery_days INTEGER;
```

---

### ✅ TASK-4: Executar Migração de Schema
**Estimativa:** 10min  
**Prioridade:** Crítica  
**Dependências:** TASK-3

**Descrição:**
Executar migração no banco de dados.

**Checklist:**
- [ ] Executar migração em dev
- [ ] Verificar campos criados
- [ ] Verificar índices criados
- [ ] Testar rollback (se necessário)
- [ ] Documentar resultado

**Comando:**
```bash
psql -U postgres -d tatuticket -f backend/migrations/20260118000001-unify-tickets-remove-service-requests.sql
```

---

### ✅ TASK-5: Migrar Dados de service_requests
**Estimativa:** 20min  
**Prioridade:** Crítica  
**Dependências:** TASK-4

**Descrição:**
Migrar dados existentes de service_requests para tickets.

**Checklist:**
- [ ] Atualizar tickets existentes com dados de service_requests
- [ ] Criar tickets para service_requests órfãos
- [ ] Validar integridade dos dados
- [ ] Contar registros migrados
- [ ] Documentar resultado

**Query:**
```sql
-- Atualizar tickets existentes
UPDATE tickets t
SET 
  approval_status = CASE sr.status
    WHEN 'pending_approval' THEN 'pending'
    WHEN 'approved' THEN 'approved'
    WHEN 'rejected' THEN 'rejected'
    ELSE NULL
  END,
  approval_comments = sr.approval_comments,
  approved_by = sr.approved_by,
  approved_at = sr.approved_at,
  rejected_by = sr.rejected_by,
  rejected_at = sr.rejected_at,
  rejection_reason = sr.rejection_reason,
  form_data = sr.form_data,
  estimated_cost = sr.estimated_cost,
  estimated_delivery_days = sr.estimated_delivery_days,
  requires_approval = true
FROM service_requests sr
WHERE t.id = sr.ticket_id;
```

---

## 💻 Fase 3: Atualização de Backend (2h)

### ✅ TASK-6: Atualizar Modelo Ticket
**Estimativa:** 20min  
**Prioridade:** Alta  
**Dependências:** TASK-4

**Descrição:**
Adicionar novos campos no modelo Sequelize.

**Arquivo:** `backend/src/modules/tickets/ticketModel.js`

**Checklist:**
- [ ] Adicionar campos de aprovação
- [ ] Adicionar campos de formulário
- [ ] Adicionar validações
- [ ] Atualizar comentários
- [ ] Testar modelo

---

### ✅ TASK-7: Criar Método createTicketFromCatalog
**Estimativa:** 30min  
**Prioridade:** Alta  
**Dependências:** TASK-6

**Descrição:**
Criar método para criar ticket diretamente do catálogo.

**Arquivo:** `backend/src/modules/catalog/catalogControllerEnhanced.js`

**Checklist:**
- [ ] Validar dados do formulário
- [ ] Criar ticket com campos apropriados
- [ ] Aplicar roteamento automático
- [ ] Enviar notificações
- [ ] Adicionar logs
- [ ] Testar método

---

### ✅ TASK-8: Criar Endpoint de Aprovação
**Estimativa:** 20min  
**Prioridade:** Alta  
**Dependências:** TASK-6

**Descrição:**
Criar endpoint para aprovar tickets.

**Arquivo:** `backend/src/modules/tickets/ticketController.js`

**Rota:** `PATCH /api/tickets/:id/approve`

**Checklist:**
- [ ] Validar permissões
- [ ] Atualizar status do ticket
- [ ] Registrar aprovação
- [ ] Enviar notificações
- [ ] Adicionar logs
- [ ] Testar endpoint

---

### ✅ TASK-9: Criar Endpoint de Rejeição
**Estimativa:** 20min  
**Prioridade:** Alta  
**Dependências:** TASK-6

**Descrição:**
Criar endpoint para rejeitar tickets.

**Arquivo:** `backend/src/modules/tickets/ticketController.js`

**Rota:** `PATCH /api/tickets/:id/reject`

**Checklist:**
- [ ] Validar permissões
- [ ] Atualizar status do ticket
- [ ] Registrar rejeição
- [ ] Enviar notificações
- [ ] Adicionar logs
- [ ] Testar endpoint

---

### ✅ TASK-10: Criar Endpoint Unificado getMyTickets
**Estimativa:** 30min  
**Prioridade:** Alta  
**Dependências:** TASK-6

**Descrição:**
Criar endpoint unificado para listar tickets do cliente.

**Arquivo:** `backend/src/modules/tickets/ticketController.js`

**Rota:** `GET /api/tickets/my-tickets`

**Checklist:**
- [ ] Filtrar por requester
- [ ] Aplicar filtros (status, source)
- [ ] Incluir relações necessárias
- [ ] Implementar paginação
- [ ] Ordenar por data
- [ ] Testar endpoint

---

### ✅ TASK-11: Atualizar Rotas
**Estimativa:** 10min  
**Prioridade:** Alta  
**Dependências:** TASK-7, TASK-8, TASK-9, TASK-10

**Descrição:**
Adicionar novas rotas e marcar antigas como deprecated.

**Arquivo:** `backend/src/routes/index.js`

**Checklist:**
- [ ] Adicionar rota POST /catalog/items/:id/ticket
- [ ] Adicionar rota GET /tickets/my-tickets
- [ ] Adicionar rota PATCH /tickets/:id/approve
- [ ] Adicionar rota PATCH /tickets/:id/reject
- [ ] Marcar rotas antigas como deprecated
- [ ] Atualizar documentação de rotas

---

### ✅ TASK-12: Atualizar Serviço de Notificações
**Estimativa:** 10min  
**Prioridade:** Média  
**Dependências:** TASK-8, TASK-9

**Descrição:**
Adicionar notificações para aprovação/rejeição.

**Arquivo:** `backend/src/modules/notifications/notificationService.js`

**Checklist:**
- [ ] Criar notifyTicketApproved
- [ ] Criar notifyTicketRejected
- [ ] Testar notificações

---

## 🎨 Fase 4: Atualização de Frontend (2h)

### ✅ TASK-13: Atualizar MyRequests.jsx
**Estimativa:** 30min  
**Prioridade:** Alta  
**Dependências:** TASK-10

**Descrição:**
Atualizar componente para usar endpoint unificado.

**Arquivo:** `portalClientEmpresa/src/pages/MyRequests.jsx`

**Checklist:**
- [ ] Mudar de /catalog/requests para /tickets/my-tickets
- [ ] Atualizar estrutura de dados
- [ ] Adicionar badge de origem (email, catálogo, manual)
- [ ] Manter filtros funcionando
- [ ] Testar componente

---

### ✅ TASK-14: Atualizar ServiceCatalog.jsx
**Estimativa:** 20min  
**Prioridade:** Alta  
**Dependências:** TASK-7

**Descrição:**
Atualizar para criar ticket diretamente.

**Arquivo:** `portalClientEmpresa/src/pages/ServiceCatalog.jsx`

**Checklist:**
- [ ] Mudar de /catalog/items/:id/request para /catalog/items/:id/ticket
- [ ] Atualizar mensagens de sucesso
- [ ] Atualizar redirecionamento
- [ ] Testar criação

---

### ✅ TASK-15: Criar Componente de Aprovação
**Estimativa:** 40min  
**Prioridade:** Alta  
**Dependências:** TASK-8, TASK-9

**Descrição:**
Criar componente para aprovar/rejeitar tickets.

**Arquivo:** `portalOrganizaçãoTenant/src/components/TicketApproval.jsx`

**Checklist:**
- [ ] Criar UI de aprovação
- [ ] Adicionar campo de comentários
- [ ] Adicionar campo de motivo de rejeição
- [ ] Integrar com API
- [ ] Adicionar confirmações
- [ ] Testar componente

---

### ✅ TASK-16: Atualizar TicketDetail.jsx (Cliente)
**Estimativa:** 15min  
**Prioridade:** Média  
**Dependências:** TASK-13

**Descrição:**
Mostrar dados do formulário se for ticket de catálogo.

**Arquivo:** `portalClientEmpresa/src/pages/TicketDetail.jsx`

**Checklist:**
- [ ] Mostrar form_data se existir
- [ ] Mostrar status de aprovação
- [ ] Mostrar custo estimado
- [ ] Mostrar prazo estimado
- [ ] Testar visualização

---

### ✅ TASK-17: Atualizar TicketDetail.jsx (Organização)
**Estimativa:** 15min  
**Prioridade:** Média  
**Dependências:** TASK-15

**Descrição:**
Adicionar botões de aprovação/rejeição.

**Arquivo:** `portalOrganizaçãoTenant/src/pages/TicketDetail.jsx`

**Checklist:**
- [ ] Adicionar botões de aprovação/rejeição
- [ ] Mostrar histórico de aprovação
- [ ] Validar permissões
- [ ] Testar funcionalidade

---

## 🧪 Fase 5: Testes (1.5h)

### ✅ TASK-18: Testes Unitários - Backend
**Estimativa:** 30min  
**Prioridade:** Alta  
**Dependências:** TASK-7, TASK-8, TASK-9, TASK-10

**Descrição:**
Criar testes unitários para novos métodos.

**Arquivo:** `backend/tests/unit/ticketUnification.test.js`

**Checklist:**
- [ ] Testar createTicketFromCatalog
- [ ] Testar approveTicket
- [ ] Testar rejectTicket
- [ ] Testar getMyTickets
- [ ] Todos os testes passando

---

### ✅ TASK-19: Testes de Integração
**Estimativa:** 30min  
**Prioridade:** Alta  
**Dependências:** TASK-18

**Descrição:**
Criar testes de integração end-to-end.

**Arquivo:** `backend/tests/integration/ticketUnification.test.js`

**Checklist:**
- [ ] Testar fluxo completo de catálogo com aprovação
- [ ] Testar fluxo completo de catálogo sem aprovação
- [ ] Testar listagem unificada
- [ ] Testar filtros
- [ ] Todos os testes passando

---

### ✅ TASK-20: Testes Frontend
**Estimativa:** 30min  
**Prioridade:** Média  
**Dependências:** TASK-13, TASK-14, TASK-15

**Descrição:**
Testar componentes atualizados.

**Checklist:**
- [ ] Testar MyRequests.jsx
- [ ] Testar ServiceCatalog.jsx
- [ ] Testar TicketApproval.jsx
- [ ] Testar responsividade
- [ ] Testar em diferentes navegadores

---

## 🧹 Fase 6: Limpeza (1h)

### ✅ TASK-21: Remover Código de service_requests
**Estimativa:** 20min  
**Prioridade:** Média  
**Dependências:** TASK-20

**Descrição:**
Remover código relacionado a service_requests.

**Checklist:**
- [ ] Remover serviceRequestModel.js
- [ ] Remover métodos de service_requests em controllers
- [ ] Remover rotas de service_requests
- [ ] Remover imports não utilizados
- [ ] Verificar que nada quebrou

---

### ✅ TASK-22: Criar Backup de service_requests
**Estimativa:** 5min  
**Prioridade:** Alta  
**Dependências:** TASK-5

**Descrição:**
Criar backup da tabela antes de dropar.

**Checklist:**
- [ ] Criar tabela service_requests_backup
- [ ] Copiar todos os dados
- [ ] Verificar integridade
- [ ] Documentar localização

**Query:**
```sql
CREATE TABLE service_requests_backup AS SELECT * FROM service_requests;
```

---

### ✅ TASK-23: Dropar Tabela service_requests
**Estimativa:** 5min  
**Prioridade:** Baixa  
**Dependências:** TASK-22

**Descrição:**
Remover tabela service_requests do banco.

**Checklist:**
- [ ] Verificar que backup existe
- [ ] Dropar tabela
- [ ] Verificar que sistema funciona
- [ ] Documentar ação

**Query:**
```sql
DROP TABLE IF EXISTS service_requests CASCADE;
```

---

### ✅ TASK-24: Atualizar Documentação
**Estimativa:** 20min  
**Prioridade:** Média  
**Dependências:** TASK-21

**Descrição:**
Atualizar toda a documentação do projeto.

**Checklist:**
- [ ] Atualizar README.md
- [ ] Atualizar API documentation
- [ ] Atualizar CHANGELOG.md
- [ ] Atualizar diagramas de arquitetura
- [ ] Atualizar guias de desenvolvimento

---

### ✅ TASK-25: Commit e Deploy
**Estimativa:** 10min  
**Prioridade:** Alta  
**Dependências:** TASK-24

**Descrição:**
Fazer commit final e preparar deploy.

**Checklist:**
- [ ] Commit de todas as alterações
- [ ] Push para repositório
- [ ] Criar tag de versão
- [ ] Preparar notas de release
- [ ] Documentar processo de deploy

---

## 📊 Progresso

```
Fase 1: Preparação         [ ] 0/2   (0%)
Fase 2: Migração Schema    [ ] 0/3   (0%)
Fase 3: Backend            [ ] 0/7   (0%)
Fase 4: Frontend           [ ] 0/5   (0%)
Fase 5: Testes             [ ] 0/3   (0%)
Fase 6: Limpeza            [ ] 0/5   (0%)

Total:                     [ ] 0/25  (0%)
```

---

## 🎯 Ordem de Execução Recomendada

1. **Dia 1 - Preparação e Backend (4h)**
   - TASK-1 → TASK-2 → TASK-3 → TASK-4 → TASK-5
   - TASK-6 → TASK-7 → TASK-8 → TASK-9 → TASK-10 → TASK-11 → TASK-12

2. **Dia 2 - Frontend e Testes (3h)**
   - TASK-13 → TASK-14 → TASK-15 → TASK-16 → TASK-17
   - TASK-18 → TASK-19 → TASK-20

3. **Dia 3 - Limpeza e Deploy (1h)**
   - TASK-21 → TASK-22 → TASK-23 → TASK-24 → TASK-25

---

## ⚠️ Pontos de Atenção

1. **Backup antes de tudo** - TASK-1 é crítica
2. **Testar migração em dev primeiro** - TASK-4
3. **Validar dados migrados** - TASK-5
4. **Não dropar service_requests até validar tudo** - TASK-23
5. **Manter rotas antigas por um tempo** - TASK-11

---

**Última atualização:** 18 de Janeiro de 2026
