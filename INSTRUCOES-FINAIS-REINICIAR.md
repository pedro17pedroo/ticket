# Instruções Finais - Reiniciar Backend

## 🎯 Ação Necessária

O backend precisa ser **reiniciado** para que o cron job de verificação de subscrições seja inicializado.

---

## ⚠️ Por Que Reiniciar?

O servidor backend está rodando desde **09/03/2026** (antes da implementação do sistema de subscrição).

Para que o cron job de verificação de subscrições seja ativado, é necessário reiniciar o servidor.

---

## 🔄 Como Reiniciar

### Opção 1: Reiniciar via npm (Recomendado)

```bash
cd backend
npm restart
```

### Opção 2: Parar e Iniciar Manualmente

```bash
# Parar o servidor
cd backend
npm stop

# Ou matar o processo manualmente
pkill -f "node.*server.js"

# Iniciar novamente
npm start
```

### Opção 3: Reiniciar via nodemon (Se estiver usando)

```bash
# O nodemon reinicia automaticamente ao salvar arquivos
# Ou você pode forçar o restart:
cd backend
rs
```

---

## ✅ Verificar se Funcionou

Após reiniciar, você deve ver estas mensagens nos logs:

```
🚀 Servidor rodando na porta 4003
📍 Ambiente: development
🔗 API: http://localhost:4003/api
🔌 WebSocket: ws://localhost:4003
❤️  Health: http://localhost:4003/api/health
✅ Serviço de processamento de e-mail iniciado
✅ Monitor de SLA iniciado
✅ Monitor de Health Check iniciado
✅ Job de limpeza de sessões iniciado
✅ Job de verificação de subscrições iniciado (diariamente às 9h)  ← ESTA LINHA
```

---

## 🔍 Verificar Logs

### Ver logs em tempo real:

```bash
cd backend
tail -f logs/combined.log
```

### Buscar mensagem específica:

```bash
cd backend
grep "Job de verificação de subscrições" logs/combined.log
```

### Ver últimas 50 linhas:

```bash
cd backend
tail -n 50 logs/combined.log
```

---

## 📊 Status Atual

### Backend:
- ✅ Código implementado
- ✅ node-cron instalado (v4.2.1)
- ✅ SMTP configurado
- ⚠️ **Servidor precisa ser reiniciado**

### Após Reiniciar:
- ✅ Cron job será inicializado
- ✅ Verificação diária às 9h será ativada
- ✅ Notificações automáticas funcionarão
- ✅ Emails serão enviados

---

## 🕐 Quando o Cron Job Executa?

O cron job executa **automaticamente todos os dias às 9h** (timezone: Africa/Luanda).

### O que ele faz:

1. Verifica trials expirando (7, 3, 1 dia antes)
2. Verifica subscrições ativas expirando
3. Verifica subscrições já expiradas
4. Cria notificações para admins
5. Envia emails de lembrete
6. Atualiza status automaticamente (trial → suspended, active → past_due)

---

## 🧪 Testar Manualmente (Opcional)

Se quiser testar o cron job sem esperar até às 9h, você pode criar um endpoint temporário:

### 1. Adicionar endpoint de teste (temporário):

```javascript
// backend/src/routes/index.js

import { runSubscriptionCheckNow } from '../jobs/subscriptionCheckJob.js';

// Adicionar esta rota (apenas para testes)
router.post('/test/subscription-check', 
  authenticate, 
  authorize('super-admin'), 
  async (req, res) => {
    try {
      await runSubscriptionCheckNow();
      res.json({ 
        success: true, 
        message: 'Verificação executada com sucesso' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
);
```

### 2. Testar via curl:

```bash
curl -X POST http://localhost:4003/api/test/subscription-check \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

### 3. Verificar logs:

```bash
cd backend
tail -f logs/combined.log | grep -E "(subscrição|subscription)"
```

---

## 📝 Checklist Pós-Reinício

Após reiniciar o backend, verificar:

- [ ] Servidor iniciou sem erros
- [ ] Mensagem "Job de verificação de subscrições iniciado" apareceu nos logs
- [ ] API está respondendo: http://localhost:4003/api/health
- [ ] Frontend consegue se conectar ao backend
- [ ] Outros jobs também foram inicializados (SLA, Health Check, etc.)

---

## 🎉 Após Reiniciar

O sistema estará **100% funcional** com:

- ✅ Verificação automática de subscrições
- ✅ Notificações automáticas
- ✅ Emails de lembrete
- ✅ Alertas visuais no frontend
- ✅ Renovação de subscrição
- ✅ Todos os filtros funcionando

---

## 🆘 Problemas?

### Erro: "Cannot find module 'node-cron'"

```bash
cd backend
npm install node-cron
npm restart
```

### Erro: "SMTP connection failed"

Verificar configurações no `.env`:
```env
SMTP_HOST=smtp.titan.email
SMTP_PORT=587
SMTP_USER=noreply@tatusolutions.com
SMTP_PASS=Tatu2025*E
```

### Erro: "Port 4003 already in use"

```bash
# Matar processo na porta 4003
lsof -ti:4003 | xargs kill -9

# Ou no Windows:
netstat -ano | findstr :4003
taskkill /PID <PID> /F

# Iniciar novamente
cd backend
npm start
```

---

## 📞 Suporte

Se encontrar problemas após reiniciar:

1. Verificar logs de erro: `backend/logs/error3.log`
2. Verificar se todas as dependências estão instaladas: `npm install`
3. Verificar se o banco de dados está rodando
4. Verificar se o Redis está rodando
5. Verificar se o MongoDB está rodando

---

**Data:** 05/04/2026  
**Status:** ⚠️ AGUARDANDO REINÍCIO DO BACKEND  
**Ação:** Executar `cd backend && npm restart`

**Após reiniciar:** ✅ Sistema 100% funcional!
