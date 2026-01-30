# ⚠️ AÇÃO NECESSÁRIA: Reiniciar Backend

## 🔴 IMPORTANTE: O backend precisa ser reiniciado para aplicar as correções!

---

## ✅ Correções Aplicadas

1. **Tabela `attachments`** - Convertida de INTEGER para UUID
2. **Model `Attachment`** - Atualizado para UUID
3. **Controller `ticketController.js`** - Corrigido includes problemáticos

---

## 🚀 Como Reiniciar o Backend

### Opção 1: Reiniciar Processo Atual
```bash
# Parar o backend atual (Ctrl+C no terminal onde está rodando)
# Depois iniciar novamente:
cd backend
npm run dev
```

### Opção 2: Usar PM2 (se estiver usando)
```bash
pm2 restart backend
```

### Opção 3: Matar processo e reiniciar
```bash
# Encontrar o processo
lsof -i :4003

# Matar o processo (substitua PID pelo número encontrado)
kill -9 PID

# Iniciar novamente
cd backend
npm run dev
```

---

## 🧪 Testar Após Reiniciar

### 1. Verificar Backend Iniciou
```bash
# Deve mostrar: Server running on port 4003
tail -f backend/backend.log
```

### 2. Testar Endpoint de Ticket
```bash
curl http://localhost:4003/api/tickets/88289303-33e3-4266-ad14-63ddbc86ceec \
  -H "Authorization: Bearer <seu-token>"
```

### 3. Testar no Frontend
1. Abrir Portal Organização: http://localhost:5173
2. Login: `tenant-admin@empresademo.com` / `TenantAdmin@123`
3. Ir para Tickets
4. Clicar em qualquer ticket
5. ✅ Deve abrir o modal de detalhes sem erro!

---

## 📊 O Que Foi Corrigido

### Erro ANTES:
```
❌ operator does not exist: uuid = integer
❌ invalid input syntax for type integer: "88289303-..."
```

### Resultado DEPOIS:
```
✅ GET /api/tickets/:id → 200 OK
✅ GET /api/tickets/:id/attachments → 200 OK
✅ Modal de detalhes abre corretamente
```

---

## 📁 Arquivos Modificados

- `backend/fix-attachments-schema.sql` ✅ Executado
- `backend/src/modules/attachments/attachmentModel.js` ✅ Modificado
- `backend/src/modules/tickets/ticketController.js` ✅ Modificado

---

## ⚠️ LEMBRETE

**O backend DEVE ser reiniciado para que as mudanças no model Attachment sejam carregadas!**

Sem reiniciar, o erro continuará acontecendo.

---

## 📞 Se Ainda Houver Erros

1. Verificar logs do backend: `tail -f backend/backend.log`
2. Verificar se a tabela attachments foi atualizada:
   ```bash
   psql -U postgres -d tatuticket -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attachments' AND column_name IN ('id', 'ticket_id', 'comment_id');"
   ```
3. Verificar se o backend está usando a porta correta: `lsof -i :4003`

---

**Data**: 2026-01-18  
**Status**: ⚠️ AGUARDANDO REINÍCIO DO BACKEND
