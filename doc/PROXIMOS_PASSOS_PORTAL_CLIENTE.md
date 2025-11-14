# 📋 PRÓXIMOS PASSOS - Portal Cliente

**Data:** 05/11/2025 13:45  
**Status:** ✅ Login Funcionando | ⚠️ APIs Precisam Ajustes

---

## ✅ **JÁ FUNCIONANDO**

### **1. Autenticação**
```
✅ Login com credenciais corretas
✅ Token JWT gerado
✅ Scope withPassword funcionando
✅ Hash de senha correto
✅ Roles de cliente no ENUM
```

### **2. Usuários de Teste Criados**
```
✅ admin@acme.pt / ClientAdmin@123 (client-admin)
✅ user@acme.pt / ClientAdmin@123 (client-user)
✅ admin@techsolutions.pt / ClientAdmin@123 (client-admin)
```

---

## ⚠️ **ERROS ATUAIS (500 Internal Server Error)**

O Portal Cliente está tentando acessar APIs que não estão preparadas para usuários B2B:

### **1. Catálogo de Serviços**
```
❌ GET /api/catalog/items?popular=true
❌ GET /api/catalog/categories?includeStats=true
❌ GET /api/catalog/requests
```

**Problema:**
- Rotas existem mas podem não filtrar por `clientId`
- Controllers podem esperar campos que clientes não têm

**Solução Necessária:**
```javascript
// catalogControllerEnhanced.js
async getItems(req, res) {
  // ✅ Adicionar filtro por clientId para client-admin
  if (req.user.role.startsWith('client-')) {
    where.clientId = req.user.clientId;
  }
}
```

---

### **2. Base de Conhecimento**
```
❌ GET /api/knowledge?isPublished=true
```

**Problema:**
- Pode não existir modelo `Knowledge` no backend

**Solução Necessária:**
- Criar controller/rota ou remover do frontend temporariamente

---

### **3. Inventário**
```
❌ POST /api/inventory/browser-collect
❌ GET /api/inventory/assets
❌ GET /api/inventory/statistics
```

**Problema:**
- Rotas de inventário podem não aceitar clientes B2B
- Filtros por `clientId` podem estar faltando

**Solução Necessária:**
```javascript
// inventoryController.js
async getAssets(req, res) {
  // ✅ Filtrar por clientId
  if (req.user.clientId) {
    where.clientId = req.user.clientId;
  }
}
```

---

### **4. Bolsa de Horas**
```
❌ GET /api/client/hours-banks (404 Not Found)
```

**Problema:**
- Rota não existe

**Solução Necessária:**
- Criar rota ou remover página do frontend

---

## 🔧 **SOLUÇÕES RECOMENDADAS**

### **Opção 1: Ajustar APIs Backend (Recomendado)**

#### **1. Adicionar Middleware de Cliente**
```javascript
// middleware/clientAuth.js
export const requireClient = (req, res, next) => {
  if (!req.user.clientId) {
    return res.status(403).json({ error: 'Acesso restrito a clientes' });
  }
  next();
};
```

#### **2. Atualizar Controllers**
```javascript
// Adicionar filtro por clientId
const where = { organizationId: req.user.organizationId };

if (req.user.role.startsWith('client-')) {
  where.clientId = req.user.clientId;
}
```

#### **3. Criar Rotas de Cliente**
```javascript
// routes/clientRoutes.js
router.get('/client/catalog', clientController.getCatalog);
router.get('/client/requests', clientController.getMyRequests);
router.get('/client/knowledge', clientController.getKnowledgeBase);
```

---

### **Opção 2: Simplificar Frontend (Temporário)**

Criar uma dashboard simples sem dependências de APIs complexas:

```javascript
// DashboardSimple.jsx
const DashboardSimple = () => {
  return (
    <div>
      <h1>Bem-vindo, {user.name}!</h1>
      <p>Cliente: {user.clientId}</p>
      <p>Role: {user.role}</p>
      
      <div>
        <h2>Ações Disponíveis:</h2>
        <button>Criar Ticket</button>
        <button>Ver Meus Tickets</button>
        <button>Meu Perfil</button>
      </div>
    </div>
  );
};
```

---

## 📊 **ROTAS QUE PRECISAM SER CRIADAS/AJUSTADAS**

| Rota | Status | Ação Necessária |
|------|--------|-----------------|
| `GET /api/catalog/items` | ⚠️ 500 | Adicionar filtro `clientId` |
| `GET /api/catalog/categories` | ⚠️ 500 | Adicionar filtro `clientId` |
| `GET /api/catalog/requests` | ⚠️ 500 | Filtrar por `userId` do cliente |
| `GET /api/knowledge` | ⚠️ 500 | Verificar se rota existe |
| `POST /api/inventory/browser-collect` | ⚠️ 500 | Aceitar `clientId` |
| `GET /api/inventory/assets` | ⚠️ 500 | Filtrar por `clientId` |
| `GET /api/inventory/statistics` | ⚠️ 500 | Filtrar por `clientId` |
| `GET /api/client/hours-banks` | ❌ 404 | Criar rota ou remover do UI |

---

## 🎯 **PLANO DE AÇÃO IMEDIATO**

### **Passo 1: Verificar Erros Reais no Backend**
```bash
# Ver logs do backend
# Identificar exatamente qual linha está quebrando
```

### **Passo 2: Criar Rotas Básicas de Cliente**
```javascript
// backend/src/routes/clientRoutes.js
router.get('/client/dashboard', (req, res) => {
  res.json({
    user: req.user,
    stats: {
      openTickets: 0,
      pendingRequests: 0
    }
  });
});
```

### **Passo 3: Ajustar Frontend**
- Remover temporariamente páginas que dependem de APIs quebradas
- Manter apenas: Dashboard, Novo Ticket, Meus Tickets, Perfil

---

## 🚀 **FUNCIONALIDADES MÍNIMAS PARA CLIENTE**

### **Essenciais (MVP):**
1. ✅ Login/Logout
2. ⏳ Dashboard com resumo
3. ⏳ Criar ticket
4. ⏳ Ver meus tickets
5. ⏳ Ver detalhes de ticket
6. ⏳ Adicionar comentário em ticket
7. ✅ Ver/editar perfil

### **Opcionais (Futuro):**
- Catálogo de serviços
- Base de conhecimento
- Inventário de ativos
- Bolsa de horas
- Relatórios

---

## 🔍 **DEBUGGING**

### **Ver Logs do Backend:**
```bash
# Terminal onde o backend está rodando
# Procurar por:
# - Stack traces
# - Sequelize errors
# - "Cannot read property"
```

### **Testar Rota Manualmente:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/catalog/items
```

---

## ✅ **RESUMO**

### **Funcionando:**
```
✅ Login
✅ Autenticação
✅ Token JWT
✅ Usuários de teste
```

### **Precisa Corrigir:**
```
⚠️ APIs de catálogo (500)
⚠️ APIs de inventário (500)
⚠️ API de conhecimento (500)
❌ API de bolsa de horas (404)
```

### **Recomendação:**
1. Simplificar frontend temporariamente
2. Criar apenas rotas essenciais para clientes
3. Adicionar filtros `clientId` nas queries existentes
4. Expandir funcionalidades gradualmente

---

**O login está 100% funcional! Agora precisamos ajustar o backend para suportar as funcionalidades do Portal Cliente.** 🚀
