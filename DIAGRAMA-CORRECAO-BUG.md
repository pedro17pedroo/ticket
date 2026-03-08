# Diagrama: Correção do Bug de Seleção de Contexto

## 🔴 ANTES (COM BUG)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUXO COM BUG                            │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN
   ┌──────────┐
   │ Frontend │ POST /auth/login
   │          │ { email, password }
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Backend  │ ✅ Encontra 3 contextos
   │          │ ✅ Retorna lista de contextos
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Frontend │ ✅ Mostra ContextSelector
   │          │ ✅ Usuário vê 3 opções
   └──────────┘

2. SELEÇÃO DE CONTEXTO (AQUI ESTAVA O BUG)
   ┌──────────┐
   │ Frontend │ POST /auth/select-context
   │          │ {
   │          │   email: "multicontext@test.com",
   │          │   password: "Test@123",
   │          │   contextId: "3314a47e-...",  ❌ ERRADO: userId
   │          │   contextType: "organization"
   │          │ }
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Backend  │ SELECT * FROM organization_users
   │          │ WHERE email = 'multicontext@test.com'
   │          │   AND organization_id = '3314a47e-...'  ❌ userId, não organizationId
   │          │   AND is_active = true
   │          │
   │          │ ❌ RESULTADO: Nenhum registro encontrado
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Frontend │ ❌ Erro: "Acesso negado"
   │          │ ❌ Login falha
   └──────────┘
```

---

## ✅ DEPOIS (CORRIGIDO)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUXO CORRIGIDO                             │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN
   ┌──────────┐
   │ Frontend │ POST /auth/login
   │          │ { email, password }
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Backend  │ ✅ Encontra 3 contextos
   │          │ ✅ Retorna lista de contextos
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Frontend │ ✅ Mostra ContextSelector
   │          │ ✅ Usuário vê 3 opções
   └──────────┘

2. SELEÇÃO DE CONTEXTO (CORRIGIDO)
   ┌──────────┐
   │ Frontend │ POST /auth/select-context
   │          │ {
   │          │   email: "multicontext@test.com",
   │          │   password: "Test@123",
   │          │   contextId: "f8e7d6c5-...",  ✅ CORRETO: organizationId
   │          │   contextType: "organization"
   │          │ }
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Backend  │ SELECT * FROM organization_users
   │          │ WHERE email = 'multicontext@test.com'
   │          │   AND organization_id = 'f8e7d6c5-...'  ✅ organizationId correto
   │          │   AND is_active = true
   │          │
   │          │ ✅ RESULTADO: Registro encontrado!
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Backend  │ ✅ Cria sessão de contexto
   │          │ ✅ Gera token JWT
   │          │ ✅ Registra audit log
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Frontend │ ✅ Login bem-sucedido
   │          │ ✅ Redireciona para dashboard
   └──────────┘
```

---

## 📊 Estrutura do Objeto Context

```javascript
┌─────────────────────────────────────────────────────────────────┐
│                    OBJETO CONTEXT                                │
└─────────────────────────────────────────────────────────────────┘

{
  // ❌ CAMPOS ERRADOS (não usar para select-context)
  id: "3314a47e-cdb9-4db8-976f-ea1abed36644",
  type: "organization",
  userId: "3314a47e-cdb9-4db8-976f-ea1abed36644",
  
  // ✅ CAMPOS CORRETOS (usar para select-context)
  contextId: "f8e7d6c5-b4a3-9281-7069-584736251940",     ← USAR ESTE
  contextType: "organization",                           ← USAR ESTE
  
  // Dados adicionais
  organizationId: "f8e7d6c5-b4a3-9281-7069-584736251940",
  organizationName: "Alpha Organization",
  organizationSlug: "alpha-org",
  email: "multicontext@test.com",
  name: "Multi Context User",
  role: "org-admin",
  permissions: [],
  avatar: null,
  isLastUsed: false,
  isPreferred: false
}

┌─────────────────────────────────────────────────────────────────┐
│                    MAPEAMENTO DE IDs                             │
└─────────────────────────────────────────────────────────────────┘

context.id           = organization_users.id        (userId)
context.userId       = organization_users.id        (userId)
context.contextId    = organizations.id             (organizationId) ✅
context.organizationId = organizations.id           (organizationId) ✅

Para CLIENTE:
context.id           = client_users.id              (userId)
context.userId       = client_users.id              (userId)
context.contextId    = clients.id                   (clientId) ✅
context.clientId     = clients.id                   (clientId) ✅
```

---

## 🔧 Mudança no Código

```javascript
┌─────────────────────────────────────────────────────────────────┐
│              ANTES (portalOrganizaçãoTenant)                     │
└─────────────────────────────────────────────────────────────────┘

const handleContextSelect = async (context) => {
  const response = await authService.selectContext(
    loginCredentials.email,
    loginCredentials.password,
    context.id,        // ❌ ERRADO: userId
    context.type       // ❌ ERRADO: tipo simplificado
  )
}

┌─────────────────────────────────────────────────────────────────┐
│              DEPOIS (portalOrganizaçãoTenant)                    │
└─────────────────────────────────────────────────────────────────┘

const handleContextSelect = async (context) => {
  const response = await authService.selectContext(
    loginCredentials.email,
    loginCredentials.password,
    context.contextId,     // ✅ CORRETO: organizationId ou clientId
    context.contextType    // ✅ CORRETO: 'organization' ou 'client'
  )
}

┌─────────────────────────────────────────────────────────────────┐
│                MESMA MUDANÇA NO PORTAL CLIENTE                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Queries no Banco de Dados

```sql
┌─────────────────────────────────────────────────────────────────┐
│                    QUERY COM BUG                                 │
└─────────────────────────────────────────────────────────────────┘

SELECT * FROM organization_users
WHERE email = 'multicontext@test.com'
  AND organization_id = '3314a47e-cdb9-4db8-976f-ea1abed36644'  ❌ userId
  AND is_active = true;

-- RESULTADO: 0 linhas (não encontra nada)

┌─────────────────────────────────────────────────────────────────┐
│                  QUERY CORRIGIDA                                 │
└─────────────────────────────────────────────────────────────────┘

SELECT * FROM organization_users
WHERE email = 'multicontext@test.com'
  AND organization_id = 'f8e7d6c5-b4a3-9281-7069-584736251940'  ✅ organizationId
  AND is_active = true;

-- RESULTADO: 1 linha (encontra o usuário!)
```

---

## 📈 Fluxo Completo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│              FLUXO COMPLETO: LOGIN → DASHBOARD                   │
└─────────────────────────────────────────────────────────────────┘

1. USUÁRIO DIGITA CREDENCIAIS
   ┌──────────────┐
   │ Login Form   │
   │ Email: multicontext@test.com
   │ Senha: Test@123
   └──────┬───────┘
          │
          ▼

2. BACKEND BUSCA CONTEXTOS
   ┌──────────────┐
   │ Database     │
   │ SELECT * FROM organization_users WHERE email = '...'
   │ SELECT * FROM client_users WHERE email = '...'
   │
   │ RETORNA:
   │ - Alpha Org (org-admin)     → contextId: f8e7d6c5-...
   │ - Beta Org (agent)          → contextId: a1b2c3d4-...
   │ - Gamma Client (client-admin) → contextId: e5f6g7h8-...
   └──────┬───────┘
          │
          ▼

3. USUÁRIO SELECIONA CONTEXTO
   ┌──────────────┐
   │ ContextSelector │
   │ [Alpha Org]  ← CLICA AQUI
   │ [Beta Org]
   │ [Gamma Client]
   └──────┬───────┘
          │
          ▼

4. FRONTEND ENVIA SELEÇÃO
   ┌──────────────┐
   │ API Call     │
   │ POST /auth/select-context
   │ {
   │   contextId: "f8e7d6c5-...",     ✅ organizationId da Alpha
   │   contextType: "organization"
   │ }
   └──────┬───────┘
          │
          ▼

5. BACKEND VALIDA E CRIA SESSÃO
   ┌──────────────┐
   │ Database     │
   │ 1. Valida acesso ao contexto     ✅
   │ 2. Cria sessão em context_sessions ✅
   │ 3. Registra em context_audit_logs  ✅
   │ 4. Gera token JWT                  ✅
   └──────┬───────┘
          │
          ▼

6. FRONTEND RECEBE TOKEN E REDIRECIONA
   ┌──────────────┐
   │ Dashboard    │
   │ Header: "Alpha Organization"
   │ Contexto ativo: org-admin
   │ ✅ LOGIN COMPLETO
   └──────────────┘
```

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                         RESUMO                                   │
└─────────────────────────────────────────────────────────────────┘

PROBLEMA:
  Frontend enviava:  context.id (userId)
  Backend esperava:  organizationId

SOLUÇÃO:
  Frontend agora envia: context.contextId (organizationId)

RESULTADO:
  ❌ ANTES: Erro "Acesso negado"
  ✅ DEPOIS: Login funciona perfeitamente

ARQUIVOS MODIFICADOS:
  1. portalOrganizaçãoTenant/src/pages/Login.jsx (linha ~169)
  2. portalClientEmpresa/src/pages/Login.jsx (linha ~145)

LINHAS ALTERADAS: 4 (2 por arquivo)
COMPLEXIDADE: Baixa
RISCO: Baixo
IMPACTO: Alto (corrige bug crítico)
```

---

## 📚 Referências Rápidas

- **Detalhes técnicos**: `CORRECAO-BUG-CONTEXT-SELECTION.md`
- **Como testar**: `TESTE-CORRECAO-BUG.md`
- **Quick start**: `PROXIMOS-PASSOS-TESTE.md`
- **Histórico**: `SESSAO-CORRECAO-BUG-CONTEXT.md`

---

**Este diagrama mostra visualmente o problema, a solução e o fluxo correto de dados!** 📊
