# 🎨 Sistema de Cores - Catálogo de Serviços

## 🔵 Cor Principal: Azul

O sistema usa **azul** como cor principal, refletindo a identidade visual da plataforma.

---

## 🎨 Paleta de Cores Disponíveis

### Tons de Azul (Recomendado)

| Nome | Gradiente | Uso Recomendado |
|------|-----------|-----------------|
| `blue` | `from-blue-500 to-blue-600` | **Padrão** - Categorias gerais |
| `lightblue` | `from-blue-400 to-blue-500` | Categorias leves (RH, Admin) |
| `darkblue` | `from-blue-600 to-blue-700` | Categorias técnicas (TI, Dev) |
| `cyan` | `from-cyan-500 to-cyan-600` | Infraestrutura, Facilities |
| `sky` | `from-sky-500 to-sky-600` | Suporte, Atendimento |

### Outras Cores (Opcional)

| Nome | Gradiente | Uso |
|------|-----------|-----|
| `green` | `from-green-500 to-green-600` | Aprovações, Sucesso |
| `purple` | `from-purple-500 to-purple-600` | Premium, Especial |
| `orange` | `from-orange-500 to-orange-600` | Urgente, Importante |
| `red` | `from-red-500 to-red-600` | Crítico, Emergência |
| `indigo` | `from-indigo-500 to-indigo-600` | Administrativo |
| `pink` | `from-pink-500 to-pink-600` | Marketing, Comunicação |
| `teal` | `from-teal-500 to-teal-600` | Finanças, Contabilidade |

---

## ⚙️ Como Definir Cores

### Via SQL (Backend)

```sql
-- Azul claro para RH
UPDATE catalog_categories 
SET color = 'lightblue' 
WHERE name = 'RH';

-- Azul escuro para TI
UPDATE catalog_categories 
SET color = 'darkblue' 
WHERE name = 'TI';

-- Cyan para Facilities
UPDATE catalog_categories 
SET color = 'cyan' 
WHERE name = 'Facilities';
```

### Via API (Aplicação)

```json
{
  "name": "TI",
  "color": "darkblue"
}
```

---

## 🎯 Mapeamento Recomendado

### Categorias Principais

| Categoria | Cor | Código |
|-----------|-----|--------|
| RH | `lightblue` | `from-blue-400 to-blue-500` |
| TI | `darkblue` | `from-blue-600 to-blue-700` |
| Facilities | `cyan` | `from-cyan-500 to-cyan-600` |
| Suporte | `sky` | `from-sky-500 to-sky-600` |
| Financeiro | `teal` | `from-teal-500 to-teal-600` |
| Marketing | `pink` | `from-pink-500 to-pink-600` |
| Administrativo | `indigo` | `from-indigo-500 to-indigo-600` |
| Qualidade | `green` | `from-green-500 to-green-600` |

---

## 🔄 Migração de Cinza para Azul

### Script Automático

Execute o script SQL:
```bash
psql -U postgres -d tatuticket -f backend/scripts/update-catalog-colors-blue.sql
```

### Manual

```sql
-- Atualizar todas as categorias sem cor definida
UPDATE catalog_categories 
SET color = 'blue' 
WHERE color IS NULL OR color = '';

-- Atualizar categorias com cor cinza
UPDATE catalog_categories 
SET color = 'blue' 
WHERE color = 'gray' OR color = 'grey';
```

---

## 📊 Visualização

### Azul Claro (lightblue)
```
┌────────────────────────┐
│  🔵 Gradiente Suave    │
│  #60A5FA → #3B82F6    │
│                        │
│  RH, Admin, Docs       │
└────────────────────────┘
```

### Azul Padrão (blue)
```
┌────────────────────────┐
│  🔵 Azul Vibrante      │
│  #3B82F6 → #2563EB    │
│                        │
│  Categorias gerais     │
└────────────────────────┘
```

### Azul Escuro (darkblue)
```
┌────────────────────────┐
│  🔵 Azul Profundo      │
│  #2563EB → #1D4ED8    │
│                        │
│  TI, Técnico, Dev      │
└────────────────────────┘
```

---

## ⚡ Fallback Automático

Se nenhuma cor for definida:
```jsx
// Antes: Cinza
return 'from-gray-500 to-gray-600';

// Agora: Azul (cor do sistema)
return 'from-blue-500 to-blue-600';
```

**Resultado:** Cards sempre em azul, mesmo sem cor configurada! ✅

---

## 🎨 Exemplos de Uso

### Card de Categoria
```jsx
<div className={`bg-gradient-to-br ${getCategoryColor('darkblue')}`}>
  {/* Conteúdo */}
</div>
```

### SQL Bulk Update
```sql
-- Definir cores por tipo de categoria
UPDATE catalog_categories SET color = 'lightblue' WHERE name ILIKE '%rh%';
UPDATE catalog_categories SET color = 'darkblue' WHERE name ILIKE '%ti%';
UPDATE catalog_categories SET color = 'cyan' WHERE name ILIKE '%facilities%';
UPDATE catalog_categories SET color = 'sky' WHERE name ILIKE '%suporte%';
UPDATE catalog_categories SET color = 'teal' WHERE name ILIKE '%financ%';
```

---

## ✅ Benefícios

| Antes | Agora |
|-------|-------|
| ❌ Cinza sem personalidade | ✅ Azul alinhado ao sistema |
| ❌ Cor única monótona | ✅ 5 tons de azul disponíveis |
| ❌ Fallback cinza | ✅ Fallback azul |
| ⚠️ Visual inconsistente | ✅ Identidade visual forte |

---

## 🔧 Troubleshooting

### Problema: Cards ainda cinza
**Solução:**
```sql
-- Verificar cor atual
SELECT name, color FROM catalog_categories;

-- Atualizar para azul
UPDATE catalog_categories SET color = 'blue';
```

### Problema: Cor não existe
**Solução:** Usar uma cor da lista acima ou deixar vazio (fallback azul)

---

**Data:** 09/11/2025  
**Versão:** 2.0.0  
**Status:** ✅ Azul como cor padrão do sistema
