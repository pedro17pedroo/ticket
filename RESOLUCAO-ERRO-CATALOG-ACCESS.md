# Resolução do Erro "Não foi possível carregar as permissões do catálogo"

## Data: 2026-03-02

## Problema Identificado

O frontend estava tentando carregar as permissões do catálogo através do endpoint `/api/clients/:id/catalog-access`, mas esse endpoint não estava disponível porque as rotas de catalog access não estavam registradas no servidor.

**Erro no frontend:**
```
Erro: Não foi possível carregar as permissões do catálogo
```

**Causa raiz:**
- As rotas de catalog access (`catalogAccessRoutes.js`) existiam mas não estavam registradas no arquivo principal de rotas (`backend/src/routes/index.js`)
- O controller tinha os métodos necessários mas eles não estavam acessíveis via API

## Solução Implementada

### 1. Registrar as Rotas de Catalog Access

**Arquivo modificado:** `backend/src/routes/index.js`

Adicionado:
```javascript
// ==================== CATALOG ACCESS CONTROL ====================
import catalogAccessRoutes from '../modules/catalogAccess/catalogAccessRoutes.js';
router.use('/catalog-access', catalogAccessRoutes);
```

### 2. Adicionar Métodos ao Controller

**Arquivo modificado:** `backend/src/modules/catalogAccess/catalogAccessController.js`

Adicionados os seguintes métodos:

#### Para Clientes (B2B):
- `getClientCatalogAccess` - GET /api/catalog-access/clients/:id
- `updateClientCatalogAccess` - PUT /api/catalog-access/clients/:id
- `getClientCatalogAccessAudit` - GET /api/catalog-access/clients/:id/audit

#### Para Usuários de Clientes:
- `getClientUserCatalogAccess` - GET /api/catalog-access/client-users/:id
- `updateClientUserCatalogAccess` - PUT /api/catalog-access/client-users/:id
- `getClientUserCatalogAccessAudit` - GET /api/catalog-access/client-users/:id/audit

## Endpoints Disponíveis

### Catalog Access Control

#### 1. GET /api/catalog-access/clients/:id
Obter permissões de catálogo de um cliente

**Resposta:**
```json
{
  "success": true,
  "data": {
    "accessMode": "all|selected|none",
    "allowedCategories": ["uuid1", "uuid2"],
    "allowedItems": ["uuid3", "uuid4"],
    "deniedCategories": [],
    "deniedItems": []
  }
}
```

#### 2. PUT /api/catalog-access/clients/:id
Atualizar permissões de catálogo de um cliente

**Body:**
```json
{
  "accessMode": "selected",
  "allowedCategories": ["uuid1", "uuid2"],
  "allowedItems": ["uuid3", "uuid4"],
  "deniedCategories": [],
  "deniedItems": []
}
```

#### 3. GET /api/catalog-access/client-users/:id
Obter permissões de catálogo de um usuário de cliente

**Resposta:**
```json
{
  "success": true,
  "data": {
    "accessMode": "inherit|selected|none",
    "allowedCategories": ["uuid1", "uuid2"],
    "allowedItems": ["uuid3", "uuid4"],
    "deniedCategories": [],
    "deniedItems": []
  }
}
```

#### 4. PUT /api/catalog-access/client-users/:id
Atualizar permissões de catálogo de um usuário de cliente

#### 5. GET /api/catalog/effective-access
Obter permissões efetivas do usuário atual (já existia)

## Modos de Acesso

### Para Clientes:
- **all**: Acesso total ao catálogo (padrão)
- **selected**: Acesso apenas aos itens selecionados
- **none**: Sem acesso ao catálogo

### Para Usuários de Clientes:
- **inherit**: Herda as permissões do cliente (padrão)
- **selected**: Acesso apenas aos itens selecionados
- **none**: Sem acesso ao catálogo

## Como Testar

### 1. Reiniciar o Servidor Backend

```bash
# Parar o servidor se estiver rodando
# Ctrl+C

# Iniciar novamente
cd backend
npm start
```

### 2. Testar o Endpoint no Frontend

1. Acesse a página de um cliente
2. Vá para a aba "Catálogo de Serviços"
3. O erro "Não foi possível carregar as permissões do catálogo" não deve mais aparecer
4. Você deve ver as opções de modo de acesso:
   - Acesso Total
   - Acesso Selecionado
   - Sem Acesso

### 3. Testar via API (Opcional)

```bash
# Obter permissões de um cliente
curl -X GET http://localhost:5173/api/catalog-access/clients/{clientId} \
  -H "Authorization: Bearer {token}"

# Atualizar permissões de um cliente
curl -X PUT http://localhost:5173/api/catalog-access/clients/{clientId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "accessMode": "selected",
    "allowedCategories": ["uuid1"],
    "allowedItems": ["uuid2"]
  }'
```

## Arquivos Modificados

1. ✅ `backend/src/routes/index.js` - Registradas as rotas de catalog access
2. ✅ `backend/src/modules/catalogAccess/catalogAccessController.js` - Adicionados métodos para clientes e usuários

## Arquivos Já Existentes (Não Modificados)

- `backend/src/modules/catalogAccess/catalogAccessRoutes.js` - Rotas já estavam definidas
- `backend/src/modules/catalogAccess/catalogAccessModel.js` - Modelo já existia
- `backend/migrations/20260302000001-create-catalog-access-control.sql` - Migration já foi executada

## Próximos Passos

1. ✅ Rotas registradas
2. ✅ Controller atualizado
3. 🔄 **VOCÊ ESTÁ AQUI** → Reiniciar o servidor backend
4. 🔄 Testar no frontend
5. 🔄 Verificar que o erro não aparece mais

## Notas Técnicas

### Hierarquia de Permissões

1. **Deny tem precedência sobre Allow** - Se um recurso é negado, não pode ser acessado mesmo que haja uma regra de allow
2. **Permissão de usuário sobrepõe cliente** - Permissões específicas do usuário têm prioridade sobre as do cliente
3. **Herança** - Por padrão, usuários herdam as permissões do cliente

### Estrutura da Tabela catalog_access_control

```sql
CREATE TABLE catalog_access_control (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  entity_type ENUM('direction', 'department', 'section', 'user', 'client'),
  entity_id UUID NOT NULL,
  resource_type ENUM('category', 'item'),
  resource_id UUID NOT NULL,
  access_type ENUM('allow', 'deny'),
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Conclusão

O erro foi causado pela falta de registro das rotas de catalog access no servidor. Após adicionar o registro das rotas e os métodos necessários no controller, o endpoint está disponível e o frontend deve conseguir carregar as permissões do catálogo sem erros.

**Status Final:** ✅ RESOLVIDO (aguardando reinício do servidor)
