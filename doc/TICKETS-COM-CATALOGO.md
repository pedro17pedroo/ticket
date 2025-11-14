# 🎯 TICKETS COM HIERARQUIA DO CATÁLOGO

## 📊 **DECISÃO ARQUITETURAL**

**Data:** 08/11/2025  
**Decisão:** Eliminar "Categorias de Ticket" e usar hierarquia do Catálogo de Serviços

---

## ❌ **PROBLEMA ANTERIOR:**

### **Duplicação Confusa:**
```
📂 Categorias de Ticket (Funcional)
   ├── Incidente
   ├── Requisição
   ├── Problema
   └── Mudança

📂 Categorias do Catálogo (Visual/Organizacional)
   ├── TI
   │   ├── Hardware
   │   ├── Software
   │   └── Infraestrutura
   ├── RH
   └── Facilities
```

### **Problemas:**
1. ❌ Dois tipos de "categoria" = confusão
2. ❌ Usuários não sabem qual usar
3. ❌ Tickets via catálogo vs manuais têm estruturas diferentes
4. ❌ Redundância no menu (Categorias em 2 lugares)
5. ❌ Manutenção duplicada

---

## ✅ **SOLUÇÃO:**

### **Hierarquia Única do Catálogo:**
```
Ticket {
  // ✅ NOVO: Vincula ao Catálogo
  catalogCategoryId → TI > Infraestrutura (categoria do catálogo)
  catalogItemId → Novo Servidor (item/serviço específico)
  
  // ⚠️ LEGADO: Manter por compatibilidade
  categoryId → null (será descontinuado)
  
  // Outras props existentes
  type: 'incidente' | 'requisicao' | 'problema' | 'mudanca'
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  ...
}
```

---

## 🔄 **COMO FUNCIONA:**

### **1. Ticket via Catálogo** (Automático)

```javascript
// Usuário clica no Portal do Cliente:
// TI > Infraestrutura > Solicitar Novo Servidor

POST /api/catalog/requests
{
  itemId: "uuid-do-item-novo-servidor",
  description: "Preciso de um servidor para produção",
  ...
}

// Backend cria ticket automaticamente:
{
  ticketNumber: "TKT-20251108-8564",
  subject: "Solicitar Novo Servidor",
  description: "Preciso de um servidor para produção",
  
  // ✅ Campos do catálogo preenchidos automaticamente:
  catalogCategoryId: "uuid-infraestrutura",  // Categoria do item
  catalogItemId: "uuid-novo-servidor",       // Item selecionado
  
  // Herdado do item do catálogo:
  type: "requisicao",
  priority: "media",
  slaId: "uuid-sla-ti",
  directionId: "uuid-direcao-ti",
  ...
}
```

---

### **2. Ticket Manual** (Formulário)

```jsx
// NewTicket.jsx (Formulário)

<form>
  <h2>Novo Ticket</h2>
  
  {/* ✅ Seletor Hierárquico do Catálogo */}
  <label>Categoria e Serviço</label>
  <CatalogHierarchySelector
    onSelect={(category, item) => {
      setFormData({
        ...formData,
        catalogCategoryId: category.id,
        catalogItemId: item?.id  // Opcional
      })
    }}
  />
  
  {/* Campos tradicionais */}
  <input name="subject" placeholder="Assunto" required />
  <textarea name="description" placeholder="Descrição" required />
  
  <select name="type">
    <option value="incidente">Incidente</option>
    <option value="requisicao">Requisição</option>
    <option value="problema">Problema</option>
    <option value="mudanca">Mudança</option>
  </select>
  
  <select name="priority">
    <option value="baixa">Baixa</option>
    <option value="media">Média</option>
    <option value="alta">Alta</option>
    <option value="critica">Crítica</option>
  </select>
  
  <button type="submit">Criar Ticket</button>
</form>
```

**Resultado:**
```javascript
POST /api/tickets
{
  subject: "Problema com impressora",
  description: "Impressora não imprime",
  type: "incidente",
  priority: "media",
  
  // ✅ Vinculado ao catálogo:
  catalogCategoryId: "uuid-hardware",      // TI > Hardware
  catalogItemId: "uuid-suporte-impressora" // Suporte a Impressora
}
```

---

## 🗄️ **ESTRUTURA DO BANCO**

### **Modelo Ticket Atualizado:**

```javascript
// ticketModel.js
{
  // ... campos existentes ...
  
  // ⚠️ LEGADO (manter por compatibilidade)
  categoryId: {
    type: UUID,
    allowNull: true,
    references: { model: 'categories', key: 'id' },
    comment: 'LEGADO - Categoria funcional do ticket'
  },
  
  // ✅ NOVO: Campos do Catálogo
  catalogCategoryId: {
    type: UUID,
    allowNull: true,
    references: { model: 'catalog_categories', key: 'id' },
    comment: 'Categoria do catálogo (TI, RH, Facilities)'
  },
  
  catalogItemId: {
    type: UUID,
    allowNull: true,
    references: { model: 'catalog_items', key: 'id' },
    comment: 'Item/Serviço do catálogo selecionado'
  },
}
```

---

### **Associações Sequelize:**

```javascript
// models/index.js

// Ticket → CatalogCategory
Ticket.belongsTo(CatalogCategory, { 
  foreignKey: 'catalogCategoryId', 
  as: 'catalogCategory' 
});
CatalogCategory.hasMany(Ticket, { 
  foreignKey: 'catalogCategoryId', 
  as: 'tickets' 
});

// Ticket → CatalogItem
Ticket.belongsTo(CatalogItem, { 
  foreignKey: 'catalogItemId', 
  as: 'catalogItem' 
});
CatalogItem.hasMany(Ticket, { 
  foreignKey: 'catalogItemId', 
  as: 'tickets' 
});
```

---

### **Migração SQL:**

```sql
-- 20251108000002-add-catalog-fields-to-tickets.sql

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS catalog_category_id UUID 
REFERENCES catalog_categories(id) ON DELETE SET NULL;

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS catalog_item_id UUID 
REFERENCES catalog_items(id) ON DELETE SET NULL;

CREATE INDEX idx_tickets_catalog_category_id ON tickets(catalog_category_id);
CREATE INDEX idx_tickets_catalog_item_id ON tickets(catalog_item_id);
```

---

## 📊 **EXEMPLOS PRÁTICOS**

### **Exemplo 1: Ticket de Incidente via Catálogo**

**Cenário:** Impressora quebrou

```
Portal do Cliente:
├── TI
    ├── Hardware
        └── 🖨️ Suporte a Impressora (ITEM)

Usuário clica "Solicitar" →
```

```javascript
// Service Request criado:
{
  requestType: "incident",
  itemId: "uuid-suporte-impressora",
  description: "Impressora da sala 301 não liga"
}

// Ticket gerado automaticamente:
{
  ticketNumber: "TKT-20251108-8565",
  subject: "Suporte a Impressora",
  description: "Impressora da sala 301 não liga",
  type: "incidente",
  priority: "alta",  // Auto-atribuída (incidente = alta)
  
  catalogCategoryId: "uuid-hardware",           // TI > Hardware
  catalogItemId: "uuid-suporte-impressora",     // Item específico
  
  slaId: "uuid-sla-hardware",                   // Herdado do item
  directionId: "uuid-direcao-ti",               // Herdado do item
  assigneeId: "uuid-tecnico-ti"                 // Auto-atribuído
}
```

---

### **Exemplo 2: Ticket Manual sem Catálogo**

**Cenário:** Agente cria ticket manualmente

```jsx
// Formulário:
Assunto: "Problema com login"
Descrição: "Usuário não consegue fazer login"
Tipo: Incidente
Prioridade: Média

Categoria do Catálogo: TI > Software > Acesso ao Sistema
Item (opcional): [não selecionado]
```

```javascript
// Ticket criado:
{
  subject: "Problema com login",
  description: "Usuário não consegue fazer login",
  type: "incidente",
  priority: "media",
  
  catalogCategoryId: "uuid-software",  // TI > Software
  catalogItemId: null,                 // Nenhum item específico
  
  // Agente preenche manualmente:
  assigneeId: "uuid-agente-atual",
  directionId: "uuid-direcao-ti"
}
```

---

### **Exemplo 3: Ticket de Requisição via Catálogo**

**Cenário:** Solicitar novo laptop

```
Portal:
├── TI
    ├── Hardware
        └── 💻 Novo Laptop (ITEM)
```

```javascript
// Service Request:
{
  itemId: "uuid-novo-laptop",
  customFields: {
    modelo: "MacBook Pro",
    ram: "32GB",
    armazenamento: "1TB"
  }
}

// Ticket:
{
  subject: "Novo Laptop",
  type: "requisicao",
  priority: "baixa",  // Requisições = prioridade baixa
  
  catalogCategoryId: "uuid-hardware",
  catalogItemId: "uuid-novo-laptop",
  
  requiresApproval: true,  // Herdado do item
  approvalStatus: "pending",
  defaultApproverId: "uuid-gestor-ti"
}
```

---

## 🎨 **COMPONENTE: CatalogHierarchySelector**

### **Proposta de Componente React:**

```jsx
import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'

const CatalogHierarchySelector = ({ onSelect }) => {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    // Carregar categorias raiz
    api.get('/catalog/categories?hierarchy=true')
      .then(res => setCategories(res.data.categories))
  }, [])

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    
    // Carregar itens da categoria
    api.get(`/catalog/categories/${category.id}/items`)
      .then(res => setItems(res.data.items))
    
    onSelect(category, null)
  }

  const handleItemSelect = (item) => {
    setSelectedItem(item)
    onSelect(selectedCategory, item)
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Categoria */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Categoria *
        </label>
        <select
          value={selectedCategory?.id || ''}
          onChange={(e) => {
            const cat = categories.find(c => c.id === e.target.value)
            handleCategorySelect(cat)
          }}
          className="w-full px-4 py-2 border rounded-lg"
          required
        >
          <option value="">Selecione uma categoria...</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon || '📁'} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Seletor de Item (opcional) */}
      {selectedCategory && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Serviço/Item (opcional)
          </label>
          <select
            value={selectedItem?.id || ''}
            onChange={(e) => {
              const item = items.find(i => i.id === e.target.value)
              handleItemSelect(item)
            }}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Nenhum item específico</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.icon || '📦'} {item.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Breadcrumb */}
      {selectedCategory && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{selectedCategory.icon}</span>
          <span>{selectedCategory.name}</span>
          {selectedItem && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedItem.icon}</span>
              <span>{selectedItem.name}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default CatalogHierarchySelector
```

---

## 📋 **MENU SIMPLIFICADO**

### **ANTES:**
```
⚙️ Sistema
   ├── 🏷️ Categorias de Ticket  ❌ REMOVIDO
   ├── ⏱️ SLAs
   ├── 🎯 Prioridades
   ├── 📝 Tipos
   └── 🛡️ Permissões (RBAC)
```

### **DEPOIS:**
```
⚙️ Sistema
   ├── ⏱️ SLAs
   ├── 🎯 Prioridades
   ├── 📝 Tipos
   └── 🛡️ Permissões (RBAC)
```

**Categorias agora são geridas apenas em:**
```
🛒 Catálogo de Serviços
   ├── 📦 Itens/Serviços
   ├── 📁 Categorias  ✅ ÚNICO LUGAR
   ├── ✅ Aprovações
   └── 📊 Analytics
```

---

## ✅ **VANTAGENS**

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Categorias** | 2 tipos (confuso) | 1 tipo único |
| **Manutenção** | 2 lugares | 1 lugar |
| **UX** | Confusa | Clara |
| **Tickets via Catálogo** | Estrutura diferente | Mesma estrutura |
| **Tickets Manuais** | Sem hierarquia | Com hierarquia |
| **Relatórios** | Difícil agrupar | Fácil agrupar |

---

## 🔄 **MIGRAÇÃO DE DADOS EXISTENTES**

### **Script de Migração (Opcional):**

```sql
-- Migrar tickets antigos que usavam categoryId
-- para a nova estrutura com catalogCategoryId

-- 1. Criar mapeamento de Category → CatalogCategory
-- (Executar manualmente baseado em sua estrutura)

UPDATE tickets t
SET catalog_category_id = cc.id
FROM categories c
JOIN catalog_categories cc ON cc.name = c.name  -- Ajustar conforme necessário
WHERE t.category_id = c.id
AND t.catalog_category_id IS NULL;

-- 2. Log de tickets migrados
SELECT 
  COUNT(*) as total_migrados,
  COUNT(DISTINCT catalog_category_id) as categorias_unicas
FROM tickets
WHERE catalog_category_id IS NOT NULL
AND category_id IS NOT NULL;
```

---

## 📊 **QUERIES ÚTEIS**

### **Tickets por Categoria do Catálogo:**

```sql
SELECT 
  cc.name as categoria,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN t.status = 'novo' THEN 1 END) as novos,
  COUNT(CASE WHEN t.status = 'resolvido' THEN 1 END) as resolvidos
FROM tickets t
JOIN catalog_categories cc ON cc.id = t.catalog_category_id
GROUP BY cc.id, cc.name
ORDER BY total_tickets DESC;
```

### **Tickets por Item do Catálogo:**

```sql
SELECT 
  ci.name as item,
  cc.name as categoria,
  COUNT(t.id) as total_tickets,
  AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600) as avg_hours_to_resolve
FROM tickets t
JOIN catalog_items ci ON ci.id = t.catalog_item_id
JOIN catalog_categories cc ON cc.id = ci.category_id
WHERE t.resolved_at IS NOT NULL
GROUP BY ci.id, ci.name, cc.name
ORDER BY total_tickets DESC
LIMIT 10;
```

---

## 🚀 **PRÓXIMOS PASSOS**

### **Backend:**
- [x] Adicionar campos ao modelo Ticket
- [x] Criar migração SQL
- [x] Atualizar associações
- [ ] Executar migração no banco
- [ ] Testar criação de tickets

### **Frontend:**
- [x] Remover "Categorias de Ticket" do menu
- [ ] Criar componente CatalogHierarchySelector
- [ ] Atualizar NewTicket.jsx
- [ ] Adicionar seletores no formulário
- [ ] Testar fluxo completo

### **Documentação:**
- [x] Documentar decisão arquitetural
- [x] Atualizar memória do sistema
- [ ] Atualizar guia do usuário
- [ ] Criar tutorial para agentes

---

## 📚 **CONCLUSÃO**

Esta mudança simplifica significativamente a arquitetura eliminando duplicação e confusão. Tickets agora têm uma fonte única de verdade para categorização (o Catálogo de Serviços), seja criados automaticamente via portal ou manualmente por agentes.

**Data:** 08/11/2025  
**Versão:** 1.0  
**Status:** ✅ IMPLEMENTADO (Backend) / ⏳ PENDENTE (Frontend)
