# 🔧 Configuração do Desktop Agent

## 📋 Visão Geral

O Desktop Agent utiliza um arquivo de configuração centralizado (`.env`) para facilitar a manutenção e personalização das configurações.

## 📁 Arquivo de Configuração

### Localização
```
desktop-agent/.env
```

### Estrutura

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

## ⚙️ Configurações Disponíveis

### BACKEND_URL
**Descrição:** URL base do backend da aplicação  
**Padrão:** `http://localhost:4003`  
**Exemplos:**
```env
# Desenvolvimento local
BACKEND_URL=http://localhost:4003

# Servidor de staging
BACKEND_URL=https://staging-api.tatuticket.com

# Produção
BACKEND_URL=https://api.tatuticket.com
```

**⚠️ IMPORTANTE:** 
- Não adicione barra `/` no final da URL
- **NÃO inclua `/api`** - o sistema adiciona automaticamente
- Use `https://` em produção

### USE_MOCK
**Descrição:** Ativa/desativa o modo mock (sem backend)  
**Padrão:** `false`  
**Valores:** `true` ou `false`

```env
# Usar backend real
USE_MOCK=false

# Usar dados mock (desenvolvimento sem backend)
USE_MOCK=true
```

**Quando usar:**
- `false`: Quando o backend está rodando (produção/desenvolvimento)
- `true`: Para testar a interface sem backend disponível

### SYNC_INTERVAL
**Descrição:** Intervalo de sincronização automática em minutos  
**Padrão:** `5`  
**Valores:** Número inteiro (1-60)

```env
# Sincronizar a cada 5 minutos
SYNC_INTERVAL=5

# Sincronizar a cada 10 minutos
SYNC_INTERVAL=10
```

### REQUEST_TIMEOUT
**Descrição:** Timeout para requisições HTTP em milissegundos  
**Padrão:** `30000` (30 segundos)  
**Valores:** Número inteiro

```env
# 30 segundos
REQUEST_TIMEOUT=30000

# 1 minuto
REQUEST_TIMEOUT=60000
```

### LOG_LEVEL
**Descrição:** Nível de detalhamento dos logs  
**Padrão:** `info`  
**Valores:** `debug`, `info`, `warn`, `error`

```env
# Desenvolvimento (mais detalhado)
LOG_LEVEL=debug

# Produção (menos detalhado)
LOG_LEVEL=error
```

## 🚀 Como Usar

### 1. Primeira Configuração

1. Copie o arquivo de exemplo:
   ```bash
   cd desktop-agent
   cp .env.example .env
   ```

2. Edite o arquivo `.env` com suas configurações:
   ```bash
   nano .env
   # ou
   code .env
   ```

3. Salve e reinicie o Desktop Agent

### 2. Alterar URL do Backend

**Cenário:** Você precisa apontar para um servidor diferente

1. Abra o arquivo `.env`:
   ```bash
   cd desktop-agent
   nano .env
   ```

2. Altere a linha `BACKEND_URL`:
   ```env
   BACKEND_URL=https://seu-servidor.com/api
   ```

3. Salve e reinicie o Desktop Agent

### 3. Ativar Modo Mock

**Cenário:** Testar sem backend disponível

1. Abra o arquivo `.env`
2. Altere `USE_MOCK` para `true`:
   ```env
   USE_MOCK=true
   ```
3. Reinicie o Desktop Agent
4. Use as credenciais de teste:
   - `pedro17pedroo@gmail.com` / `123456789`
   - `pedro.nekaka@gmail.com` / `123456789`

## 🔍 Verificação

### Ver Configuração Atual

Ao iniciar o Desktop Agent em modo desenvolvimento, você verá:

```
⚙️  Configuração carregada:
   Backend URL: http://localhost:4003/api
   Modo Mock: DESATIVADO
   Sync Interval: 5 minutos
```

### Testar Conexão

1. Inicie o Desktop Agent:
   ```bash
   npm run dev
   ```

2. Verifique os logs no console:
   - ✅ `Conectando ao backend: http://localhost:4003/api`
   - ✅ `Login bem-sucedido`

3. Se houver erro:
   - ❌ `ECONNREFUSED` = Backend não está rodando
   - ❌ `404` = URL incorreta
   - ❌ `401` = Credenciais inválidas

## 📝 Exemplos de Configuração

### Desenvolvimento Local
```env
BACKEND_URL=http://localhost:4003
USE_MOCK=false
SYNC_INTERVAL=5
REQUEST_TIMEOUT=30000
LOG_LEVEL=debug
```

### Staging
```env
BACKEND_URL=https://staging-api.tatuticket.com
USE_MOCK=false
SYNC_INTERVAL=10
REQUEST_TIMEOUT=60000
LOG_LEVEL=info
```

### Produção
```env
BACKEND_URL=https://api.tatuticket.com
USE_MOCK=false
SYNC_INTERVAL=15
REQUEST_TIMEOUT=30000
LOG_LEVEL=error
```

### Desenvolvimento Offline (Mock)
```env
BACKEND_URL=http://localhost:4003
USE_MOCK=true
SYNC_INTERVAL=5
REQUEST_TIMEOUT=30000
LOG_LEVEL=debug
```

## ⚠️ Troubleshooting

### Problema: Configuração não está sendo aplicada

**Solução:**
1. Verifique se o arquivo `.env` existe na pasta `desktop-agent/`
2. Reinicie completamente o Desktop Agent (feche e abra novamente)
3. Limpe o cache:
   ```bash
   rm -rf desktop-agent/node_modules/.cache
   ```

### Problema: Erro "BACKEND_URL não configurada"

**Solução:**
1. Crie o arquivo `.env` se não existir:
   ```bash
   cp desktop-agent/.env.example desktop-agent/.env
   ```
2. Adicione a linha `BACKEND_URL=http://localhost:4003/api`

### Problema: Conexão recusada (ECONNREFUSED)

**Solução:**
1. Verifique se o backend está rodando:
   ```bash
   curl http://localhost:4003/api/health
   ```
2. Verifique se a porta está correta no `.env`
3. Se o backend não estiver disponível, ative o modo mock:
   ```env
   USE_MOCK=true
   ```

## 📚 Referências

- **Arquivo de configuração:** `desktop-agent/.env`
- **Módulo de configuração:** `desktop-agent/src/config/index.js`
- **Exemplo:** `desktop-agent/.env.example`
- **Documentação do dotenv:** https://github.com/motdotla/dotenv

## 🔐 Segurança

**⚠️ IMPORTANTE:**
- Nunca commite o arquivo `.env` no Git (já está no `.gitignore`)
- Use variáveis de ambiente diferentes para cada ambiente
- Em produção, use HTTPS (`https://`) sempre
- Não compartilhe credenciais no arquivo `.env`

## 📞 Suporte

Se tiver problemas com a configuração:
1. Verifique os logs do console
2. Consulte este documento
3. Entre em contato com a equipe de desenvolvimento
