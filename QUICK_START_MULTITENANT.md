# ⚡ Quick Start - Multi-Tenant B2B2C

## 🚀 Iniciar em 5 Minutos

### **1. Executar Migrations**
```bash
cd /Users/pedrodivino/Dev/ticket/backend
for file in migrations/202511040000*.sql; do
  psql -U postgres -d ticket_db -f "$file"
done
```

### **2. Executar Seed**
```bash
node src/seeds/multitenant-seed.js
```

### **3. Iniciar Backend**
```bash
npm run dev
# → http://localhost:3000
```

### **4. Iniciar Portais**
```bash
# Terminal separado para cada portal

# Portal Provider
cd portalBackofficeSis && npm install && npm run dev
# → http://localhost:5174

# Portal SaaS  
cd portalSaaS && npm install && npm run dev
# → http://localhost:5175

# Portal Tenant
cd portalOrganizaçãoTenant && npm run dev
# → http://localhost:5173

# Portal Cliente
cd portalClientEmpresa && npm run dev
# → http://localhost:5172
```

---

## 🔐 Logins Rápidos

### **Provider (Backoffice)**
```
URL: http://localhost:5174
Email: superadmin@tatuticket.com
Senha: Super@123
```

### **Tenant (Staff)**
```
URL: http://localhost:5173
Email: admin@empresademo.com
Senha: Admin@123
```

### **Cliente B2B**
```
URL: http://localhost:5172
Email: admin@clientedemo.com
Senha: ClientAdmin@123
```

---

## 📡 Endpoints Principais

### **Provider**
```http
GET /api/provider/tenants
GET /api/provider/stats
POST /api/provider/tenants
```

### **Clientes B2B**
```http
GET /api/clients-b2b
POST /api/clients-b2b
GET /api/clients-b2b/:id/stats
```

### **Usuários de Clientes**
```http
GET /api/client-users-b2b/clients/:clientId/users
POST /api/client-users-b2b/clients/:clientId/users
```

---

## 📚 Documentação Completa

1. **ARQUITETURA_MULTITENANT_B2B2C.md** - Visão geral da arquitetura
2. **IMPLEMENTACAO_MULTITENANT_B2B2C.md** - Guia de implementação backend
3. **PORTAIS_MULTITENANT_ATUALIZADOS.md** - Visão dos 4 portais
4. **IMPLEMENTACAO_PORTAIS_COMPLETA.md** - Implementação frontend
5. **SUMARIO_IMPLEMENTACAO_MULTITENANT_COMPLETA.md** - Resumo completo

---

## ✅ Verificar Instalação

```bash
# Verificar Organizations
psql -U postgres -d ticket_db -c "SELECT id, type, name FROM organizations;"

# Verificar Clients
psql -U postgres -d ticket_db -c "SELECT id, name, organization_id FROM clients;"

# Verificar ClientUsers
psql -U postgres -d ticket_db -c "SELECT id, name, email, role, client_id FROM client_users;"
```

---

## 🎯 Estrutura

```
Provider (TatuTicket)
  ↓
Tenant (Empresa Demo)
  ↓
Client B2B (Cliente Demo SA, TechCorp)
  ↓
Client Users (4 usuários)
```

**Status: 90% Production-Ready** 🚀
