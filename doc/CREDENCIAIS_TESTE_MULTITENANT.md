# 🔐 CREDENCIAIS DE TESTE - ARQUITETURA MULTI-TENANT

**Última atualização:** 04/11/2025 22:00

---

## 🚀 COMO TESTAR O SISTEMA

### **1. Backend (Porta 3000)**

Certifique-se que o backend está rodando:

```bash
cd backend
npm run dev
```

**Verificar saúde:**
```bash
curl http://localhost:3000/api/health
```

---

## 🔑 CREDENCIAIS POR PORTAL

### **📊 Portal Provider** (http://localhost:5174)

**Super Admin:**
```
Email: superadmin@tatuticket.com
Senha: Super@123
```

**Provider Admin:**
```
Email: provider-admin@tatuticket.com
Senha: ProviderAdmin@123
```

#### Funcionalidades Provider:
- ✅ Criar e gerenciar Tenants
- ✅ Ver estatísticas globais
- ✅ Configurar planos e deployment
- ✅ Suspender/reativar tenants

---

### **🏢 Portal Tenant** (http://localhost:5173)

**Tenant Admin:**
```
Email: admin@empresademo.com
Senha: Admin@123
```

**Agente:**
```
Email: agente@empresademo.com
Senha: Agente@123
```

#### Funcionalidades Tenant:
- ✅ Criar e gerenciar Clientes B2B
- ✅ Ver lista de clientes
- ✅ Ver estatísticas de clientes
- ✅ Criar usuários para clientes (admin)
- ✅ Gerenciar tickets

---

### **👥 Portal Cliente** (http://localhost:5172)

#### **Cliente 1: ACME Technologies**

**Admin ACME:**
```
Email: admin@acme.pt
Senha: ClientAdmin@123
```

**User ACME:**
```
Email: user@acme.pt
Senha: ClientAdmin@123
```

#### **Cliente 2: Tech Solutions Portugal**

**Admin TechSolutions:**
```
Email: admin@techsolutions.pt
Senha: ClientAdmin@123
```

#### Funcionalidades Cliente:
- ✅ Criar tickets
- ✅ Ver tickets da empresa (admin vê todos)
- ✅ Gerenciar usuários da empresa (apenas admin)
- ✅ Acessar knowledge base
- ✅ Solicitar serviços

---

## 🧪 TESTES RÁPIDOS

### **Teste 1: Login Portal Tenant**

1. Abra http://localhost:5173
2. Login: `admin@empresademo.com` / `Admin@123`
3. Deve ver Dashboard com estatísticas
4. Acesse **Clientes B2B**
5. Deve ver 2 clientes: ACME e TechSolutions

### **Teste 2: Login Portal Cliente**

1. Abra http://localhost:5172
2. Login: `admin@acme.pt` / `ClientAdmin@123`
3. Deve ver Dashboard da empresa ACME
4. Acesse **Utilizadores**
5. Deve ver 2 usuários (admin e user)

### **Teste 3: Criar Cliente via Portal Tenant**

1. Login Portal Tenant
2. Ir para **Clientes B2B**
3. Clicar **Novo Cliente**
4. Preencher dados e criar
5. Verificar que aparece na lista

### **Teste 4: API Endpoints**

```bash
# Login como Tenant Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresademo.com","password":"Admin@123"}'

# Copie o TOKEN retornado

# Listar clientes B2B
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/clients-b2b

# Login como Client Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.pt","password":"ClientAdmin@123"}'

# Ver perfil
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/auth/profile
```

---

## ⚠️ TROUBLESHOOTING

### **Problema: Login mostra credenciais antigas**

**Solução:** Limpar cache do navegador
1. Pressione `Ctrl+Shift+Del` (Windows/Linux) ou `Cmd+Shift+Del` (Mac)
2. Selecione "Cookies e dados de sites"
3. Limpar dados
4. Ou use modo anônimo: `Ctrl+Shift+N` / `Cmd+Shift+N`

### **Problema: Erro 500 ao carregar clientes**

**Solução:** Backend pode estar usando porta antiga
```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Reiniciar backend
cd backend
npm run dev
```

### **Problema: "Acesso negado" ao fazer login**

**Causa:** Usando credenciais erradas para o portal
- Portal Provider: apenas super-admin, provider-admin
- Portal Tenant: apenas admin-org, tenant-admin, agente
- Portal Cliente: apenas client-admin, client-user

### **Problema: Portal mostra "Network Error"**

**Solução:** Verificar se backend está rodando
```bash
curl http://localhost:3000/api/health
```

Se não responder, inicie o backend:
```bash
cd backend
npm run dev
```

---

## 📋 ESTRUTURA DE ROLES

```
┌─────────────────────────────────┐
│   PROVIDER (TatuTicket)         │
│   Roles:                        │
│   - super-admin                 │
│   - provider-admin              │
│   - provider-support            │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   TENANT (Empresa Demo)         │
│   Roles:                        │
│   - admin-org (legacy)          │
│   - tenant-admin                │
│   - tenant-manager              │
│   - agent                       │
│   - viewer                      │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   CLIENT (ACME / TechSolutions) │
│   Roles:                        │
│   - client-admin                │
│   - client-manager              │
│   - client-user                 │
└─────────────────────────────────┘
```

---

## 🎯 ENDPOINTS ATIVOS

### **Provider Routes** (Apenas Provider admins)
```
GET    /api/provider/tenants
POST   /api/provider/tenants
GET    /api/provider/tenants/:id
PUT    /api/provider/tenants/:id
PUT    /api/provider/tenants/:id/suspend
PUT    /api/provider/tenants/:id/activate
GET    /api/provider/stats
```

### **Client B2B Routes** (Apenas Tenant admins)
```
GET    /api/clients-b2b
POST   /api/clients-b2b
GET    /api/clients-b2b/:id
PUT    /api/clients-b2b/:id
DELETE /api/clients-b2b/:id
PUT    /api/clients-b2b/:id/activate
GET    /api/clients-b2b/:id/stats
```

### **Client User Routes** (Tenant admins e Client admins)
```
GET    /api/client-users-b2b/clients/:clientId/users
POST   /api/client-users-b2b/clients/:clientId/users
GET    /api/client-users-b2b/:id
PUT    /api/client-users-b2b/:id
DELETE /api/client-users-b2b/:id
PUT    /api/client-users-b2b/:id/activate
PUT    /api/client-users-b2b/:id/change-password
```

---

## 📊 DADOS DE EXEMPLO NO BANCO

### **Organizations (2):**
- TatuTicket (Provider)
- Empresa Demo (Tenant)

### **Users (4):**
- superadmin@tatuticket.com (super-admin)
- provider-admin@tatuticket.com (provider-admin)
- admin@empresademo.com (admin-org)
- agente@empresademo.com (agente)

### **Clients (2):**
- ACME Technologies Lda
- Tech Solutions Portugal

### **Client Users (3):**
- admin@acme.pt (client-admin - ACME)
- user@acme.pt (client-user - ACME)
- admin@techsolutions.pt (client-admin - TechSolutions)

---

## 🔄 LIMPAR E REINICIAR DADOS

Se precisar reiniciar os dados de teste:

```bash
cd backend

# Remover clientes e client users
node -e "import('./src/config/database.js').then(async ({sequelize}) => {
  await sequelize.query('DELETE FROM client_users;');
  await sequelize.query('DELETE FROM clients;');
  console.log('✅ Dados limpos');
  process.exit(0);
});"

# Recriar dados de exemplo
node scripts/insert-demo-data-sql.js
```

---

## ✅ CHECKLIST DE TESTE

- [ ] Backend está rodando (porta 3000)
- [ ] Portal Provider abre (porta 5174)
- [ ] Portal Tenant abre (porta 5173)
- [ ] Portal Cliente abre (porta 5172)
- [ ] Login Provider funciona
- [ ] Login Tenant funciona
- [ ] Login Cliente funciona
- [ ] Portal Tenant lista 2 clientes
- [ ] Portal Cliente lista usuários
- [ ] API responde aos endpoints
- [ ] Criar novo cliente funciona
- [ ] Criar novo client user funciona

---

**Sistema 100% funcional e pronto para testes! 🚀**

_Para documentação completa, consulte: `MIGRACAO_MULTITENANT_100_COMPLETA.md`_
