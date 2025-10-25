# 📧 Configuração de E-mail Inbox para Tickets

## Visão Geral

O serviço de E-mail Inbox permite criar tickets automaticamente a partir de e-mails recebidos. O sistema monitora uma caixa de entrada IMAP e processa novos e-mails automaticamente.

## Funcionalidades

✅ **Criar Tickets Automaticamente** - E-mails novos são convertidos em tickets  
✅ **Responder Tickets** - E-mails com `#TICKET-XXXX` no assunto adicionam comentários  
✅ **Processar Anexos** - Suporte a anexos de e-mail  
✅ **Polling Automático** - Verifica e-mails periodicamente  
✅ **Notificações** - Sistema de notificações integrado  

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```bash
# Ativar serviço de e-mail inbox
ENABLE_EMAIL_INBOX=true

# Configurações IMAP (receber e-mails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=suporte@suaempresa.com
IMAP_PASS=sua-senha-ou-app-password
IMAP_TLS=true

# Configurações SMTP (enviar e-mails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=suporte@suaempresa.com
SMTP_PASS=sua-senha-ou-app-password
SMTP_FROM_NAME=TatuTicket Support
SMTP_FROM=suporte@suaempresa.com

# Intervalo de polling (em milissegundos)
EMAIL_POLL_INTERVAL=60000  # 1 minuto
```

### 2. Gmail - App Password

Se usar Gmail, você precisa de uma **App Password**:

1. Acesse [Google Account Security](https://myaccount.google.com/security)
2. Ative **2-Step Verification**
3. Vá em **App Passwords**
4. Crie uma nova senha para "Mail"
5. Use essa senha no `IMAP_PASS` e `SMTP_PASS`

### 3. Outros Provedores

**Microsoft 365 / Outlook:**
```bash
IMAP_HOST=outlook.office365.com
SMTP_HOST=smtp.office365.com
```

**Yahoo:**
```bash
IMAP_HOST=imap.mail.yahoo.com
SMTP_HOST=smtp.mail.yahoo.com
```

**Servidor Próprio:**
```bash
IMAP_HOST=mail.suaempresa.com
SMTP_HOST=mail.suaempresa.com
IMAP_PORT=993
SMTP_PORT=465 ou 587
```

## Como Funciona

### Criação de Tickets

1. Cliente envia e-mail para `suporte@suaempresa.com`
2. Sistema verifica caixa de entrada a cada 1 minuto
3. E-mail é parseado e ticket criado automaticamente
4. Solicitante recebe confirmação por e-mail

**Exemplo de E-mail:**
```
De: cliente@exemplo.com
Para: suporte@suaempresa.com
Assunto: Problema com sistema de vendas

Descrição:
Não consigo acessar o módulo de vendas...
```

**Resultado:**
- ✅ Ticket #TICKET-0001 criado
- ✅ Status: Novo
- ✅ Prioridade: Média
- ✅ Source: email
- ✅ Solicitante: cliente@exemplo.com

### Responder Tickets

Para adicionar comentário a um ticket existente, basta responder o e-mail incluindo o número do ticket no assunto:

**Exemplo:**
```
Assunto: RE: #TICKET-0001 Problema com sistema de vendas

Olá, tentei novamente mas continua com o mesmo erro...
```

**Resultado:**
- ✅ Comentário adicionado ao TICKET-0001
- ✅ Agentes notificados

## Monitoramento

### Logs

O sistema registra todas as operações:

```bash
# Ver logs em tempo real
npm run dev

# Logs registrados:
📧 Conexão IMAP estabelecida
📬 Iniciando polling de e-mails a cada 60 segundos
📨 1 novo(s) e-mail(s) encontrado(s)
✅ Ticket #TICKET-0001 criado a partir de e-mail
✅ E-mail processado com sucesso
```

### Debug

Para debug detalhado, ajuste o nível de log:

```bash
LOG_LEVEL=debug npm run dev
```

## Segurança

### Validações

- ✅ Apenas e-mails de usuários cadastrados criam tickets
- ✅ Apenas usuários da mesma organização podem comentar
- ✅ Conexão TLS/SSL obrigatória
- ✅ Senhas não são logadas

### Recomendações

1. **Use App Passwords**, não a senha principal
2. **Limite permissões** da conta de e-mail
3. **Monitore logs** regularmente
4. **Configure filtros** no e-mail para evitar spam

## Solução de Problemas

### E-mails não são processados

1. Verifique `ENABLE_EMAIL_INBOX=true`
2. Confirme credenciais IMAP
3. Verifique logs de erro
4. Teste conexão manualmente

### Tickets não são criados

1. Verifique se remetente é usuário cadastrado
2. Confirme que e-mail não tem `#TICKET-` no assunto (seria resposta)
3. Verifique logs de erro

### Performance

- **Polling Interval:** Ajuste `EMAIL_POLL_INTERVAL` conforme necessário
- **Carga Baixa:** 60000ms (1 minuto)
- **Carga Alta:** 30000ms (30 segundos)
- **Muito Baixo:** Pode sobrecarregar servidor IMAP

## Roadmap

### Próximas Implementações

- [ ] **Webhook** - Alternativa ao polling
- [ ] **Filtros de spam** - Anti-spam integrado
- [ ] **Templates de resposta** - Respostas automáticas
- [ ] **Categorização automática** - IA para categorizar tickets
- [ ] **Múltiplas caixas** - Suporte a várias caixas de entrada
- [ ] **Rich text** - Preservar formatação HTML
- [ ] **Assinaturas** - Remover assinaturas de e-mail

## Suporte

Para problemas ou dúvidas:
- **Logs:** Verifique logs do servidor
- **Documentação:** Este arquivo
- **Issues:** Abra um issue no repositório
