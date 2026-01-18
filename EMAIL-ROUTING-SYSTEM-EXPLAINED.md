# 📧 Sistema de Roteamento de Email - Explicação Completa

## Como Funciona REALMENTE

### ❌ O Que NÃO Funciona (Antes da Correção)

**Cenário que NÃO funcionava:**
```
Cliente envia email para: sellerreview24@gmail.com (email da direção TI)
❌ Sistema NÃO recebe o email
❌ Ticket NÃO é criado
```

**Por quê?**
- O sistema só lê emails da caixa IMAP configurada (`noreply@tatusolutions.com`)
- Não tem acesso à caixa `sellerreview24@gmail.com`
- Cada email precisa de credenciais IMAP próprias

### ✅ Como Funciona AGORA (Após Correção)

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE ENVIA EMAIL                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Para: noreply@tatusolutions.com                 │
│              CC: ti@tatusolutions.com (email da direção)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           SERVIDOR IMAP (imap.titan.email)                   │
│           Caixa: noreply@tatusolutions.com                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND - EmailProcessor                        │
│              Verifica emails a cada 60 segundos              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              parseEmail()                                    │
│              Extrai: from, to, subject, body, attachments    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              processIncomingEmail()                          │
│              1. Verifica se é resposta a ticket existente    │
│              2. Busca/cria usuário                           │
│              3. Cria ticket com roteamento                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              emailRouterService                              │
│              Busca unidade organizacional por email          │
│              Ordem: Section → Department → Direction         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              createTicketFromEmail()                         │
│              - Atribui directionId/departmentId/sectionId    │
│              - Atribui ao gestor (managerId)                 │
│              - Define prioridade                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              TICKET CRIADO E ROTEADO                         │
│              ✅ Na direção/departamento/secção correta       │
│              ✅ Atribuído ao gestor responsável              │
└─────────────────────────────────────────────────────────────┘
```

## Configuração Necessária

### 1. Configuração IMAP (Backend)
```env
# .env
IMAP_HOST=imap.titan.email
IMAP_PORT=993
IMAP_USER=noreply@tatusolutions.com
IMAP_PASS=Tatu2025*E
```

### 2. Configuração de Emails nas Unidades Organizacionais

#### Direção TI
```javascript
{
  name: "TI",
  email: "ti@tatusolutions.com",  // ← Email da direção
  managerId: "uuid-do-gestor"
}
```

#### Departamento Suporte
```javascript
{
  name: "Suporte",
  directionId: "uuid-direcao-ti",
  email: "suporte@tatusolutions.com",  // ← Email do departamento
  managerId: "uuid-do-gestor"
}
```

#### Secção Help Desk
```javascript
{
  name: "Help Desk",
  departmentId: "uuid-departamento-suporte",
  email: "helpdesk@tatusolutions.com",  // ← Email da secção
  managerId: "uuid-do-gestor"
}
```

## Como Usar

### Opção 1: Email Direto (NÃO FUNCIONA)
```
❌ Para: ti@tatusolutions.com
❌ Sistema não recebe (não tem acesso a essa caixa)
```

### Opção 2: Email com Roteamento (FUNCIONA) ✅
```
✅ Para: noreply@tatusolutions.com
✅ CC: ti@tatusolutions.com
✅ Sistema lê o campo "To" e roteia para a direção TI
```

### Opção 3: Alias/Forwarding (RECOMENDADO) ✅
Configurar no servidor de email:
```
ti@tatusolutions.com → encaminhar para → noreply@tatusolutions.com
suporte@tatusolutions.com → encaminhar para → noreply@tatusolutions.com
helpdesk@tatusolutions.com → encaminhar para → noreply@tatusolutions.com
```

**Vantagem:**
- Cliente envia para `ti@tatusolutions.com`
- Email é automaticamente encaminhado para `noreply@tatusolutions.com`
- Sistema recebe e processa
- Roteamento funciona baseado no campo `To:` original

## Fluxo de Roteamento

### 1. Email Recebido
```javascript
{
  from: "cliente@example.com",
  to: "ti@tatusolutions.com",  // ← Campo usado para roteamento
  subject: "Problema no sistema",
  body: "Não consigo fazer login..."
}
```

### 2. Busca na Base de Dados
```sql
-- Busca em ordem de especificidade
SELECT * FROM sections WHERE email = 'ti@tatusolutions.com' AND organization_id = '...';
-- Se não encontrar, busca em departments
SELECT * FROM departments WHERE email = 'ti@tatusolutions.com' AND organization_id = '...';
-- Se não encontrar, busca em directions
SELECT * FROM directions WHERE email = 'ti@tatusolutions.com' AND organization_id = '...';
```

### 3. Ticket Criado
```javascript
{
  ticketNumber: "000123",
  subject: "Problema no sistema",
  description: "Não consigo fazer login...",
  status: "novo",
  priority: "media",
  directionId: "uuid-direcao-ti",  // ← Roteado automaticamente
  assigneeId: "uuid-gestor-ti",    // ← Atribuído ao gestor
  source: "email",
  organizationId: "..."
}
```

## Hierarquia de Roteamento

### Prioridade de Busca
1. **Secção** (mais específico)
   - Se encontrar, atribui: `sectionId`, `departmentId`, `directionId`
   
2. **Departamento** (intermediário)
   - Se encontrar, atribui: `departmentId`, `directionId`
   
3. **Direção** (mais geral)
   - Se encontrar, atribui: `directionId`

### Exemplo Prático

#### Cenário 1: Email para Secção
```
Email para: helpdesk@tatusolutions.com
Encontrado: Secção "Help Desk"
Ticket criado com:
  - sectionId: uuid-helpdesk
  - departmentId: uuid-suporte
  - directionId: uuid-ti
  - assigneeId: gestor-helpdesk
```

#### Cenário 2: Email para Departamento
```
Email para: suporte@tatusolutions.com
Encontrado: Departamento "Suporte"
Ticket criado com:
  - departmentId: uuid-suporte
  - directionId: uuid-ti
  - assigneeId: gestor-suporte
```

#### Cenário 3: Email para Direção
```
Email para: ti@tatusolutions.com
Encontrado: Direção "TI"
Ticket criado com:
  - directionId: uuid-ti
  - assigneeId: gestor-ti
```

#### Cenário 4: Email Sem Roteamento
```
Email para: noreply@tatusolutions.com (sem CC)
Não encontrado: Nenhuma unidade
Ticket criado com:
  - Sem directionId/departmentId/sectionId
  - Sem assigneeId
  - Fica na fila geral
```

## Configuração de Alias/Forwarding

### No Titan Email (Recomendado)
1. Aceder ao painel do Titan Email
2. Ir para "Email Forwarding" ou "Aliases"
3. Criar regras:
   ```
   ti@tatusolutions.com → noreply@tatusolutions.com
   suporte@tatusolutions.com → noreply@tatusolutions.com
   helpdesk@tatusolutions.com → noreply@tatusolutions.com
   ```

### No Gmail (Alternativa)
1. Configurações → Encaminhamento e POP/IMAP
2. Adicionar endereço de encaminhamento: `noreply@tatusolutions.com`
3. Confirmar encaminhamento

### No cPanel (Alternativa)
1. Email Accounts → Forwarders
2. Adicionar forwarder:
   - De: `ti@tatusolutions.com`
   - Para: `noreply@tatusolutions.com`

## Vantagens do Sistema

### 1. Centralização
- ✅ Uma única caixa IMAP para monitorar
- ✅ Credenciais centralizadas
- ✅ Mais fácil de manter

### 2. Roteamento Inteligente
- ✅ Tickets automaticamente atribuídos
- ✅ Hierarquia organizacional respeitada
- ✅ Gestores notificados automaticamente

### 3. Escalabilidade
- ✅ Adicionar novos emails sem configurar IMAP
- ✅ Apenas criar alias/forwarding
- ✅ Roteamento automático

### 4. Flexibilidade
- ✅ Clientes podem usar emails específicos
- ✅ Emails genéricos também funcionam
- ✅ Suporta múltiplos destinatários (CC, BCC)

## Limitações

### 1. Requer Alias/Forwarding
- ❌ Não funciona com emails diretos para unidades
- ✅ Solução: Configurar forwarding no servidor de email

### 2. Uma Caixa IMAP
- ❌ Não suporta múltiplas caixas IMAP simultaneamente
- ✅ Solução: Usar forwarding para centralizar

### 3. Delay de Processamento
- ⏱️ Emails verificados a cada 60 segundos
- ✅ Solução: Reduzir intervalo se necessário (não recomendado < 30s)

## Testes

### Teste 1: Email para Direção
```bash
# Enviar email
Para: noreply@tatusolutions.com
CC: ti@tatusolutions.com
Assunto: Teste de roteamento
Corpo: Este é um teste

# Verificar logs
tail -f backend/logs/combined.log | grep -i "roteado\|direction"

# Resultado esperado
📍 Email roteado para direction: TI
✅ Novo ticket criado: #000123
```

### Teste 2: Email para Departamento
```bash
# Enviar email
Para: noreply@tatusolutions.com
CC: suporte@tatusolutions.com
Assunto: Preciso de ajuda
Corpo: Não consigo acessar o sistema

# Resultado esperado
📍 Email roteado para department: Suporte
✅ Ticket atribuído ao gestor do departamento
```

### Teste 3: Email para Secção
```bash
# Enviar email
Para: noreply@tatusolutions.com
CC: helpdesk@tatusolutions.com
Assunto: Reset de senha
Corpo: Esqueci minha senha

# Resultado esperado
📍 Email roteado para section: Help Desk
✅ Ticket com sectionId, departmentId e directionId
```

## Troubleshooting

### Problema: Email não cria ticket
**Verificar:**
1. ✅ IMAP está conectado? `tail -f backend/logs/combined.log | grep IMAP`
2. ✅ Email chegou na caixa? Verificar webmail
3. ✅ Email foi marcado como lido? Verificar flag UNSEEN

### Problema: Ticket criado mas não roteado
**Verificar:**
1. ✅ Email da unidade está correto no banco de dados
2. ✅ Campo `to` do email contém o email da unidade
3. ✅ OrganizationId está correto
4. ✅ Logs mostram tentativa de roteamento

### Problema: Ticket roteado mas não atribuído
**Verificar:**
1. ✅ Unidade tem `managerId` definido
2. ✅ Gestor existe e está ativo
3. ✅ Gestor pertence à mesma organização

## Melhorias Futuras

### 1. Suporte a Múltiplas Caixas IMAP
```javascript
// Configurar múltiplas caixas
imapAccounts: [
  { email: 'noreply@...', host: '...', user: '...', pass: '...' },
  { email: 'ti@...', host: '...', user: '...', pass: '...' },
  { email: 'suporte@...', host: '...', user: '...', pass: '...' }
]
```

### 2. Webhook de Email
```javascript
// Receber emails via webhook em vez de IMAP
POST /api/webhooks/email
{
  from: "...",
  to: "...",
  subject: "...",
  body: "..."
}
```

### 3. Roteamento por Domínio
```javascript
// Rotear baseado no domínio do remetente
cliente@empresa-a.com → Cliente A
cliente@empresa-b.com → Cliente B
```

### 4. Regras de Roteamento Avançadas
```javascript
// Rotear baseado em palavras-chave
subject.includes('urgente') → Prioridade Alta
subject.includes('fatura') → Departamento Financeiro
```

## Conclusão

O sistema de roteamento de email funciona através de:
1. ✅ Monitoramento de uma caixa IMAP central
2. ✅ Análise do campo `To:` do email
3. ✅ Busca da unidade organizacional por email
4. ✅ Criação de ticket com roteamento automático
5. ✅ Atribuição ao gestor responsável

**Para funcionar corretamente, é necessário:**
- Configurar alias/forwarding no servidor de email
- Definir emails nas unidades organizacionais
- Manter IMAP conectado e funcionando

**Não é possível:**
- Receber emails enviados diretamente para emails das unidades sem forwarding
- Monitorar múltiplas caixas IMAP simultaneamente (sem modificação do código)
