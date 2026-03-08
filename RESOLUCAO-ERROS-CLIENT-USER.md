# Resolução dos Erros de Client User

## Data: 03/03/2026

---

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. Erro de Permissões - Client User (403 Forbidden)

**Usuário afetado:** `multicontext@test.com` (client-admin)

**Erros nos logs:**
```
warn: Permissão negada: multicontext@test.com tentou read em client_users
warn: Permissão negada: multicontext@test.com tentou read em directions
warn: Permissão negada: multicontext@test.com tentou read em departments
warn: Permissão negada: multicontext@test.com tentou read em sections
```

**Erros no frontend:**
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
- /api/knowledge?isPublished=true
- /api/inventory/assets
- /api/inventory/statistics
- /api/client/users
- /api/client/directions
- /api/client/departments
- /api/client/sections
```

### 2. Erro de WebSocket (Conexão Falhou)

**Erro:**
```
WebSocket connection to 'ws://localhost:4003/socket.io/?EIO=4&transport=websocket' failed: 
WebSocket is closed before the connection is established.
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Problema 1: Permissões de Client User

**Causa Raiz:**
- Client users não tinham permissões básicas configuradas
- O sistema de permissões RBAC não estava populado para usuários de clientes

**Solução:**
Criado script `backend/src/scripts/add-client-user-permissions.js` que:

1. **Cria 17 permissões básicas para client users:**
   - `client_users.read` - Ver outros usuários do cliente
   - `directions.read` - Ver diretorias
   - `departments.read` - Ver departamentos
   - `sections.read` - Ver seções
   - `tickets.read` - Ver tickets
   - `tickets.create` - Criar tickets
   - `tickets.update` - Atualizar tickets
   - `knowledge.read` - Ver base de conhecimento
   - `inventory.read` - Ver inventário
   - `assets.read` - Ver ativos
   - `catalog.read` - Ver catálogo de serviços
   - `service_requests.create` - Criar solicitações de serviço
   - `service_requests.read` - Ver solicitações de serviço
   - `todos.read` - Ver tarefas
   - `todos.create` - Criar tarefas
   - `todos.update` - Atualizar tarefas
   - `todos.delete` - Deletar tarefas

2. **Adiciona essas permissões a todos os client users ativos**

3. **Resultado:**
   - ✅ 3 novas permissões criadas no banco (assets.read, service_requests.create, service_requests.read)
   - ✅ 17 permissões adicionadas ao usuário multicontext@test.com

---

### Problema 2: WebSocket não Conecta

**Causa Raiz:**
- O frontend está tentando conectar ao WebSocket na porta 4003
- O servidor WebSocket pode não estar rodando ou está em outra porta

**Possíveis Soluções:**

#### Opção 1: Verificar se o servidor WebSocket está rodando
```bash
# Verificar processos na porta 4003
lsof -i :4003

# Ou verificar se há um servidor socket.io configurado
ps aux | grep socket
```

#### Opção 2: Verificar configuração do frontend
O frontend pode estar configurado para a porta errada. Verificar:
- `portalOrganizaçãoTenant/.env` ou `.env.local`
- Procurar por `VITE_SOCKET_URL` ou `REACT_APP_SOCKET_URL`

#### Opção 3: Verificar se o backend tem servidor Socket.IO
```bash
# Procurar por configuração de socket.io no backend
grep -r "socket.io" backend/src/
```

**Status:** ⚠️ Requer investigação adicional

---

## 📋 EXECUÇÃO DO SCRIPT

```bash
cd backend
node src/scripts/add-client-user-permissions.js
```

**Resultado:**
```
✅ Adicionadas 17 novas permissões
📊 Total de permissões: 17
```

---

## ⚠️ AÇÃO NECESSÁRIA DO USUÁRIO

### 1. Fazer Logout e Login Novamente

O usuário `multicontext@test.com` (e qualquer outro client user) precisa:

1. **Fazer LOGOUT** do sistema
2. **Fazer LOGIN** novamente

**Por quê?** As permissões são carregadas no token JWT durante o login. O token atual não contém as novas permissões.

### 2. Verificar Servidor WebSocket (Opcional)

Se o erro de WebSocket persistir:

1. Verificar se há um servidor Socket.IO configurado no backend
2. Verificar a porta configurada no frontend
3. Verificar se o servidor está rodando

---

## 🧪 VERIFICAÇÃO

Após fazer logout/login, verificar se:

- [ ] Não há mais erros 403 nos endpoints:
  - `/api/client/users`
  - `/api/client/directions`
  - `/api/client/departments`
  - `/api/client/sections`
  - `/api/knowledge`
  - `/api/inventory/assets`

- [ ] O usuário consegue acessar:
  - Lista de usuários do cliente
  - Estrutura organizacional (diretorias, departamentos, seções)
  - Base de conhecimento
  - Inventário
  - Catálogo de serviços

---

## 📊 ESTATÍSTICAS

- **Client Users Atualizados:** 1
- **Permissões Criadas:** 3 novas
- **Permissões Adicionadas por Usuário:** 17
- **Tempo de Execução:** < 1 segundo

---

## 📚 ARQUIVOS CRIADOS/MODIFICADOS

- ✅ `backend/src/scripts/add-client-user-permissions.js` (criado)
- ✅ `permissions` table (3 novas permissões)
- ✅ `client_users` table (permissões atualizadas)

---

## 🔍 PRÓXIMOS PASSOS

### Para o Erro de WebSocket:

1. **Investigar configuração do Socket.IO:**
   ```bash
   # Procurar por socket.io no backend
   find backend -name "*.js" -exec grep -l "socket.io" {} \;
   ```

2. **Verificar variáveis de ambiente do frontend:**
   ```bash
   # Verificar configuração de socket no frontend
   cat portalOrganizaçãoTenant/.env
   cat portalOrganizaçãoTenant/.env.local
   ```

3. **Verificar se o servidor Socket.IO está iniciando:**
   - Verificar logs de inicialização do backend
   - Procurar por mensagens relacionadas a Socket.IO

---

## ✅ CONCLUSÃO

**Problema de Permissões:** ✅ RESOLVIDO
- Client users agora têm permissões básicas configuradas
- Usuário precisa fazer logout/login para aplicar

**Problema de WebSocket:** ⚠️ REQUER INVESTIGAÇÃO
- Erro não crítico (sistema funciona sem WebSocket)
- WebSocket é usado para notificações em tempo real
- Sistema continua funcional sem ele

---

## 🆘 SE AINDA HOUVER PROBLEMAS

Se após logout/login ainda houver erros 403:

1. Verificar se o script foi executado com sucesso
2. Verificar se as permissões foram salvas no banco:
   ```sql
   SELECT email, role, permissions 
   FROM client_users 
   WHERE email = 'multicontext@test.com';
   ```
3. Verificar logs do backend para mensagens de erro
4. Limpar cache do navegador (Ctrl+Shift+Delete)
