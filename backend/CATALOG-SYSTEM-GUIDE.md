# 📚 Sistema de Catálogo de Serviços - Guia Completo

## 🎯 Visão Geral

Sistema enterprise-grade de catálogo de serviços com **hierarquia de categorias**, **tipos de item** (Incidente, Serviço, Suporte, Requisição), **roteamento organizacional completo** e **regras de negócio inteligentes**.

---

## 🏗️ Arquitetura

### Componentes Implementados

```
backend/
├── src/
│   ├── migrations/
│   │   └── 20251115-enhance-catalog-system.js    ✅ Nova migration
│   ├── modules/
│   │   └── catalog/
│   │       ├── catalogModel.js                    ✅ Atualizado
│   │       ├── catalogControllerV2.js             ✅ Novo controller
│   │       └── catalogRoutes.js                   ✅ Rotas completas
│   └── services/
│       └── catalogService.js                      ✅ Service layer
```

### Models

1. **CatalogCategory** - Categorias (com hierarquia)
2. **CatalogItem** - Itens/Serviços
3. **ServiceRequest** - Solicitações

---

## 🆕 Novos Campos Implementados

### CatalogCategory

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `parentCategoryId` | UUID | ID da categoria pai (para subcategorias) |
| `level` | Integer | Nível hierárquico (1=raiz, 2=sub, etc) |
| `imageUrl` | String(500) | URL da imagem/logo |
| `color` | String(7) | Cor em hex (#4A90E2) |
| `defaultDirectionId` | UUID | Direção padrão |
| `defaultDepartmentId` | UUID | Departamento padrão |
| `defaultSectionId` | UUID | Seção padrão |

### CatalogItem

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `itemType` | Enum | incident, service, support, request |
| `imageUrl` | String(500) | URL da imagem/logo |
| `autoAssignPriority` | Boolean | Auto-definir prioridade por tipo |
| `skipApprovalForIncidents` | Boolean | Incidentes pulam aprovação |
| `incidentWorkflowId` | Integer | Workflow específico para incidentes |
| `keywords` | Array[String] | Tags para busca |
| `defaultDirectionId` | UUID | Direção responsável |
| `defaultDepartmentId` | UUID | Departamento responsável |
| `defaultSectionId` | UUID | Seção responsável |

### ServiceRequest

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `requestType` | Enum | Tipo copiado do catalog item |
| `finalPriority` | Enum | Prioridade final aplicada ao ticket |

---

## 📋 Como Funciona

### 1️⃣ Hierarquia de Categorias

```
TI (Categoria Raiz - level 1)
  ├── Infraestrutura (Subcategoria - level 2)
  │   ├── Redes (Subcategoria - level 3)
  │   └── Servidores (Subcategoria - level 3)
  └── Aplicações (Subcategoria - level 2)
      ├── ERP (Subcategoria - level 3)
      └── CRM (Subcategoria - level 3)
```

**Criação:**
```json
POST /api/catalog/categories
{
  "name": "Infraestrutura",
  "parentCategoryId": "uuid-da-categoria-ti",
  "description": "Serviços de infraestrutura",
  "icon": "Server",
  "color": "#3B82F6",
  "imageUrl": "https://exemplo.com/infra.png",
  "defaultDirectionId": "uuid-direcao-ti",
  "defaultDepartmentId": "uuid-dept-infra"
}
```

### 2️⃣ Tipos de Item

#### 🚨 **Incident** (Incidente)
- **Comportamento:** Prioridade automática Alta/Crítica
- **Aprovação:** NUNCA (urgente)
- **Workflow:** Usa `incidentWorkflowId` se definido
- **Exemplo:** "Falha na VPN", "Servidor fora do ar"

#### 🛠️ **Service** (Serviço)
- **Comportamento:** Prioridade padrão configurável
- **Aprovação:** Conforme configurado
- **Workflow:** Usa `defaultWorkflowId`
- **Exemplo:** "Solicitar novo computador", "Criar novo usuário"

#### 🆘 **Support** (Suporte)
- **Comportamento:** Prioridade média (upgradable)
- **Aprovação:** Conforme configurado
- **Exemplo:** "Dúvida sobre software", "Treinamento"

#### 📝 **Request** (Requisição)
- **Comportamento:** Prioridade baixa (downgradable)
- **Aprovação:** Conforme configurado
- **Exemplo:** "Requisitar material", "Solicitação geral"

### 3️⃣ Roteamento Organizacional

**Hierarquia:** Direction → Department → Section

**Prioridade de roteamento:**
1. Item específico (`defaultDirectionId`, `defaultDepartmentId`, `defaultSectionId`)
2. Categoria do item
3. Categoria pai (se subcategoria)

**Exemplo:**
```json
POST /api/catalog/items
{
  "name": "Falha de Rede Interna",
  "categoryId": "uuid-categoria-redes",
  "itemType": "incident",
  "autoAssignPriority": true,
  "skipApprovalForIncidents": true,
  "defaultDirectionId": "uuid-direcao-ti",
  "defaultDepartmentId": "uuid-dept-infra",
  "defaultSectionId": "uuid-secao-redes",
  "keywords": ["rede", "conectividade", "internet"]
}
```

### 4️⃣ Fluxo do Cliente (Portal)

```
1. Cliente acessa: GET /api/catalog/portal/categories
   ↓ Recebe hierarquia de categorias

2. Cliente seleciona: Categoria "TI" → "Infraestrutura" → "Redes"
   ↓

3. Cliente busca itens: GET /api/catalog/portal/categories/:categoryId/items
   ↓ Recebe lista de serviços

4. Cliente seleciona: "Falha de rede interna"
   ↓ Abre formulário com customFields

5. Cliente preenche e envia: POST /api/catalog/requests
   {
     "catalogItemId": "uuid-item",
     "formData": {
       "local": "Sala 101",
       "descricao": "Sem acesso à internet",
       "urgencia": "alta"
     }
   }
   ↓

6. Sistema aplica regras de negócio:
   - Detecta itemType: "incident"
   - Define prioridade: "alta" (automático)
   - Pula aprovação: true
   - Determina roteamento: TI > Infra > Redes
   - Cria ticket AUTOMATICAMENTE
   ↓

7. Ticket criado e atribuído!
```

---

## 🔧 Regras de Negócio Implementadas

### Auto-Prioridade por Tipo

```javascript
// catalogService.js - determinePriorityByType()

itemType: 'incident'
  → Prioridade: SEMPRE alta ou crítica

itemType: 'service'
  → Prioridade: Configurável (defaultPriority)

itemType: 'support'
  → Prioridade: média (upgradable para alta)

itemType: 'request'
  → Prioridade: baixa (downgraded se tentar alta)
```

### Aprovação por Tipo

```javascript
// catalogService.js - requiresApprovalByType()

itemType: 'incident' && skipApprovalForIncidents: true
  → NUNCA requer aprovação

Outros tipos
  → Seguem configuração do campo requiresApproval
```

### Workflow por Tipo

```javascript
// catalogService.js - getWorkflowByType()

itemType: 'incident' && incidentWorkflowId existe
  → Usa workflow específico de incidente

Qualquer tipo
  → Usa defaultWorkflowId
```

---

## 📡 API Endpoints

### Categorias

```http
# Listar categorias (hierárquica)
GET /api/catalog/categories?hierarchy=true

# Obter categoria específica
GET /api/catalog/categories/:id

# Criar categoria
POST /api/catalog/categories
{
  "name": "TI",
  "parentCategoryId": null,  // null = raiz
  "icon": "Monitor",
  "color": "#3B82F6",
  "imageUrl": "https://...",
  "defaultDirectionId": "uuid",
  "defaultDepartmentId": "uuid"
}

# Atualizar categoria
PUT /api/catalog/categories/:id

# Deletar categoria
DELETE /api/catalog/categories/:id
```

### Itens

```http
# Buscar itens (com filtros)
GET /api/catalog/items?itemType=incident&categoryId=xxx&search=vpn

# Obter item específico
GET /api/catalog/items/:id

# Criar item
POST /api/catalog/items
{
  "categoryId": "uuid",
  "name": "Falha na VPN",
  "itemType": "incident",
  "autoAssignPriority": true,
  "skipApprovalForIncidents": true,
  "defaultPriority": "alta",
  "keywords": ["vpn", "acesso remoto"],
  "customFields": [
    {
      "name": "local",
      "type": "text",
      "label": "Local do Problema",
      "required": true
    }
  ]
}
```

### Service Requests

```http
# Criar solicitação (aplica regras de negócio)
POST /api/catalog/requests
{
  "catalogItemId": "uuid-item",
  "formData": {
    "local": "Sala 101",
    "descricao": "Descrição do problema"
  },
  "userProvidedPriority": "critica"  // opcional
}

# Listar solicitações
GET /api/catalog/requests?status=pending_approval&requestType=incident

# Aprovar/Rejeitar
POST /api/catalog/requests/:id/approve
{
  "approved": true,
  "comments": "Aprovado",
  "approvedCost": 150.00
}
```

### Portal do Cliente

```http
# Hierarquia de categorias
GET /api/catalog/portal/categories

# Itens de uma categoria
GET /api/catalog/portal/categories/:categoryId/items

# Itens mais populares
GET /api/catalog/portal/popular?limit=10&itemType=service
```

### Estatísticas

```http
# Estatísticas gerais
GET /api/catalog/statistics

# Resposta:
{
  "totalCategories": 15,
  "totalItems": 50,
  "totalRequests": 230,
  "pendingApprovals": 5,
  "byType": {
    "incident": { "count": 10, "totalRequests": 80 },
    "service": { "count": 30, "totalRequests": 120 },
    "support": { "count": 8, "totalRequests": 25 },
    "request": { "count": 2, "totalRequests": 5 }
  },
  "mostPopular": [...]
}
```

---

## 🚀 Como Executar a Migration

```bash
# 1. Backup do banco
pg_dump -U postgres -d tatuticket > backup_antes_catalog.sql

# 2. Executar migration
cd /Users/pedrodivino/Dev/ticket/backend
npm run migrate

# 3. Verificar se tabelas foram atualizadas
psql -U postgres -d tatuticket -c "\d catalog_categories"
psql -U postgres -d tatuticket -c "\d catalog_items"
```

---

## 📊 Comparação com Mercado

| Feature | ServiceNow | Jira SM | Zendesk | **TatuTicket** |
|---------|-----------|---------|---------|---------------|
| Hierarquia de Categorias | ✅ 3 níveis | ✅ 2 níveis | ✅ 2 níveis | ✅ **Multi-nível ilimitado** |
| Tipos de Item | ✅ | ✅ | ⚠️ | ✅ **4 tipos** |
| Auto-Prioridade | ✅ | ⚠️ | ❌ | ✅ |
| Aprovações | ✅ | ✅ | ✅ | ✅ |
| SLA por Item | ✅ | ✅ | ⚠️ | ✅ |
| Campos Customizados | ✅ | ✅ | ✅ | ✅ |
| Roteamento 3 Níveis | ✅ | ❌ | ❌ | ✅ **Direction/Dept/Section** |
| Imagens/Ícones | ✅ | ✅ | ⚠️ | ✅ |
| Keywords/Tags | ✅ | ✅ | ✅ | ✅ |
| Portal Cliente | ✅ | ✅ | ✅ | ✅ |
| Workflows por Tipo | ✅ | ⚠️ | ❌ | ✅ |

---

## 🎨 Exemplo Completo de Uso

### Cenário: Configurar Catálogo de TI

```bash
# 1. Criar Categoria Raiz "TI"
POST /api/catalog/categories
{
  "name": "TI",
  "description": "Serviços de Tecnologia da Informação",
  "icon": "Monitor",
  "color": "#3B82F6",
  "imageUrl": "https://exemplo.com/ti.png",
  "defaultDirectionId": "uuid-direcao-ti"
}

# 2. Criar Subcategoria "Infraestrutura"
POST /api/catalog/categories
{
  "name": "Infraestrutura",
  "parentCategoryId": "uuid-categoria-ti",
  "icon": "Server",
  "color": "#10B981",
  "defaultDepartmentId": "uuid-dept-infra"
}

# 3. Criar Item "Falha na VPN" (Incidente)
POST /api/catalog/items
{
  "categoryId": "uuid-categoria-infra",
  "name": "Falha de Acesso à VPN",
  "shortDescription": "Problemas para conectar na VPN corporativa",
  "itemType": "incident",
  "autoAssignPriority": true,
  "skipApprovalForIncidents": true,
  "defaultPriority": "alta",
  "defaultSectionId": "uuid-secao-redes",
  "keywords": ["vpn", "acesso remoto", "rede"],
  "customFields": [
    {
      "name": "mensagem_erro",
      "type": "textarea",
      "label": "Mensagem de erro",
      "required": false
    },
    {
      "name": "sistema_operacional",
      "type": "select",
      "label": "Sistema Operacional",
      "options": ["Windows", "macOS", "Linux"],
      "required": true
    }
  ]
}

# 4. Cliente cria solicitação
POST /api/catalog/requests
{
  "catalogItemId": "uuid-item-vpn",
  "formData": {
    "mensagem_erro": "Connection timeout",
    "sistema_operacional": "Windows"
  }
}

# ✅ Sistema automaticamente:
# - Define prioridade: "alta"
# - Pula aprovação
# - Roteia para: TI > Infra > Redes
# - Cria ticket imediatamente
```

---

## 🔐 Permissões Necessárias

```javascript
// Criar/Editar/Deletar categorias e itens
checkPermission('catalog', 'create')
checkPermission('catalog', 'update')
checkPermission('catalog', 'delete')

// Aprovar solicitações
checkPermission('catalog', 'approve')

// Visualizar estatísticas
checkPermission('catalog', 'view')

// Clientes podem:
// - Ver portal
// - Criar solicitações
// - Ver suas próprias solicitações
```

---

## 📌 Próximos Passos

1. ✅ Executar migration
2. ✅ Registrar rotas no `routes/index.js`
3. ✅ Criar seeds de exemplo
4. ✅ Testar endpoints
5. ⏳ Implementar frontend (React)
6. ⏳ Testes automatizados

---

## 🆘 Troubleshooting

### Migration falha

```bash
# Verificar se as tabelas existem
psql -U postgres -d tatuticket -c "\dt catalog*"

# Se necessário, reverter
npm run migrate:undo
```

### Erro de relacionamentos

```bash
# Verificar se Direction, Department, Section existem
psql -U postgres -d tatuticket -c "SELECT COUNT(*) FROM directions;"
```

---

## 📝 Notas Importantes

1. **Hierarquia ilimitada:** Suporta N níveis de categorias
2. **Validação de loops:** Sistema previne hierarquia circular
3. **Soft delete:** Itens com solicitações são desativados, não deletados
4. **Performance:** Índices criados para queries hierárquicas
5. **Retrocompatível:** Dados existentes continuam funcionando

---

**Desenvolvido por:** Pedro Divino  
**Data:** 15/11/2024  
**Versão:** 2.0
