# 🧪 Guia de Teste - Sistema de Email

## ✅ Status Atual
- Backend: Rodando (porta 4003)
- IMAP: Conectado (imap.titan.email)
- SMTP: Configurado (smtp.titan.email)
- Verificação: A cada 60 segundos

---

## 📧 Teste 1: Utilizador Registado com Roteamento

### Enviar Email
```
De: tenant-admin@empresademo.com
Para: noreply@tatusolutions.com
CC: sellerreview24@gmail.com
Assunto: Teste de criação de ticket via email
Corpo:
  Olá,
  
  Este é um teste do sistema de criação de tickets via email.
  
  Por favor, confirme que o ticket foi criado corretamente.
  
  Obrigado!
```

### Resultado Esperado
✅ Ticket criado automaticamente  
✅ Roteado para direção TI  
✅ Atribuído ao gestor da TI  
✅ Email de confirmação recebido em tenant-admin@empresademo.com  

### Verificar Logs
```bash
# Terminal 1: Monitorar logs gerais
tail -f backend/logs/combined.log | grep -E "(📧|📍|✅|👤)"

# Terminal 2: Monitorar erros
tail -f backend/logs/error.log

# Logs esperados:
# info: 📧 Processando e-mail de: tenant-admin@empresademo.com
# info: 👤 Utilizador encontrado (organization_users)
# info: 📍 Email roteado para direction: TI
# info: 👤 Ticket atribuído ao gestor: 55a8f2b5-001c-40a6-81b6-66bbebc4d9ec
# info: ✅ Novo ticket criado: #000XXX
# info: ✉️ Auto-resposta enviada para: tenant-admin@empresademo.com
```

### Verificar no Portal
1. Aceder ao Portal Organização: http://localhost:5173
2. Login: tenant-admin@empresademo.com / TenantAdmin@123
3. Ir para "Tickets"
4. Verificar se novo ticket aparece
5. Abrir ticket e verificar:
   - ✅ Assunto correto
   - ✅ Descrição correta
   - ✅ Status: "novo"
   - ✅ Direção: TI
   - ✅ Atribuído ao gestor
   - ✅ Source: "email"

---

## 📧 Teste 2: Utilizador NÃO Registado

### Enviar Email
```
De: teste-nao-registado@example.com
Para: noreply@tatusolutions.com
Assunto: Teste de utilizador não registado
Corpo:
  Olá,
  
  Este email é de um utilizador que não está registado no sistema.
  
  O sistema deve rejeitar e enviar email de notificação.
```

### Resultado Esperado
❌ Ticket NÃO criado  
📧 Email de notificação recebido em teste-nao-registado@example.com  
📧 Assunto: "Re: Teste de utilizador não registado - Registo Necessário"  

### Verificar Logs
```bash
tail -f backend/logs/combined.log | grep -E "(⚠️|❌|📧)"

# Logs esperados:
# info: 📧 Processando e-mail de: teste-nao-registado@example.com
# warn: ⚠️ Email recebido de utilizador não registado: teste-nao-registado@example.com
# info: 📧 Email de notificação enviado para: teste-nao-registado@example.com
```

### Verificar Email Recebido
Verificar caixa de entrada de `teste-nao-registado@example.com`:
- ✅ Email recebido com assunto "Registo Necessário"
- ✅ Conteúdo explica que precisa de se registar
- ✅ Link para aceder ao portal

---

## 📧 Teste 3: Email Sem Roteamento

### Enviar Email
```
De: tenant-admin@empresademo.com
Para: noreply@tatusolutions.com
(SEM CC - sem email de unidade organizacional)
Assunto: Teste sem roteamento
Corpo:
  Este ticket não deve ser roteado para nenhuma unidade específica.
```

### Resultado Esperado
✅ Ticket criado  
⚠️ SEM directionId/departmentId/sectionId  
⚠️ SEM assigneeId (não atribuído)  
✅ Fica na fila geral  

### Verificar Logs
```bash
tail -f backend/logs/combined.log | grep -E "(📧|⚠️|✅)"

# Logs esperados:
# info: 📧 Processando e-mail de: tenant-admin@empresademo.com
# info: 👤 Utilizador encontrado
# info: ✅ Novo ticket criado: #000XXX
# (Sem log de roteamento)
```

---

## 📧 Teste 4: Resposta a Ticket Existente

### Passo 1: Criar Ticket Inicial
Enviar email conforme Teste 1 e anotar o número do ticket (ex: #000123)

### Passo 2: Responder ao Email de Confirmação
```
De: tenant-admin@empresademo.com
Para: noreply@tatusolutions.com
Assunto: Re: [#000123] Teste de criação de ticket via email
Corpo:
  Obrigado pela confirmação!
  
  Gostaria de adicionar mais informações ao ticket.
  
  Esta é uma resposta ao ticket existente.
```

### Resultado Esperado
✅ Comentário adicionado ao ticket #000123  
✅ Status atualizado (se estava fechado)  
✅ Gestor notificado  

### Verificar Logs
```bash
tail -f backend/logs/combined.log | grep -E "(📧|📎|✅)"

# Logs esperados:
# info: 📧 Processando e-mail de: tenant-admin@empresademo.com
# info: 📎 Adicionando resposta ao ticket #000123
# info: ✅ Comentário adicionado
```

### Verificar no Portal
1. Abrir ticket #000123
2. Verificar se novo comentário aparece
3. Verificar conteúdo do comentário

---

## 📧 Teste 5: Email com Anexos

### Enviar Email
```
De: tenant-admin@empresademo.com
Para: noreply@tatusolutions.com
CC: sellerreview24@gmail.com
Assunto: Teste com anexos
Corpo:
  Este email contém anexos que devem ser salvos no ticket.
Anexos:
  - screenshot.png
  - documento.pdf
```

### Resultado Esperado
✅ Ticket criado  
✅ Anexos salvos no ticket  
✅ Anexos visíveis no portal  

### Verificar no Portal
1. Abrir ticket criado
2. Verificar secção de anexos
3. Verificar se anexos podem ser baixados

---

## 🔍 Comandos Úteis de Debug

### Verificar Conexão IMAP
```bash
tail -f backend/logs/combined.log | grep IMAP
```

### Verificar Processamento de Emails
```bash
tail -f backend/logs/combined.log | grep "📧\|📬"
```

### Verificar Erros
```bash
tail -f backend/logs/error.log
```

### Verificar Todos os Eventos de Email
```bash
tail -f backend/logs/combined.log | grep -E "(📧|📥|📬|📍|👤|✅|❌|⚠️|📎|✉️)"
```

### Verificar Últimos 50 Logs
```bash
tail -50 backend/logs/combined.log
```

### Testar Conexão IMAP Manualmente
```bash
cd backend
node test-imap-connection.js
```

---

## 📊 Checklist de Validação

### Teste 1: Utilizador Registado ✅
- [ ] Email enviado
- [ ] Logs mostram processamento
- [ ] Ticket criado no sistema
- [ ] Ticket roteado corretamente
- [ ] Ticket atribuído ao gestor
- [ ] Email de confirmação recebido
- [ ] Ticket visível no portal

### Teste 2: Utilizador NÃO Registado ❌
- [ ] Email enviado
- [ ] Logs mostram rejeição
- [ ] Ticket NÃO criado
- [ ] Email de notificação recebido
- [ ] Conteúdo do email correto

### Teste 3: Email Sem Roteamento ⚠️
- [ ] Email enviado
- [ ] Ticket criado
- [ ] Ticket SEM roteamento
- [ ] Ticket SEM atribuição
- [ ] Ticket na fila geral

### Teste 4: Resposta a Ticket ✅
- [ ] Ticket inicial criado
- [ ] Resposta enviada
- [ ] Comentário adicionado
- [ ] Comentário visível no portal

### Teste 5: Email com Anexos ✅
- [ ] Email com anexos enviado
- [ ] Ticket criado
- [ ] Anexos salvos
- [ ] Anexos visíveis no portal
- [ ] Anexos podem ser baixados

---

## ⚠️ Troubleshooting

### Problema: Email não cria ticket
**Verificar:**
1. IMAP está conectado?
   ```bash
   tail -f backend/logs/combined.log | grep IMAP
   ```
2. Email chegou na caixa?
   - Aceder webmail: https://titan.email
   - Login: noreply@tatusolutions.com / Tatu2025*E
   - Verificar caixa de entrada

3. Email foi marcado como lido?
   - Sistema só processa emails UNSEEN (não lidos)

### Problema: Ticket criado mas não roteado
**Verificar:**
1. Email da unidade está correto no banco de dados
   ```sql
   SELECT name, email FROM directions WHERE organization_id = '20644329-f0a4-4987-874a-0f629e2dde61';
   ```

2. Campo `to` ou `cc` do email contém o email da unidade

3. Logs mostram tentativa de roteamento
   ```bash
   tail -f backend/logs/combined.log | grep "📍"
   ```

### Problema: Ticket roteado mas não atribuído
**Verificar:**
1. Unidade tem `managerId` definido
   ```sql
   SELECT name, email, manager_id FROM directions WHERE email = 'sellerreview24@gmail.com';
   ```

2. Gestor existe e está ativo
   ```sql
   SELECT id, name, email, is_active FROM organization_users WHERE id = '55a8f2b5-001c-40a6-81b6-66bbebc4d9ec';
   ```

### Problema: Email de confirmação não recebido
**Verificar:**
1. SMTP está configurado
   ```bash
   tail -f backend/logs/combined.log | grep SMTP
   ```

2. Verificar pasta de spam

3. Verificar logs de envio
   ```bash
   tail -f backend/logs/combined.log | grep "✉️"
   ```

---

## 📝 Notas Importantes

### Tempo de Processamento
- Emails são verificados a cada 60 segundos
- Pode demorar até 1 minuto para processar novo email
- Para testes mais rápidos, pode reduzir intervalo (não recomendado < 30s)

### Emails Duplicados
- Sistema mantém cache de emails processados
- Evita processar o mesmo email múltiplas vezes
- Cache limpa automaticamente a cada hora

### Formato do Assunto para Respostas
- Sistema detecta referência ao ticket no assunto: `[#000123]`
- Também detecta por headers: `In-Reply-To`, `References`
- Também detecta por assunto similar (últimas 24h)

### Anexos
- Salvos em: `backend/uploads/tickets/{ticketId}/`
- Nome do ficheiro: `{uuid}-{nome-original}`
- Tamanho máximo: Configurável no servidor de email

---

## ✅ Resultado Esperado Final

Após completar todos os testes:

1. ✅ Sistema processa emails automaticamente
2. ✅ Apenas utilizadores registados criam tickets
3. ✅ Roteamento funciona corretamente
4. ✅ Atribuição ao gestor funciona (quando existe)
5. ✅ Emails de confirmação são enviados
6. ✅ Emails de notificação para não registados funcionam
7. ✅ Respostas adicionam comentários aos tickets
8. ✅ Anexos são salvos corretamente
9. ✅ Sistema é estável e confiável

---

**Boa sorte com os testes!** 🚀

Se encontrar algum problema, verificar os logs e consultar a secção de Troubleshooting.
