# 📊 Fluxo Visual do Sistema de Email

## 🎯 Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE ENVIA EMAIL                          │
│  De: tenant-admin@empresademo.com                               │
│  Para: noreply@tatusolutions.com                                │
│  CC: sellerreview24@gmail.com (email da direção TI)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVIDOR IMAP (Titan Email)                        │
│              imap.titan.email:993                               │
│              Caixa: noreply@tatusolutions.com                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND - EmailProcessor                           │
│              Verifica emails a cada 60 segundos                 │
│              http://localhost:4003                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              1. parseEmail()                                    │
│              Extrai informações do email:                       │
│              - from: tenant-admin@empresademo.com               │
│              - to: noreply@tatusolutions.com                    │
│              - cc: sellerreview24@gmail.com                     │
│              - subject: Problema no sistema                     │
│              - body: Não consigo fazer login...                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. É resposta a ticket existente?                  │
│              Verifica:                                          │
│              - Assunto contém [#000123]?                        │
│              - Header In-Reply-To?                              │
│              - Assunto similar (últimas 24h)?                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                   SIM           NÃO
                    │             │
                    ▼             ▼
┌───────────────────────────┐  ┌──────────────────────────────────┐
│ addCommentToTicket()      │  │ 3. findOrCreateUser()            │
│                           │  │                                  │
│ 1. Busca utilizador       │  │ 1. Busca em organization_users   │
│ 2. Se não existe: PARA    │  │    WHERE email = 'tenant-admin@' │
│ 3. Se existe:             │  │                                  │
│    - Adiciona comentário  │  │ 2. Se não encontrar:             │
│    - Atualiza status      │  │    Busca em client_users         │
│    - Notifica gestor      │  │    WHERE email = 'tenant-admin@' │
└───────────────────────────┘  │                                  │
                               │ 3. Se não encontrar:             │
                               │    - Envia email notificação     │
                               │    - return null                 │
                               └──────────────┬───────────────────┘
                                              │
                                       ┌──────┴──────┐
                                       │             │
                                  ENCONTRADO    NÃO ENCONTRADO
                                       │             │
                                       ▼             ▼
                        ┌──────────────────────┐  ┌─────────────────────┐
                        │ 4. Rotear por email  │  │ ❌ PARA             │
                        │                      │  │                     │
                        │ emailRouterService   │  │ sendUserNotRegistered│
                        │ .findOrgUnitByEmail()│  │ Email()             │
                        │                      │  │                     │
                        │ Busca em ordem:      │  │ Template:           │
                        │ 1. Section           │  │ "⚠️ Registo         │
                        │    WHERE email =     │  │  Necessário"        │
                        │    'sellerreview24@' │  │                     │
                        │                      │  │ Enviado para:       │
                        │ 2. Department        │  │ tenant-admin@...    │
                        │    WHERE email =     │  └─────────────────────┘
                        │    'sellerreview24@' │
                        │                      │
                        │ 3. Direction         │
                        │    WHERE email =     │
                        │    'sellerreview24@' │
                        │                      │
                        │ ✅ Encontrado:       │
                        │ Direction "TI"       │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ 5. createTicket      │
                        │                      │
                        │ ticketData = {       │
                        │   ticketNumber: 123  │
                        │   subject: "..."     │
                        │   description: "..." │
                        │   status: "novo"     │
                        │   priority: "media"  │
                        │   directionId: uuid  │ ← Da direção TI
                        │   assigneeId: uuid   │ ← Gestor da TI
                        │   source: "email"    │
                        │   requesterOrgUserId │
                        │   organizationId     │
                        │ }                    │
                        │                      │
                        │ Ticket.create()      │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ 6. Criar comentário  │
                        │                      │
                        │ Comment.create({     │
                        │   content: body      │
                        │   ticketId: ticket.id│
                        │   userId: user.id    │
                        │   isPublic: true     │
                        │ })                   │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ 7. Processar anexos  │
                        │                      │
                        │ Se email tem anexos: │
                        │ - Salva em uploads/  │
                        │ - Cria Attachment    │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ 8. sendAutoResponse  │
                        │                      │
                        │ Template:            │
                        │ "✅ Ticket Criado    │
                        │  com Sucesso"        │
                        │                      │
                        │ Enviado para:        │
                        │ tenant-admin@...     │
                        │                      │
                        │ Assunto:             │
                        │ [#000123] Problema   │
                        │ no sistema           │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ ✅ COMPLETO          │
                        │                      │
                        │ - Ticket criado      │
                        │ - Roteado para TI    │
                        │ - Atribuído ao gestor│
                        │ - Email enviado      │
                        └──────────────────────┘
```

---

## 🔄 Cenários Diferentes

### Cenário 1: Utilizador Registado ✅

```
Email → IMAP → Backend
  ↓
findOrCreateUser()
  ↓
✅ Encontrado em organization_users
  ↓
emailRouterService.findOrgUnitByEmail()
  ↓
✅ Encontrado: Direction "TI"
  ↓
createTicketFromEmail()
  ↓
✅ Ticket criado com:
   - directionId: uuid-ti
   - assigneeId: uuid-gestor
  ↓
sendAutoResponse()
  ↓
✅ Email de confirmação enviado
```

### Cenário 2: Utilizador NÃO Registado ❌

```
Email → IMAP → Backend
  ↓
findOrCreateUser()
  ↓
❌ NÃO encontrado em organization_users
  ↓
❌ NÃO encontrado em client_users
  ↓
sendUserNotRegisteredEmail()
  ↓
📧 Email enviado: "Registo Necessário"
  ↓
❌ Ticket NÃO criado
```

### Cenário 3: Email Sem Roteamento ⚠️

```
Email → IMAP → Backend
  ↓
findOrCreateUser()
  ↓
✅ Encontrado em organization_users
  ↓
emailRouterService.findOrgUnitByEmail()
  ↓
⚠️ NÃO encontrado (email não tem CC com unidade)
  ↓
createTicketFromEmail()
  ↓
✅ Ticket criado SEM:
   - directionId
   - departmentId
   - sectionId
   - assigneeId
  ↓
✅ Ticket fica na fila geral
```

### Cenário 4: Resposta a Ticket ✅

```
Email → IMAP → Backend
  ↓
findRelatedTicket()
  ↓
✅ Encontrado: Ticket #000123
  ↓
addCommentToTicket()
  ↓
findOrCreateUser()
  ↓
✅ Encontrado
  ↓
Comment.create()
  ↓
✅ Comentário adicionado
  ↓
✅ Status atualizado (se estava fechado)
  ↓
✅ Gestor notificado
```

---

## 📊 Tabelas Envolvidas

### 1. organization_users
```sql
SELECT id, email, organization_id, role
FROM organization_users
WHERE email = 'tenant-admin@empresademo.com';
```

### 2. client_users
```sql
SELECT id, email, organization_id, client_id
FROM client_users
WHERE email = 'cliente@empresa-a.com';
```

### 3. directions
```sql
SELECT id, name, email, manager_id, organization_id
FROM directions
WHERE email = 'sellerreview24@gmail.com';
```

### 4. departments
```sql
SELECT id, name, email, manager_id, direction_id
FROM departments
WHERE email = 'suporte@tatusolutions.com';
```

### 5. sections
```sql
SELECT id, name, email, manager_id, department_id
FROM sections
WHERE email = 'helpdesk@tatusolutions.com';
```

### 6. tickets
```sql
INSERT INTO tickets (
  ticket_number,
  subject,
  description,
  status,
  priority,
  direction_id,
  department_id,
  section_id,
  assignee_id,
  requester_org_user_id,
  organization_id,
  source
) VALUES (
  '000123',
  'Problema no sistema',
  'Não consigo fazer login...',
  'novo',
  'media',
  'uuid-direcao-ti',
  NULL,
  NULL,
  'uuid-gestor-ti',
  'uuid-tenant-admin',
  'uuid-organizacao',
  'email'
);
```

### 7. comments
```sql
INSERT INTO comments (
  content,
  ticket_id,
  user_id,
  is_public,
  email_message_id,
  organization_id
) VALUES (
  'Não consigo fazer login...',
  'uuid-ticket',
  'uuid-user',
  true,
  '<message-id@titan.email>',
  'uuid-organizacao'
);
```

---

## 🔍 Logs de Debug

### Sucesso Completo
```
info: 📧 Tentando conectar ao IMAP...
info: 📥 Conectado ao servidor IMAP com sucesso
info: 📬 1 novos emails encontrados
info: 📧 Processando e-mail de: tenant-admin@empresademo.com para: sellerreview24@gmail.com
info: 👤 Utilizador encontrado (organization_users): tenant-admin@empresademo.com
info: 📍 Email roteado para direction: TI
info: 👤 Ticket atribuído ao gestor: 55a8f2b5-001c-40a6-81b6-66bbebc4d9ec
info: ✅ Novo ticket criado: #000123
info: ✉️ Auto-resposta enviada para: tenant-admin@empresademo.com
```

### Utilizador Não Registado
```
info: 📧 Processando e-mail de: desconhecido@example.com
warn: ⚠️ Email recebido de utilizador não registado: desconhecido@example.com
warn: ⚠️ Ticket NÃO será criado. Utilizador deve ser registado primeiro.
info: 📧 Email de notificação enviado para: desconhecido@example.com
```

### Email Sem Roteamento
```
info: 📧 Processando e-mail de: tenant-admin@empresademo.com
info: 👤 Utilizador encontrado (organization_users)
info: ✅ Novo ticket criado: #000123
(Sem log de roteamento - ticket fica na fila geral)
```

---

## ⏱️ Timeline de Processamento

```
T+0s    Email enviado pelo cliente
T+0s    Email chega no servidor Titan
T+0-60s Backend verifica caixa IMAP (a cada 60s)
T+0-60s parseEmail() - Extrai informações
T+0-60s findOrCreateUser() - Valida utilizador
T+0-60s emailRouterService - Busca unidade
T+0-60s createTicketFromEmail() - Cria ticket
T+0-60s sendAutoResponse() - Envia confirmação
T+0-60s Email de confirmação chega ao cliente
```

**Tempo total**: 0-60 segundos (depende do momento da verificação)

---

## 🎯 Pontos-Chave

### ✅ O Que Funciona
1. Sistema lê emails de `noreply@tatusolutions.com`
2. Valida se utilizador existe (organization_users ou client_users)
3. Roteia baseado no campo `To:` ou `CC:`
4. Atribui ao gestor se existir
5. Envia email de confirmação
6. Envia email de notificação para não registados

### ❌ O Que NÃO Funciona
1. Não lê emails de outras caixas (ex: ti@tatusolutions.com)
2. Não cria utilizadores automaticamente
3. Não cria tickets de utilizadores não registados

### ✅ Solução
1. Configurar forwarding/alias no servidor de email
2. Ou instruir utilizadores a enviar para `noreply@tatusolutions.com`

---

**Sistema completo e funcionando!** 🚀
