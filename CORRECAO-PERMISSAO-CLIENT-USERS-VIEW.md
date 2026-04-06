# Correção - Permissão client_users.view Faltante

## 🐛 Problema Identificado

A tab "Utilizadores" na página Organização não estava renderizando para o `client-admin`.

### Causa Raiz

O `client-admin` não tinha a permissão `client_users.view`, que é necessária para visualizar a tab de Utilizadores.

**Permissões que o client-admin tinha:**
- client_users.read ✅
- client_users.create ✅
- client_users.update ✅
- client_users.delete ✅
- client_users.view ❌ **FALTANDO**

### Como o Problema Foi Detectado

No componente `Organization.jsx`, as tabs são filtradas baseado em permissões:

```javascript
const allTabs = [
  { 
    id: 'users', 
    label: 'Utilizadores', 
    icon: Users, 
    component: UsersTab,
    permission: ['client_users', 'view']  // ← Requer esta permissão
  },
  // ... outras tabs
]

// Filtrar tabs baseado em permissões
const tabs = allTabs.filter(tab => {
  if (!tab.permission) return true
  const [resource, action] = tab.permission
  return can(resource, action)  // ← Verifica se tem a permissão
})
```

Como o `client-admin` não tinha `client_users.view`, a tab era filtrada e não aparecia.

---

## ✅ Solução Aplicada

### 1. Adicionar Permissão ao Banco de Dados

```sql
-- Adicionar permissão client_users.view ao client-admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'client_users'
AND p.action = 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);
```

### 2. Atualizar Script de Permissões

Atualizado o arquivo `backend/scripts/add-client-admin-full-permissions.sql` para incluir `view` nas permissões de `client_users`:

```sql
-- Adicionar permissões de client_users (view, create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'client_users'
AND p.action IN ('view', 'create', 'update', 'delete')  -- ← Incluído 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);
```

### 3. Verificação

```bash
# Verificar permissões de client_users
PGPASSWORD=postgres psql -h localhost -U postgres -d tatuticket -c "
SELECT p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'client-admin' AND p.resource = 'client_users'
ORDER BY p.action;
"
```

**Resultado:**
```
   resource   | action 
--------------+--------
 client_users | create
 client_users | delete
 client_users | read
 client_users | update
 client_users | view    ← Agora presente!
(5 rows)
```

---

## 🎯 Resultado Final

### Permissões Completas do client-admin para client_users

| Permissão | Descrição | Status |
|-----------|-----------|--------|
| client_users.view | Visualizar tab de utilizadores | ✅ |
| client_users.read | Ler dados dos utilizadores | ✅ |
| client_users.create | Criar novos utilizadores | ✅ |
| client_users.update | Editar utilizadores existentes | ✅ |
| client_users.delete | Desativar/eliminar utilizadores | ✅ |

### Total de Permissões do client-admin

**Antes:** 33 permissões  
**Depois:** 34 permissões (adicionada `client_users.view`)

---

## ⚠️ Importante

### Para Usuários Já Logados

**É necessário fazer logout e login novamente** para carregar a nova permissão. As permissões são carregadas apenas no momento do login.

### Passos para Testar

1. Fazer logout do portal cliente
2. Fazer login com `admin@clientedemo.com` / `password123`
3. Acessar menu "Organização"
4. Verificar que a tab "Utilizadores" agora está visível
5. Verificar que o conteúdo da tab renderiza corretamente

---

## 📊 Análise do Padrão de Permissões

### Padrão Identificado

Para cada recurso na seção Organização, o `client-admin` precisa de:

1. **view** - Para visualizar a tab
2. **read** - Para ler os dados
3. **create** - Para criar novos registros
4. **update** - Para editar registros existentes
5. **delete** - Para desativar/eliminar registros

### Verificação de Outros Recursos

| Recurso | view | read | create | update | delete |
|---------|------|------|--------|--------|--------|
| client_users | ✅ | ✅ | ✅ | ✅ | ✅ |
| directions | ✅ | ✅ | ✅ | ✅ | ✅ |
| departments | ✅ | ✅ | ✅ | ✅ | ✅ |
| sections | ✅ | ✅ | ✅ | ✅ | ✅ |

Todos os recursos agora têm o conjunto completo de permissões! ✅

---

## 🔍 Lições Aprendidas

1. **Permissões Duplas:** Alguns recursos precisam de duas permissões:
   - `view` para visualizar a tab/menu
   - `read` para ler os dados

2. **Filtros em Cascata:** O sistema filtra em dois níveis:
   - Nível 1: Menus na Sidebar (baseado em permissões)
   - Nível 2: Tabs dentro das páginas (baseado em permissões)

3. **Verificação Completa:** Ao adicionar permissões, verificar:
   - Permissões de visualização (view)
   - Permissões de leitura (read)
   - Permissões de ação (create, update, delete)

---

## 📝 Comandos Úteis

### Verificar Todas as Permissões do client-admin

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d tatuticket -c "
SELECT p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'client-admin'
ORDER BY p.resource, p.action;
"
```

### Verificar Permissões de um Recurso Específico

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d tatuticket -c "
SELECT p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'client-admin' AND p.resource = 'client_users'
ORDER BY p.action;
"
```

### Testar Login e Permissões

```bash
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clientedemo.com",
    "password": "password123"
  }' | jq '.user.permissions | map(select(.resource == "client_users"))'
```

---

**Data:** 04/04/2026  
**Status:** ✅ Corrigido  
**Desenvolvedor:** Kiro AI Assistant  
**Versão:** 1.1
