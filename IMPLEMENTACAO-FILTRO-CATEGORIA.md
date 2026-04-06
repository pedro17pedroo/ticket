# Implementação do Filtro por Categoria

## Data: 04/04/2026

## Objetivo

Permitir filtrar tickets por categoria do catálogo de serviços.

## Implementação Realizada

### Backend - Processamento do Filtro de Categoria

**Arquivo:** `backend/src/modules/tickets/ticketController.js`

**Adicionado:**

1. **Parâmetros de query:**
```javascript
const {
  // ... outros parâmetros
  categoryId,
  catalogCategoryId
} = req.query;
```

2. **Lógica de filtro:**
```javascript
// Filtro de categoria (suportar ambos os nomes)
const finalCategoryId = catalogCategoryId || categoryId;
if (finalCategoryId) {
  where.catalogCategoryId = finalCategoryId;
}
```

## Como Funciona

### Fluxo do Filtro

1. **Usuário seleciona categoria:**
   - Exemplo: "Tecnologias de Informação"

2. **Frontend envia:**
   ```
   GET /api/tickets?categoryId=uuid-da-categoria
   ```

3. **Backend processa:**
   ```javascript
   WHERE catalogCategoryId = 'uuid-da-categoria'
   ```

### Compatibilidade

O código suporta dois nomes de parâmetro para compatibilidade:
- `categoryId` (legado)
- `catalogCategoryId` (novo)

Se ambos forem enviados, `catalogCategoryId` tem prioridade.

## Estrutura do Ticket

```javascript
// backend/src/modules/tickets/ticketModel.js
catalogCategoryId: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'catalog_categories',
    key: 'id'
  },
  comment: 'Categoria do catálogo (hierarquia visual: TI, RH, Facilities)'
}
```

## Frontend - Componente AdvancedSearch

**Arquivo:** `portalOrganizaçãoTenant/src/components/AdvancedSearch.jsx`

**Campo já existente:**
```javascript
const [filters, setFilters] = useState({
  // ...
  categoryId: ''
});
```

**Componente CategoryTreeSelect:**
```jsx
{/* Category */}
<div>
  <label className="block text-sm font-medium mb-2">Categoria</label>
  <CategoryTreeSelect
    categories={categories}
    value={filters.categoryId}
    onChange={(value) => handleFilterChange('categoryId', value)}
    placeholder="Todas"
  />
</div>
```

### Carregamento de Categorias

```javascript
const loadFiltersData = async () => {
  try {
    const [categoriesRes, ...] = await Promise.all([
      api.get('/catalog/categories'),
      // ...
    ]);

    setCategories(categoriesRes.data.categories || []);
  } catch (error) {
    console.error('Erro ao carregar dados dos filtros:', error);
  }
};
```

**Endpoint:** `GET /api/catalog/categories`

**Retorna:** Árvore hierárquica de categorias do catálogo

## Hierarquia de Categorias

O sistema suporta categorias hierárquicas (pai/filho):

```
📁 Tecnologias de Informação
  ├─ 📁 Hardware
  │   ├─ Computadores
  │   └─ Impressoras
  └─ 📁 Software
      ├─ Licenças
      └─ Suporte

📁 Recursos Humanos
  ├─ Folha de Pagamento
  └─ Benefícios

📁 Facilities
  ├─ Manutenção
  └─ Limpeza
```

### Filtro por Categoria Pai

Quando o usuário seleciona uma categoria pai (ex: "Tecnologias de Informação"), o filtro retorna apenas tickets diretamente associados a essa categoria, **não** inclui subcategorias automaticamente.

Para incluir subcategorias, seria necessário implementar lógica adicional no backend.

## Exemplos de Uso

### Exemplo 1: Filtrar por categoria específica
```
Categoria: Tecnologias de Informação
```
**SQL:** `WHERE catalogCategoryId = 'uuid-ti'`

### Exemplo 2: Combinar com outros filtros
```
Categoria: Tecnologias de Informação
Status: Novo
Prioridade: Alta
```
**SQL:** 
```sql
WHERE catalogCategoryId = 'uuid-ti'
  AND status = 'novo'
  AND priority = 'Alta'
```

### Exemplo 3: Filtrar por subcategoria
```
Categoria: Hardware (subcategoria de TI)
```
**SQL:** `WHERE catalogCategoryId = 'uuid-hardware'`

## Componente CategoryTreeSelect

O componente `CategoryTreeSelect` é um select customizado que:
- Exibe categorias em formato hierárquico
- Permite busca/filtro de categorias
- Suporta seleção de categorias pai e filho
- Mostra ícones para categorias pai (📁)

**Localização:** `portalOrganizaçãoTenant/src/components/CategoryTreeSelect.jsx`

## Diferença entre Campos

### catalogCategoryId (Usado neste filtro)
- **Tipo:** UUID da categoria do catálogo
- **Uso:** Categoria visual/organizacional do ticket
- **Exemplo:** "Tecnologias de Informação", "Recursos Humanos"

### catalogItemId (Outro campo)
- **Tipo:** UUID do item/serviço do catálogo
- **Uso:** Serviço específico solicitado
- **Exemplo:** "Solicitar novo computador", "Resetar senha"

## Impacto

✅ Filtro por categoria implementado no backend
✅ Suporta `categoryId` e `catalogCategoryId` para compatibilidade
✅ Frontend já preparado com CategoryTreeSelect
✅ Compatível com outros filtros
✅ Suporta hierarquia de categorias

## Arquivos Modificados

1. `backend/src/modules/tickets/ticketController.js`
   - Adicionados parâmetros `categoryId` e `catalogCategoryId`
   - Implementada lógica de filtro por `catalogCategoryId`
   - Suporte para ambos os nomes (compatibilidade)

## Melhorias Futuras (Opcional)

### Filtro por Subcategorias

Para incluir subcategorias automaticamente quando uma categoria pai é selecionada:

```javascript
// Buscar IDs de todas as subcategorias
const categoryIds = [finalCategoryId];
const subcategories = await CatalogCategory.findAll({
  where: { parentCategoryId: finalCategoryId },
  attributes: ['id']
});
categoryIds.push(...subcategories.map(c => c.id));

// Filtrar por categoria pai OU subcategorias
where.catalogCategoryId = { [Op.in]: categoryIds };
```

Isso permitiria que ao selecionar "Tecnologias de Informação", o filtro incluísse automaticamente tickets de "Hardware", "Software", etc.
