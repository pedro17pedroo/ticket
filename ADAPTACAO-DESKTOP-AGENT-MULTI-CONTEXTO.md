# Adaptação Desktop-Agent para Multi-Contexto

## Objetivo
Adaptar o desktop-agent para trabalhar com a nova estrutura de multi-contexto, permitindo que usuários possam:
1. Selecionar se são de organização ou cliente no login
2. Escolher entre múltiplos contextos (organizações ou empresas clientes)
3. Carregar permissões específicas de cada contexto
4. Renderizar funcionalidades apropriadas para cada tipo de usuário

## Situação Atual

O desktop-agent atualmente:
- Faz login direto com email/senha
- Não diferencia entre usuário de organização e cliente
- Não suporta múltiplos contextos
- Usa endpoint `/api/auth/login` sem especificar `portalType`

## Mudanças Necessárias

### 1. Tela de Login (UI)

**Arquivo**: `desktop-agent/src/renderer/index.html`

Adicionar:
- Radio buttons ou tabs para selecionar tipo de usuário (Organização / Cliente)
- Manter campos de email e senha
- Adicionar lógica para enviar `portalType` no login

```html
<!-- Seletor de Tipo de Usuário -->
<div class="user-type-selector">
  <label>
    <input type="radio" name="userType" value="organization" checked />
    <span>Organização</span>
  </label>
  <label>
    <input type="radio" name="userType" value="client" />
    <span>Cliente</span>
  </label>
</div>
```

### 2. Fluxo de Login (Lógica)

**Arquivo**: `desktop-agent/src/renderer/app.js` - função `handleLogin()`

Modificar para:
1. Capturar tipo de usuário selecionado
2. Enviar `portalType` no login
3. Verificar se há múltiplos contextos na resposta
4. Se `requiresContextSelection: true`, mostrar modal de seleção
5. Se único contexto, prosseguir normalmente

```javascript
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const userType = document.querySelector('input[name="userType"]:checked').value;
  
  // Mapear userType para portalType
  const portalType = userType; // 'organization' ou 'client'
  
  // Fazer login com portalType
  const { success, token, user, context, requiresContextSelection, contexts, error } = 
    await window.electronAPI.login({
      serverUrl,
      username: email,
      password,
      portalType
    });
  
  if (!success) {
    throw new Error(error || 'Erro ao fazer login');
  }
  
  // Se múltiplos contextos, mostrar seletor
  if (requiresContextSelection && contexts && contexts.length > 1) {
    await showContextSelector(contexts, email, password);
    return;
  }
  
  // Único contexto ou contexto já selecionado
  await completeLogin(token, user, context);
}
```

### 3. Modal de Seleção de Contexto

**Novo componente**: `desktop-agent/src/renderer/components/ContextSelector.js`

Criar modal para exibir contextos disponíveis:
- Agrupar por tipo (Organizações / Empresas Cliente)
- Mostrar nome da organização/empresa
- Mostrar role do usuário
- Destacar último contexto usado
- Ao selecionar, chamar `/api/auth/select-context`

```javascript
async function showContextSelector(contexts, email, password) {
  // Criar modal com lista de contextos
  // Agrupar por tipo
  const orgContexts = contexts.filter(c => c.type === 'organization');
  const clientContexts = contexts.filter(c => c.type === 'client');
  
  // Renderizar lista
  // Ao clicar em um contexto, chamar selectContext()
}

async function selectContext(contextId, contextType, email, password) {
  const { success, token, user, context, error } = 
    await window.electronAPI.selectContext({
      email,
      password,
      contextId,
      contextType
    });
  
  if (!success) {
    throw new Error(error || 'Erro ao selecionar contexto');
  }
  
  await completeLogin(token, user, context);
}
```

### 4. Backend - Main Process

**Arquivo**: `desktop-agent/src/main/main.js`

Adicionar handlers IPC:

```javascript
// Login com portalType
ipcMain.handle('login', async (event, { serverUrl, username, password, portalType }) => {
  try {
    const response = await axios.post(`${serverUrl}/api/auth/login`, {
      email: username,
      password,
      portalType
    });
    
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
});

// Selecionar contexto
ipcMain.handle('select-context', async (event, { email, password, contextId, contextType }) => {
  try {
    const config = await getConfig();
    const response = await axios.post(`${config.serverUrl}/api/auth/select-context`, {
      email,
      password,
      contextId,
      contextType
    });
    
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
});

// Trocar contexto (durante sessão ativa)
ipcMain.handle('switch-context', async (event, { contextId, contextType }) => {
  try {
    const config = await getConfig();
    const response = await axios.post(
      `${config.serverUrl}/api/auth/switch-context`,
      { contextId, contextType },
      {
        headers: {
          Authorization: `Bearer ${config.token}`
        }
      }
    );
    
    // Atualizar token
    await saveConfig({ ...config, token: response.data.token });
    
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
});

// Listar contextos disponíveis
ipcMain.handle('list-contexts', async (event) => {
  try {
    const config = await getConfig();
    const response = await axios.get(`${config.serverUrl}/api/auth/contexts`, {
      headers: {
        Authorization: `Bearer ${config.token}`
      }
    });
    
    return {
      success: true,
      contexts: response.data.contexts
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
});
```

### 5. Preload Script

**Arquivo**: `desktop-agent/src/preload/preload.js`

Adicionar exposições:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing methods ...
  
  // Contexto
  selectContext: (data) => ipcRenderer.invoke('select-context', data),
  switchContext: (data) => ipcRenderer.invoke('switch-context', data),
  listContexts: () => ipcRenderer.invoke('list-contexts'),
  
  // Eventos de contexto
  onContextChanged: (callback) => {
    ipcRenderer.on('context-changed', (event, data) => callback(data));
  }
});
```

### 6. Context Switcher Widget

**Novo componente**: Widget no header para trocar contexto

Adicionar no header do app:
- Dropdown mostrando contexto atual
- Lista de contextos disponíveis
- Ao selecionar, chamar `switchContext()`
- Recarregar dados após troca

```html
<div class="context-switcher">
  <button id="currentContextBtn">
    <span id="currentContextName">Organização A</span>
    <span id="currentContextRole">Admin</span>
  </button>
  <div id="contextDropdown" class="dropdown">
    <!-- Lista de contextos -->
  </div>
</div>
```

### 7. Renderização Condicional

**Arquivo**: `desktop-agent/src/renderer/app.js`

Adicionar lógica para mostrar/ocultar funcionalidades baseado no contexto:

```javascript
function updateUIForContext(context) {
  const isOrganization = context.contextType === 'organization';
  const isClient = context.contextType === 'client';
  
  // Mostrar/ocultar itens de menu
  document.querySelector('[data-page="inventory"]').style.display = 
    isOrganization ? 'flex' : 'none';
  
  document.querySelector('[data-page="catalog"]').style.display = 
    isClient ? 'flex' : 'none';
  
  // Atualizar permissões
  state.permissions = context.permissions || [];
  
  // Atualizar informações do usuário
  document.getElementById('userName').textContent = context.name;
  document.getElementById('userRole').textContent = context.role;
  
  // Atualizar contexto atual
  document.getElementById('currentContextName').textContent = 
    context.organizationName || context.clientName;
  document.getElementById('currentContextRole').textContent = context.role;
}
```

## Fluxo Completo

### Login Inicial

1. Usuário abre desktop-agent
2. Vê tela de login com seletor de tipo (Organização/Cliente)
3. Seleciona tipo, insere email/senha
4. Clica em "Entrar"
5. Backend valida credenciais
6. Se múltiplos contextos:
   - Mostra modal com lista de contextos
   - Usuário seleciona contexto
   - Backend retorna token com contexto selecionado
7. Se único contexto:
   - Backend retorna token diretamente
8. Desktop-agent salva token e contexto
9. Carrega interface com permissões do contexto

### Troca de Contexto

1. Usuário clica no widget de contexto no header
2. Vê lista de contextos disponíveis
3. Seleciona novo contexto
4. Backend invalida sessão atual
5. Backend cria nova sessão com novo contexto
6. Backend retorna novo token
7. Desktop-agent atualiza token
8. Recarrega dados e interface

## Arquivos a Modificar

1. ✅ `desktop-agent/src/renderer/index.html` - Adicionar seletor de tipo
2. ✅ `desktop-agent/src/renderer/app.js` - Modificar handleLogin()
3. ✅ `desktop-agent/src/main/main.js` - Adicionar handlers IPC
4. ✅ `desktop-agent/src/preload/preload.js` - Expor novos métodos
5. ✅ `desktop-agent/src/renderer/components/ContextSelector.js` - Novo componente
6. ✅ `desktop-agent/src/renderer/styles.css` - Estilos para novos componentes

## Testes Necessários

1. Login como usuário de organização com único contexto
2. Login como usuário de organização com múltiplos contextos
3. Login como cliente com único contexto
4. Login como cliente com múltiplos contextos
5. Troca de contexto durante sessão ativa
6. Verificação de permissões por contexto
7. Renderização condicional de funcionalidades

## Próximos Passos

1. Implementar seletor de tipo na tela de login
2. Modificar função handleLogin() para enviar portalType
3. Criar modal de seleção de contexto
4. Adicionar handlers IPC no main process
5. Implementar context switcher widget
6. Adicionar renderização condicional
7. Testar todos os fluxos
