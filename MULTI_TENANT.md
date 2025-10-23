# 🏢 Arquitetura Multi-Tenant - TatuTicket

## 📋 Visão Geral

O TatuTicket implementa uma arquitetura **multi-tenant com isolamento de dados por organização**. Cada organização (tenant) tem seus dados completamente isolados, incluindo:

- Usuários (clientes, agentes, admins)
- Tickets e comentários
- Categorias, prioridades e tipos personalizados
- SLAs e departamentos
- Base de conhecimento
- Banco de horas

---

## 🔒 Estratégia de Isolamento

### **1. Isolamento de Dados no Banco**

Todos os modelos principais possuem o campo `organizationId`:

```javascript
organizationId: {
  type: DataTypes.UUID,
  allowNull: false,
  references: {
    model: 'organizations',
    key: 'id'
  }
}
```

**Modelos com isolamento:**
- ✅ `users` - Usuários pertencem a uma organização
- ✅ `tickets` - Tickets isolados por organização
- ✅ `comments` - Comentários isolados por organização
- ✅ `categories` - Categorias personalizadas por org
- ✅ `priorities` - Prioridades personalizadas por org
- ✅ `types` - Tipos personalizados por org
- ✅ `slas` - SLAs específicos por org
- ✅ `departments` - Departamentos por org
- ✅ `knowledge` - Base de conhecimento por org
- ✅ `hours_banks` - Banco de horas por org

### **2. Isolamento no Controller**

Todos os controllers filtram automaticamente por `organizationId`:

```javascript
// Exemplo padrão em todos os controllers
const where = { organizationId: req.user.organizationId };
```

**Benefícios:**
- ❌ Impossível acessar dados de outra organização
- ✅ Segurança em camadas (DB + App)
- ✅ Performance otimizada com índices

---

## 👥 Gestão de Usuários

### **Email Único por Organização**

Os emails são únicos **dentro de cada organização**, permitindo que:

```javascript
// ✅ PERMITIDO:
// usuario@email.com na Organização A
// usuario@email.com na Organização B (mesma pessoa, orgs diferentes)

// ❌ NÃO PERMITIDO:
// usuario@email.com duplicado na mesma organização
```

**Implementação:**
```javascript
indexes: [
  { 
    fields: ['email', 'organization_id'], 
    unique: true,
    name: 'users_email_organization_unique'
  }
]
```

### **Papéis de Usuário**

Cada organização tem seus próprios usuários com papéis:

- **`admin-org`** - Administrador da organização
  - Gerencia usuários, configurações, SLAs, etc
  - Acesso total aos dados da organização
  
- **`agente`** - Agente de suporte
  - Atende tickets
  - Acessa base de conhecimento
  - Visualiza tickets da organização
  
- **`cliente-org`** - Cliente da organização
  - Cria e visualiza próprios tickets
  - Acessa base de conhecimento pública
  - Auto-registro permitido

---

## 🛡️ Segurança Multi-Tenant

### **1. Autenticação**

```javascript
// JWT Token inclui organizationId
const token = jwt.sign({
  id: user.id,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId  // ✅ Essencial
}, secret);
```

### **2. Autorização**

Middleware `authenticate` extrai organizationId do token:

```javascript
req.user.organizationId // Disponível em toda requisição autenticada
```

### **3. Validações de Segurança**

#### **Prevenção de Acesso Cruzado:**

```javascript
// ❌ BLOQUEADO: Usuário Org A acessando ticket Org B
GET /api/tickets/{ticket-org-B}
Authorization: Bearer {token-org-A}

// Resposta: 404 Not Found
// (não revela existência do recurso)
```

#### **Prevenção de Injeção de OrganizationId:**

```javascript
// ❌ BLOQUEADO: Cliente tentando forçar outra org
POST /api/tickets
{
  "subject": "Ticket",
  "organizationId": "outra-org-id"  // Ignorado!
}

// ✅ Sistema usa: req.user.organizationId
```

### **4. Middleware de Isolamento**

**Uso do `tenantIsolation.js`:**

```javascript
import { ensureTenantIsolation, addTenantToBody } from '../middleware/tenantIsolation.js';

// Garantir que recurso pertence à org
router.put('/tickets/:id', 
  authenticate,
  ensureTenantIsolation(Ticket),  // ✅ Valida org
  updateTicket
);

// Auto-adicionar organizationId
router.post('/tickets',
  authenticate,
  addTenantToBody,  // ✅ Força organizationId
  createTicket
);
```

---

## 📊 Modelo de Dados

### **Organização (Tenant)**

```javascript
Organization {
  id: UUID (PK)
  name: String
  slug: String (unique)
  logo: String
  primaryColor: String
  secondaryColor: String
  email: String
  phone: String
  settings: JSONB {
    language: 'pt',
    timezone: 'Europe/Lisbon',
    allowSelfRegistration: true
  }
  isActive: Boolean
}
```

### **Relacionamentos**

```
Organization (1) -----> (N) Users
Organization (1) -----> (N) Tickets
Organization (1) -----> (N) Categories
Organization (1) -----> (N) Priorities
Organization (1) -----> (N) Types
Organization (1) -----> (N) SLAs
Organization (1) -----> (N) Departments
Organization (1) -----> (N) Knowledge Articles
Organization (1) -----> (N) Hours Banks
```

---

## 🧪 Testes de Segurança

### **Cenários Críticos:**

1. **Acesso Cruzado de Tickets:**
   ```bash
   # Usuário Org A tentando acessar ticket Org B
   curl -H "Authorization: Bearer {token-org-A}" \
        http://localhost:3000/api/tickets/{ticket-id-org-B}
   
   # Esperado: 404 Not Found
   ```

2. **Listagem de Recursos:**
   ```bash
   # Deve retornar APENAS recursos da organização do token
   curl -H "Authorization: Bearer {token-org-A}" \
        http://localhost:3000/api/categories
   
   # Esperado: Apenas categorias da Org A
   ```

3. **Criação com OrganizationId Forçado:**
   ```bash
   curl -X POST \
        -H "Authorization: Bearer {token-org-A}" \
        -H "Content-Type: application/json" \
        -d '{"name":"Categoria","organizationId":"org-B-id"}' \
        http://localhost:3000/api/categories
   
   # Esperado: Categoria criada na Org A (ignora org-B-id)
   ```

4. **Email Duplicado em Organizações Diferentes:**
   ```bash
   # Criar mesmo email em 2 organizações diferentes
   # Org A
   POST /api/auth/register
   {"email":"user@test.com","organizationId":"org-A"}
   
   # Org B
   POST /api/auth/register
   {"email":"user@test.com","organizationId":"org-B"}
   
   # Esperado: Ambos com sucesso (201)
   ```

---

## 🚀 Boas Práticas

### **1. Sempre Filtrar por OrganizationId**

```javascript
// ✅ CORRETO
const tickets = await Ticket.findAll({
  where: { 
    organizationId: req.user.organizationId,
    status: 'novo'
  }
});

// ❌ ERRADO - Expõe dados de todas organizações
const tickets = await Ticket.findAll({
  where: { status: 'novo' }
});
```

### **2. Validar Relacionamentos**

```javascript
// Ao atribuir ticket, validar que agente pertence à mesma org
const assignee = await User.findOne({
  where: {
    id: assigneeId,
    organizationId: req.user.organizationId  // ✅ Essencial
  }
});
```

### **3. Usar Middleware de Segurança**

```javascript
// Aplicar em todas rotas sensíveis
router.put('/tickets/:id',
  authenticate,
  ensureTenantIsolation(Ticket),  // ✅ Segurança extra
  validate(schemas.updateTicket),
  updateTicket
);
```

### **4. Logs de Segurança**

```javascript
// Log tentativas de acesso cruzado
logger.warn(`Tentativa cross-tenant: user ${req.user.email} tentou acessar recurso ${resourceId}`);
```

---

## 📈 Performance

### **Índices Otimizados**

Todos os modelos têm índices em `organization_id`:

```javascript
indexes: [
  { fields: ['organization_id'] },
  { fields: ['organization_id', 'created_at'] },
  { fields: ['email', 'organization_id'], unique: true }
]
```

**Benefícios:**
- ✅ Queries rápidas mesmo com milhões de registros
- ✅ Unique constraints por tenant
- ✅ Particionamento eficiente

---

## 🔄 Migração e Manutenção

### **Adicionar Nova Entidade:**

1. Adicionar campo `organizationId` ao modelo
2. Criar índice em `organization_id`
3. Filtrar por `organizationId` no controller
4. Validar isolamento em testes

### **Auditoria:**

Todas operações são logadas com `organizationId`:

```javascript
{
  userId: req.user.id,
  organizationId: req.user.organizationId,
  action: 'create',
  entityType: 'ticket',
  entityId: ticket.id
}
```

---

## ✅ Checklist de Implementação

Ao criar um novo recurso, verificar:

- [ ] Modelo tem campo `organizationId`
- [ ] Índice criado em `organization_id`
- [ ] Controller filtra por `organizationId`
- [ ] Rotas usam middleware `authenticate`
- [ ] Validação de tenant em updates/deletes
- [ ] Testes de isolamento implementados
- [ ] Logs incluem `organizationId`
- [ ] Documentação atualizada

---

## 🎯 Conclusão

O TatuTicket implementa **multi-tenancy robusto e seguro** com:

✅ **Isolamento Total** - Dados completamente separados por organização
✅ **Segurança em Camadas** - DB + App + Middleware
✅ **Performance** - Índices otimizados
✅ **Flexibilidade** - Configurações personalizadas por tenant
✅ **Auditoria** - Logs completos de todas operações

**Status: PRODUÇÃO-READY** 🚀
