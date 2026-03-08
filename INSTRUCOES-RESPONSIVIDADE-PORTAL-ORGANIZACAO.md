# Instruções: Responsividade Portal da Organização

## ✅ Já Implementado

1. **Layout.jsx** - Atualizado com:
   - Detecção automática de mobile/desktop
   - Overlay para fechar sidebar no mobile
   - Gerenciamento de estado responsivo

## 📝 Alterações Necessárias

### 1. Sidebar.jsx

Adicionar suporte para mobile no componente Sidebar. Fazer as seguintes alterações:

#### a) Atualizar assinatura da função:
```jsx
// ANTES:
const Sidebar = ({ isOpen, setIsOpen }) => {

// DEPOIS:
const Sidebar = ({ isOpen, setIsOpen, isMobile, onClose }) => {
```

#### b) Adicionar função para fechar sidebar ao clicar em link (mobile):
```jsx
// Adicionar após os hooks existentes:
const handleLinkClick = () => {
  if (isMobile && onClose) {
    onClose()
  }
}
```

#### c) Atualizar o JSX do aside (linha ~180):
```jsx
// ANTES:
<aside
  className={`fixed left-0 top-0 z-30 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
    isOpen ? 'w-64' : 'w-20'
  }`}
>

// DEPOIS:
<aside
  className={`fixed left-0 top-0 z-30 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
    isOpen ? 'w-64' : isMobile ? '-translate-x-full w-64' : 'w-20'
  } ${isMobile && isOpen ? 'translate-x-0' : ''}`}
>
```

#### d) Atualizar seção do logo (linha ~185):
```jsx
// ANTES:
<div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
  {isOpen && (
    <img 
      src="/TDESK.png" 
      alt="T-Desk" 
      className="h-10 w-auto"
    />
  )}
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
  >
    {isOpen ? (
      <ChevronLeft className="w-5 h-5" />
    ) : (
      <ChevronRight className="w-5 h-5" />
    )}
  </button>
</div>

// DEPOIS:
<div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
  {isOpen && (
    <img 
      src="/TDESK.png" 
      alt="T-Desk" 
      className="h-8 sm:h-10 w-auto"
    />
  )}
  {!isMobile && (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={isOpen ? 'Recolher menu' : 'Expandir menu'}
    >
      {isOpen ? (
        <ChevronLeft className="w-5 h-5" />
      ) : (
        <ChevronRight className="w-5 h-5" />
      )}
    </button>
  )}
  {isMobile && (
    <button
      onClick={onClose}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
      aria-label="Fechar menu"
    >
      <X className="w-5 h-5" />
    </button>
  )}
</div>
```

#### e) Adicionar onClick em todos os Links:
Procurar por todos os componentes `<Link>` e adicionar `onClick={handleLinkClick}`.

Exemplo:
```jsx
// ANTES:
<Link
  key={item.path}
  to={item.path}
  className={...}
>

// DEPOIS:
<Link
  key={item.path}
  to={item.path}
  onClick={handleLinkClick}
  className={...}
>
```

#### f) Atualizar classes do nav (linha ~200):
```jsx
// ANTES:
<nav className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-2" style={{ maxHeight: 'calc(100vh - 4rem)' }}>

// DEPOIS:
<nav className="flex-1 overflow-y-auto sidebar-scroll p-3 sm:p-4 space-y-1 sm:space-y-2" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
```

#### g) Adicionar tooltips nos ícones quando recolhida:
```jsx
// Em cada Link, adicionar:
title={!isOpen && !isMobile ? item.label : ''}
```

### 2. Header.jsx

Fazer as seguintes alterações:

#### a) Atualizar altura e padding:
```jsx
// ANTES:
<header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between sticky top-0 z-10">

// DEPOIS:
<header className="h-14 sm:h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
```

#### b) Atualizar botão de menu:
```jsx
// ANTES:
<button
  onClick={toggleSidebar}
  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
>
  <Menu className="w-5 h-5" />
</button>

// DEPOIS:
<button
  onClick={toggleSidebar}
  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
  aria-label="Abrir menu"
>
  <Menu className="w-5 h-5" />
</button>
```

#### c) Atualizar gaps e ícones:
```jsx
// ANTES:
<div className="ml-auto flex items-center gap-3">

// DEPOIS:
<div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-3">
```

#### d) Atualizar ícones de tema:
```jsx
// ANTES:
<Moon className="w-5 h-5" />
<Sun className="w-5 h-5" />

// DEPOIS:
<Moon className="w-4 h-4 sm:w-5 sm:h-5" />
<Sun className="w-4 h-4 sm:w-5 sm:h-5" />
```

#### e) Ocultar Context Switcher em telas pequenas:
```jsx
// ANTES:
<ContextSwitcher />

// DEPOIS:
<div className="hidden sm:block">
  <ContextSwitcher />
</div>
```

#### f) Adicionar Context Switcher no menu do usuário (mobile):
```jsx
// Dentro do dropdown menu, após o header com nome/email:
<div className="sm:hidden px-4 py-2 border-b border-gray-200 dark:border-gray-700">
  <ContextSwitcher />
</div>
```

#### g) Atualizar avatar:
```jsx
// ANTES:
<div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">

// DEPOIS:
<div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
```

#### h) Adicionar animação fadeIn no dropdown:
```jsx
// ANTES:
<div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">

// DEPOIS:
<div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-fadeIn">
```

### 3. index.css

Adicionar os mesmos estilos do portal cliente ao final do arquivo:

```bash
# Copiar estilos de responsividade
cat portalClientEmpresa/src/index.css | grep -A 500 "MELHORIAS DE RESPONSIVIDADE" >> portalOrganizaçãoTenant/src/index.css
```

Ou adicionar manualmente os estilos de:
- Variáveis CSS
- Animações (fadeIn)
- Componentes responsivos (.card, .btn-primary, etc)
- Grids responsivos
- Tabelas responsivas
- Estados vazios
- Modais responsivos
- Badges
- Utilitários de texto
- Espaçamento
- Indicadores de status
- Touch targets
- Focus visible

## 🧪 Testes

Após implementar as alterações, testar:

1. **Mobile (< 640px)**
   - Sidebar abre/fecha com overlay
   - Fecha ao clicar em link
   - Context Switcher no menu do usuário
   - Todos os elementos visíveis e clicáveis

2. **Tablet (640px - 1023px)**
   - Sidebar overlay funciona
   - Context Switcher visível
   - Menus expansíveis funcionam

3. **Desktop (≥ 1024px)**
   - Sidebar fixa lateral
   - Pode expandir/recolher
   - Todos os elementos visíveis
   - Tooltips nos ícones quando recolhida

## 📋 Checklist

- [ ] Layout.jsx atualizado ✅
- [ ] Sidebar.jsx - Assinatura da função
- [ ] Sidebar.jsx - handleLinkClick
- [ ] Sidebar.jsx - Classes do aside
- [ ] Sidebar.jsx - Seção do logo
- [ ] Sidebar.jsx - onClick em todos os Links
- [ ] Sidebar.jsx - Classes do nav
- [ ] Sidebar.jsx - Tooltips
- [ ] Header.jsx - Altura e padding
- [ ] Header.jsx - Botão de menu
- [ ] Header.jsx - Gaps e ícones
- [ ] Header.jsx - Context Switcher
- [ ] Header.jsx - Avatar
- [ ] Header.jsx - Animação dropdown
- [ ] index.css - Estilos responsivos
- [ ] Testes em mobile
- [ ] Testes em tablet
- [ ] Testes em desktop

## 🔧 Comando Rápido

Para aplicar as alterações de CSS automaticamente:

```bash
# Navegar para o diretório do projeto
cd portalOrganizaçãoTenant

# Adicionar estilos responsivos
cat ../portalClientEmpresa/src/index.css | tail -n +$(grep -n "MELHORIAS DE RESPONSIVIDADE" ../portalClientEmpresa/src/index.css | cut -d: -f1) >> src/index.css
```

## 📚 Referência

Ver arquivo completo implementado em:
- `portalClientEmpresa/src/components/Layout.jsx`
- `portalClientEmpresa/src/components/Sidebar.jsx`
- `portalClientEmpresa/src/components/Header.jsx`
- `portalClientEmpresa/src/index.css`
