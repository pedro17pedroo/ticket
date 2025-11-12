# 🔴 CORREÇÃO CRÍTICA - Tabelas de Usuários

**Data:** 11/11/2025 - 22:15  
**Status:** ✅ CORRIGIDO

---

## 🐛 Problema Identificado

O endpoint `/api/users` estava consultando a tabela **ERRADA** para listar usuários da organização tenant.

### **Situação Anterior (ERRADO):**

```javascript
// ❌ userController.js estava usando:
import { User } from '../models/index.js';

const users = await User.findAll({ where: { organizationId } });
```

**Problema:**
- `User` → Tabela `users` → **Provedor SaaS APENAS**
- Retornava usuários do provedor SaaS
- Retornava usuários de clientes (`ClientUser`)
- **NÃO retornava** usuários da organização tenant!

---

## ✅ Correção Implementada

### **Agora (CORRETO):**

```javascript
// ✅ userController.js agora usa:
import { OrganizationUser } from '../models/index.js';

const users = await OrganizationUser.findAll({ where: { organizationId } });
```

**Solução:**
- `OrganizationUser` → Tabela `organization_users` → **Organização Tenant**
- Retorna **APENAS** usuários da organização tenant
- Não mistura com provedor SaaS ou clientes

---

## 📊 Estrutura de Tabelas (CORRETA)

### **1. Tabela `users`**
**Uso:** Provedor SaaS **APENAS**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID, -- Sempre aponta para a organização PROVEDORA
  name VARCHAR,
  email VARCHAR,
  role ENUM('super-admin', 'admin', 'support'), -- Roles do provedor
  ...
);
```

**Quem usa:**
- Administradores do SaaS
- Suporte do provedor
- **NÃO deve** aparecer no portal da organização tenant

---

### **2. Tabela `organization_users`**
**Uso:** Usuários das Organizações Tenant

```sql
CREATE TABLE organization_users (
  id UUID PRIMARY KEY,
  organization_id UUID, -- Organização TENANT
  name VARCHAR,
  email VARCHAR,
  role ENUM('org-admin', 'org-manager', 'agent', 'technician'), -- Roles da organização
  direction_id UUID,
  department_id UUID,
  section_id UUID,
  ...
);
```

**Quem usa:**
- Administradores da organização tenant
- Agentes de suporte
- Técnicos
- **DEVE** aparecer em `/api/users` do portal da organização

**Roles Válidos:**
- `org-admin` - Administrador da organização
- `org-manager` - Gerente
- `agent` - Agente de suporte
- `technician` - Técnico

---

### **3. Tabela `client_users`**
**Uso:** Usuários dos Clientes (Empresas que usam a organização tenant)

```sql
CREATE TABLE client_users (
  id UUID PRIMARY KEY,
  organization_id UUID, -- Organização TENANT que serve este cliente
  client_id UUID, -- Cliente (empresa)
  name VARCHAR,
  email VARCHAR,
  role ENUM('client-admin', 'client-user', 'client-viewer'), -- Roles do cliente
  ...
);
```

**Quem usa:**
- Administradores da empresa cliente
- Usuários finais da empresa cliente
- **NÃO deve** aparecer em `/api/users` (tem endpoint próprio `/api/clients/:id/users`)

**Roles Válidos:**
- `client-admin` - Administrador da empresa cliente
- `client-user` - Usuário normal
- `client-viewer` - Visualizador apenas

---

## 🔄 Fluxo de Dados Correto

```
┌─────────────────────────────────────────────────────────────┐
│                    PROVEDOR SAAS                             │
│  ┌───────────┐                                               │
│  │   users   │ ← Usuários do provedor (super-admin, admin)  │
│  └───────────┘                                               │
└─────────────────────────────────────────────────────────────┘
                          |
                          ├─ organization_id (provedor)
                          |
┌─────────────────────────────────────────────────────────────┐
│              ORGANIZAÇÃO TENANT (ACME)                       │
│  ┌────────────────────┐                                      │
│  │ organization_users │ ← Agentes, Técnicos da ACME         │
│  └────────────────────┘                                      │
│         |                                                     │
│         ├─ organization_id: UUID-ACME                        │
│         └─ roles: org-admin, agent, technician               │
└─────────────────────────────────────────────────────────────┘
                          |
                          ├─ organization_id: UUID-ACME
                          |
┌─────────────────────────────────────────────────────────────┐
│         CLIENTES da ACME (Empresas XYZ, ABC...)             │
│  ┌───────────────┐                                           │
│  │ client_users  │ ← Usuários finais das empresas           │
│  └───────────────┘                                           │
│         |                                                     │
│         ├─ organization_id: UUID-ACME                        │
│         ├─ client_id: UUID-XYZ                               │
│         └─ roles: client-admin, client-user                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Mudanças Implementadas

### **Arquivo:** `/backend/src/modules/users/userController.js`

#### **1. Import Correto:**

```javascript
// ❌ ANTES:
import { User, Organization, Direction, Department, Section } from '../models/index.js';

// ✅ DEPOIS:
import { OrganizationUser, Organization, Direction, Department, Section } from '../models/index.js';
```

---

#### **2. Listar Usuários (GET /api/users):**

```javascript
// ❌ ANTES:
const users = await User.findAll({
  where: { 
    organizationId,
    role: { [Op.ne]: 'cliente-org' } // Tentava excluir clientes
  }
});

// ✅ DEPOIS:
const users = await OrganizationUser.findAll({
  where: { 
    organizationId // Apenas organization_users
  }
});
```

---

#### **3. Buscar por ID (GET /api/users/:id):**

```javascript
// ❌ ANTES:
const user = await User.findOne({
  where: { id, organizationId, role: { [Op.ne]: 'cliente-org' } }
});

// ✅ DEPOIS:
const user = await OrganizationUser.findOne({
  where: { id, organizationId }
});
```

---

#### **4. Criar Usuário (POST /api/users):**

```javascript
// ❌ ANTES:
const user = await User.create({ ... });

// ✅ DEPOIS:
const user = await OrganizationUser.create({ 
  name, email, password,
  role: role || 'agent', // Roles válidos: org-admin, agent, technician
  organizationId,
  ...
});
```

**Validação de Roles:**
```javascript
// ✅ Apenas roles válidos para organization_users
const validRoles = ['org-admin', 'org-manager', 'agent', 'technician'];
if (role && !validRoles.includes(role)) {
  return res.status(400).json({ 
    error: `Role inválido. Utilize: ${validRoles.join(', ')}` 
  });
}
```

---

#### **5. Atualizar Usuário (PUT /api/users/:id):**

```javascript
// ❌ ANTES:
const user = await User.findOne({ where: { id, organizationId } });

// ✅ DEPOIS:
const user = await OrganizationUser.findOne({ where: { id, organizationId } });
```

---

#### **6. Desativar/Reativar (DELETE /PUT /api/users/:id/activate):**

```javascript
// ❌ ANTES:
const user = await User.findOne({ ... });

// ✅ DEPOIS:
const user = await OrganizationUser.findOne({ ... });
```

---

#### **7. Reset Senha (PUT /api/users/:id/reset-password):**

```javascript
// ❌ ANTES:
const user = await User.findOne({ ... });

// ✅ DEPOIS:
const user = await OrganizationUser.scope('withPassword').findOne({ ... });
```

---

## 🎯 Resultado Final

### **Antes (ERRADO):**

Ao acessar `/api/users` no portal da organização ACME:

```json
{
  "users": [
    {
      "name": "Administrador Sistema",  // ❌ Provedor SaaS
      "role": "admin"
    },
    {
      "name": "Agente Suporte",         // ❌ Provedor SaaS
      "role": "support"
    },
    {
      "name": "Admin ACME",             // ❌ Cliente (ClientUser)
      "role": "client-admin"
    },
    {
      "name": "Maria Santos",           // ❌ Cliente (ClientUser)
      "role": "client-user"
    }
  ]
}
```

**Problemas:**
- ❌ Mostra usuários do provedor SaaS
- ❌ Mostra usuários de clientes
- ❌ Não mostra os verdadeiros agentes da organização

---

### **Depois (CORRETO):**

Ao acessar `/api/users` no portal da organização ACME:

```json
{
  "users": [
    {
      "name": "João Silva",          // ✅ OrganizationUser (ACME)
      "role": "org-admin",
      "department": "TI"
    },
    {
      "name": "Pedro Costa",         // ✅ OrganizationUser (ACME)
      "role": "agent",
      "department": "Suporte"
    },
    {
      "name": "Ana Ferreira",        // ✅ OrganizationUser (ACME)
      "role": "technician",
      "department": "Infraestrutura"
    }
  ]
}
```

**Correto:**
- ✅ Apenas usuários de `organization_users`
- ✅ Apenas da organização ACME (`organizationId` correto)
- ✅ Roles válidos: `org-admin`, `agent`, `technician`

---

## 🔍 Como Verificar

### **1. Verificar Tabela no Banco:**

```sql
-- Ver usuários da organização tenant
SELECT id, name, email, role, organization_id 
FROM organization_users 
WHERE organization_id = 'UUID-da-organizacao';

-- Verificar que não há mix com outras tabelas
SELECT 'users' AS source, COUNT(*) FROM users 
WHERE organization_id = 'UUID-da-organizacao'
UNION ALL
SELECT 'organization_users', COUNT(*) FROM organization_users 
WHERE organization_id = 'UUID-da-organizacao'
UNION ALL
SELECT 'client_users', COUNT(*) FROM client_users 
WHERE organization_id = 'UUID-da-organizacao';
```

---

### **2. Testar API:**

```bash
# GET /api/users
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/users

# Deve retornar APENAS organization_users
# Roles válidos: org-admin, org-manager, agent, technician
```

---

### **3. Verificar Interface:**

- Acessar "Estrutura Organizacional" > "Utilizadores"
- **Deve mostrar:** Agentes, técnicos da organização
- **NÃO deve mostrar:** Usuários do provedor SaaS
- **NÃO deve mostrar:** Usuários de clientes (empresas)

---

## 📝 Checklist de Verificação

### **Backend:**
- [x] `userController.js` usa `OrganizationUser`
- [x] Validação de roles corretos (`org-admin`, `agent`, etc.)
- [x] Filtro por `organizationId`
- [x] Sem filtros de exclusão por role (`role: { [Op.ne]: 'cliente-org' }`)

### **Modelos:**
- [x] `OrganizationUser` exportado em `/models/index.js`
- [x] Associações corretas (Direction, Department, Section)
- [x] Roles válidos no ENUM

### **Interface:**
- [x] Lista mostra apenas usuários da organização
- [x] Formulário usa roles válidos
- [x] Não aparece mix de tabelas

---

## 🚨 Importante

### **Separação de Responsabilidades:**

| Tabela | Uso | Endpoint | Portal |
|--------|-----|----------|--------|
| `users` | Provedor SaaS | `/api/provider/users` | Portal SaaS Provider |
| `organization_users` | Organização Tenant | `/api/users` | Portal Organização |
| `client_users` | Clientes | `/api/clients/:id/users` | Portal Cliente |

**NUNCA misturar estas tabelas!**

---

## ✅ Resultado

✅ **Portal da Organização** mostra apenas `organization_users`  
✅ **Roles corretos** (`org-admin`, `agent`, `technician`)  
✅ **Sem mix** de provedor ou clientes  
✅ **Filtro correto** por `organizationId`  
✅ **Validações** de roles implementadas  

---

**CORREÇÃO CRÍTICA IMPLEMENTADA!** 🎉✅

O sistema agora usa as tabelas corretas conforme a arquitetura multi-tenant!
