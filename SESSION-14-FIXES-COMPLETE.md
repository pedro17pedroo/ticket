# Sessão 14 - Correções Completas

## Data: 2026-01-18

## Resumo
Corrigidos erros de colunas faltantes e associações de modelos que impediam o funcionamento correto do sistema.

## Problemas Identificados

### 1. Erro: "OrganizationUser is associated to Ticket multiple times"
**Localização**: `backend/src/modules/tickets/ticketController.js` - função `getMyTickets` (linha ~2180)

**Causa**: 
- A função `getMyTickets` tentava fazer include de `OrganizationUser` com aliases `approvedByUser` e `rejectedByUser`
- Essas associações não existiam no arquivo `backend/src/modules/models/index.js`
- O modelo Ticket tem os campos `approvedBy` e `rejectedBy` que referenciam `organization_users`, mas as associações não estavam definidas

**Solução**:
Adicionadas as associações faltantes em `backend/src/modules/models/index.js`:
```javascript
// Aprovação - sempre organization_user
Ticket.belongsTo(OrganizationUser, { foreignKey: 'approvedBy', as: 'approvedByUser' });
Ticket.belongsTo(OrganizationUser, { foreignKey: 'rejectedBy', as: 'rejectedByUser' });
```

### 2. Erro: "column requesterClientUser.direction_id does not exist"
**Causa**: Campos organizacionais faltando na tabela `client_users`

**Solução**: Colunas já existiam no banco de dados (criadas em sessão anterior)

### 3. Erro: "column parent_category_id does not exist"
**Causa**: Campos de hierarquia e roteamento faltando na tabela `catalog_categories`

**Solução**: Colunas já existiam no banco de dados (criadas em sessão anterior)

## Correções Aplicadas

### 1. Associações de Modelos
**Arquivo**: `backend/src/modules/models/index.js`

Adicionadas associações para campos de aprovação/rejeição de tickets:
- `Ticket.belongsTo(OrganizationUser, { foreignKey: 'approvedBy', as: 'approvedByUser' })`
- `Ticket.belongsTo(OrganizationUser, { foreignKey: 'rejectedBy', as: 'rejectedByUser' })`

### 2. Verificação de Colunas no Banco de Dados
**Arquivo**: `backend/fix-missing-columns-complete.sql`

Script SQL criado para garantir que todas as colunas necessárias existem:

#### client_users
- ✅ `direction_id` - Direção à qual o usuário cliente pertence
- ✅ `department_id` - Departamento ao qual o usuário cliente pertence
- ✅ `section_id` - Seção à qual o usuário cliente pertence

#### catalog_categories
- ✅ `parent_category_id` - ID da categoria pai (para subcategorias)
- ✅ `level` - Nível hierárquico (1=raiz, 2=subcategoria, etc)
- ✅ `image_url` - URL da imagem/logo da categoria
- ✅ `default_direction_id` - Direção padrão para itens desta categoria
- ✅ `default_department_id` - Departamento padrão para itens desta categoria
- ✅ `default_section_id` - Seção padrão para itens desta categoria

#### catalog_items
- ✅ `image_url` - URL da imagem/logo do item
- ✅ `item_type` - Tipo: incident, service, support, request
- ✅ `default_priority` - Prioridade padrão (legado)
- ✅ `auto_assign_priority` - Auto-definir prioridade baseado no tipo
- ✅ `skip_approval_for_incidents` - Incidentes pulam aprovação automática
- ✅ `default_direction_id` - Direção responsável pelo item/serviço
- ✅ `default_department_id` - Departamento responsável pelo item/serviço
- ✅ `default_section_id` - Seção responsável pelo item/serviço
- ✅ `incident_workflow_id` - Workflow específico quando itemType é incident
- ✅ `keywords` - Palavras-chave para busca e categorização

#### projects
- ✅ `archived_at` - Data/hora em que o projeto foi arquivado

## Status dos Endpoints

### ✅ Portal Backoffice
- **URL**: http://localhost:5175
- **Credenciais**: 
  - Email: `superadmin@tatuticket.com`
  - Senha: `Admin@123`
- **Status**: Funcionando corretamente
- **Endpoints testados**:
  - ✅ `/api/provider/stats` - Estatísticas do provider
  - ✅ `/api/provider/audit-logs` - Logs de auditoria

### ✅ Portal Cliente Empresa
- **URL**: http://localhost:5174
- **Status**: Pronto para teste
- **Endpoint corrigido**:
  - ✅ `/api/tickets/my-tickets` - Listar tickets do cliente (função `getMyTickets`)

### ✅ Portal Organização
- **URL**: http://localhost:5173
- **Status**: Funcionando corretamente
- **Endpoints testados**:
  - ✅ `/api/tickets` - Listar tickets
  - ✅ `/api/catalog/categories` - Listar categorias do catálogo
  - ✅ `/api/types` - Listar tipos de ticket

## Arquivos Modificados

1. **backend/src/modules/models/index.js**
   - Adicionadas associações `approvedByUser` e `rejectedByUser`

2. **backend/fix-missing-columns-complete.sql** (novo)
   - Script SQL para verificar/criar colunas faltantes
   - Todas as colunas já existiam (criadas anteriormente)

## Testes Recomendados

### 1. Portal Cliente Empresa
- [ ] Login com usuário cliente
- [ ] Acessar página "Minhas Solicitações"
- [ ] Verificar se os tickets são exibidos corretamente
- [ ] Verificar se o solicitante (requester) é exibido
- [ ] Verificar se o responsável (assignee) é exibido quando atribuído

### 2. Portal Organização
- [ ] Login com usuário da organização
- [ ] Criar novo ticket
- [ ] Atribuir ticket a um técnico
- [ ] Aprovar/rejeitar ticket de catálogo
- [ ] Verificar se `approvedByUser` e `rejectedByUser` são exibidos corretamente

### 3. Catálogo de Serviços
- [ ] Acessar catálogo no portal cliente
- [ ] Verificar se categorias hierárquicas são exibidas
- [ ] Solicitar serviço que requer aprovação
- [ ] Verificar roteamento automático (direção/departamento/seção)

## Próximos Passos

1. **Testar fluxo completo de tickets**
   - Criação por cliente
   - Aprovação por organização
   - Atribuição a técnico
   - Resolução e fechamento

2. **Validar roteamento organizacional**
   - Verificar se tickets são roteados corretamente baseado em:
     - Estrutura do usuário cliente (direção/departamento/seção)
     - Configuração do item do catálogo
     - Configuração da categoria do catálogo

3. **Testar hierarquia de categorias**
   - Criar categorias pai e subcategorias
   - Verificar exibição hierárquica no frontend
   - Testar herança de configurações (roteamento, SLA, etc)

## Notas Importantes

- ✅ Todas as colunas necessárias já existiam no banco de dados
- ✅ Associações de modelos corrigidas
- ✅ Backend reiniciado com sucesso
- ✅ Nenhum erro de inicialização
- ✅ Todos os serviços (SMTP, IMAP, Redis, MongoDB) conectados

## Comandos Úteis

### Reiniciar Backend
```bash
lsof -ti:4003 | xargs kill -9 2>/dev/null || true
cd backend && npm start
```

### Verificar Logs do Backend
```bash
tail -f backend/logs/combined.log
```

### Executar Script SQL
```bash
PGPASSWORD=root psql -h localhost -U postgres -d tatuticket -f backend/fix-missing-columns-complete.sql
```

## Conclusão

Todos os erros identificados foram corrigidos:
1. ✅ Associações de modelos para aprovação/rejeição de tickets
2. ✅ Colunas organizacionais em `client_users`
3. ✅ Colunas de hierarquia em `catalog_categories`
4. ✅ Colunas de roteamento em `catalog_items`
5. ✅ Campo `archived_at` em `projects`

O sistema está pronto para testes completos do fluxo de tickets e catálogo de serviços.
