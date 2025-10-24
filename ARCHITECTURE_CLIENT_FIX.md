# 🏢 Correção da Arquitetura de Clientes

## 📊 Problema Identificado

### **Arquitetura Atual (Incorreta)**

```
Organization (Tenant)
  └── User (role: 'cliente-org')
       ├── Cliente Empresa 1 (clientId: null)
       ├── Utilizador da Empresa 1 (clientId: UUID_Empresa1) ❌
       ├── Cliente Empresa 2 (clientId: null)
       └── Utilizador da Empresa 2 (clientId: UUID_Empresa2) ❌
```

**Problema:**
- No portal da Organização, ao listar "Clientes", aparecem **TODOS** os Users com role `'cliente-org'`
- Isso inclui tanto empresas clientes quanto utilizadores dessas empresas
- Quando um utilizador é criado no portal do cliente, ele aparece na lista de clientes da organização

---

## ✅ Arquitetura Correta

### **Hierarquia de Entidades:**

```
Organization (Tenant) - ex: "Empresa XYZ"
  │
  └── Client (Empresa Cliente) - User com clientId = NULL
       │  - name: "Cliente Demo Lda"
       │  - email: "cliente@empresademo.com"
       │  - role: 'cliente-org'
       │  - clientId: NULL (É a empresa raiz)
       │
       └── Client Users (Utilizadores) - Users com clientId = UUID
            ├── User 1 (clientId: UUID_ClienteDemo)
            │    - name: "João Silva"
            │    - email: "joao@empresademo.com"
            │    - role: 'cliente-org'
            │
            └── User 2 (clientId: UUID_ClienteDemo)
                 - name: "Maria Santos"
                 - email: "maria@empresademo.com"
                 - role: 'cliente-org'
```

### **Modelo User:**

```javascript
{
  id: UUID,
  organizationId: UUID,              // Tenant
  clientId: UUID | NULL,             // NULL = Cliente-Empresa
                                     // UUID = Utilizador do Cliente
  name: STRING,
  email: STRING,
  role: ENUM('admin-org', 'agente', 'cliente-org'),
  settings: {
    clientAdmin: BOOLEAN            // true = Admin do cliente
  }
}
```

---

## 🔧 Correções Necessárias

### **1. clientController.js**

**Antes (Incorreto):**
```javascript
const where = { 
  organizationId,
  role: 'cliente-org'  // ❌ Lista TODOS os cliente-org
};
```

**Depois (Correto):**
```javascript
const where = { 
  organizationId,
  role: 'cliente-org',
  clientId: null        // ✅ Apenas empresas clientes
};
```

### **2. Distinction de Queries**

#### **Portal Organização - Listar Clientes (Empresas):**
```sql
SELECT * FROM users 
WHERE organization_id = ? 
  AND role = 'cliente-org' 
  AND client_id IS NULL;  -- Apenas empresas
```

#### **Portal Organização - Listar Utilizadores de um Cliente:**
```sql
SELECT * FROM users 
WHERE organization_id = ? 
  AND role = 'cliente-org' 
  AND client_id = ?;  -- Utilizadores de uma empresa específica
```

#### **Portal Cliente - Listar Utilizadores:**
```sql
-- Se user logado for empresa (clientId = null):
SELECT * FROM users 
WHERE organization_id = ? 
  AND role = 'cliente-org' 
  AND client_id = [user.id];

-- Se user logado for utilizador (clientId != null):
SELECT * FROM users 
WHERE organization_id = ? 
  AND role = 'cliente-org' 
  AND client_id = [user.clientId];
```

---

## 📋 Comportamentos Esperados

### **Cenário 1: Organização Cria Cliente**
```
1. Admin Org acessa /clients
2. Clica "Novo Cliente"
3. Cria: Cliente Demo (cliente@demo.com)
4. System cria User:
   - role: 'cliente-org'
   - clientId: NULL
   - settings.clientAdmin: true
```

### **Cenário 2: Cliente Cria Utilizador**
```
1. Cliente Demo login (clientId = NULL)
2. Acessa /users (portal cliente)
3. Cria: João Silva (joao@demo.com)
4. System cria User:
   - role: 'cliente-org'
   - clientId: UUID_ClienteDemo
   - settings.clientAdmin: false (por defeito)
```

### **Cenário 3: Organização Lista Clientes**
```
1. Admin Org acessa /clients
2. Sistema mostra apenas:
   ✅ Cliente Demo (clientId = NULL)
   ❌ NÃO mostra João Silva (clientId != NULL)
```

### **Cenário 4: Organização Vê Utilizadores de um Cliente**
```
1. Admin Org acessa /clients/[UUID_ClienteDemo]/users
2. Sistema mostra:
   ✅ João Silva (clientId = UUID_ClienteDemo)
   ✅ Maria Santos (clientId = UUID_ClienteDemo)
```

---

## 🎯 Validações

- [ ] Criar utilizador no portal cliente → NÃO aparece na lista de clientes da org
- [ ] Lista de clientes da org → Apenas empresas (clientId = NULL)
- [ ] Lista de utilizadores de um cliente → Apenas users com clientId = UUID_Cliente
- [ ] Portal cliente lista utilizadores → Apenas da mesma empresa
- [ ] Tickets criados por utilizadores → Aparecem no dashboard do cliente-empresa

---

## 📊 Diagrama de Relacionamentos

```
organizations (1) ──────┐
                        │
                        │ has many
                        ▼
               users (cliente-org)
                        │
                        ├── clientId = NULL → Cliente Empresa
                        │    └── É referenciado por outros users
                        │
                        └── clientId = UUID → Utilizador
                             └── Pertence a um Cliente Empresa
```

---

## ✅ Implementação

Ver commits:
- `fix: corrigir listagem de clientes - filtrar apenas empresas`
- `fix: separar cliente-empresa de utilizadores do cliente`
