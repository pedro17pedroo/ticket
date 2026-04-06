# Desktop Agent - Implementação Multi-Contexto

## Resumo Executivo

Adaptar o desktop-agent para suportar login com seleção de tipo de usuário (Organização/Cliente) e múltiplos contextos.

## Arquivos Principais a Modificar

### 1. HTML - Adicionar Seletor de Tipo
**Arquivo**: `desktop-agent/src/renderer/index.html`
- ✅ Adicionar radio buttons para Organização/Cliente antes dos campos de login
- Adicionar modal para seleção de contexto (quando múltiplos)

### 2. CSS - Estilos
**Arquivo**: `desktop-agent/src/renderer/styles.css`
- Adicionar estilos para `.user-type-selector`
- Adicionar estilos para modal de contexto

### 3. JavaScript - Lógica de Login
**Arquivo**: `desktop-agent/src/renderer/app.js`
- Modificar `handleLogin()` para capturar userType e enviar portalType
- Adicionar `showContextSelector()` para modal de seleção
- Adicionar `selectContext()` para selecionar contexto específico
- Adicionar `switchContext()` para trocar durante sessão
- Adicionar `updateUIForContext()` para renderização condicional

### 4. Main Process - IPC Handlers
**Arquivo**: `desktop-agent/src/main/main.js`
- Adicionar handler `login` com suporte a portalType
- Adicionar handler `select-context`
- Adicionar handler `switch-context`
- Adicionar handler `list-contexts`

### 5. Preload - Exposição de APIs
**Arquivo**: `desktop-agent/src/preload/preload.js`
- Expor `selectContext()`
- Expor `switchContext()`
- Expor `listContexts()`
- Expor evento `onContextChanged()`

## Próximos Passos

Quer que eu continue com a implementação completa ou prefere revisar o plano primeiro?
