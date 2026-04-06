# Correção de Permissões do Portal Cliente

## Problema Identificado
O Portal Cliente estava retornando erro 403 (Forbidden) em todas as requisições para:
- `/api/client/directions`
- `/api/client/departments`
- `/api/client/sections`
- `/api/client/users`
- `/api/inventory/statistics`
- `/api/inventory/assets`
- `/api/knowledge`

Logs do backend mostravam:
```
warn: Permissão negada: pedro.nekaka@gmail.com tentou read em directions
warn: Permissão negada: pedro.nekaka@gmail.com tentou read em departments
warn: Permissão negada: pedro.nekaka@gmail.com tentou read em sections
```

## Causa Raiz
Os usuários de cliente (tabela `client_users`) não tinham roles RBAC configurados com permissões associadas. O sistema de permissões estava implementado apenas para usuários de organização.

## Solução Aplicada

### 1. Criação de Roles para Clientes

Foram criados 2 roles específicos para usuários de clientes:

#### client-admin (Administrador do Cliente)
- **Prioridade**: 600
- **Permissões** (14 total):
  - `dashboard.view`
  - `tickets.view`, `tickets.create`, `tickets.update`
  - `comments.view`, `comments.create`
  - `directions.view`, `departments.view`, `sections.view`
  - `catalog.view`
  - `assets.view`
  - `knowledge.view`
  - `hours_bank.view`
  - `reports.view`

#### client-user (Utilizador do Cliente)
- **Prioridade**: 300
- **Permissões** (9 total):
  - `dashboard.view`
  - `tickets.view`, `tickets.create`
  - `comments.view`, `comments.create`
  - `catalog.view`
  - `assets.view`
  - `knowledge.view`
  - `hours_bank.view`

### 2. Scripts Criados

1. **`backend/src/scripts/seedClientRBACPermissions.js`**
   - Cria os roles `client-admin` e `client-user`
   - Associa as permissões apropriadas a cada role

2. **`backend/src/scripts/update-client-users-roles.js`**
   - Atualiza os roles dos usuários existentes
   - Mapeia roles antigos para os novos roles RBAC

### 3. Execução dos Scripts

```bash
cd backend
node src/scripts/seedClientRBACPermissions.js
node src/scripts/update-client-users-roles.js
```

**Resultado**:
- ✅ 2 roles de clientes criados
- ✅ 14 usuários de clientes verificados
- ✅ Todos os usuários já tinham roles corretos

## Diferenças entre Roles de Organização e Cliente

### Organização (org-admin, org-manager, agent, technician)
- Acesso completo à gestão da organização
- Podem criar/editar/deletar recursos
- Gerenciam estrutura organizacional
- Gerenciam usuários e clientes

### Cliente (client-admin, client-user)
- Acesso limitado aos seus próprios recursos
- Podem criar tickets e comentários
- Visualização da estrutura organizacional (read-only)
- Não podem gerenciar outros clientes ou usuários da organização

## Próximos Passos

1. **Reiniciar o Backend**
   ```bash
   # Parar o backend atual (Ctrl+C)
   cd backend
   npm start
   ```

2. **Fazer Logout e Login Novamente**
   - Sair do Portal Cliente
   - Fazer login novamente com suas credenciais
   - O novo token JWT incluirá as permissões do role `client-admin`

3. **Verificar Permissões**
   - Abrir o console do navegador (F12)
   - Verificar que o token JWT agora contém o array `permissions` preenchido
   - Todas as páginas devem carregar sem erros 403

## Verificação no Banco de Dados

```sql
-- Ver roles de clientes
SELECT * FROM roles 
WHERE name IN ('client-admin', 'client-user')
ORDER BY priority DESC;

-- Ver permissões do client-admin
SELECT p.* 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON r.id = rp.role_id
WHERE r.name = 'client-admin' AND rp.granted = true
ORDER BY p.category, p.resource, p.action;

-- Ver usuários de clientes e seus roles
SELECT 
  email,
  name,
  role,
  is_active
FROM client_users
WHERE is_active = true
ORDER BY role, email;
```

## Estrutura de Permissões Completa

### Organização
- **org-admin**: 77 permissões (todas)
- **org-manager**: 60 permissões
- **agent**: 29 permissões
- **technician**: 23 permissões

### Cliente
- **client-admin**: 14 permissões
- **client-user**: 9 permissões

## Status
✅ Roles de clientes criados
✅ Permissões associadas
✅ Usuários verificados
⏳ Aguardando reinicialização do backend
⏳ Aguardando novo login do usuário
