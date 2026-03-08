# ✅ Permissões do org-admin Configuradas com Sucesso

## 📊 Status Atual

Todas as permissões necessárias foram adicionadas com sucesso aos roles `org-admin`:

- ✅ **103-106 permissões** atribuídas a cada role org-admin
- ✅ **14 roles org-admin** atualizados (1 sistema + 13 organizações)
- ✅ Inclui todas as permissões para menus:
  - Dashboard, Tickets, Projetos
  - Catálogo de Serviços
  - Inventário e Licenças
  - Clientes
  - Estrutura Organizacional (Utilizadores, Direções, Departamentos, Secções)
  - **Sistema (SLAs, Prioridades, Tipos, Permissões/RBAC)** ← Agora disponível!
  - Tarefas, Bolsa de Horas, Relatórios
  - Base de Conhecimento, Tags, Templates
  - Desktop Agent

## ⚠️ AÇÃO NECESSÁRIA: Logout e Login

### Por que é necessário?

As permissões são armazenadas no **token JWT** durante o login. Tokens existentes não contêm as novas permissões adicionadas.

### Como fazer:

1. **Fazer LOGOUT** do portal de organização
2. **Fazer LOGIN** novamente com as mesmas credenciais
3. Verificar que todos os menus agora aparecem, incluindo:
   - Menu "Sistema" com submenu "Permissões (RBAC)"
   - Todos os outros menus que estavam faltando

## 🔍 Verificação das Permissões

Para verificar as permissões atribuídas, execute:

```bash
cd backend
node src/scripts/verify-org-admin-permissions.js
```

Este script mostra todas as permissões de cada role org-admin.

## 📋 Permissões Principais Adicionadas

### Sistema (Menu que estava faltando)
- `slas.view`, `slas.create`, `slas.update`, `slas.delete`
- `priorities.view`, `priorities.create`, `priorities.update`, `priorities.delete`
- `types.view`, `types.create`, `types.update`, `types.delete`
- **`roles.view`, `roles.create`, `roles.update`, `roles.delete`** ← Menu Permissões (RBAC)

### Outros Recursos
- `dashboard.view`
- `tickets.*` (view, create, update, delete, assign, close)
- `projects.*` (view, create, update, delete, manage_tasks)
- `catalog.*` (view, create, update, delete, approve)
- `inventory.*`, `licenses.*`
- `clients.*`, `users.*`
- `directions.*`, `departments.*`, `sections.*`
- `todos.*`, `hours_bank.*`, `reports.*`
- `knowledge.*`, `tags.*`, `templates.*`
- `desktop_agent.view`
- `settings.read`, `settings.update`

## 🎯 Resultado Esperado

Após logout e login, o utilizador org-admin terá acesso completo a:

1. ✅ Todos os menus principais
2. ✅ Todos os submenus
3. ✅ Menu "Sistema" com:
   - SLAs
   - Prioridades
   - Tipos
   - **Permissões (RBAC)** ← Agora visível!
4. ✅ Todas as funcionalidades de administração

## 📝 Notas Técnicas

- As permissões são carregadas no login via `authController.js` → `getProfile()`
- O hook `usePermissions` no frontend verifica as permissões do token
- O componente `Sidebar.jsx` filtra menus baseado nas permissões
- Permissões são mapeadas entre backend e frontend via `PERMISSION_ALIASES`

## 🔧 Scripts Disponíveis

1. **Adicionar permissões** (já executado):
   ```bash
   node src/scripts/add-all-org-admin-permissions.js
   ```

2. **Verificar permissões**:
   ```bash
   node src/scripts/verify-org-admin-permissions.js
   ```

3. **Debug de permissões de um utilizador específico**:
   ```bash
   node src/scripts/debug-org-admin-permissions.js
   ```

## ✅ Conclusão

O sistema está configurado corretamente. O utilizador apenas precisa fazer **logout e login** para receber o novo token JWT com todas as permissões atualizadas.
