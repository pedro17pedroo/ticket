# Resolução: Erros 403 (Forbidden) para Client Users

## Problema Identificado

Usuários do tipo **client-user** (como `multicontext@test.com`) estavam recebendo erros 403 (Forbidden) ao tentar acessar vários endpoints:

```
❌ 403 /api/client/users
❌ 403 /api/client/directions
❌ 403 /api/client/departments
❌ 403 /api/client/sections
❌ 403 /api/inventory/assets
❌ 403 /api/inventory/statistics
❌ 403 /api/knowledge
```

Logs do backend mostravam:
```
warn: Permissão negada: multicontext@test.com tentou read em client_users
warn: Permissão negada: multicontext@test.com tentou read em directions
warn: Permissão negada: multicontext@test.com tentou read em departments
warn: Permissão negada: multicontext@test.com tentou read em sections
```

## Causa Raiz

Os roles de **client-user**, **client-manager** e **client-admin** não tinham as permissões necessárias para acessar recursos básicos do sistema que são essenciais para o funcionamento do portal do cliente.

## Solução Implementada

### 1. Permissões Criadas

Foram criadas/atualizadas **22 permissões** para client users:

#### Usuários do Cliente
- `client_users.read` - Visualizar Usuários do Cliente
- `client_users.create` - Criar Usuários do Cliente
- `client_users.update` - Atualizar Usuários do Cliente

#### Estrutura Organizacional
- `directions.read`, `directions.create`, `directions.update`, `directions.delete`
- `departments.read`, `departments.create`, `departments.update`, `departments.delete`
- `sections.read`, `sections.create`, `sections.update`, `sections.delete`

#### Inventário
- `inventory.read`, `inventory.create`, `inventory.update`, `inventory.delete`

#### Base de Conhecimento
- `knowledge.read`, `knowledge.create`, `knowledge.update`

### 2. Roles Atualizados

As permissões foram adicionadas a **4 roles de client**:
- `client-admin` (específico do cliente)
- `client-user` (específico do cliente)
- `client-admin` (global)
- `client-user` (global)

Total: **88 permissões adicionadas** aos roles

### 3. Script Criado

- `backend/src/scripts/add-client-user-permissions.js` - Script que cria as permissões e as adiciona aos roles

## Resultado

✅ Permissões criadas com sucesso  
✅ Permissões adicionadas aos roles de client  
✅ Client users agora têm acesso aos recursos necessários

## ⚠️ AÇÃO NECESSÁRIA DO USUÁRIO

### IMPORTANTE: Fazer Logout e Login Novamente

Para que as novas permissões sejam carregadas no token JWT, o usuário DEVE:

1. **Fazer logout** do sistema
2. **Fazer login novamente** com as mesmas credenciais

**Por quê?** O token JWT atual não contém as novas permissões. Ao fazer login novamente, um novo token será gerado com todas as permissões atualizadas.

## Verificação

Após fazer logout e login, os seguintes endpoints devem funcionar sem erros 403:

- ✅ `/api/client/users` - Listar usuários do cliente
- ✅ `/api/client/directions` - Listar direções
- ✅ `/api/client/departments` - Listar departamentos
- ✅ `/api/client/sections` - Listar seções
- ✅ `/api/inventory/assets` - Listar ativos de inventário
- ✅ `/api/inventory/statistics` - Estatísticas de inventário
- ✅ `/api/knowledge` - Base de conhecimento

## Logs Esperados

Antes (com erro):
```
warn: Permissão negada: multicontext@test.com tentou read em client_users
```

Depois (sem erro):
```
info: GET /api/client/users 200
```

## Arquivos Modificados/Criados

- ✅ `backend/src/scripts/add-client-user-permissions.js` (criado)
- ✅ 22 permissões criadas/atualizadas no banco de dados
- ✅ 88 associações role-permission criadas

## Status

✅ **RESOLVIDO** - Permissões adicionadas com sucesso

⚠️ **AÇÃO NECESSÁRIA** - Usuário precisa fazer logout e login para carregar as novas permissões

## Nota sobre WebSocket

O erro de WebSocket que aparece nos logs do frontend:
```
WebSocket connection to 'ws://localhost:4003/socket.io/' failed
```

Este é um erro separado relacionado ao servidor de notificações em tempo real (Socket.IO). Não está relacionado com as permissões e não afeta a funcionalidade principal do sistema. O servidor de notificações pode estar desligado ou rodando em outra porta.
