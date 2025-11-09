# 🔧 Troubleshooting - Erros 500 no Catálogo de Serviços

## 🐛 Problema
Todos os endpoints de catálogo retornam erro **500 Internal Server Error**:
- `GET /api/catalog/requests` → 500
- `POST /api/catalog/categories` → 500  
- `GET /api/catalog/items` → 500

---

## ✅ Checklist de Soluções

### **1️⃣ Verificar se o Backend está Rodando**

```bash
# Verificar se algo está rodando na porta 3000
lsof -i :3000

# Verificar processos node
ps aux | grep node | grep backend
```

**Se não aparecer nada, o backend não está rodando!**

#### **Solução: Iniciar o Backend**

```bash
cd /Users/pedrodivino/Dev/ticket/backend
npm run dev
```

**Output esperado:**
```
Server running on port 3000
Database connected successfully
```

---

### **2️⃣ Verificar Conexão com Banco de Dados**

#### **Arquivo:** `/backend/.env`

Verifique se as credenciais estão corretas:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tatuticket
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
```

#### **Testar Conexão:**

```bash
# No backend
cd /Users/pedrodivino/Dev/ticket/backend
node -e "require('./src/config/database.js')"
```

**Se falhar:** Verifique se o PostgreSQL está rodando:
```bash
brew services list | grep postgresql
# ou
pg_isready
```

---

### **3️⃣ Executar Migrations do Catálogo**

As tabelas do catálogo podem não existir no banco de dados.

#### **Verificar Migrations Pendentes:**

```bash
cd /Users/pedrodivino/Dev/ticket/backend
npx sequelize-cli db:migrate:status
```

#### **Executar Migrations:**

```bash
cd /Users/pedrodivino/Dev/ticket/backend

# Executar TODAS as migrations
npx sequelize-cli db:migrate

# Ou especificamente as do catálogo
# Migration 1: Criar tabelas básicas
npx sequelize-cli db:migrate --name 20251025-create-catalog.js

# Migration 2: Sistema aprimorado (hierarquia e tipos)
npx sequelize-cli db:migrate --name 20251115-enhance-catalog-system.js
```

**Output esperado:**
```
== 20251025-create-catalog: migrating =======
== 20251025-create-catalog: migrated (0.123s)

== 20251115-enhance-catalog-system: migrating =======
== 20251115-enhance-catalog-system: migrated (0.089s)
```

---

### **4️⃣ Verificar Logs do Backend**

Quando o frontend faz a requisição, o backend deve logar o erro. Veja o console do backend:

```bash
# Se estiver rodando em outra janela do terminal
# Verifique os logs lá

# Ou inicie com logs detalhados
cd /Users/pedrodivino/Dev/ticket/backend
DEBUG=* npm run dev
```

**Procure por:**
- ❌ `Error: relation "catalog_categories" does not exist` → Migrations não executadas
- ❌ `ECONNREFUSED` → Banco de dados não conectado
- ❌ `Cannot find module` → Dependências faltando

---

### **5️⃣ Verificar Tabelas no Banco de Dados**

```bash
# Conectar ao PostgreSQL
psql -U postgres -d tatuticket

# Listar tabelas
\dt

# Verificar se as tabelas do catálogo existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'catalog%';
```

**Tabelas esperadas:**
- `catalog_categories`
- `catalog_items`
- `service_requests`
- `service_request_approvals`
- `service_request_fields`

**Se não existirem:** Execute as migrations (passo 3).

---

### **6️⃣ Testar Endpoints Manualmente**

#### **Com cURL:**

```bash
# GET Categorias (deve retornar array vazio se não houver dados)
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/catalog/categories

# GET Items
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/catalog/items
```

#### **Com Thunder Client / Postman / Insomnia:**

1. **GET** `http://localhost:3000/api/catalog/categories`
2. **Headers:** `Authorization: Bearer SEU_TOKEN`
3. **Resposta esperada:** 
   - ✅ 200 OK com `{ data: [] }`
   - ❌ 500 Internal Server Error → Problema no backend

---

### **7️⃣ Seed de Dados (Opcional)**

Se quiser popular o banco com dados de exemplo:

```bash
cd /Users/pedrodivino/Dev/ticket/backend
node src/seeds/catalog-seed.js
```

**Isso cria:**
- 3 Categorias raiz (TI, RH, Facilities)
- 5 Subcategorias
- 10 Itens de exemplo

---

## 🔍 Diagnóstico Rápido

Execute este script de diagnóstico:

```bash
cd /Users/pedrodivino/Dev/ticket/backend

echo "=== DIAGNÓSTICO DO CATÁLOGO ==="
echo ""

echo "1. Backend rodando?"
lsof -i :3000 > /dev/null && echo "✅ SIM (porta 3000 em uso)" || echo "❌ NÃO (backend não está rodando)"
echo ""

echo "2. PostgreSQL rodando?"
pg_isready > /dev/null && echo "✅ SIM" || echo "❌ NÃO (PostgreSQL não está rodando)"
echo ""

echo "3. Migrations executadas?"
npx sequelize-cli db:migrate:status | grep -q "up.*catalog" && echo "✅ SIM" || echo "❌ NÃO (execute: npx sequelize-cli db:migrate)"
echo ""

echo "4. Tabelas existem?"
psql -U postgres -d tatuticket -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'catalog%';" 2>/dev/null | grep -q "[1-9]" && echo "✅ SIM" || echo "❌ NÃO (execute migrations)"
```

---

## 📋 Checklist Final

- [ ] Backend rodando (`npm run dev` no `/backend`)
- [ ] PostgreSQL rodando (`brew services list | grep postgresql`)
- [ ] Arquivo `.env` configurado com credenciais corretas
- [ ] Migrations executadas (`npx sequelize-cli db:migrate`)
- [ ] Tabelas `catalog_*` existem no banco (`\dt` no psql)
- [ ] Rotas registradas em `/backend/src/routes/index.js` (linha 367-368)
- [ ] Sem erros no console do backend

---

## 🚀 Solução Mais Comum

**90% dos casos** é resolvido com:

```bash
# 1. Ir para a pasta do backend
cd /Users/pedrodivino/Dev/ticket/backend

# 2. Executar migrations
npx sequelize-cli db:migrate

# 3. Reiniciar backend
npm run dev
```

---

## 📞 Ainda com Erro?

Se após todos os passos ainda houver erro 500:

1. **Copie os logs do backend** (console onde está rodando `npm run dev`)
2. **Verifique a stack trace completa** do erro
3. **Procure por:**
   - Nome da tabela que falta
   - Erro de SQL
   - Permissões do banco
   - Dependências faltando

---

## 🎯 Frontend vs Backend

**IMPORTANTE:** Esses erros **NÃO são do frontend**!

- ✅ Frontend está fazendo as requisições **corretamente**
- ❌ Backend está retornando erro 500
- 🔧 Solução está **no backend**, não no React

---

**Última atualização:** 2025-01-08
