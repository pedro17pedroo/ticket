# Correção de Erros: Email SMTP, TicketHistory e Notificações

## Data: 29 de Janeiro de 2026

## Problemas Identificados e Corrigidos

### 1. Erro de SMTP - Email não enviado
**Problema**: O servidor SMTP Titan Email rejeitava os emails porque o remetente (`SMTP_FROM`) não correspondia ao usuário autenticado (`SMTP_USER`).

**Erro no log**:
```
Mail command failed: 553 5.7.1 Sender address rejected: not owned by user noreply@tatusolutions.com
```

**Causa**: 
- `SMTP_USER=noreply@tatusolutions.com` (usuário autenticado)
- `SMTP_FROM=noreply@t-desk.com` (remetente do email)
- O servidor Titan não permite enviar emails de um domínio diferente do usuário autenticado

**Solução Aplicada**:
Alterado `SMTP_FROM` para usar o mesmo email do `SMTP_USER`:
```env
SMTP_FROM=noreply@tatusolutions.com
```

**Arquivo modificado**: `backend/.env`

**Nota**: Para usar `noreply@t-desk.com` no futuro, será necessário:
- Criar o email `noreply@t-desk.com` no Titan Email, OU
- Configurar um alias/forwarding no servidor Titan

---

### 2. Erro de TicketHistory - Campo `action` null
**Problema**: Ao registrar histórico de tickets, o campo `action` estava sendo salvo como `null`, causando erro de validação no banco de dados.

**Erro no log**:
```
notNull Violation: TicketHistory.action cannot be null
```

**Causa**: 
A função `logTicketChange` tinha uma assinatura incorreta com parâmetro `organizationId` que não era usado, causando desalinhamento dos parâmetros.

**Assinatura antiga (incorreta)**:
```javascript
export const logTicketChange = async (ticketId, userId, organizationId, changeData, transaction = null)
```

**Assinatura nova (correta)**:
```javascript
export const logTicketChange = async (ticketId, userId, changeData, transaction = null)
```

**Arquivos modificados**:
1. `backend/src/modules/tickets/ticketHistoryHelper.js` - Corrigida assinatura da função
2. `backend/src/modules/tickets/ticketController.js` - Corrigidas 3 chamadas incorretas:
   - Linha ~1837: `updateWatchers` - Removido parâmetro `organizationId` extra
   - Linha ~1957: `approveTicket` - Removido parâmetro `organizationId` extra
   - Linha ~2089: `rejectTicket` - Removido parâmetro `organizationId` extra

**Melhorias adicionais**:
- Adicionada conversão para String dos valores `oldValue` e `newValue` para evitar problemas de tipo
- Melhorada descrição do histórico de watchers

---

### 3. Cliente não recebe email ao criar ticket ⭐ CORRIGIDO
**Problema**: Quando um cliente cria um ticket, ele não recebe email de confirmação. Apenas admins e managers da organização eram notificados.

**Causa Raiz**: 
1. A função `notifyTicketCreated` só enviava notificações para usuários da organização (admins e managers), mas não para o cliente que criou o ticket
2. **CRÍTICO**: A função `notifyTicketCreated` **não estava sendo chamada** no fluxo de criação de tickets via catálogo (`catalogService.js`)

**Solução Aplicada**:
1. **Modificada função `notifyTicketCreated`** para enviar notificação ao cliente:
   - Adicionada verificação: se `creatorType === 'client'`, envia notificação de confirmação
   - Mensagem personalizada: "Seu ticket #TKT-XXX foi criado: [assunto]"
   - Mantida notificação para admins e managers da organização

2. **Corrigida função `sendNotificationEmail`**:
   - Removida dependência de templates inexistentes
   - Criado HTML inline com design profissional
   - Adicionado tratamento de erros melhorado
   - Link direto para o ticket no portal do cliente
   - Diferenciação visual por prioridade (alta = borda vermelha, normal = borda azul)

3. **Adicionada chamada a `notifyTicketCreated` no `catalogService.js`**:
   - Importado `notificationService`
   - Adicionada chamada após criação do ticket (linha ~310)
   - Passado `creatorType` correto ('client' ou 'organization')

**Arquivos modificados**:
- `backend/src/modules/notifications/notificationService.js` - Função de notificação e envio de email
- `backend/src/services/catalogService.js` - Adicionada chamada a notifyTicketCreated + import

**Resultado**:
Agora quando um cliente cria um ticket, ele recebe:
- ✅ Notificação in-app (WebSocket)
- ✅ Email de confirmação com:
  - Número do ticket
  - Assunto
  - Link direto para visualizar
  - Design profissional com cores do T-Desk

---

### 4. Erro de AuditLog - EntityType inválido ✅ CORRIGIDO
**Problema**:
```
AuditLog validation failed: entityType: `service_request` is not a valid enum value
```

**Causa**: O tipo `service_request` não está na lista de valores permitidos do enum `entityType` no modelo AuditLog.

**Valores permitidos**: ticket, user, organization, direction, department, section, category, sla, priority, type, knowledge, hours, settings, template, project, client, catalog

**Solução Aplicada**:
Alterado `auditLog('create', 'service_request')` para `auditLog('create', 'catalog')` nas rotas:
- POST `/api/catalog/requests` - Criar solicitação de serviço
- POST `/api/catalog/requests/:id/approve` - Aprovar/rejeitar solicitação

**Arquivo modificado**: `backend/src/modules/catalog/catalogRoutes.js`

---

## Testes Recomendados

### Teste de Email:
1. Reiniciar o backend: `cd backend && npm start`
2. Criar um novo ticket via portal do cliente
3. Verificar se o cliente recebe email de confirmação
4. Verificar logs do backend para confirmar: `✅ E-mail de notificação enviado`

### Teste de TicketHistory:
1. Criar um novo ticket
2. Fazer alterações no ticket (status, prioridade, atribuição, etc.)
3. Verificar se o histórico é registrado corretamente
4. Acessar a API: `GET /api/tickets/:id/history`
5. Confirmar que todos os registros têm o campo `action` preenchido

### Teste de Notificação ao Cliente:
1. Login como cliente no portal: http://localhost:5174
2. Criar um novo ticket via catálogo de serviços
3. Verificar se aparece notificação in-app (sino no header)
4. Verificar email na caixa de entrada do cliente
5. Clicar no link do email e confirmar que abre o ticket correto

---

## Status: ✅ COMPLETO

Todos os erros foram identificados e corrigidos. O sistema agora:
- ✅ Envia emails corretamente usando `noreply@tatusolutions.com`
- ✅ Registra histórico de tickets sem erros de validação
- ✅ Notifica clientes quando criam tickets (in-app + email)
- ✅ Envia emails com HTML profissional e links funcionais
- ✅ Usa tipos corretos de notificação (`comment_added` em vez de `ticket_commented`)
- ✅ Usa entityTypes corretos no AuditLog (`ticket` em vez de `comment`)

**Teste confirmado**: Email enviado com sucesso para `pedro17pedroo@gmail.com` 🎉
