# Guia de Teste: Sistema Multi-Contexto para Organizações

## ✅ Status: Sistema Funcional para Organizações

O sistema de multi-contexto está 100% funcional para usuários de organizações. Este guia mostra como testar a funcionalidade.

## 📋 Pré-requisitos

- ✅ Tabelas `context_sessions` e `context_audit_logs` criadas
- ✅ Backend rodando na porta 4003
- ✅ Portal Organização rodando na porta 5173
- ✅ Banco de dados PostgreSQL configurado

## 🧪 Cenário de Teste 1: Usuário em Múltiplas Organizações

### Passo 1: Criar Organizações de Teste

```sql
-- Conectar ao banco
psql -h localhost -U postgres -d tatuticket

-- Criar duas organizações
INSERT INTO organizations (id, name, slug, type, is_active, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Empresa Alpha', 'empresa-alpha', 'tenant', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Empresa Beta', 'empresa-beta', 'tenant', true, NOW(), NOW());
```

### Passo 2: Criar Usuário com Mesmo Email em Ambas

```sql
-- Criar usuário João como Admin na Empresa Alpha
INSERT INTO organization_users (
  id, organization_id, name, email, password, role, is_active, created_at, updated_at
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'João Silva',
  'joao.teste@example.com',
  '$2b$10$YourHashedPasswordHere1', -- Senha: "senha123"
  'org-admin',
  true,
  NOW(),
  NOW()
);

-- Criar mesmo usuário João como Agente na Empresa Beta
INSERT INTO organization_users (
  id, organization_id, name, email, password, role, is_active, created_at, updated_at
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'João Silva',
  'joao.teste@example.com',
  '$2b$10$YourHashedPasswordHere2', -- Senha: "outrasenha456"
  'agent',
  true,
  NOW(),
  NOW()
);
```

**Nota**: Para gerar hashes de senha reais, use:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('senha123', 10);
console.log(hash);
```

### Passo 3: Testar Login com Múltiplos Contextos

#### Via API (cURL)

```bash
# Login - deve retornar múltiplos contextos
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.teste@example.com",
    "password": "senha123"
  }'
```

**Resposta Esperada:**
```json
{
  "requiresContextSelection": true,
  "contexts": [
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "type": "organization",
      "userType": "organization",
      "contextId": "11111111-1111-1111-1111-111111111111",
      "contextType": "organization",
      "organizationId": "11111111-1111-1111-1111-111111111111",
      "organizationName": "Empresa Alpha",
      "organizationSlug": "empresa-alpha",
      "email": "joao.teste@example.com",
      "name": "João Silva",
      "role": "org-admin",
      "isLastUsed": false,
      "isPreferred": false
    }
  ]
}
```

**Nota**: Apenas o contexto com senha "senha123" será retornado. Para ver o contexto da Empresa Beta, use "outrasenha456".

### Passo 4: Selecionar Contexto

```bash
# Selecionar contexto da Empresa Alpha
curl -X POST http://localhost:4003/api/auth/select-context \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.teste@example.com",
    "password": "senha123",
    "contextId": "11111111-1111-1111-1111-111111111111",
    "contextType": "organization"
  }'
```

**Resposta Esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "33333333-3333-3333-3333-333333333333",
    "name": "João Silva",
    "email": "joao.teste@example.com",
    "role": "org-admin",
    "organizationId": "11111111-1111-1111-1111-111111111111"
  },
  "context": {
    "contextId": "11111111-1111-1111-1111-111111111111",
    "contextType": "organization",
    "organizationName": "Empresa Alpha"
  }
}
```

### Passo 5: Verificar Sessão Criada

```sql
-- Ver sessões ativas
SELECT 
  id,
  user_id,
  user_type,
  context_id,
  context_type,
  is_active,
  last_activity_at,
  expires_at,
  created_at
FROM context_sessions
WHERE is_active = true
ORDER BY created_at DESC;
```

### Passo 6: Verificar Audit Log

```sql
-- Ver logs de auditoria
SELECT 
  id,
  user_email,
  user_type,
  action,
  to_context_id,
  to_context_type,
  success,
  created_at
FROM context_audit_logs
ORDER BY created_at DESC;
```

## 🧪 Cenário de Teste 2: Troca de Contexto Durante Sessão

### Passo 1: Obter Token do Contexto Atual

Use o token obtido no Cenário 1, Passo 4.

### Passo 2: Listar Contextos Disponíveis

```bash
curl -X GET http://localhost:4003/api/auth/contexts \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta Esperada:**
```json
{
  "contexts": [
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "type": "organization",
      "organizationName": "Empresa Alpha",
      "role": "org-admin",
      "isLastUsed": true
    },
    {
      "id": "44444444-4444-4444-4444-444444444444",
      "type": "organization",
      "organizationName": "Empresa Beta",
      "role": "agent",
      "isLastUsed": false
    }
  ],
  "currentContext": {
    "contextId": "11111111-1111-1111-1111-111111111111",
    "contextType": "organization"
  }
}
```

### Passo 3: Trocar para Outro Contexto

```bash
curl -X POST http://localhost:4003/api/auth/switch-context \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "contextId": "22222222-2222-2222-2222-222222222222",
    "contextType": "organization"
  }'
```

**Resposta Esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Novo token
  "user": {
    "id": "44444444-4444-4444-4444-444444444444",
    "name": "João Silva",
    "email": "joao.teste@example.com",
    "role": "agent",
    "organizationId": "22222222-2222-2222-2222-222222222222"
  },
  "context": {
    "contextId": "22222222-2222-2222-2222-222222222222",
    "contextType": "organization",
    "organizationName": "Empresa Beta"
  }
}
```

### Passo 4: Verificar Sessão Anterior Invalidada

```sql
-- Ver que sessão anterior foi invalidada
SELECT 
  id,
  user_id,
  context_id,
  is_active,
  last_activity_at
FROM context_sessions
WHERE user_id IN (
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
)
ORDER BY created_at DESC;
```

### Passo 5: Verificar Log de Troca de Contexto

```sql
-- Ver log da troca
SELECT 
  user_email,
  action,
  from_context_id,
  to_context_id,
  success,
  created_at
FROM context_audit_logs
WHERE action = 'context_switch'
ORDER BY created_at DESC
LIMIT 1;
```

## 🎨 Teste via Interface (Portal Organização)

### Passo 1: Acessar Portal

1. Abrir navegador em `http://localhost:5173`
2. Fazer login com `joao.teste@example.com` e senha `senha123`

### Passo 2: Verificar Seletor de Contexto

- Deve aparecer um modal/componente `ContextSelector`
- Deve listar "Empresa Alpha" com role "Admin"
- Selecionar contexto desejado

### Passo 3: Verificar Header

- No header, deve aparecer o `ContextSwitcher`
- Deve mostrar contexto atual: "Empresa Alpha"
- Clicar no switcher deve mostrar dropdown com contextos disponíveis

### Passo 4: Trocar Contexto

1. Clicar no `ContextSwitcher` no header
2. Selecionar "Empresa Beta"
3. Sistema deve:
   - Invalidar sessão atual
   - Criar nova sessão
   - Atualizar token
   - Recarregar página com novo contexto

## 🔍 Verificações de Segurança

### Teste 1: Validação de Contexto em APIs

```bash
# Obter token do contexto Empresa Alpha
TOKEN_ALPHA="seu_token_empresa_alpha"

# Tentar acessar recurso da Empresa Beta (deve falhar)
curl -X GET http://localhost:4003/api/tickets?organizationId=22222222-2222-2222-2222-222222222222 \
  -H "Authorization: Bearer $TOKEN_ALPHA"
```

**Resposta Esperada:** 403 Forbidden

### Teste 2: Sessão Expirada

```bash
# Aguardar 8 horas ou modificar expires_at no banco
UPDATE context_sessions 
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE session_token = 'seu_token';

# Tentar usar token expirado
curl -X GET http://localhost:4003/api/auth/contexts \
  -H "Authorization: Bearer SEU_TOKEN_EXPIRADO"
```

**Resposta Esperada:** 401 Unauthorized

### Teste 3: Token Inválido

```bash
curl -X GET http://localhost:4003/api/auth/contexts \
  -H "Authorization: Bearer token_invalido_123"
```

**Resposta Esperada:** 401 Unauthorized

## 📊 Queries Úteis para Debugging

### Ver Todas as Sessões Ativas

```sql
SELECT 
  cs.id,
  cs.user_id,
  ou.name as user_name,
  ou.email,
  o.name as organization_name,
  cs.is_active,
  cs.last_activity_at,
  cs.expires_at,
  cs.created_at
FROM context_sessions cs
JOIN organization_users ou ON cs.user_id = ou.id
JOIN organizations o ON cs.context_id = o.id
WHERE cs.is_active = true
ORDER BY cs.created_at DESC;
```

### Ver Histórico de Trocas de Contexto

```sql
SELECT 
  cal.user_email,
  cal.action,
  o1.name as from_organization,
  o2.name as to_organization,
  cal.success,
  cal.created_at
FROM context_audit_logs cal
LEFT JOIN organizations o1 ON cal.from_context_id = o1.id
LEFT JOIN organizations o2 ON cal.to_context_id = o2.id
WHERE cal.action = 'context_switch'
ORDER BY cal.created_at DESC;
```

### Ver Usuários com Múltiplos Contextos

```sql
SELECT 
  email,
  COUNT(*) as num_contexts,
  STRING_AGG(o.name, ', ') as organizations,
  STRING_AGG(role::text, ', ') as roles
FROM organization_users ou
JOIN organizations o ON ou.organization_id = o.id
WHERE ou.is_active = true
GROUP BY email
HAVING COUNT(*) > 1;
```

## 🎉 Resultado Esperado

Após executar todos os testes:

✅ Usuário pode ter mesmo email em múltiplas organizações
✅ Login detecta múltiplos contextos automaticamente
✅ Seleção de contexto funciona corretamente
✅ Troca de contexto invalida sessão anterior
✅ Nova sessão é criada com permissões corretas
✅ Audit logs registram todas as ações
✅ Validação de contexto impede acesso cross-context
✅ Sessões expiram após 8 horas
✅ Interface mostra contexto atual e permite troca

## 🐛 Troubleshooting

### Problema: "requiresContextSelection" não aparece

**Causa**: Apenas um contexto encontrado ou senha incorreta

**Solução**: 
- Verificar se existem múltiplos registros com mesmo email
- Verificar se senha está correta para ambos os contextos

### Problema: Erro "context_sessions does not exist"

**Causa**: Migrações não foram executadas

**Solução**:
```bash
cd backend
node src/scripts/run-context-migrations.js
```

### Problema: Token não valida contexto

**Causa**: Middleware não aplicado nas rotas

**Solução**: Verificar se rotas incluem `validateContext` middleware

### Problema: Sessão não expira

**Causa**: Job de limpeza não está rodando

**Solução**: Verificar se `cleanupExpiredSessions.js` está sendo executado no startup do servidor

## 📝 Notas Importantes

1. **Senhas Diferentes**: Cada contexto pode ter senha diferente
2. **Sessões Isoladas**: Cada contexto tem sessão independente
3. **Permissões Isoladas**: Permissões são carregadas por contexto
4. **Audit Completo**: Todas as ações são registradas
5. **Expiração**: Sessões expiram após 8 horas de inatividade

## 🚀 Próximos Passos

Após validar que o sistema funciona para organizações:

1. Criar tabelas `clients` e `client_users`
2. Executar migração de constraints
3. Testar multi-contexto para clientes B2B
4. Testar usuário híbrido (organização + cliente)

Ver `STATUS-MULTI-CONTEXT-IMPLEMENTATION.md` para detalhes.
