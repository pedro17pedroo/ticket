# 🎨 Guia de Mapeamento de Ícones

## 📋 Problema Resolvido

O catálogo agora suporta **DOIS tipos de ícones**:

1. **Ícones Lucide-react** (recomendado) - Nome como string: `"Users"`, `"Monitor"`
2. **Emojis** (suportado) - Emoji direto: `"📂"`, `"🖥️"`

---

## ✅ Suporte Atual

### Renderização Inteligente

```jsx
// Se for nome de ícone válido → renderiza ícone SVG
renderIcon("Users") → <Users className="w-6 h-6" />

// Se for emoji ou string curta → renderiza emoji
renderIcon("📂") → <span className="text-lg">📂</span>

// Se inválido → fallback ShoppingCart
renderIcon("InvalidIcon") → <ShoppingCart />
```

### Mapeamento de Tamanhos

| Classe CSS | Tamanho Texto |
|------------|---------------|
| `w-3 h-3` | `text-xs` |
| `w-4 h-4` | `text-sm` |
| `w-5 h-5` | `text-base` |
| `w-6 h-6` | `text-lg` |
| `w-8 h-8` | `text-2xl` |
| `w-10 h-10` | `text-4xl` |

---

## 🔧 Atualizar Ícones no Backend

### Opção 1: SQL Direto (Recomendado)

```sql
-- Atualizar categoria RH para usar ícone Users
UPDATE catalog_categories 
SET icon = 'Users' 
WHERE name = 'RH';

-- Atualizar categoria TI para usar ícone Monitor
UPDATE catalog_categories 
SET icon = 'Monitor' 
WHERE name = 'TI';
```

### Opção 2: Via API/Interface

Ao criar ou editar categoria, use o **nome do ícone** do Lucide-react:
- ❌ Não use: `"📂"`, `"🖥️"` (funciona mas não recomendado)
- ✅ Use: `"Users"`, `"Monitor"`, `"Package"`

---

## 📦 Ícones Disponíveis (23)

### Hardware (8)
```
Box, Printer, Monitor, Wifi
Database, Server, HardDrive, Cpu
```

### Comunicação (3)
```
Mail, Phone, Headphones
```

### Organização (5)
```
Package, FolderOpen, FileText
Layers, Briefcase
```

### Pessoas & Admin (4)
```
Users, Building, Settings, Shield
```

### Ferramentas (2)
```
Wrench, Zap
```

### Cloud (1)
```
Cloud
```

---

## 🎯 Exemplos de Uso

### Categorias Raiz

| Categoria | Ícone Recomendado | SQL |
|-----------|-------------------|-----|
| RH | `Users` | `UPDATE catalog_categories SET icon = 'Users' WHERE name = 'RH'` |
| TI | `Monitor` | `UPDATE catalog_categories SET icon = 'Monitor' WHERE name = 'TI'` |
| Facilities | `Building` | `UPDATE catalog_categories SET icon = 'Building' WHERE name = 'Facilities'` |
| Financeiro | `Briefcase` | `UPDATE catalog_categories SET icon = 'Briefcase' WHERE name = 'Financeiro'` |
| Suporte | `Headphones` | `UPDATE catalog_categories SET icon = 'Headphones' WHERE name = 'Suporte'` |

### Subcategorias

| Subcategoria | Ícone | SQL |
|--------------|-------|-----|
| Impressoras | `Printer` | `UPDATE catalog_categories SET icon = 'Printer' WHERE name = 'Impressoras'` |
| Computadores | `Monitor` | `UPDATE catalog_categories SET icon = 'Monitor' WHERE name = 'Computadores'` |
| Rede | `Wifi` | `UPDATE catalog_categories SET icon = 'Wifi' WHERE name = 'Rede'` |
| Servidores | `Server` | `UPDATE catalog_categories SET icon = 'Server' WHERE name = 'Servidores'` |
| Cloud | `Cloud` | `UPDATE catalog_categories SET icon = 'Cloud' WHERE name = 'Cloud'` |

### Itens/Serviços

| Item | Ícone | SQL |
|------|-------|-----|
| Acesso a Impressora | `Printer` | `UPDATE catalog_items SET icon = 'Printer' WHERE name LIKE '%Impressora%'` |
| Solicitar Hardware | `Box` | `UPDATE catalog_items SET icon = 'Box' WHERE name LIKE '%Hardware%'` |
| Suporte Técnico | `Wrench` | `UPDATE catalog_items SET icon = 'Wrench' WHERE name LIKE '%Suporte%'` |
| E-mail | `Mail` | `UPDATE catalog_items SET icon = 'Mail' WHERE name LIKE '%mail%'` |

---

## 🔄 Script de Migração

Se quiser atualizar todos de uma vez:

```sql
-- Categorias principais
UPDATE catalog_categories SET icon = 'Users' WHERE name = 'RH';
UPDATE catalog_categories SET icon = 'Monitor' WHERE name = 'TI';
UPDATE catalog_categories SET icon = 'Building' WHERE name = 'Facilities';
UPDATE catalog_categories SET icon = 'Briefcase' WHERE name = 'Financeiro';

-- Subcategorias de TI
UPDATE catalog_categories SET icon = 'Printer' WHERE name = 'Impressoras';
UPDATE catalog_categories SET icon = 'Monitor' WHERE name = 'Computadores';
UPDATE catalog_categories SET icon = 'Wifi' WHERE name = 'Rede';
UPDATE catalog_categories SET icon = 'Server' WHERE name = 'Servidores';
UPDATE catalog_categories SET icon = 'Database' WHERE name = 'Banco de Dados';

-- Itens genéricos
UPDATE catalog_items SET icon = 'Package' WHERE icon IS NULL OR icon = '📦';
UPDATE catalog_items SET icon = 'Settings' WHERE category_id IN (
  SELECT id FROM catalog_categories WHERE name = 'TI'
) AND icon IS NULL;
```

---

## ⚠️ Importante

### Emojis Continuam Funcionando
- ✅ O sistema **suporta emojis**
- ✅ Não precisa atualizar com urgência
- ⚡ Mas ícones do Lucide-react são **mais consistentes** e **profissionais**

### Fallback Automático
- Se o ícone não existir, usa `ShoppingCart` automaticamente
- Sem erros, sem quebra da interface

---

## 🧪 Testar

1. Atualize alguns ícones no banco:
```sql
UPDATE catalog_categories SET icon = 'Users' WHERE name = 'RH';
```

2. Recarregue a página

3. Veja o ícone correto aparecer!

---

## 📚 Referência Completa

Para ver todos os ícones disponíveis do Lucide-react:
- **Site:** https://lucide.dev/icons/
- **Filtro:** Procure por categoria (business, communication, etc.)

---

**Data:** 09/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Suporte completo a emojis e ícones
