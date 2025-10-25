# 📧 Configuração de Notificações por Email

## ✅ **IMPLEMENTADO**

O sistema de notificações por email está completamente funcional e envia emails automáticos para:

### **Eventos Notificados:**

1. ✅ **Novo Ticket Criado** (com atribuição)
   - Notifica o agente atribuído
   - Inclui detalhes do ticket e link direto

2. ✅ **Ticket Atribuído/Reatribuído**
   - Notifica o novo agente responsável
   - Mostra quem fez a atribuição

3. ✅ **Mudança de Status**
   - Notifica solicitante e agente atribuído
   - Mostra status anterior e novo

4. ✅ **Novo Comentário**
   - Comentários públicos: notifica solicitante e agente
   - Comentários internos: notifica apenas agentes
   - Agente comentando: notifica o cliente com template especial

---

## 🔧 **CONFIGURAÇÃO**

### **Opção 1: Gmail (Recomendado para testes)**

1. **Criar Senha de App do Gmail:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Crie uma senha de app para "Mail"
   - Copie a senha gerada (16 caracteres)

2. **Configurar `.env`:**

```bash
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # Senha de app
SMTP_FROM=seu-email@gmail.com
SMTP_FROM_NAME=TatuTicket

# Frontend URLs (para links nos emails)
FRONTEND_URL=http://localhost:5173
CLIENT_PORTAL_URL=http://localhost:3001
```

---

### **Opção 2: Outlook/Office365**

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
SMTP_FROM=seu-email@outlook.com
SMTP_FROM_NAME=TatuTicket
```

---

### **Opção 3: SendGrid (Produção)**

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx  # API Key do SendGrid
SMTP_FROM=noreply@seudominio.com
SMTP_FROM_NAME=TatuTicket
```

---

### **Opção 4: Amazon SES (Produção)**

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-access-key
SMTP_PASS=seu-secret-key
SMTP_FROM=noreply@seudominio.com
SMTP_FROM_NAME=TatuTicket
```

---

## 🧪 **MODO DE TESTE**

Se as configurações SMTP não estiverem definidas, o sistema roda em **modo de teste**:

- Emails **NÃO são enviados**
- Logs mostram que o email seria enviado
- Funcionalidades do sistema continuam funcionando normalmente

**Vantagem:** Desenvolvimento sem precisar configurar SMTP

---

## 📝 **TEMPLATES DE EMAIL**

Todos os emails usam templates HTML responsivos com:

- ✅ Design moderno com gradientes
- ✅ Branding TatuTicket
- ✅ Links diretos para tickets
- ✅ Informações formatadas (badges de prioridade, etc.)
- ✅ Versão texto simples (fallback)
- ✅ Footer com informações

### **Exemplos de Notificações:**

#### **1. Novo Ticket**
```
Assunto: Novo Ticket #TKT-20251023-1234 - Erro no login

Olá João Silva,

Um novo ticket foi criado e atribuído a você:

┌─────────────────────────────────
│ Ticket: #TKT-20251023-1234
│ Assunto: Erro no login
│ Prioridade: 🔴 Alta
│ Solicitante: Maria Santos (maria@empresa.com)
└─────────────────────────────────

Descrição:
Não consigo fazer login no sistema...

[Ver Ticket] (botão)
```

#### **2. Novo Comentário**
```
Assunto: Novo comentário no ticket #TKT-20251023-1234

Olá Maria Santos,

Há uma nova resposta no seu ticket:

┌─────────────────────────────────
│ Ticket: #TKT-20251023-1234 - Erro no login
│ Respondido por: João Silva
└─────────────────────────────────

Resposta:
Verifiquei o problema. Por favor tente limpar...

[Ver Ticket] (botão)
```

---

## 🔍 **VERIFICAÇÃO**

### **Testar Configuração:**

1. **Iniciar o backend:**
```bash
cd backend
npm run dev
```

2. **Verificar logs de conexão:**
```
[INFO] Servidor SMTP conectado e pronto para enviar emails
```

3. **Criar um ticket com atribuição:**
   - Criar ticket no portal
   - Atribuir a um agente
   - Verificar email recebido

### **Debug de Problemas:**

```bash
# Ver logs em tempo real
tail -f backend/logs/combined.log | grep -i email

# Logs mostram:
# ✅ Email enviado: <message-id> para agente@empresa.com
# ❌ Erro ao enviar email: <detalhes>
```

---

## 🔐 **SEGURANÇA**

### **Boas Práticas:**

1. ✅ **Nunca commitar senhas no Git**
   - Use `.env` (já no `.gitignore`)
   - Use variáveis de ambiente em produção

2. ✅ **Use senhas de app** (Gmail)
   - Mais seguro que senha principal
   - Pode ser revogada sem afetar a conta

3. ✅ **Rate limiting**
   - Sistema já tem proteção contra spam
   - Emails são enviados async (não bloqueiam)

4. ✅ **Validação de email**
   - Sistema valida formato de email
   - Ignora emails inválidos

---

## 📊 **MONITORAMENTO**

### **Logs de Email:**

Todos os envios são registrados:

```javascript
// Sucesso
[INFO] Email enviado: abc123@messageId para cliente@empresa.com

// Falha
[ERROR] Erro ao enviar email: Connection timeout
```

### **Métricas (futuro):**

- Total de emails enviados
- Taxa de entrega
- Emails com erro
- Tipos de notificação mais comuns

---

## 🚀 **MELHORIAS FUTURAS**

### **Fase 2:**

- [ ] **Preferências de notificação por usuário**
  - Escolher quais eventos receber
  - Frequência (imediato, digest diário)

- [ ] **Templates customizáveis**
  - Admin pode editar templates
  - Múltiplos idiomas

- [ ] **Notificações in-app**
  - Badge de novas notificações
  - Centro de notificações

- [ ] **Webhooks**
  - Integração com Slack/Teams
  - Webhooks personalizados

---

## 📚 **REFERÊNCIAS**

- [Nodemailer Docs](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

- [ ] Criar senha de app (Gmail) ou configurar SMTP
- [ ] Copiar `.env.example` para `.env`
- [ ] Preencher variáveis SMTP_*
- [ ] Definir URLs do frontend
- [ ] Reiniciar backend
- [ ] Verificar logs de conexão SMTP
- [ ] Testar criando ticket com atribuição
- [ ] Confirmar recebimento de email

---

**Status:** ✅ Pronto para produção (após configurar SMTP)
