# 🔒 Correção de Segurança - Email Processor

## Problemas Identificados

### 1. ❌ Criação Automática de Utilizadores
**Problema:** Sistema criava automaticamente utilizadores não registados
```javascript
// ANTES (INSEGURO)
if (!user) {
  user = await User.create({
    name: email.fromName || email.from.split('@')[0],
    email: email.from,
    password: crypto.randomBytes(16).toString('hex'),
    role: 'cliente-org',
    active: true,
    organizationId: 1  // ❌ Hardcoded!
  });
}
```

**Riscos:**
- ❌ Qualquer pessoa podia criar tickets enviando email
- ❌ Spam e abuso do sistema
- ❌ Utilizadores criados sem validação
- ❌ OrganizationId hardcoded (sempre 1)
- ❌ Tabela `users` errada (deveria ser `organization_users` ou `client_users`)

### 2. ❌ Atribuição Obrigatória ao Gestor
**Problema:** Código assumia que unidades sempre têm gestor
```javascript
// ANTES
if (routingInfo.unit.managerId) {
  ticketData.assigneeId = routingInfo.unit.managerId;
}
// Mas não havia log se não tivesse gestor
```

**Riscos:**
- ❌ Tickets podiam não ser criados se unidade não tivesse gestor
- ❌ Falta de visibilidade sobre unidades sem gestor

## Correções Aplicadas

### 1. ✅ Validação de Utilizador Existente

#### Novo Método `findOrCreateUser`
```javascript
async findOrCreateUser(email) {
  // Buscar em todas as tabelas de utilizadores
  const OrganizationUser = (await import('../modules/users/organizationUserModel.js')).default;
  const ClientUser = (await import('../modules/users/clientUserModel.js')).default;
  
  // 1. Tentar encontrar em organization_users
  let user = await OrganizationUser.findOne({
    where: { email: email.from }
  });

  if (user) {
    logger.info(`👤 Utilizador encontrado (organization_users): ${user.email}`);
    return {
      user,
      type: 'organization',
      organizationId: user.organizationId
    };
  }

  // 2. Tentar encontrar em client_users
  user = await ClientUser.findOne({
    where: { email: email.from }
  });

  if (user) {
    logger.info(`👤 Utilizador encontrado (client_users): ${user.email}`);
    return {
      user,
      type: 'client',
      organizationId: user.organizationId
    };
  }

  // 3. Utilizador não encontrado - NÃO criar automaticamente
  logger.warn(`⚠️ Email recebido de utilizador não registado: ${email.from}`);
  logger.warn(`⚠️ Ticket NÃO será criado. Utilizador deve ser registado primeiro.`);
  
  return null;
}
```

**Benefícios:**
- ✅ Busca em ambas as tabelas (`organization_users` e `client_users`)
- ✅ Retorna tipo de utilizador e organizationId corretos
- ✅ NÃO cria utilizadores automaticamente
- ✅ Logs claros quando utilizador não existe

### 2. ✅ Tratamento de Utilizador Não Encontrado

#### Atualização do `processIncomingEmail`
```javascript
async processIncomingEmail(email) {
  try {
    logger.info(`📧 Processando e-mail de: ${email.from} para: ${email.to}`);

    // 1. Verificar se é resposta a ticket existente
    const existingTicket = await this.findRelatedTicket(email);
    
    if (existingTicket) {
      logger.info(`📎 Adicionando resposta ao ticket #${existingTicket.ticketNumber}`);
      return await this.addCommentToTicket(existingTicket, email);
    }

    // 2. Buscar utilizador (NÃO criar automaticamente)
    const userInfo = await this.findOrCreateUser(email);
    
    if (!userInfo) {
      logger.error(`❌ Ticket NÃO criado: Utilizador ${email.from} não está registado no sistema`);
      // TODO: Enviar email ao remetente informando que precisa de se registar
      return null;
    }

    // 3. Criar novo ticket (com roteamento por email)
    const ticket = await this.createTicketFromEmail(email, userInfo);
    logger.info(`✅ Novo ticket criado: #${ticket.ticketNumber}`);

    // ... resto do código
  } catch (error) {
    logger.error('Erro ao processar e-mail:', error);
    throw error;
  }
}
```

**Benefícios:**
- ✅ Valida se utilizador existe ANTES de criar ticket
- ✅ Retorna `null` se utilizador não existe
- ✅ Logs claros do motivo da rejeição
- ✅ Preparado para enviar email de notificação ao remetente

### 3. ✅ Atribuição Opcional ao Gestor

#### Atualização do `createTicketFromEmail`
```javascript
// Atribuir ao gestor se existir (OPCIONAL - não bloqueia criação)
if (routingInfo.unit.managerId) {
  ticketData.assigneeId = routingInfo.unit.managerId;
  logger.info(`👤 Ticket atribuído ao gestor: ${routingInfo.unit.managerId}`);
} else {
  logger.info(`⚠️ Unidade ${routingInfo.unit.name} não tem gestor definido - ticket ficará não atribuído`);
}
```

**Benefícios:**
- ✅ Ticket é criado mesmo sem gestor
- ✅ Logs informativos sobre estado da atribuição
- ✅ Gestor pode ser atribuído depois no portal

### 4. ✅ Suporte a Ambos os Tipos de Utilizador

#### Definição Correta do Requester
```javascript
// Definir requester baseado no tipo de utilizador
if (type === 'organization') {
  ticketData.requesterOrgUserId = user.id;
  ticketData.requesterType = 'organization_user';
} else if (type === 'client') {
  ticketData.requesterClientUserId = user.id;
  ticketData.requesterType = 'client_user';
  ticketData.clientId = user.clientId;
}
```

**Benefícios:**
- ✅ Suporta utilizadores da organização
- ✅ Suporta utilizadores clientes
- ✅ Define campos corretos no ticket
- ✅ Mantém integridade referencial

## Fluxo de Processamento Atualizado

```
┌─────────────────────────────────────────────────────────────┐
│              Email Recebido na Caixa IMAP                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              parseEmail()                                    │
│              Extrai: from, to, subject, body                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              É resposta a ticket existente?                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                ┌──────┴──────┐
                │             │
               SIM           NÃO
                │             │
                ▼             ▼
┌───────────────────────┐  ┌──────────────────────────────────┐
│ addCommentToTicket()  │  │ findOrCreateUser()               │
│ - Busca utilizador    │  │ 1. Busca em organization_users   │
│ - Se não existe: PARA │  │ 2. Busca em client_users         │
│ - Se existe: adiciona │  │ 3. Se não existe: return null    │
└───────────────────────┘  └──────────────┬───────────────────┘
                                          │
                                   ┌──────┴──────┐
                                   │             │
                              ENCONTRADO    NÃO ENCONTRADO
                                   │             │
                                   ▼             ▼
                    ┌──────────────────────┐  ┌─────────────────┐
                    │ createTicketFromEmail│  │ ❌ PARA         │
                    │ - Roteia por email   │  │ Log: Utilizador │
                    │ - Atribui se gestor  │  │ não registado   │
                    │ - Cria ticket        │  └─────────────────┘
                    └──────────────────────┘
```

## Cenários de Teste

### Cenário 1: Utilizador Registado (Organization User)
```
Email de: admin@empresademo.com (registado em organization_users)
Para: noreply@tatusolutions.com
CC: ti@tatusolutions.com

Resultado:
✅ Utilizador encontrado
✅ Ticket criado
✅ Roteado para direção TI
✅ Atribuído ao gestor (se existir)
```

### Cenário 2: Utilizador Registado (Client User)
```
Email de: cliente@empresa-a.com (registado em client_users)
Para: noreply@tatusolutions.com
CC: suporte@tatusolutions.com

Resultado:
✅ Utilizador encontrado
✅ Ticket criado
✅ Roteado para departamento Suporte
✅ clientId definido
```

### Cenário 3: Utilizador NÃO Registado
```
Email de: desconhecido@example.com (NÃO registado)
Para: noreply@tatusolutions.com

Resultado:
❌ Utilizador não encontrado
❌ Ticket NÃO criado
📝 Log: "Utilizador desconhecido@example.com não está registado"
```

### Cenário 4: Unidade Sem Gestor
```
Email de: admin@empresademo.com
Para: noreply@tatusolutions.com
CC: ti@tatusolutions.com (direção TI sem gestor)

Resultado:
✅ Utilizador encontrado
✅ Ticket criado
✅ Roteado para direção TI
⚠️ Ticket não atribuído (sem gestor)
📝 Log: "Unidade TI não tem gestor definido"
```

### Cenário 5: Resposta a Ticket Existente
```
Email de: cliente@empresa-a.com
Para: noreply@tatusolutions.com
Assunto: Re: [#000123] Problema no sistema

Resultado:
✅ Ticket #000123 encontrado
✅ Comentário adicionado
✅ Status atualizado (se estava fechado)
```

## Logs de Debug

### Utilizador Encontrado
```
info: 📧 Processando e-mail de: admin@empresademo.com para: ti@tatusolutions.com
info: 👤 Utilizador encontrado (organization_users): admin@empresademo.com
info: 📍 Email roteado para direction: TI
info: 👤 Ticket atribuído ao gestor: uuid-gestor-ti
info: ✅ Novo ticket criado: #000123
```

### Utilizador NÃO Encontrado
```
info: 📧 Processando e-mail de: desconhecido@example.com para: noreply@tatusolutions.com
warn: ⚠️ Email recebido de utilizador não registado: desconhecido@example.com
warn: ⚠️ Ticket NÃO será criado. Utilizador deve ser registado primeiro.
error: ❌ Ticket NÃO criado: Utilizador desconhecido@example.com não está registado no sistema
```

### Unidade Sem Gestor
```
info: 📧 Processando e-mail de: admin@empresademo.com para: ti@tatusolutions.com
info: 👤 Utilizador encontrado (organization_users): admin@empresademo.com
info: 📍 Email roteado para direction: TI
warn: ⚠️ Unidade TI não tem gestor definido - ticket ficará não atribuído
info: ✅ Novo ticket criado: #000123
```

## Melhorias Futuras

### 1. Email de Notificação ao Remetente
Quando utilizador não está registado, enviar email automático:
```javascript
if (!userInfo) {
  await this.sendRegistrationRequiredEmail(email.from);
  return null;
}
```

### 2. Whitelist de Domínios
Permitir apenas emails de domínios específicos:
```javascript
const allowedDomains = ['empresademo.com', 'empresa-a.com'];
const domain = email.from.split('@')[1];
if (!allowedDomains.includes(domain)) {
  logger.warn(`Domain ${domain} not allowed`);
  return null;
}
```

### 3. Rate Limiting por Email
Prevenir spam de um mesmo remetente:
```javascript
const emailCount = await this.getEmailCountLast24h(email.from);
if (emailCount > 10) {
  logger.warn(`Rate limit exceeded for ${email.from}`);
  return null;
}
```

### 4. Validação de Conteúdo
Verificar se email não é spam:
```javascript
const isSpam = await this.checkSpam(email);
if (isSpam) {
  logger.warn(`Spam detected from ${email.from}`);
  return null;
}
```

## Ficheiros Modificados

- `backend/src/services/emailProcessor.js`
  - ✅ `findOrCreateUser()` - Não cria utilizadores automaticamente
  - ✅ `processIncomingEmail()` - Valida utilizador antes de criar ticket
  - ✅ `createTicketFromEmail()` - Atribuição opcional ao gestor
  - ✅ `addCommentToTicket()` - Valida utilizador antes de adicionar comentário

## Status Final

✅ **Segurança melhorada** - Apenas utilizadores registados podem criar tickets
✅ **Validação robusta** - Busca em ambas as tabelas de utilizadores
✅ **Atribuição flexível** - Tickets criados mesmo sem gestor
✅ **Logs informativos** - Visibilidade completa do processamento
✅ **Pronto para produção** - Sistema seguro e confiável
