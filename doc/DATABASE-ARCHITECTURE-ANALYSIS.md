# 🔍 Análise da Arquitetura Multi-Tenant - Base de Dados

**Data:** 06 de Dezembro de 2024  
**Base de Dados:** `tatuticket` (PostgreSQL)  
**Status:** ⚠️ **INCOMPLETO - FALTA TABELA CRÍTICA**

---

## 📋 Arquitetura Esperada (3 Camadas)

### Camada 1: Service Provider (TatuTicket)
- **Tabela:** `users`
- **Descrição:** Usuários da empresa detentora do sistema SaaS
- **Portal:** Backoffice SaaS
- **Roles:** `super-admin`, `provider-admin`, `provider-support`
- **Acesso:** Gestão completa do sistema, todas as organizações e clientes

### Camada 2: Organizações (Tenants)
- **Tabela:** `organizations` + `organization_users`
- **Descrição:** Empresas que contratam o serviço SaaS
- **Portal:** Portal das Organizações
- **Roles:** `org-admin`, `org-manager`, `agent`, `technician`
- **Acesso:** Gestão da organização, seus clientes, tickets, catálogo
- **Desktop Agent:** ✅ Sim (solicitar acesso remoto aos clientes)

### Camada 3: Empresas Clientes
- **Tabela:** `clients` + `client_users` ⚠️
- **Descrição:** Empresas clientes que pertencem a uma organização
- **Portal:** Portal Cliente Empresa
- **Roles:** `client-admin`, `client-manager`, `client-user`
- **Acesso:** Abrir tickets, solicitar serviços, ver seus dados
- **Desktop Agent:** ✅ Sim (inventário, aceitar acesso remoto)

---

## ✅ Tabelas Existentes na Base de Dados

### 1. ✅ `users` (Camada 1 - Provider)
```sql
Colunas principais:
- id (UUID)
- organization_id (UUID) → organizations
- name, email, password
- role (ENUM): super-admin, provider-admin, provider-support, 
               tenant-admin, tenant-manager, agent, viewer
- permissions (JSONB)
- client_id (UUID) → Referência confusa!
```

**⚠️ PROBLEMA:** A tabela `users` mistura roles de Provider E Tenant!
- Roles de Provider: `super-admin`, `provider-admin`, `provider-support`
- Roles de Tenant: `tenant-admin`, `tenant-manager`, `agent`, `viewer`

**CONFUSÃO:** Campo `client_id` na tabela `users` não faz sentido arquiteturalmente.

---

### 2. ✅ `organizations` (Camada 2 - Tenants)
```sql
Colunas principais:
- id (UUID)
- type (ENUM): 'provider', 'tenant'
- parent_id (UUID) → organizations (NULL para provider)
- name, slug, tax_id
- subscription (JSONB) → plano, limites
- settings (JSONB)
- is_active (BOOLEAN)
```

**✅ CORRETO:** Estrutura adequada para multi-tenancy.

---

### 3. ✅ `organization_users` (Camada 2 - Usuários das Organizações)
```sql
Colunas principais:
- id (UUID)
- organization_id (UUID) → organizations
- name, email, password
- role (ENUM): 'org-admin', 'org-manager', 'agent', 'technician'
- permissions (JSONB)
- direction_id, department_id, section_id (UUID)
- is_active (BOOLEAN)
```

**✅ CORRETO:** Tabela separada para usuários das organizações tenant.

---

### 4. ✅ `clients` (Camada 3 - Empresas Clientes)
```sql
Colunas principais:
- id (UUID)
- organization_id (UUID) → organizations (tenant)
- name, trade_name, tax_id
- email, phone, website
- address (JSONB)
- contract (JSONB) → SLA, limites
- billing (JSONB)
- settings (JSONB)
- stats (JSONB) → cache de estatísticas
- is_active (BOOLEAN)
```

**✅ CORRETO:** Estrutura adequada para empresas clientes.

---

### 5. ❌ `client_users` (Camada 3 - Usuários das Empresas Clientes)

**STATUS:** ⚠️ **TABELA NÃO EXISTE NA BASE DE DADOS!**

**ESPERADO:**
```sql
CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('client-admin', 'client-manager', 'client-user') DEFAULT 'client-user',
  avatar VARCHAR(255),
  phone VARCHAR(255),
  position VARCHAR(255),
  department_name VARCHAR(255),
  location JSONB DEFAULT '{}',
  permissions JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  last_login TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(email, organization_id)
);
```

---

## 🔴 Problemas Identificados

### 1. ❌ Tabela `client_users` Não Existe
- **Impacto:** Usuários das empresas clientes não têm onde ser armazenados
- **Consequência:** Não é possível fazer login no Portal Cliente Empresa
- **Urgência:** 🔴 CRÍTICO

### 2. ⚠️ Confusão na Tabela `users`
- **Problema:** Mistura roles de Provider e Tenant
- **Campo `client_id`:** Não faz sentido arquiteturalmente
- **Recomendação:** Separar em `provider_users` e manter `organization_users`

### 3. ⚠️ Modelo `ClientUser` Existe mas Tabela Não
- **Arquivo:** `backend/src/modules/clients/clientUserModel.js`
- **Problema:** Modelo Sequelize existe mas tabela não foi criada
- **Causa:** Migration não foi executada ou não existe

---

## 📊 Resumo da Situação Atual

| Camada | Tabela de Entidades | Tabela de Usuários | Status |
|--------|---------------------|-------------------|--------|
| **1. Provider** | `organizations` (type='provider') | `users` | ⚠️ Misturado |
| **2. Organizações** | `organizations` (type='tenant') | `organization_users` | ✅ OK |
| **3. Clientes** | `clients` | `client_users` | ❌ **FALTA** |

---

## 🔧 Ações Necessárias

### 1. Criar Tabela `client_users` (URGENTE)

**Opção A: Migration Sequelize**
```javascript
// backend/src/database/migrations/YYYYMMDD-create-client-users.cjs
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('client_users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' }
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' }
      },
      // ... outros campos
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('client_users');
  }
};
```

**Opção B: SQL Direto**
```sql
-- Executar no PostgreSQL
CREATE TABLE client_users (
  -- Ver estrutura completa acima
);
```

### 2. Limpar Confusão na Tabela `users`

**Opção A: Manter Como Está (Mais Simples)**
- Documentar claramente que `users` é para Provider
- Remover roles de Tenant da ENUM
- Remover campo `client_id`

**Opção B: Renomear (Mais Limpo)**
- Renomear `users` para `provider_users`
- Atualizar todas as referências no código

### 3. Validar Relacionamentos

Verificar se todos os relacionamentos estão corretos:
```javascript
// backend/src/modules/models/index.js
Organization.hasMany(OrganizationUser, { foreignKey: 'organizationId' });
Organization.hasMany(Client, { foreignKey: 'organizationId' });
Client.hasMany(ClientUser, { foreignKey: 'clientId' });
ClientUser.belongsTo(Client, { foreignKey: 'clientId' });
ClientUser.belongsTo(Organization, { foreignKey: 'organizationId' });
```

### 4. Atualizar Autenticação

Garantir que o sistema de autenticação suporta as 3 camadas:
- Provider users → `users` table
- Organization users → `organization_users` table
- Client users → `client_users` table

---

## 🎯 Fluxo de Dados Correto

### Login no Backoffice (Provider)
```
1. User acessa portalBackofficeSis
2. Login verifica tabela: users
3. Role: super-admin, provider-admin, provider-support
4. Acesso: TUDO (todas orgs, todos clientes)
```

### Login no Portal Organização (Tenant)
```
1. User acessa portalOrganizaçãoTenant
2. Login verifica tabela: organization_users
3. Role: org-admin, org-manager, agent, technician
4. Acesso: Apenas sua organização e seus clientes
5. Desktop Agent: Pode solicitar acesso remoto aos clientes
```

### Login no Portal Cliente (End User)
```
1. User acessa portalClientEmpresa
2. Login verifica tabela: client_users ❌ (NÃO EXISTE!)
3. Role: client-admin, client-manager, client-user
4. Acesso: Apenas sua empresa cliente
5. Desktop Agent: Inventário, aceitar acesso remoto
```

---

## 📝 Checklist de Validação

- [ ] Tabela `client_users` criada
- [ ] Migration executada com sucesso
- [ ] Modelo `ClientUser` sincronizado com tabela
- [ ] Relacionamentos configurados
- [ ] Autenticação suporta 3 camadas
- [ ] Testes de login em cada portal
- [ ] Desktop Agent funciona para org e client users
- [ ] Segregação de dados validada
- [ ] Documentação atualizada

---

## 🚨 Impacto Atual

**SEM a tabela `client_users`:**
- ❌ Portal Cliente Empresa não funciona
- ❌ Clientes não conseguem fazer login
- ❌ Clientes não conseguem abrir tickets
- ❌ Desktop Agent não funciona para clientes
- ❌ Inventário de clientes não é coletado
- ❌ Acesso remoto aos clientes não funciona

**Funcionalidades Afetadas:**
- Portal Cliente Empresa (100% não funcional)
- Desktop Agent para clientes (100% não funcional)
- Sistema de tickets de clientes (não podem criar)
- Catálogo de serviços para clientes (não podem solicitar)

---

## 💡 Recomendação Imediata

**PRIORIDADE MÁXIMA:** Criar tabela `client_users`

1. Criar migration para `client_users`
2. Executar migration
3. Validar modelo Sequelize
4. Testar autenticação
5. Testar Portal Cliente Empresa
6. Testar Desktop Agent para clientes

---

**Desenvolvido por:** Kiro AI Assistant  
**Data:** 06 de Dezembro de 2024  
**Status:** ⚠️ **ANÁLISE COMPLETA - AÇÃO NECESSÁRIA**
