# 🗂️ Guia de Navegação do Catálogo de Serviços

## 📐 Nova Estrutura Hierárquica

O catálogo de serviços agora usa uma **navegação hierárquica em 3 níveis** para tornar a experiência mais intuitiva e organizada.

---

## 🎯 Fluxo de Navegação

```
📁 NÍVEL 1: Categorias Raiz
   ↓ (clique)
📁 NÍVEL 2: Subcategorias
   ↓ (clique)
📦 NÍVEL 3: Itens/Serviços
   ↓ (clique)
📋 Modal de Solicitação
```

---

## 📊 Níveis Detalhados

### 🏠 **NÍVEL 1: Categorias Raiz**

**Visual:** Cards grandes coloridos em grid

**Características:**
- ✅ Cards em grid 3 colunas (desktop)
- ✅ Gradiente colorido por categoria
- ✅ Ícone grande e nome em destaque
- ✅ Contador de serviços disponíveis
- ✅ Hover animado (sobe e sombra)

**Exemplo:**
```
┌──────────────────────────┐
│  🖥️  TI                  │
│                          │
│  Serviços de tecnologia  │
│  e infraestrutura        │
│                          │
│  ────────────────────    │
│  12 serviços             │
└──────────────────────────┘
```

**API:** `GET /catalog/portal/categories` (filtra apenas `parentCategoryId === null`)

---

### 📁 **NÍVEL 2: Subcategorias**

**Visual:** Cards médios em grid 4 colunas

**Características:**
- ✅ Breadcrumb no topo (Catálogo > Categoria Raiz)
- ✅ Cards menores com ícone centralizado
- ✅ Border que muda para azul no hover
- ✅ Contador de itens
- ✅ Botão "Voltar" se não houver subcategorias

**Exemplo:**
```
Catálogo > TI

┌──────────┐  ┌──────────┐  ┌──────────┐
│  🖨️       │  │  💻       │  │  🌐       │
│          │  │          │  │          │
│Impressora│  │ Hardware │  │   Rede   │
│          │  │          │  │          │
│ 5 itens  │  │ 8 itens  │  │ 3 itens  │
└──────────┘  └──────────┘  └──────────┘
```

**API:** `GET /catalog/portal/categories` (filtra `parentCategoryId === categoriaRaizId`)

---

### 📦 **NÍVEL 3: Itens/Serviços**

**Visual:** Cards de serviço em grid 3 colunas

**Características:**
- ✅ Breadcrumb completo (Catálogo > Categoria > Subcategoria)
- ✅ Cards com ícone, nome, descrição
- ✅ Informações de custo e prazo
- ✅ Botão "Solicitar Serviço"
- ✅ Botão "Voltar" se não houver itens

**Exemplo:**
```
Catálogo > TI > Impressoras

┌───────────────────────────┐
│ 🖨️  Acesso a Impressora   │
│                           │
│ Solicite acesso às        │
│ impressoras da org.       │
│                           │
│ ⏱️ 2d  💶 €0.00           │
│                           │
│ [Solicitar Serviço →]    │
└───────────────────────────┘
```

**API:** `GET /catalog/portal/categories/:subcategoriaId/items`

---

## 🎨 Design System

### Cores de Categorias

```jsx
const categoryColors = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  indigo: 'from-indigo-500 to-indigo-600',
  pink: 'from-pink-500 to-pink-600',
  teal: 'from-teal-500 to-teal-600'
};
```

### Tamanhos de Cards

| Nível | Tamanho | Grid |
|-------|---------|------|
| Categorias | Grande | 3 colunas (lg) |
| Subcategorias | Médio | 4 colunas (lg) |
| Itens | Padrão | 3 colunas (lg) |

---

## 🧭 Breadcrumb

O breadcrumb é **dinâmico e interativo**:

```jsx
// Nível 1 (Categorias)
[🏠 Catálogo]

// Nível 2 (Subcategorias)
[🏠 Catálogo] > [📁 TI]
                   ↑ clicável

// Nível 3 (Itens)
[🏠 Catálogo] > [📁 TI] > [📦 Impressoras]
                   ↑ clicável
```

**Comportamento:**
- ✅ Sempre permite voltar ao nível anterior
- ✅ Items atuais em negrito
- ✅ Items anteriores com hover underline

---

## 🔄 Gestão de Estado

```jsx
const [navigationLevel, setNavigationLevel] = useState('categories');
// Valores possíveis: 'categories' | 'subcategories' | 'items'

const [selectedRootCategory, setSelectedRootCategory] = useState(null);
const [selectedSubcategory, setSelectedSubcategory] = useState(null);
```

### Transições de Estado

```
Estado Inicial:
  navigationLevel = 'categories'

Clica em Categoria Raiz:
  navigationLevel = 'subcategories'
  selectedRootCategory = categoria

Clica em Subcategoria:
  navigationLevel = 'items'
  selectedSubcategory = subcategoria

Botão Voltar:
  navigationLevel volta ao anterior
  limpa seleções
```

---

## 📱 Responsividade

### Desktop (lg+)
- Categorias: 3 colunas
- Subcategorias: 4 colunas
- Itens: 3 colunas

### Tablet (md)
- Categorias: 2 colunas
- Subcategorias: 2 colunas
- Itens: 2 colunas

### Mobile (sm)
- Todas: 1 coluna (stack vertical)

---

## 🚀 Endpoints da API

### 1. Listar Categorias Raiz
```http
GET /catalog/portal/categories
Response: { categories: [...] }
```

Filtro frontend:
```js
const roots = categories.filter(cat => !cat.parentCategoryId);
```

### 2. Listar Subcategorias
```http
GET /catalog/portal/categories
Response: { categories: [...] }
```

Filtro frontend:
```js
const subs = categories.filter(cat => cat.parentCategoryId === rootId);
```

### 3. Listar Itens da Subcategoria
```http
GET /catalog/portal/categories/:subcategoryId/items
Response: { items: [...] }
```

### 4. Detalhes do Item
```http
GET /catalog/items/:itemId
Response: { item: {...} }
```

### 5. Solicitar Serviço
```http
POST /catalog/items/:itemId/request
Body: { formData: {...} }
Response: { requiresApproval, ticket }
```

---

## 🎯 Casos de Uso

### 1. **Categoria sem Subcategorias**

Se uma categoria raiz não tiver subcategorias:

```
📁 TI (clique)
   ↓
⚠️ "Esta categoria não possui subcategorias"
   [Voltar para categorias]
```

### 2. **Subcategoria sem Itens**

Se uma subcategoria não tiver itens:

```
📦 Impressoras (clique)
   ↓
⚠️ "Nenhum serviço disponível nesta categoria"
   [Voltar para subcategorias]
```

### 3. **Busca Direta** (Futuro)

Permitir buscar e ir direto para o item sem passar pela hierarquia.

---

## ✅ Vantagens da Nova Estrutura

1. **✅ Mais Intuitivo**
   - Usuário entende claramente onde está
   - Hierarquia visual clara

2. **✅ Menos Confusão**
   - Não mostra tudo de uma vez
   - Foco em uma categoria por vez

3. **✅ Melhor Performance**
   - Carrega dados sob demanda
   - Menos itens renderizados

4. **✅ Escalável**
   - Suporta centenas de categorias
   - Suporta subcategorias ilimitadas

5. **✅ Navegação Clara**
   - Breadcrumb mostra o caminho
   - Botões de voltar sempre visíveis

---

## 🔧 Manutenção

### Adicionar Nova Categoria Raiz

No backend ou DB:
```sql
INSERT INTO catalog_categories (name, icon, color, parent_category_id)
VALUES ('Facilities', 'Box', 'teal', NULL);
```

Aparecerá automaticamente no Nível 1.

### Adicionar Subcategoria

```sql
INSERT INTO catalog_categories (name, icon, parent_category_id)
VALUES ('Limpeza', 'Broom', 'categoria-facilities-id');
```

Aparecerá automaticamente no Nível 2.

### Adicionar Item/Serviço

```sql
INSERT INTO catalog_items (name, category_id, ...)
VALUES ('Solicitar Limpeza', 'subcategoria-limpeza-id', ...);
```

Aparecerá automaticamente no Nível 3.

---

## 📋 Checklist de Implementação

- [x] Componente ServiceCatalogHierarchical criado
- [x] Navegação em 3 níveis implementada
- [x] Breadcrumb dinâmico
- [x] Cards coloridos para categorias
- [x] Grid responsivo
- [x] Modal padronizado
- [x] Integração com API
- [x] Estados vazios (sem subcategorias/itens)
- [x] Botões de voltar
- [x] Loading states
- [x] Rota atualizada em App.jsx

---

## 🎓 Para Desenvolvedores

### Arquivo Principal
`/portalClientEmpresa/src/pages/ServiceCatalogHierarchical.jsx`

### Componente Modal
`/portalClientEmpresa/src/components/Modal.jsx`

### Rota
`/service-catalog` → `ServiceCatalogHierarchical`

### Testar Localmente
1. Acesse http://localhost:5174/service-catalog
2. Clique em uma categoria raiz
3. Clique em uma subcategoria
4. Clique em "Solicitar Serviço"

---

**Criado em:** 09/11/2025  
**Última atualização:** 09/11/2025  
**Versão:** 1.0.0
