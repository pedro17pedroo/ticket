# Correção do Bug de Seleção de Contexto

## 📋 Resumo

Bug crítico identificado e corrigido no fluxo de seleção de contexto multi-tenant. O frontend estava enviando `userId` como `contextId`, mas o backend esperava `organizationId` ou `clientId`.

## 🐛 Problema Identificado

### Sintoma
- Usuário fazia login com `multicontext@test.com`
- Sistema detectava 3 contextos disponíveis corretamente
- Ao selecionar um contexto, recebia erro: **"Acesso negado"**

### Causa Raiz
O frontend estava enviando o campo errado para o backend:

**Frontend (ANTES):**
```javascript
// Login.jsx - linha 169
const response = await authService.selectContext(
  loginCredentials.email,
  loginCredentials.password,
  context.id,        // ❌ ERRADO: Enviava userId
  context.type       // ❌ ERRADO: Enviava 'organization' ou 'client'
)
```

**Backend esperava:**
```javascript
// authController.js - selectContext
const { email, password, contextId, contextType } = req.body;

// contextService.js - validateContextAccess
if (contextType === 'organization') {
  const orgUser = await OrganizationUser.findOne({
    where: {
      email,
      organizationId: contextId,  // ❌ Buscava por organizationId, mas recebia userId
      isActive: true
    }
  });
}
```

### Evidência nos Logs
```
Context selection attempt: multicontext@test.com Context: organization 3314a47e-cdb9-4db8-976f-ea1abed36644
WHERE "OrganizationUser"."organization_id" = '3314a47e-cdb9-4db8-976f-ea1abed36644'
❌ Context access denied or not found
```

O UUID `3314a47e-cdb9-4db8-976f-ea1abed36644` era o `userId` (id do organization_user), não o `organizationId`.

## ✅ Solução Implementada

### Correção no Frontend

Modificado para enviar os campos corretos do objeto `context`:

**Portal Organização (`portalOrganizaçãoTenant/src/pages/Login.jsx`):**
```javascript
// DEPOIS (CORRETO):
const response = await authService.selectContext(
  loginCredentials.email,
  loginCredentials.password,
  context.contextId,     // ✅ CORRETO: Envia organizationId ou clientId
  context.contextType    // ✅ CORRETO: Envia 'organization' ou 'client'
)
```

**Portal Cliente (`portalClientEmpresa/src/pages/Login.jsx`):**
```javascript
// DEPOIS (CORRETO):
const response = await authService.selectContext(
  loginCredentials.email,
  loginCredentials.password,
  context.contextId,     // ✅ CORRETO: Envia organizationId ou clientId
  context.contextType    // ✅ CORRETO: Envia 'organization' ou 'client'
)
```

### Estrutura do Objeto Context

O objeto `context` retornado pelo backend tem a seguinte estrutura:

```javascript
{
  id: "3314a47e-cdb9-4db8-976f-ea1abed36644",           // userId (organization_user.id)
  type: "organization",                                  // Tipo simplificado
  userId: "3314a47e-cdb9-4db8-976f-ea1abed36644",       // userId (organization_user.id)
  userType: "organization",                              // Tipo do usuário
  contextId: "f8e7d6c5-b4a3-9281-7069-584736251940",    // organizationId ✅
  contextType: "organization",                           // Tipo do contexto ✅
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
```

**Campos importantes:**
- `context.id` = `userId` (id do organization_user ou client_user)
- `context.contextId` = `organizationId` ou `clientId` (o que o backend precisa)
- `context.contextType` = `'organization'` ou `'client'` (tipo correto)

## 📁 Arquivos Modificados

1. **portalOrganizaçãoTenant/src/pages/Login.jsx**
   - Linha ~169: Corrigido `context.id` → `context.contextId`
   - Linha ~169: Corrigido `context.type` → `context.contextType`

2. **portalClientEmpresa/src/pages/Login.jsx**
   - Linha ~145: Corrigido `context.id` → `context.contextId`
   - Linha ~145: Corrigido `context.type` → `context.contextType`

## 🧪 Como Testar

### 1. Preparar Dados de Teste
```bash
cd backend
node src/scripts/create-multi-context-test-data.js
```

### 2. Testar via Browser

**Credenciais:**
- Email: `multicontext@test.com`
- Senha: `Test@123`

**Fluxo esperado:**
1. Acessar `http://localhost:5173` (Portal Organização)
2. Fazer login com as credenciais acima
3. Sistema deve mostrar 3 contextos disponíveis:
   - Alpha Organization (org-admin)
   - Beta Organization (agent)
   - Gamma Client (client-admin)
4. Selecionar qualquer contexto
5. ✅ Login deve ser bem-sucedido
6. ✅ Usuário deve ser redirecionado para o dashboard correto

### 3. Testar Troca de Contexto

1. Após login, clicar no seletor de contexto no header
2. Selecionar outro contexto disponível
3. ✅ Troca deve ser bem-sucedida
4. ✅ Interface deve atualizar com dados do novo contexto

### 4. Testar Cross-Portal Redirect

1. Login no Portal Organização com contexto de cliente
2. ✅ Deve redirecionar para `http://localhost:5174` (Portal Cliente)

3. Login no Portal Cliente com contexto de organização
4. ✅ Deve redirecionar para `http://localhost:5173` (Portal Organização)

## 🔍 Verificação de Logs

### Logs Esperados (SUCESSO)

```
🔐 Login attempt: multicontext@test.com Portal: organization
✅ Found 3 available context(s) for multicontext@test.com
🔀 Multiple contexts available, requiring selection

🔀 Context selection attempt: multicontext@test.com Context: organization f8e7d6c5-b4a3-9281-7069-584736251940
✅ Context access validated, creating session
✅ Permissões carregadas: []
✅ Sessão de contexto criada: { sessionId: '...', userId: '...', contextId: '...' }
Contexto selecionado: multicontext@test.com (organization) - organization:f8e7d6c5-b4a3-9281-7069-584736251940
```

### Logs Anteriores (ERRO)

```
🔀 Context selection attempt: multicontext@test.com Context: organization 3314a47e-cdb9-4db8-976f-ea1abed36644
WHERE "OrganizationUser"."organization_id" = '3314a47e-cdb9-4db8-976f-ea1abed36644'
❌ Context access denied or not found
```

## 📊 Status da Implementação

### ✅ Completo
- [x] Bug identificado e diagnosticado
- [x] Correção aplicada no Portal Organização
- [x] Correção aplicada no Portal Cliente
- [x] Documentação criada
- [x] Fluxo de teste documentado

### 🧪 Pendente de Teste
- [ ] Teste manual via browser
- [ ] Verificação de logs no backend
- [ ] Teste de troca de contexto
- [ ] Teste de cross-portal redirect
- [ ] Validação de auditoria de contexto

## 🎯 Próximos Passos

1. **Testar no Browser**
   - Iniciar backend: `cd backend && npm run dev`
   - Iniciar Portal Org: `cd portalOrganizaçãoTenant && npm run dev`
   - Iniciar Portal Cliente: `cd portalClientEmpresa && npm run dev`
   - Fazer login com `multicontext@test.com` / `Test@123`

2. **Verificar Logs**
   - Monitorar console do backend
   - Verificar que `contextId` agora é o `organizationId` correto
   - Confirmar que busca no banco retorna resultados

3. **Validar Funcionalidades**
   - Seleção de contexto funciona
   - Troca de contexto no header funciona
   - Cross-portal redirect funciona
   - Auditoria registra trocas corretamente

## 📝 Notas Técnicas

### Por que não modificar o backend?

Consideramos duas opções:

**Opção 1: Modificar Frontend (ESCOLHIDA)**
- ✅ Mais simples e direto
- ✅ Mantém API consistente
- ✅ Backend já está correto
- ✅ Apenas 2 linhas de código alteradas

**Opção 2: Modificar Backend**
- ❌ Mais complexo
- ❌ Requer mudanças em `contextService.validateContextAccess`
- ❌ Pode introduzir novos bugs
- ❌ API ficaria menos clara

### Lições Aprendidas

1. **Sempre verificar estrutura de dados**: O objeto `context` tinha múltiplos IDs com propósitos diferentes
2. **Logs são essenciais**: Os logs mostraram exatamente qual UUID estava sendo usado
3. **Nomenclatura importa**: `context.id` vs `context.contextId` causou confusão
4. **Testar fluxo completo**: Script de teste validou backend, mas não frontend

## 🔗 Referências

- **Documentação API**: `backend/docs/API-CONTEXT-SWITCHING.md`
- **Status Implementação**: `STATUS-MULTI-CONTEXT-FINAL.md`
- **Script de Teste**: `backend/src/scripts/test-multi-context-login.js`
- **Dados de Teste**: `backend/src/scripts/create-multi-context-test-data.js`

---

**Data da Correção**: 2026-03-02  
**Autor**: Kiro AI Assistant  
**Status**: ✅ Correção Aplicada - Pendente de Teste Manual
