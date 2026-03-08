# 🛠️ Comandos Úteis - Integração TPagamento

## 🚀 Setup Inicial

### 1. Configurar Ambiente
```bash
# Copiar arquivo de exemplo
cp backend/.env.example backend/.env

# Editar variáveis
nano backend/.env
# ou
code backend/.env
```

### 2. Instalar Dependências
```bash
# Backend
cd backend
npm install

# Portal SaaS
cd ../portalSaaS
npm install

# Portal Organização
cd ../portalOrganizaçãoTenant
npm install
```

### 3. Executar Migrations
```bash
cd backend
npm run migrate

# Ou com Sequelize CLI
npx sequelize-cli db:migrate

# Reverter última migration
npx sequelize-cli db:migrate:undo

# Reverter todas
npx sequelize-cli db:migrate:undo:all
```

---

## 🏃 Executar Aplicação

### Desenvolvimento
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Portal SaaS
cd portalSaaS
npm run dev

# Terminal 3 - Portal Organização
cd portalOrganizaçãoTenant
npm run dev
```

### Produção
```bash
# Backend
cd backend
npm run build
npm start

# Frontend (build)
cd portalSaaS
npm run build

cd ../portalOrganizaçãoTenant
npm run build
```

---

## 🧪 Testes

### Script Automatizado
```bash
# Teste completo
cd backend
./test-payment-integration.sh

# Com variáveis customizadas
API_URL=http://localhost:4003/api \
TEST_EMAIL=admin@example.com \
TEST_PASSWORD=senha123 \
./test-payment-integration.sh
```

### Testes Manuais com cURL

#### Login
```bash
# Fazer login e obter token
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "senha123"
  }' | jq

# Salvar token em variável
export TOKEN=$(curl -s -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}' \
  | jq -r '.token')

echo $TOKEN
```

#### Criar Pagamentos
```bash
# E-Kwanza
curl -X POST http://localhost:4003/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "ekwanza",
    "customerName": "João Silva",
    "customerEmail": "joao@example.com",
    "customerPhone": "923456789",
    "description": "Teste E-Kwanza"
  }' | jq

# GPO (Multicaixa Express)
curl -X POST http://localhost:4003/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "gpo",
    "customerName": "João Silva",
    "customerEmail": "joao@example.com",
    "customerPhone": "923456789",
    "description": "Teste GPO"
  }' | jq

# REF (Referência Multicaixa)
curl -X POST http://localhost:4003/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "ref",
    "customerName": "João Silva",
    "customerEmail": "joao@example.com",
    "customerPhone": "923456789",
    "description": "Teste REF"
  }' | jq
```

#### Verificar Status
```bash
# Substituir TRANSACTION_ID pelo ID retornado
export TRANSACTION_ID="uuid-aqui"

curl -X GET http://localhost:4003/api/payments/$TRANSACTION_ID/status \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### Histórico
```bash
# Listar todos
curl -X GET http://localhost:4003/api/payments/history \
  -H "Authorization: Bearer $TOKEN" | jq

# Com filtros
curl -X GET "http://localhost:4003/api/payments/history?status=completed&method=gpo&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq

# Apenas status
curl -X GET "http://localhost:4003/api/payments/history?status=pending" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[].status'
```

#### Subscrição
```bash
# Obter subscrição atual
curl -X GET http://localhost:4003/api/subscription \
  -H "Authorization: Bearer $TOKEN" | jq

# Apenas plano
curl -X GET http://localhost:4003/api/subscription \
  -H "Authorization: Bearer $TOKEN" | jq '.data.plan'

# Apenas uso
curl -X GET http://localhost:4003/api/subscription \
  -H "Authorization: Bearer $TOKEN" | jq '.data.usage'
```

#### Webhook (Simulação)
```bash
# Pagamento concluído
curl -X POST http://localhost:4003/api/webhooks/tpagamento \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.completed",
    "data": {
      "id": "pay_123",
      "reference": "REF-456",
      "amount": 5000,
      "paidAt": "2026-03-06T10:30:00Z"
    }
  }' | jq

# Pagamento falhado
curl -X POST http://localhost:4003/api/webhooks/tpagamento \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.failed",
    "data": {
      "id": "pay_123",
      "reference": "REF-456",
      "reason": "Saldo insuficiente"
    }
  }' | jq
```

---

## 🗄️ Database

### Conectar ao PostgreSQL
```bash
# Conectar
psql -h localhost -U postgres -d tatuticket

# Ou com variáveis de ambiente
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB
```

### Queries Úteis
```sql
-- Ver todas as transações
SELECT id, amount, payment_method, status, created_at 
FROM payment_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- Contar por status
SELECT status, COUNT(*) 
FROM payment_transactions 
GROUP BY status;

-- Transações pendentes
SELECT * FROM payment_transactions 
WHERE status = 'pending' 
AND created_at > NOW() - INTERVAL '1 hour';

-- Transações expiradas
SELECT * FROM payment_transactions 
WHERE status = 'pending' 
AND expires_at < NOW();

-- Receita total
SELECT SUM(amount) as total_revenue 
FROM payment_transactions 
WHERE status = 'completed';

-- Receita por método
SELECT payment_method, SUM(amount) as revenue, COUNT(*) as count
FROM payment_transactions 
WHERE status = 'completed'
GROUP BY payment_method;

-- Últimos recibos
SELECT pr.receipt_number, pt.amount, pt.created_at
FROM payment_receipts pr
JOIN payment_transactions pt ON pr.transaction_id = pt.id
ORDER BY pr.created_at DESC
LIMIT 10;

-- Subscrições ativas
SELECT o.name, p.display_name, s.status, s.current_period_end
FROM subscriptions s
JOIN organizations o ON s.organization_id = o.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY s.current_period_end;
```

### Backup e Restore
```bash
# Backup
pg_dump -h localhost -U postgres tatuticket > backup.sql

# Backup apenas tabelas de pagamento
pg_dump -h localhost -U postgres tatuticket \
  -t payment_transactions \
  -t payment_receipts > payment_backup.sql

# Restore
psql -h localhost -U postgres tatuticket < backup.sql
```

---

## 📊 Logs e Monitoramento

### Ver Logs do Backend
```bash
# Logs em tempo real
cd backend
npm run dev

# Filtrar logs de pagamento
npm run dev | grep -E "Payment|TPagamento"

# Filtrar logs de webhook
npm run dev | grep "Webhook"

# Salvar logs em arquivo
npm run dev 2>&1 | tee logs/app.log
```

### Analisar Logs
```bash
# Contar erros
grep "ERROR" logs/app.log | wc -l

# Ver últimos erros
grep "ERROR" logs/app.log | tail -20

# Erros de pagamento
grep -E "Payment.*error" logs/app.log

# Webhooks recebidos
grep "Webhook.*Received" logs/app.log | wc -l
```

---

## 🔧 Troubleshooting

### Verificar Configuração
```bash
# Ver variáveis de ambiente
cd backend
cat .env | grep TPAGAMENTO

# Verificar se migrations foram executadas
psql -h localhost -U postgres tatuticket -c "\dt payment*"

# Verificar se tabelas existem
psql -h localhost -U postgres tatuticket -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_name LIKE 'payment%';
"
```

### Limpar Dados de Teste
```bash
# CUIDADO: Isso apaga todos os dados de pagamento!
psql -h localhost -U postgres tatuticket -c "
  TRUNCATE TABLE payment_receipts CASCADE;
  TRUNCATE TABLE payment_transactions CASCADE;
"

# Apagar apenas transações de teste
psql -h localhost -U postgres tatuticket -c "
  DELETE FROM payment_transactions 
  WHERE description LIKE '%Teste%';
"
```

### Resetar Migrations
```bash
# CUIDADO: Isso apaga as tabelas!
cd backend

# Reverter migrations de pagamento
npx sequelize-cli db:migrate:undo --name 20260306000002-create-payment-receipts.js
npx sequelize-cli db:migrate:undo --name 20260306000001-create-payment-transactions.js

# Executar novamente
npm run migrate
```

---

## 🚀 Deploy

### Build para Produção
```bash
# Backend
cd backend
npm run build
npm run test

# Frontend SaaS
cd portalSaaS
npm run build
npm run preview  # Testar build

# Frontend Organização
cd portalOrganizaçãoTenant
npm run build
npm run preview  # Testar build
```

### Deploy com PM2
```bash
# Instalar PM2
npm install -g pm2

# Iniciar backend
cd backend
pm2 start npm --name "tatuticket-backend" -- start

# Ver logs
pm2 logs tatuticket-backend

# Restart
pm2 restart tatuticket-backend

# Stop
pm2 stop tatuticket-backend

# Status
pm2 status
```

### Deploy com Docker
```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Logs
docker-compose logs -f backend

# Stop
docker-compose down
```

---

## 📈 Métricas

### Estatísticas Rápidas
```bash
# Total de pagamentos
psql -h localhost -U postgres tatuticket -c "
  SELECT COUNT(*) as total FROM payment_transactions;
"

# Taxa de conversão
psql -h localhost -U postgres tatuticket -c "
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as conversion_rate
  FROM payment_transactions;
"

# Receita do mês
psql -h localhost -U postgres tatuticket -c "
  SELECT SUM(amount) as monthly_revenue
  FROM payment_transactions
  WHERE status = 'completed'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
"

# Método mais usado
psql -h localhost -U postgres tatuticket -c "
  SELECT payment_method, COUNT(*) as count
  FROM payment_transactions
  GROUP BY payment_method
  ORDER BY count DESC;
"
```

---

## 🔐 Segurança

### Gerar Webhook Secret
```bash
# Gerar secret aleatório
openssl rand -hex 32

# Ou com Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Testar Validação de Webhook
```bash
# Gerar assinatura
export WEBHOOK_SECRET="seu-secret-aqui"
export PAYLOAD='{"event":"payment.completed","data":{"id":"test"}}'

# Calcular HMAC
echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET"

# Enviar com assinatura
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

curl -X POST http://localhost:4003/api/webhooks/tpagamento \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## 📞 Suporte

### Verificar Status da API TPagamento
```bash
# Health check
curl https://tpagamento-backend.tatusolutions.com/api/v1/health

# Testar autenticação
curl -X GET https://tpagamento-backend.tatusolutions.com/api/v1/payments \
  -H "X-API-Key: $TPAGAMENTO_API_KEY"
```

### Contatos
- Documentação: Ver arquivos MD no repositório
- Suporte TPagamento: suporte@tpagamento.com
- Docs TPagamento: https://docs.tpagamento.com

---

**Última Atualização:** 06/03/2026
