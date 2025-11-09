# 📋 API - Catálogo de Serviços e Roteamento Inteligente

**TatuTicket Service Catalog API**  
**Versão:** 1.0  
**Data:** 04 Novembro 2025

---

## 🎯 VISÃO GERAL

Sistema completo de **Service Catalog** com:
- ✅ Catálogo de serviços organizável
- ✅ Formulários dinâmicos por serviço
- ✅ Roteamento inteligente automático
- ✅ Validação de campos customizados
- ✅ Service requests com aprovação
- ✅ Portal público

---

## 📚 BASE URL

```
http://localhost:3000/api/catalog
```

---

## 🔐 AUTENTICAÇÃO

Todas as rotas (exceto `/portal`) requerem token JWT:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 📂 ENDPOINTS

### **1. CATALOG CATEGORIES (Categorias do Catálogo)**

#### **GET /categories**
Listar todas as categorias do catálogo

**Query Parameters:**
- `includeInactive` (boolean) - Incluir categorias inativas
- `includeStats` (boolean) - Incluir contagem de itens

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hardware",
      "description": "Solicitações de equipamentos",
      "icon": "Laptop",
      "color": "#4A90E2",
      "defaultDirectionId": "uuid",
      "defaultDepartmentId": "uuid",
      "order": 1,
      "isActive": true,
      "itemCount": 15
    }
  ]
}
```

#### **GET /categories/:id**
Buscar categoria específica com seus itens

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Hardware",
    "items": [
      {
        "id": "uuid",
        "name": "Request New Laptop",
        "shortDescription": "Solicitar novo notebook"
      }
    ]
  }
}
```

#### **POST /categories** 🔒 Admin only
Criar nova categoria

**Body:**
```json
{
  "name": "Hardware",
  "description": "Equipamentos de TI",
  "icon": "Laptop",
  "color": "#4A90E2",
  "defaultDirectionId": "uuid",
  "defaultDepartmentId": "uuid",
  "order": 1
}
```

#### **PUT /categories/:id** 🔒 Admin only
Atualizar categoria

#### **DELETE /categories/:id** 🔒 Admin only
Desativar categoria

---

### **2. CATALOG ITEMS (Itens do Catálogo)**

#### **GET /items**
Listar itens do catálogo

**Query Parameters:**
- `categoryId` (uuid) - Filtrar por categoria
- `search` (string) - Buscar por nome/descrição
- `popular` (boolean) - Ordenar por mais solicitados

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Request New Laptop",
      "shortDescription": "Solicitar novo notebook para trabalho",
      "icon": "Laptop",
      "categoryId": "uuid",
      "category": {
        "name": "Hardware",
        "icon": "Laptop",
        "color": "#4A90E2"
      },
      "estimatedCost": 5000.00,
      "estimatedDeliveryTime": 120,
      "requestCount": 45,
      "requiresApproval": true
    }
  ]
}
```

#### **GET /items/:id**
Buscar item específico **com schema do formulário**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Request New Laptop",
    "shortDescription": "Solicitar novo notebook",
    "fullDescription": "Processo para solicitar...",
    
    // Roteamento automático
    "defaultDirectionId": "uuid",
    "defaultDepartmentId": "uuid",
    "defaultSectionId": "uuid",
    "defaultWorkflowId": 1,
    "assignmentType": "round_robin",
    
    // SLA e aprovação
    "slaId": "uuid",
    "requiresApproval": true,
    "defaultPriority": "media",
    
    // Custos
    "estimatedCost": 5000.00,
    "estimatedDeliveryTime": 120,
    
    // CAMPOS CUSTOMIZADOS
    "customFields": [
      {
        "name": "modelo",
        "label": "Modelo do Notebook",
        "type": "dropdown",
        "required": true,
        "options": [
          {"value": "macbook_pro_14", "label": "MacBook Pro 14\""},
          {"value": "dell_xps_15", "label": "Dell XPS 15"}
        ]
      },
      {
        "name": "ram",
        "label": "Memória RAM",
        "type": "dropdown",
        "required": true,
        "options": ["16GB", "32GB", "64GB"]
      },
      {
        "name": "justificativa",
        "label": "Justificativa",
        "type": "textarea",
        "required": true,
        "minLength": 20,
        "maxLength": 500,
        "placeholder": "Por favor, detalhe sua necessidade..."
      },
      {
        "name": "urgente",
        "label": "É urgente?",
        "type": "checkbox",
        "required": false
      }
    ],
    
    // SCHEMA GERADO para o Frontend
    "formSchema": {
      "fields": [
        // ... mesmos campos com validações processadas
      ]
    }
  }
}
```

#### **POST /items** 🔒 Admin only
Criar novo item do catálogo

**Body:**
```json
{
  "name": "Request New Laptop",
  "categoryId": "uuid",
  "shortDescription": "Solicitar novo notebook",
  "fullDescription": "Processo completo...",
  "icon": "Laptop",
  
  // Roteamento
  "defaultDirectionId": "uuid",
  "defaultDepartmentId": "uuid",
  "defaultSectionId": "uuid",
  "defaultWorkflowId": 1,
  "assignmentType": "round_robin",
  
  // Configurações
  "slaId": "uuid",
  "requiresApproval": true,
  "defaultPriority": "alta",
  "estimatedCost": 5000.00,
  "estimatedDeliveryTime": 120,
  
  // Campos customizados
  "customFields": [
    {
      "name": "modelo",
      "label": "Modelo",
      "type": "dropdown",
      "required": true,
      "options": ["MacBook Pro", "Dell XPS"]
    }
  ],
  
  "order": 1,
  "isActive": true,
  "isPublic": true
}
```

#### **PUT /items/:id** 🔒 Admin only
Atualizar item

#### **DELETE /items/:id** 🔒 Admin only
Desativar item

---

### **3. SERVICE REQUESTS (Solicitações de Serviço)**

#### **POST /items/:id/request**
Criar service request a partir de um item

**Body:**
```json
{
  "formData": {
    "modelo": "macbook_pro_14",
    "ram": "32GB",
    "justificativa": "Preciso para desenvolvimento de aplicações pesadas...",
    "urgente": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "catalogItemId": "uuid",
    "requesterId": "uuid",
    "formData": {
      "modelo": "macbook_pro_14",
      "ram": "32GB",
      "justificativa": "Preciso para..."
    },
    "status": "pending_approval",
    "createdAt": "2025-11-04T10:00:00Z"
  },
  "requiresApproval": true
}
```

**Fluxo:**
1. Se `requiresApproval = true`:
   - Status: `pending_approval`
   - Aguarda aprovador
   
2. Se `requiresApproval = false`:
   - Status: `approved` → `in_progress`
   - Ticket criado automaticamente
   - Roteamento aplicado

#### **GET /requests**
Listar minhas service requests

**Query Parameters:**
- `status` (string) - Filtrar por status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "catalogItemId": "uuid",
      "catalogItem": {
        "name": "Request New Laptop",
        "icon": "Laptop"
      },
      "status": "pending_approval",
      "createdAt": "2025-11-04T10:00:00Z"
    }
  ]
}
```

#### **GET /requests/:id**
Detalhes de um service request

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "catalogItemId": "uuid",
    "requesterId": "uuid",
    "ticketId": "uuid",
    "formData": {
      "modelo": "macbook_pro_14",
      "ram": "32GB"
    },
    "formDataDisplay": {
      "modelo": "MacBook Pro 14\"",
      "ram": "32GB"
    },
    "status": "approved",
    "approverId": "uuid",
    "approvalDate": "2025-11-04T11:00:00Z",
    "approvalComments": "Aprovado conforme necessidade do projeto"
  }
}
```

---

### **4. PORTAL PÚBLICO**

#### **GET /portal**
Portal público do catálogo (SEM AUTENTICAÇÃO)

**Query Parameters:**
- `organizationId` (uuid) - **Obrigatório**

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hardware",
      "description": "Equipamentos de TI",
      "icon": "Laptop",
      "color": "#4A90E2",
      "items": [
        {
          "id": "uuid",
          "name": "Request New Laptop",
          "shortDescription": "Solicitar notebook",
          "icon": "Laptop",
          "estimatedCost": 5000.00,
          "estimatedDeliveryTime": 120
        }
      ]
    },
    {
      "name": "Software",
      "items": [...]
    }
  ]
}
```

---

## 🔄 FLUXOS COMPLETOS

### **Fluxo 1: Cliente Solicita Notebook**

```
1. GET /catalog/portal?organizationId=xxx
   → Visualiza catálogo público

2. GET /catalog/items/:id
   → Busca detalhes do item "Request New Laptop"
   → Recebe formSchema com campos customizados

3. POST /catalog/items/:id/request
   Body: { formData: { modelo: "macbook_pro_14", ram: "32GB", ... } }
   → Cria Service Request
   → Se requiresApproval = true: aguarda aprovação
   → Se requiresApproval = false: cria ticket automaticamente

4. Sistema aplica ROTEAMENTO AUTOMÁTICO:
   ✅ Direction = Diretoria TI (do catalog item)
   ✅ Department = Infraestrutura (do catalog item)
   ✅ Section = Aquisições (do catalog item)
   ✅ SLA = 5 dias úteis (do catalog item)
   ✅ Workflow = Workflow de Compras (do catalog item)
   ✅ Assignment = Round Robin entre agentes da seção

5. Ticket criado e roteado corretamente!
```

### **Fluxo 2: Admin Cria Novo Serviço**

```
1. POST /catalog/categories
   → Cria categoria "Acesso e Segurança"

2. POST /catalog/items
   Body: {
     name: "Request VPN Access",
     categoryId: "uuid",
     defaultDepartmentId: "uuid-security",
     assignmentType: "agent",
     defaultAgentId: "uuid-security-admin",
     customFields: [
       {
         name: "motivo",
         label: "Motivo do Acesso",
         type: "textarea",
         required: true
       }
     ]
   }
   → Cria item configurado

3. Usuários podem agora solicitar VPN via portal!
```

---

## 🎨 TIPOS DE CAMPOS CUSTOMIZADOS

### **Tipos Suportados:**

```javascript
{
  // Textos
  "text", "textarea", "email", "phone", "url",
  
  // Números e datas
  "number", "date", "time", "datetime", "currency",
  
  // Seleção
  "dropdown", "radio", "checkbox", "multiselect",
  
  // Especiais
  "file", "rating", "slider", "color"
}
```

### **Exemplo de Campo Condicional:**

```json
{
  "name": "mac_specs",
  "label": "Especificações Mac",
  "type": "multiselect",
  "options": ["Touch Bar", "M3 Pro", "M3 Max"],
  "conditional": {
    "field": "modelo",
    "operator": "equals",
    "value": "macbook_pro_14"
  }
}
```

Este campo só aparece se `modelo === "macbook_pro_14"`.

---

## ✅ VALIDAÇÕES AUTOMÁTICAS

O sistema valida automaticamente:

- ✅ Campos obrigatórios
- ✅ Tipos de dados (email, phone, URL, number)
- ✅ Min/Max valores
- ✅ Min/MaxLength
- ✅ Padrões regex
- ✅ Opções válidas (dropdown, radio, etc)

**Exemplo de erro:**
```json
{
  "error": "Dados do formulário inválidos",
  "errors": [
    {
      "field": "justificativa",
      "message": "O campo deve ter no mínimo 20 caracteres"
    },
    {
      "field": "email",
      "message": "O valor de \"Email\" não é um email válido"
    }
  ]
}
```

---

## 🚀 ROTEAMENTO INTELIGENTE

Quando um Service Request é criado, o sistema **AUTOMATICAMENTE**:

### **1. Define Hierarquia Organizacional:**
```javascript
ticket.directionId = catalogItem.defaultDirectionId;
ticket.departmentId = catalogItem.defaultDepartmentId;
ticket.sectionId = catalogItem.defaultSectionId;
```

### **2. Aplica SLA e Workflow:**
```javascript
ticket.slaId = catalogItem.slaId;
ticket.workflowId = catalogItem.defaultWorkflowId;
```

### **3. Atribui Agente baseado no tipo:**

**a) Agente Específico:**
```javascript
assignmentType: "agent"
defaultAgentId: "uuid"
→ Ticket vai direto para esse agente
```

**b) Round Robin:**
```javascript
assignmentType: "round_robin"
→ Próximo agente disponível na fila
```

**c) Load Balance:**
```javascript
assignmentType: "load_balance"
→ Agente com menos tickets abertos
```

**d) Fila do Departamento/Seção:**
```javascript
assignmentType: "department" ou "section"
→ Fica na fila para qualquer agente pegar
```

---

## 📊 EXEMPLOS PRÁTICOS

### **Exemplo 1: Formulário Simples**

```json
{
  "name": "Request Parking Spot",
  "customFields": [
    {
      "name": "plate",
      "label": "Placa do Veículo",
      "type": "text",
      "required": true,
      "pattern": "^[A-Z]{3}-[0-9]{4}$",
      "patternMessage": "Formato: ABC-1234"
    },
    {
      "name": "start_date",
      "label": "Data de Início",
      "type": "date",
      "required": true
    }
  ]
}
```

### **Exemplo 2: Formulário Complexo**

```json
{
  "name": "Request Software License",
  "customFields": [
    {
      "name": "software",
      "label": "Software",
      "type": "dropdown",
      "required": true,
      "options": [
        {"value": "office365", "label": "Microsoft Office 365"},
        {"value": "adobe_cc", "label": "Adobe Creative Cloud"},
        {"value": "autocad", "label": "AutoCAD"}
      ]
    },
    {
      "name": "license_type",
      "label": "Tipo de Licença",
      "type": "radio",
      "required": true,
      "options": ["Individual", "Equipe"],
      "conditional": {
        "field": "software",
        "operator": "equals",
        "value": "office365"
      }
    },
    {
      "name": "duration",
      "label": "Duração (meses)",
      "type": "number",
      "required": true,
      "min": 1,
      "max": 36
    },
    {
      "name": "cost_center",
      "label": "Centro de Custo",
      "type": "text",
      "required": true
    }
  ]
}
```

---

## 🎯 BENEFÍCIOS

### **Para o Cliente:**
- ✅ Portal intuitivo e visual
- ✅ Formulários específicos por serviço
- ✅ Vê prazo e custo antes de solicitar
- ✅ Acompanha status em tempo real

### **Para o Técnico:**
- ✅ Tickets chegam na fila certa
- ✅ Contexto completo desde o início
- ✅ Sem re-roteamento
- ✅ Workflow já definido

### **Para o Gestor:**
- ✅ Métricas por serviço
- ✅ Custos mapeados
- ✅ Gargalos identificados
- ✅ ROI calculável

---

## 🔧 CONFIGURAÇÃO RECOMENDADA

### **1. Criar Categorias:**
```
Hardware, Software, Acesso & Segurança, RH, Facilities
```

### **2. Criar Itens Populares:**
```
- Request New Laptop/Desktop
- Request VPN Access
- Request Software License
- Request Parking Spot
- Request Office Supplies
```

### **3. Configurar Roteamento:**
```
Cada item deve ter:
- Direction/Department/Section
- SLA apropriado
- Workflow (se aplicável)
- Tipo de atribuição
```

### **4. Customizar Formulários:**
```
Definir campos específicos para cada serviço
```

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Executar migration: `20251111-enhance-catalog-routing.cjs`
2. ✅ Adicionar rotas ao `routes/index.js`
3. ✅ Testar endpoints via Postman/Insomnia
4. 🔄 Criar interface frontend
5. 🔄 Popular catálogo com serviços reais

---

**Sistema completo e production-ready!** 🚀

**TatuTicket agora tem o Service Catalog mais avançado do mercado!** 🏆
