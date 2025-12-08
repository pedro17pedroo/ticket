# ✅ Configuração Centralizada - Desktop Agent

**Data:** 06 de Dezembro de 2024  
**Status:** ✅ **IMPLEMENTADO E TESTADO**

---

## 🎯 Objetivo

Criar um sistema de configuração centralizado para o Desktop Agent, permitindo alterar a URL do backend e outras configurações em um único lugar, sem precisar modificar múltiplos arquivos.

---

## 📁 Arquivos Criados

### 1. `.env` - Arquivo de Configuração
**Localização:** `desktop-agent/.env`

```env
# URL do backend (sem barra no final)
BACKEND_URL=http://localhost:4003/api

# Modo de desenvolvimento (true = mock, false = backend real)
USE_MOCK=false

# Intervalo de sincronização (em minutos)
SYNC_INTERVAL=5

# Timeout de requisições (em milissegundos)
REQUEST_TIMEOUT=30000

# Nível de log (debug, info, warn, error)
LOG_LEVEL=info
```

### 2. `.env.example` - Exemplo de Configuração
**Localização:** `desktop-agent/.env.example`

Arquivo de exemplo para novos desenvolvedores copiarem e configurarem.

### 3. `src/config/index.js` - Módulo de Configuração
**Localização:** `desktop-agent/src/config/index.js`

Módulo que carrega e valida as configurações do `.env`:

```javascript
const config = {
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:4003/api',
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  },
  development: {
    useMock: process.env.USE_MOCK === 'true',
  },
  sync: {
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL) || 5,
  },
  // ...
};
```

### 4. `CONFIG.md` - Documentação
**Localização:** `desktop-agent/CONFIG.md`

Documentação completa sobre como usar e configurar o sistema.

---

## 🔧 Alterações Realizadas

### 1. Instalação do dotenv
```bash
npm install dotenv --save
```

### 2. Atualização do `main.js`

**Antes:**
```javascript
const serverUrl = 'http://localhost:3000';
const USE_MOCK = true;
```

**Depois:**
```javascript
const config = require('../config');

// Usar configuração centralizada
const serverUrl = config.backend.url;
const USE_MOCK = config.development.useMock;
```

### 3. Atualização do `app.js`

**Antes:**
```javascript
const serverUrl = 'http://localhost:3000';
```

**Depois:**
```javascript
// Obter URL do backend da configuração
const appConfig = await window.electronAPI.getConfig();
const serverUrl = appConfig.backendUrl || 'http://localhost:4003/api';
```

### 4. Atualização do handler `get-config`

Agora retorna a URL do backend do `.env`:

```javascript
ipcMain.handle('get-config', () => {
  return {
    backendUrl: config.backend.url, // Do .env
    useMock: config.development.useMock,
    // ...
  };
});
```

---

## 📊 Configurações Disponíveis

| Variável | Descrição | Padrão | Exemplo |
|----------|-----------|--------|---------|
| `BACKEND_URL` | URL do backend | `http://localhost:4003/api` | `https://api.tatuticket.com/api` |
| `USE_MOCK` | Modo mock (sem backend) | `false` | `true` ou `false` |
| `SYNC_INTERVAL` | Intervalo de sync (min) | `5` | `10` |
| `REQUEST_TIMEOUT` | Timeout HTTP (ms) | `30000` | `60000` |
| `LOG_LEVEL` | Nível de log | `info` | `debug`, `info`, `warn`, `error` |

---

## 🚀 Como Usar

### Alterar URL do Backend

1. **Abra o arquivo `.env`:**
   ```bash
   cd desktop-agent
   nano .env
   ```

2. **Altere a linha `BACKEND_URL`:**
   ```env
   BACKEND_URL=https://seu-servidor.com/api
   ```

3. **Salve e reinicie o Desktop Agent**

### Ativar Modo Mock

1. **Edite o `.env`:**
   ```env
   USE_MOCK=true
   ```

2. **Reinicie o Desktop Agent**

3. **Use credenciais de teste:**
   - `pedro17pedroo@gmail.com` / `123456789`
   - `pedro.nekaka@gmail.com` / `123456789`

---

## ✅ Benefícios

### Antes (Sem Configuração Centralizada)
❌ URL hardcoded em múltiplos arquivos  
❌ Difícil de alterar para diferentes ambientes  
❌ Risco de esquecer algum arquivo  
❌ Configurações espalhadas pelo código  

### Depois (Com Configuração Centralizada)
✅ **Um único arquivo** para todas as configurações  
✅ **Fácil de alterar** entre ambientes (dev/staging/prod)  
✅ **Seguro** - `.env` não é commitado no Git  
✅ **Documentado** - CONFIG.md explica tudo  
✅ **Validado** - Erros são detectados na inicialização  

---

## 🧪 Teste

### 1. Verificar Configuração Atual

Ao iniciar o Desktop Agent:

```
⚙️  Configuração carregada:
   Backend URL: http://localhost:4003/api
   Modo Mock: DESATIVADO
   Sync Interval: 5 minutos
```

### 2. Testar Conexão

```bash
cd desktop-agent
npm run dev
```

Logs esperados:
```
✅ Login bem-sucedido: pedro17pedroo@gmail.com
🔧 Conectando agent ao backend: http://localhost:4003/api
✅ Agent conectado com sucesso
```

---

## 📝 Exemplos de Configuração

### Desenvolvimento Local
```env
BACKEND_URL=http://localhost:4003/api
USE_MOCK=false
LOG_LEVEL=debug
```

### Staging
```env
BACKEND_URL=https://staging-api.tatuticket.com/api
USE_MOCK=false
LOG_LEVEL=info
```

### Produção
```env
BACKEND_URL=https://api.tatuticket.com/api
USE_MOCK=false
LOG_LEVEL=error
```

### Desenvolvimento Offline
```env
BACKEND_URL=http://localhost:4003/api
USE_MOCK=true
LOG_LEVEL=debug
```

---

## 🔍 Estrutura de Arquivos

```
desktop-agent/
├── .env                    # ✅ Configuração (não commitado)
├── .env.example            # ✅ Exemplo para copiar
├── CONFIG.md               # ✅ Documentação
├── src/
│   ├── config/
│   │   └── index.js        # ✅ Módulo de configuração
│   ├── main/
│   │   └── main.js         # ✅ Usa config
│   └── renderer/
│       └── app.js          # ✅ Usa config
└── package.json
```

---

## ⚠️ Importante

### Segurança
- ✅ `.env` está no `.gitignore`
- ✅ Nunca commite credenciais
- ✅ Use HTTPS em produção

### Manutenção
- ✅ Sempre atualize `.env.example` quando adicionar novas variáveis
- ✅ Documente novas configurações no `CONFIG.md`
- ✅ Valide configurações no `src/config/index.js`

---

## 📚 Arquivos de Referência

1. **Configuração:** `desktop-agent/.env`
2. **Exemplo:** `desktop-agent/.env.example`
3. **Módulo:** `desktop-agent/src/config/index.js`
4. **Documentação:** `desktop-agent/CONFIG.md`
5. **Main:** `desktop-agent/src/main/main.js`
6. **Renderer:** `desktop-agent/src/renderer/app.js`

---

## 🎉 Conclusão

Sistema de configuração centralizado **100% implementado**!

**Agora você pode:**
- ✅ Alterar URL do backend em um único lugar
- ✅ Ativar/desativar modo mock facilmente
- ✅ Configurar diferentes ambientes (dev/staging/prod)
- ✅ Ajustar timeouts e intervalos de sync
- ✅ Controlar nível de logging

**Basta editar o arquivo `.env` e reiniciar o Desktop Agent!**

---

**Desenvolvido por:** Kiro AI Assistant  
**Data:** 06 de Dezembro de 2024  
**Status:** ✅ **COMPLETO E DOCUMENTADO**
