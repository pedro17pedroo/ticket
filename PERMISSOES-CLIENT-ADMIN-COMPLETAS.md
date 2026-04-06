# Permissões Completas do client-admin

## 📋 Resumo

O `client-admin` é o role com maior permissão no **Portal Cliente Empresa**. Ele tem acesso completo a todas as funcionalidades disponíveis para clientes, incluindo gestão completa da seção Organização.

**Data:** 04/04/2026  
**Total de Permissões:** 33

---

## ✅ Permissões Atribuídas

### 1. Dashboard
| Recurso | Ação | Descrição |
|---------|------|-----------|
| dashboard | view | Visualizar dashboard |

### 2. Tickets (Solicitações)
| Recurso | Ação | Descrição |
|---------|------|-----------|
| tickets | view | Visualizar tickets |
| tickets | create | Criar novos tickets |
| tickets | update | Editar tickets |

### 3. Comentários
| Recurso | Ação | Descrição |
|---------|------|-----------|
| comments | view | Visualizar comentários |
| comments | create | Criar comentários |

### 4. Catálogo de Serviços
| Recurso | Ação | Descrição |
|---------|------|-----------|
| catalog | view | Visualizar catálogo de serviços |

### 5. Base de Conhecimento
| Recurso | Ação | Descrição |
|---------|------|-----------|
| knowledge | view | Visualizar artigos |
| knowledge | read | Ler artigos da base de conhecimento |

### 6. Equipamentos (Assets)
| Recurso | Ação | Descrição |
|---------|------|-----------|
| assets | view | Visualizar equipamentos |
| assets | read | Ler ativos de inventário |
| assets | read_all | Ler todos os ativos de inventário |

### 7. Bolsa de Horas
| Recurso | Ação | Descrição |
|---------|------|-----------|
| hours_bank | view | Visualizar bolsa de horas |

### 8. Relatórios
| Recurso | Ação | Descrição |
|---------|------|-----------|
| reports | view | Visualizar relatórios |

### 9. Utilizadores do Cliente ⭐
| Recurso | Ação | Descrição |
|---------|------|-----------|
| client_users | read | Ler utilizadores do cliente |
| client_users | create | Criar novos utilizadores |
| client_users | update | Editar utilizadores |
| client_users | delete | Desativar/eliminar utilizadores |

### 10. Direções ⭐
| Recurso | Ação | Descrição |
|---------|------|-----------|
| directions | view | Visualizar direções |
| directions | read | Ler direções organizacionais |
| directions | create | Criar novas direções |
| directions | update | Editar direções |
| directions | delete | Desativar/eliminar direções |

### 11. Departamentos ⭐
| Recurso | Ação | Descrição |
|---------|------|-----------|
| departments | view | Visualizar departamentos |
| departments | read | Ler departamentos organizacionais |
| departments | create | Criar novos departamentos |
| departments | update | Editar departamentos |
| departments | delete | Desativar/eliminar departamentos |

### 12. Secções ⭐
| Recurso | Ação | Descrição |
|---------|------|-----------|
| sections | view | Visualizar secções |
| sections | read | Ler secções organizacionais |
| sections | create | Criar novas secções |
| sections | update | Editar secções |
| sections | delete | Desativar/eliminar secções |

⭐ = Permissões exclusivas do `client-admin` (não disponíveis para `client-user`)

---

## 🎯 Funcionalidades Disponíveis

### Portal Cliente Empresa

#### Menus Visíveis
- ✅ Início (Dashboard)
- ✅ Catálogo de Serviços
- ✅ Minhas Solicitações
- ✅ Minhas Tarefas
- ✅ Base de Conhecimento
- ✅ Meus Equipamentos
- ✅ Bolsa de Horas
- ✅ Desktop Agent
- ✅ **Organização** (exclusivo)

#### Seção Organização - Acesso Completo

**Tabs Disponíveis:**
1. ✅ Utilizadores
2. ✅ Direções
3. ✅ Departamentos
4. ✅ Secções

**Ações Disponíveis em Cada Tab:**
- ✅ Criar novo
- ✅ Editar existente
- ✅ Desativar/Reativar
- ✅ Visualizar detalhes
- ✅ Pesquisar/Filtrar

---

## 📊 Comparação: client-admin vs client-user

| Funcionalidade | client-user | client-admin |
|----------------|-------------|--------------|
| Dashboard | ✅ | ✅ |
| Catálogo de Serviços | ✅ | ✅ |
| Criar Tickets | ✅ | ✅ |
| Editar Tickets | ❌ | ✅ |
| Base de Conhecimento | ✅ | ✅ |
| Meus Equipamentos | ✅ | ✅ |
| Bolsa de Horas | ✅ | ✅ |
| Relatórios | ❌ | ✅ |
| **Menu Organização** | ❌ | ✅ |
| **Gestão de Utilizadores** | ❌ | ✅ |
| **Gestão de Direções** | ❌ | ✅ |
| **Gestão de Departamentos** | ❌ | ✅ |
| **Gestão de Secções** | ❌ | ✅ |

---

## 🔧 Como Foram Adicionadas as Permissões

### Script SQL Executado

```sql
-- Adicionar permissões de client_users (create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'client_users'
AND p.action IN ('create', 'update', 'delete')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- Adicionar permissões de directions (create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'directions'
AND p.action IN ('create', 'update', 'delete')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- Adicionar permissões de departments (create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'departments'
AND p.action IN ('create', 'update', 'delete')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- Adicionar permissões de sections (create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'sections'
AND p.action IN ('create', 'update', 'delete')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);
```

### Comando de Execução

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d tatuticket -f backend/scripts/add-client-admin-full-permissions.sql
```

### Resultado

```
INSERT 0 3  -- client_users: create, update, delete
INSERT 0 3  -- directions: create, update, delete
INSERT 0 3  -- departments: create, update, delete
INSERT 0 3  -- sections: create, update, delete

Total: 12 novas permissões adicionadas
Total geral: 33 permissões no client-admin
```

---

## 🧪 Validação

### Teste de Login

```bash
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clientedemo.com",
    "password": "password123"
  }' | jq '.user.permissions | length'
```

**Resultado Esperado:** 33 permissões

### Verificar Permissões Específicas

```bash
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clientedemo.com",
    "password": "password123"
  }' | jq '.user.permissions | map(select(.resource == "directions" or .resource == "departments" or .resource == "sections"))'
```

**Resultado Esperado:** 15 permissões (5 para cada recurso: view, read, create, update, delete)

---

## ⚠️ Notas Importantes

1. **Logout/Login Necessário:** Usuários já logados precisam fazer logout e login novamente para carregar as novas permissões.

2. **Validação Frontend:** Atualmente, a validação de permissões está implementada apenas no frontend. Os botões e menus são ocultados baseado nas permissões.

3. **Validação Backend:** Recomenda-se implementar validação no backend nas rotas de create, update e delete para garantir segurança adicional.

4. **Hierarquia de Roles:** No Portal Cliente Empresa:
   - `client-admin` = Administrador do cliente (acesso completo)
   - `client-user` = Usuário comum do cliente (acesso limitado)

5. **Diferença do Portal Organização:** O `client-admin` é diferente dos roles do Portal Organização (`admin-org`, `gerente`, `supervisor`, `agente`). Cada portal tem seus próprios roles e permissões.

---

## 📝 Credenciais de Teste

### client-admin
- **Email:** admin@clientedemo.com
- **Senha:** password123
- **Permissões:** 33 (acesso completo)

### client-user
- **Email:** user@clientedemo.com
- **Senha:** password123
- **Permissões:** 12 (acesso limitado)

### Usuário Real
- **Email:** pedro.nekaka@gmail.com
- **Senha:** password123
- **Permissões:** 12 (mesmo que client-user)

---

## 🔄 Próximos Passos

1. ✅ Permissões adicionadas ao banco de dados
2. ✅ Frontend implementado com verificações RBAC
3. ✅ Documentação completa
4. ⏳ Testar com usuários reais (requer logout/login)
5. ⏳ Implementar validação no backend
6. ⏳ Adicionar logs de auditoria para ações administrativas
7. ⏳ Considerar adicionar mais roles intermediários se necessário

---

**Desenvolvedor:** Kiro AI Assistant  
**Data:** 04/04/2026  
**Status:** ✅ Completo  
**Versão:** 1.0
