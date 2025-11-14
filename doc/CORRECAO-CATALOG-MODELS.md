# ✅ CORREÇÕES DOS MODELOS DO CATÁLOGO

## 🐛 **PROBLEMAS IDENTIFICADOS:**

**Data:** 09/11/2025

### **1. Erro: "invalid input syntax for type numeric: ''"**
```
POST /api/catalog/items → 500
Error: invalid input syntax for type numeric: ""
```

**Causa:** Campos numéricos vazios `""` enviados como string para PostgreSQL

---

### **2. Erro: "column ServiceRequest.requester_id does not exist"**
```
GET /api/catalog/requests → 500
Error: column ServiceRequest.requester_id does not exist
```

**Causa:** Falta de configuração `underscored: true` nos modelos Sequelize

---

## 🔧 **CORREÇÕES IMPLEMENTADAS:**

### **1. Sanitização de Campos Numéricos**

**Arquivo:** `/backend/src/modules/catalog/catalogControllerV2.js`

```javascript
// Função para sanitizar campos numéricos
const cleanNumeric = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// Aplicado em:
// - estimatedCost
// - estimatedDeliveryTime
```

**Conversões:**
```javascript
""          → null
undefined   → null
null        → null
"2.5"       → 2.5
"abc"       → null
```

---

### **2. Adicionado `priorityId` e `typeId`**

**Antes:**
```javascript
const {
  categoryId,
  name,
  slaId,
  // ...
} = req.body;
```

**Depois:**
```javascript
const {
  categoryId,
  name,
  priorityId,  // ✅ NOVO
  typeId,      // ✅ NOVO
  slaId,
  // ...
} = req.body;
```

---

### **3. Configuração `underscored: true` nos Modelos**

**Arquivo:** `/backend/src/modules/catalog/catalogModel.js`

#### **CatalogCategory:**
```javascript
}, {
  tableName: 'catalog_categories',
  timestamps: true,
  underscored: true  // ✅ ADICIONADO
});
```

#### **CatalogItem:**
```javascript
}, {
  tableName: 'catalog_items',
  timestamps: true,
  underscored: true  // ✅ ADICIONADO
});
```

#### **ServiceRequest:**
```javascript
}, {
  tableName: 'service_requests',
  timestamps: true,
  underscored: true  // ✅ ADICIONADO
});
```

---

## 📊 **O QUE FAZ `underscored: true`:**

### **Sem underscored:**
```javascript
Model: requesterId
SQL:   SELECT "requesterId" FROM service_requests  ❌ ERRO!
```

### **Com underscored:**
```javascript
Model: requesterId
SQL:   SELECT "requester_id" FROM service_requests  ✅ CORRETO!
```

**Conversões automáticas:**
```
requesterId       → requester_id
catalogItemId     → catalog_item_id
approverId        → approver_id
approvalDate      → approval_date
approvalComments  → approval_comments
approvedCost      → approved_cost
rejectionReason   → rejection_reason
```

---

## 📂 **ARQUIVOS MODIFICADOS:**

```
✅ /backend/src/modules/catalog/catalogControllerV2.js
   - Adicionada função cleanNumeric()
   - Extraído priorityId e typeId do req.body
   - Sanitização em CREATE e UPDATE
   - Adicionado priorityId e typeId aos uuidFields

✅ /backend/src/modules/catalog/catalogModel.js
   - CatalogCategory: underscored: true
   - CatalogItem: underscored: true
   - ServiceRequest: underscored: true
```

---

## 🧪 **TESTES NECESSÁRIOS:**

### **1. Criar Item do Catálogo:**
```bash
POST /api/catalog/items
{
  "categoryId": "uuid",
  "name": "Teste",
  "priorityId": "uuid",
  "typeId": "uuid",
  "slaId": "uuid",
  "estimatedCost": "",           # ✅ Deve aceitar vazio
  "estimatedDeliveryTime": ""    # ✅ Deve aceitar vazio
}

Esperado: 200 OK
```

---

### **2. Buscar Service Requests:**
```bash
GET /api/catalog/requests?status=pending_approval

Esperado: 200 OK
Response: {
  success: true,
  requests: [...]
}
```

---

### **3. Atualizar Item:**
```bash
PUT /api/catalog/items/:id
{
  "name": "Novo Nome",
  "estimatedCost": "100.50",     # ✅ Deve converter para 100.5
  "estimatedDeliveryTime": "2"   # ✅ Deve converter para 2.0
}

Esperado: 200 OK
```

---

## ⚠️ **IMPORTANTE:**

### **Reiniciar o Servidor Backend:**

Após modificar os modelos Sequelize, é **OBRIGATÓRIO** reiniciar o servidor:

```bash
# 1. Parar o servidor
Ctrl + C

# 2. Reiniciar
npm run dev
```

**Por quê?** Sequelize carrega os modelos na inicialização. Mudanças nos modelos não são refletidas sem reiniciar.

---

## 🔍 **VERIFICAÇÃO:**

### **1. Verificar Logs:**
```bash
# Deve aparecer no terminal:
info: POST /api/catalog/items
info: Item de catálogo criado: [nome]

# NÃO deve aparecer:
error: invalid input syntax for type numeric: ""
error: column ServiceRequest.requester_id does not exist
```

---

### **2. Verificar Queries SQL:**
```sql
-- Deve gerar query correta:
SELECT 
  "ServiceRequest"."id",
  "ServiceRequest"."requester_id",  -- ✅ snake_case correto
  "ServiceRequest"."catalog_item_id",
  ...
FROM service_requests
```

---

## ✅ **CHECKLIST:**

```
✅ Função cleanNumeric() criada
✅ priorityId e typeId extraídos do req.body
✅ Campos numéricos sanitizados (CREATE)
✅ Campos numéricos sanitizados (UPDATE)
✅ CatalogCategory: underscored: true
✅ CatalogItem: underscored: true
✅ ServiceRequest: underscored: true
⚠️ PENDENTE: Reiniciar servidor backend
⚠️ PENDENTE: Testar criação de item
⚠️ PENDENTE: Testar busca de requests
```

---

## 🎯 **PRÓXIMOS PASSOS:**

1. **Reiniciar servidor backend** (obrigatório!)
2. Limpar cache do navegador (Ctrl+Shift+R)
3. Testar criar novo item no catálogo
4. Verificar que não há mais erros 500
5. Confirmar que service requests carregam corretamente

---

## 📝 **NOTAS:**

- ✅ **underscored: true** garante consistência entre código JS e banco PostgreSQL
- ✅ **cleanNumeric()** previne erros de tipo no banco
- ✅ Campos vazios `""` agora são convertidos para `null`
- ✅ Todos os modelos do catálogo agora têm configuração consistente

---

**Data:** 09/11/2025  
**Versão:** 1.0  
**Status:** ✅ CORREÇÕES IMPLEMENTADAS - AGUARDANDO TESTES
