# Correção de Permissões do Portal Organização

## Problema Identificado
O Portal Organização não estava carregando as permissões do backend. O token JWT retornava `permissions: []` vazio.

## Causa Raiz
As permissões RBAC não estavam seedadas no banco de dados. O sistema de permissões estava implementado, mas as tabelas `permissions`, `roles` e `role_permissions` estavam vazias.

## Solução Aplicada

### 1. Seed de Permissões RBAC
Executado o script `backend/src/scripts/seedRBACPermissions.js` que criou:

- 77 permissões organizadas por categoria:
  - Dashboard (1 permissão)
  - Tickets (7 permissões)
  - Comments (3 permissões)
  - Users (5 permissões)
  - Clients (4 permissões)
  - Client Users (4 permissões)
  - Directions (4 permissões)
  - Departments (4 permissões)
  - Sections (4 permissões)
  - Catalog (3 permissões)
  - Assets (4 permissões)
  - Knowledge (4 permissões)
  - Hours Bank (3 permissões)
  - Time Tracking (4 permissões)
  - Reports (2 permissões)
  - Settings (3 permissões)
  - Tags (4 permissões)
  - Templates (4 permissões)
  - Desktop Agent (2 permissões)
  - Projects (4 permissões)
  - Project Tasks (4 permissões)
  - Project Stakeholders (1 permissão)

- 4 roles do sistema:
  1. **org-admin** (Administrador da Organização) - TODAS as 77 permissões
  2. **org-manager** (Gestor) - 60 permissões
  3. **agent** (Agente) - 29 permissões
  4. **technician** (Técnico) - 23 permissões

### 2. Estrutura de Permissões

Cada permissão segue o formato: `resource.action`

Exemplos:
- `dashboard.view`
- `tickets.create`
- `tickets.update`
- `tickets.delete`
- `users.view`
- `clients.create`

### 3. Próximos Passos

Para que as permissões sejam carregadas corretamente:

1. **Reiniciar o Backend**
   ```bash
   # Parar o backend atual (Ctrl+C)
   cd backend
   npm start
   ```

2. **Fazer Logout e Login Novamente**
   - Sair do Portal Organização
   - Fazer login novamente com suas credenciais
   - O novo token JWT incluirá todas as permissões do role `org-admin`

3. **Verificar Permissões**
   - Abrir o console do navegador (F12)
   - Verificar que o token JWT agora contém o array `permissions` preenchido
   - O menu lateral deve exibir todos os itens (org-admin tem acesso total)

## Verificação

Após reiniciar o backend e fazer login novamente, o token JWT deve conter:

```json
{
  "id": "...",
  "email": "pedro17pedroo@gmail.com",
  "role": "org-admin",
  "permissions": [
    "dashboard.view",
    "tickets.view",
    "tickets.create",
    "tickets.update",
    "tickets.delete",
    "tickets.assign",
    "tickets.close",
    "comments.view",
    "comments.create",
    "comments.create_internal",
    // ... todas as 77 permissões
  ]
}
```

## Comandos Úteis

### Verificar Permissões de um Role
```bash
cd backend
node src/scripts/verify-org-admin-permissions.js
```

### Adicionar Novas Permissões
Editar `backend/src/scripts/seedRBACPermissions.js` e executar novamente.

### Verificar Permissões no Banco
```sql
-- Ver todas as permissões
SELECT * FROM permissions ORDER BY category, resource, action;

-- Ver permissões de um role específico
SELECT p.* 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON r.id = rp.role_id
WHERE r.name = 'org-admin' AND rp.granted = true
ORDER BY p.category, p.resource, p.action;

-- Contar permissões por role
SELECT r.name, COUNT(rp.id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
WHERE r.is_system = true
GROUP BY r.name
ORDER BY total_permissions DESC;
```

## Status
✅ Permissões seedadas com sucesso
✅ 77 permissões criadas
✅ 4 roles criados
⏳ Aguardando reinicialização do backend
⏳ Aguardando novo login do usuário
