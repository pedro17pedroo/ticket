# 📱 Nova Organização da Sidebar - Portal da Organização

## 🎯 Objetivo

Reorganizar a sidebar com **menus agrupados e expansíveis** para melhorar a navegação e reduzir o espaço visual ocupado.

---

## 📊 Estrutura Atual da Sidebar

### **1. Menus Principais** (Sempre Visíveis)
```
📊 Dashboard
👥 Clientes
🎫 Tickets
```

### **2. Estrutura Organizacional** ⬇️ (Expansível)
```
🏢 Estrutura Organizacional
   ├── 👤 Utilizadores
   ├── 🏛️ Direções
   ├── 🏢 Departamentos
   └── 📂 Secções
```

### **3. Gestão de Tickets** ⬇️ (Expansível)
```
📊 Gestão de Tickets
   ├── 🏷️ Categorias
   ├── ⏱️ SLAs
   ├── ⚠️ Prioridades
   └── 📝 Tipos
```

### **4. Inventário** ⬇️ (Expansível)
```
💾 Inventário
   ├── 📊 Dashboard
   ├── 🏢 Inventário Organização
   ├── 👥 Inventário Clientes
   └── 💻 Todos os Assets
```

### **5. Outros Menus** (Sempre Visíveis)
```
📚 Base de Conhecimento
⏰ Bolsa de Horas
🛒 Catálogo de Serviços
🏷️ Tags
📄 Templates
```

**Divisor**

### **6. Configurações** (Sempre Visível)
```
⚙️ Configurações
```

---

## ✨ Funcionalidades

### **Menus Expansíveis**

Cada grupo pode ser:
- ✅ **Expandido**: Mostra todos os submenus
- ✅ **Recolhido**: Oculta os submenus

**Comportamento**:
- Clique no menu principal → Expande/Recolhe
- Ícone de seta (ChevronDown) indica estado
- Animação suave de rotação da seta (180°)
- Estado persiste durante navegação na mesma página

### **Auto-Expansão Inteligente**

Os menus abrem automaticamente quando:
- Utilizador acede a uma página do grupo
- Exemplo: Acessar `/users` → "Estrutura Organizacional" expande automaticamente

### **Destaque Visual**

**Menu Grupo Ativo**:
```css
bg-primary-50 dark:bg-primary-900/20
text-primary-600 dark:text-primary-400
```

**Submenu Ativo**:
```css
bg-primary-50 dark:bg-primary-900/20
text-primary-600 dark:text-primary-400
font-medium
```

**Hover States**:
```css
hover:bg-gray-100 dark:hover:bg-gray-700
```

---

## 🎨 Design

### **Hierarquia Visual**

```
Menu Principal       → Tamanho normal, negrito
  └─ Submenu        → Tamanho menor, indentado (ml-8)
                      → Ícones menores (w-4 h-4 vs w-5 h-5)
```

### **Espaçamento**

- Entre itens: `space-y-2`
- Entre grupos: `space-y-1`
- Padding: `px-3 py-2.5` (principal), `px-3 py-2` (submenu)
- Margem de indentação: `ml-8`

### **Divisores**

```html
<div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
```

Usados entre:
- Menus expansíveis ↔ Outros menus
- Outros menus ↔ Configurações

---

## 🔧 Implementação Técnica

### **Estados (useState)**

```javascript
const [inventoryOpen, setInventoryOpen] = useState(
  location.pathname.startsWith('/inventory')
);

const [structureOpen, setStructureOpen] = useState(
  location.pathname.startsWith('/users') ||
  location.pathname.startsWith('/directions') ||
  location.pathname.startsWith('/departments') ||
  location.pathname.startsWith('/sections')
);

const [ticketsOpen, setTicketsOpen] = useState(
  location.pathname.startsWith('/categories') ||
  location.pathname.startsWith('/slas') ||
  location.pathname.startsWith('/priorities') ||
  location.pathname.startsWith('/types')
);
```

### **Função Helper**

```javascript
const isGroupActive = (paths) => {
  return paths.some(item => location.pathname.startsWith(item.path));
};
```

Verifica se qualquer item do grupo está ativo.

### **Estrutura de Dados**

```javascript
const structureSubmenu = [
  { path: '/users', icon: UserCog, label: 'Utilizadores' },
  { path: '/directions', icon: Building2, label: 'Direções' },
  { path: '/departments', icon: Building2, label: 'Departamentos' },
  { path: '/sections', icon: FolderTree, label: 'Secções' },
];
```

### **Renderização de Grupo**

```jsx
<div className="space-y-1">
  {/* Botão Principal */}
  <button
    onClick={() => setStructureOpen(!structureOpen)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
      isGroupActive(structureSubmenu)
        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    <Building2 className="w-5 h-5 flex-shrink-0" />
    {isOpen && (
      <>
        <span className="font-medium flex-1 text-left">Estrutura Organizacional</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            structureOpen ? 'rotate-180' : ''
          }`}
        />
      </>
    )}
  </button>

  {/* Submenu */}
  {structureOpen && isOpen && (
    <div className="ml-8 space-y-1">
      {structureSubmenu.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive(item.path)
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  )}
</div>
```

---

## 📊 Comparação: Antes vs Depois

### **Antes** (Lista Linear - 18 itens)

```
1.  Dashboard
2.  Tickets
3.  Clientes
4.  Utilizadores
5.  Direções
6.  Departamentos
7.  Secções
8.  Categorias
9.  Base de Conhecimento
10. SLAs
11. Prioridades
12. Tipos
13. Bolsa de Horas
14. Catálogo de Serviços
15. Inventário (+ 4 submenus)
16. Tags
17. Templates
18. Configurações

Total: ~22 itens visíveis (18 + 4 submenus inventário)
```

### **Depois** (Agrupado - 11 itens principais)

```
1. Dashboard
2. Clientes
3. Tickets
4. 🏢 Estrutura Organizacional ▼ (4 submenus)
5. 📊 Gestão de Tickets ▼ (4 submenus)
6. 💾 Inventário ▼ (4 submenus)
7. Base de Conhecimento
8. Bolsa de Horas
9. Catálogo de Serviços
10. Tags
11. Templates
---
12. Configurações

Total: 11 itens principais + 12 submenus (quando expandidos)
```

### **Benefícios**

✅ **Redução Visual**: 18 → 11 itens sempre visíveis (-39%)
✅ **Melhor Organização**: Itens relacionados agrupados
✅ **Navegação Mais Rápida**: Menos scroll necessário
✅ **Hierarquia Clara**: Estrutura visual mais evidente
✅ **Flexibilidade**: Expandir apenas o necessário

---

## 🎯 Lógica de Agrupamento

### **Critério**: Funcionalidade Relacionada

**Estrutura Organizacional** 🏢
- Todos os menus relacionados à **hierarquia da empresa**
- Utilizadores, Direções, Departamentos, Secções

**Gestão de Tickets** 📊
- Todos os menus de **configuração de tickets**
- Categorias, SLAs, Prioridades, Tipos

**Inventário** 💾
- Todas as **visualizações de inventário**
- Dashboard, Organização, Clientes, Assets

**Não Agrupados**:
- Menus com **funcionalidade única** ou muito importante
- Dashboard, Clientes, Tickets (acesso direto)
- Base de Conhecimento, Bolsa de Horas, etc. (standalone)

---

## 🔄 Fluxo de Navegação

### **Exemplo 1: Acessar Departamentos**

```
1. Sidebar carrega
2. Verifica location.pathname
3. Se startsWith('/departments') → structureOpen = true
4. Menu "Estrutura Organizacional" já vem expandido
5. "Departamentos" destacado como ativo
```

### **Exemplo 2: Explorar Inventário**

```
1. Usuário clica em "Inventário" 💾
2. inventoryOpen toggle (true)
3. Seta roda 180° (animação)
4. 4 submenus aparecem com fade-in
5. Usuário seleciona "Inventário Clientes"
6. Navega para página
7. Submenu "Inventário Clientes" destacado
```

### **Exemplo 3: Sidebar Recolhida**

```
1. Usuário clica em ← (collapse sidebar)
2. isOpen = false
3. Largura: 264px → 80px
4. Labels desaparecem
5. Apenas ícones visíveis
6. ChevronDown oculto
7. Hover mostra tooltip (futuro)
```

---

## 📱 Responsividade

### **Desktop (Sidebar Expandida)**
- Largura: 264px (w-64)
- Mostra labels e chevrons
- Submenus indentados

### **Desktop (Sidebar Recolhida)**
- Largura: 80px (w-20)
- Apenas ícones
- Sem labels/chevrons
- Sem submenus visíveis

### **Mobile** (Futuro)
- Overlay sidebar
- Fecha ao clicar fora
- Mesma estrutura expansível

---

## 🎨 Classes CSS Principais

### **Container**
```jsx
className="space-y-1"
```

### **Botão de Grupo**
```jsx
className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
```

### **Chevron Animado**
```jsx
className={`w-4 h-4 transition-transform ${
  structureOpen ? 'rotate-180' : ''
}`}
```

### **Submenu Container**
```jsx
className="ml-8 space-y-1"
```

### **Item de Submenu**
```jsx
className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
```

---

## ✅ Vantagens da Nova Estrutura

### **Para Utilizadores**
1. ✅ Menos itens visíveis → Menos sobrecarga visual
2. ✅ Agrupamento lógico → Encontra itens mais rápido
3. ✅ Expansão sob demanda → Vê apenas o relevante
4. ✅ Scroll reduzido → Todos os grupos cabem na tela

### **Para Desenvolvedores**
1. ✅ Fácil adicionar novos menus aos grupos
2. ✅ Estrutura de dados clara e modular
3. ✅ Reutilização de componentes
4. ✅ Manutenção simplificada

### **Para o Sistema**
1. ✅ Escalável → Suporta crescimento de funcionalidades
2. ✅ Organizado → Estrutura clara e previsível
3. ✅ Consistente → Padrão visual uniforme
4. ✅ Performático → Renderização condicional eficiente

---

## 🚀 Próximas Melhorias Sugeridas

### **1. Persistência de Estado**
Salvar estado de expansão no localStorage:
```javascript
useEffect(() => {
  localStorage.setItem('sidebar-structure-open', structureOpen);
}, [structureOpen]);
```

### **2. Tooltips na Sidebar Recolhida**
Mostrar nome do menu ao fazer hover quando sidebar está fechada:
```jsx
<Tooltip content="Estrutura Organizacional">
  <Building2 />
</Tooltip>
```

### **3. Badges de Notificação**
Mostrar contadores nos grupos:
```jsx
<span className="badge">4</span>
```

### **4. Atalhos de Teclado**
- `Ctrl + 1-9` → Navegar entre grupos
- `Seta ↑/↓` → Navegar dentro de grupo expandido
- `Enter` → Expandir/Recolher grupo selecionado

### **5. Busca Rápida**
Input de busca no topo da sidebar para filtrar menus:
```jsx
<input placeholder="Buscar menu..." />
```

---

## 📝 Notas Importantes

### **Sidebar Scroll**
- ✅ Implementado com classe `sidebar-scroll`
- ✅ Scrollbar personalizada (6px, semi-transparente)
- ✅ Suporte dark mode
- ✅ Altura máxima: `calc(100vh - 4rem)`

### **Estados Iniciais**
Os grupos expandem automaticamente se o utilizador estiver numa página do grupo:
```javascript
useState(location.pathname.startsWith('/inventory'))
```

### **Performance**
- Renderização condicional dos submenus
- Apenas menus expandidos são renderizados no DOM
- Animações CSS (não JS) para melhor performance

---

## 🎉 Conclusão

A nova estrutura da sidebar oferece:
- ✅ **Melhor UX**: Navegação mais intuitiva e rápida
- ✅ **Organização**: Agrupamento lógico de funcionalidades
- ✅ **Escalabilidade**: Fácil adicionar novos menus
- ✅ **Visual Limpo**: Menos itens visíveis simultaneamente
- ✅ **Flexibilidade**: Expandir/recolher conforme necessidade

**A sidebar está completamente funcional e pronta para uso!** 🚀
