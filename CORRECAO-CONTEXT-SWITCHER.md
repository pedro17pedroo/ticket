# Correção: ContextSwitcher - Filtro de Contextos e Bug de IDs

**Data**: 02 de Março de 2026  
**Status**: ✅ CORRIGIDO

---

## 🐛 Problemas Identificados

### Problema 1: Contextos de Cliente Aparecem no Portal de Organização
**Sintoma**: No Portal de Organização, o ContextSwitcher mostrava contextos de empresas clientes, causando erro ao tentar trocar.

**Causa**: O componente não filtrava os contextos por tipo de portal.

### Problema 2: Troca de Contexto Enviava userId em vez de organizationId
**Sintoma**: Ao clicar para trocar contexto, recebia erro "Acesso negado".

**Causa**: Mesmo bug do login - enviava `context.id` (userId) em vez de `context.contextId` (organizationId).

**Logs do erro**:
```
debug: 🔄 Context switch attempt: multicontext@test.com To: organization 3314a47e-cdb9-4db8-976f-ea1abed36644
debug: ❌ Context access denied or not found
```

---

## ✅ Soluções Implementadas

### Correção 1: Filtro de Contextos por Portal

**Portal Organização** (`portalOrganizaçãoTenant/src/components/ContextSwitcher.jsx`):
```javascript
// ANTES
const fetchContexts = async () => {
  const response = await api.get('/auth/contexts');
  setContexts(response.data.contexts || []);
};

// DEPOIS
const fetchContexts = async () => {
  const response = await api.get('/auth/contexts');
  // Filter contexts: only show organizations in organization portal
  const allContexts = response.data.contexts || [];
  const filteredContexts = allContexts.filter(ctx => ctx.contextType === 'organization');
  setContexts(filteredContexts);
};
```

**Portal Cliente** (`portalClientEmpresa/src/components/ContextSwitcher.jsx`):
```javascript
// DEPOIS
const fetchContexts = async () => {
  const response = await api.get('/auth/contexts');
  // Filter contexts: only show clients in client portal
  const allContexts = response.data.contexts || [];
  const filteredContexts = allContexts.filter(ctx => ctx.contextType === 'client');
  setContexts(filteredContexts);
};
```

### Correção 2: Enviar IDs Corretos na Troca de Contexto

**Ambos Portais**:
```javascript
// ANTES (ERRADO)
const handleContextSwitch = async (context) => {
  const response = await api.post('/auth/switch-context', {
    contextId: context.id,        // ❌ userId
    contextType: context.type     // ❌ tipo simplificado
  });
};

// DEPOIS (CORRETO)
const handleContextSwitch = async (context) => {
  const response = await api.post('/auth/switch-context', {
    contextId: context.contextId,     // ✅ organizationId ou clientId
    contextType: context.contextType  // ✅ 'organization' ou 'client'
  });
};
```

---

## 📊 Comportamento Esperado

### Portal de Organização
- **Mostra**: Apenas contextos de organizações
- **Esconde**: Contextos de empresas clientes
- **Troca**: Permite trocar entre organizações do mesmo usuário
- **Redirect**: Não há redirect (permanece no mesmo portal)

### Portal Cliente
- **Mostra**: Apenas contextos de empresas clientes
- **Esconde**: Contextos de organizações
- **Troca**: Permite trocar entre empresas clientes do mesmo usuário
- **Redirect**: Não há redirect (permanece no mesmo portal)

### Cross-Portal (Login)
- **Login no Portal Org com contexto de cliente**: Redireciona para Portal Cliente
- **Login no Portal Cliente com contexto de org**: Redireciona para Portal Organização

---

## 🧪 Como Testar

### Teste 1: Portal Organização - Filtro de Contextos

1. Login no Portal Organização: `http://localhost:5173`
   - Email: `multicontext@test.com`
   - Senha: `Test@123`
2. Selecionar contexto de organização (Alpha ou Beta)
3. Clicar no ContextSwitcher no header
4. **Resultado esperado**: 
   - ✅ Deve mostrar APENAS as 2 organizações (Alpha e Beta)
   - ✅ NÃO deve mostrar a empresa cliente (Gamma)

### Teste 2: Portal Organização - Troca de Contexto

1. No ContextSwitcher, clicar na outra organização
2. **Resultado esperado**:
   - ✅ Troca bem-sucedida
   - ✅ Página recarrega
   - ✅ Header mostra nova organização
   - ✅ Nenhum erro "Acesso negado"

### Teste 3: Portal Cliente - Filtro de Contextos

1. Login no Portal Cliente: `http://localhost:5174`
   - Email: `multicontext@test.com`
   - Senha: `Test@123`
2. Selecionar contexto de cliente (Gamma)
3. Clicar no ContextSwitcher no header
4. **Resultado esperado**:
   - ✅ Deve mostrar APENAS a empresa cliente (Gamma)
   - ✅ NÃO deve mostrar as organizações (Alpha e Beta)
   - ✅ Pode mostrar "Nenhum contexto adicional disponível" (se só tem 1 cliente)

### Teste 4: Logs do Backend

**Logs esperados (SUCESSO)**:
```
debug: 🔄 Context switch attempt: multicontext@test.com To: organization [UUID-da-org]
debug: ✅ New context access validated
debug: ✅ New session created: [session-id]
info: Troca de contexto: multicontext@test.com de organization:[UUID1] para organization:[UUID2]
```

**Logs anteriores (ERRO)**:
```
debug: 🔄 Context switch attempt: multicontext@test.com To: organization 3314a47e-cdb9-4db8-976f-ea1abed36644
debug: ❌ Context access denied or not found
```

---

## 📁 Arquivos Modificados

1. **portalOrganizaçãoTenant/src/components/ContextSwitcher.jsx**
   - Linha ~48: Adicionado filtro `ctx.contextType === 'organization'`
   - Linha ~76: Corrigido `context.id` → `context.contextId`
   - Linha ~76: Corrigido `context.type` → `context.contextType`

2. **portalClientEmpresa/src/components/ContextSwitcher.jsx**
   - Linha ~48: Adicionado filtro `ctx.contextType === 'client'`
   - Linha ~76: Corrigido `context.id` → `context.contextId`
   - Linha ~76: Corrigido `context.type` → `context.contextType`

---

## 🎯 Impacto

### Problema 1 (Filtro)
- **Severidade**: Média (causava confusão e erro)
- **Usuários afetados**: Todos com múltiplos contextos
- **Complexidade**: Baixa (1 linha por arquivo)
- **Risco**: Baixo (apenas filtro de exibição)

### Problema 2 (IDs)
- **Severidade**: Alta (bloqueava troca de contexto)
- **Usuários afetados**: 100% tentando trocar contexto
- **Complexidade**: Baixa (2 linhas por arquivo)
- **Risco**: Baixo (mesma correção do login)

---

## 🔗 Relação com Correções Anteriores

Esta correção é complementar à correção do bug de login:
- **Login**: Corrigido em `Login.jsx` (ambos portais)
- **Troca de Contexto**: Corrigido em `ContextSwitcher.jsx` (ambos portais)

Ambos tinham o mesmo problema: enviar `context.id` em vez de `context.contextId`.

---

## 📝 Notas Técnicas

### Por que filtrar no frontend?

Poderíamos filtrar no backend, mas optamos por filtrar no frontend porque:
1. **Flexibilidade**: Backend retorna todos os contextos (útil para outros casos)
2. **Simplicidade**: Filtro simples no frontend
3. **Performance**: Não adiciona carga ao backend
4. **Manutenibilidade**: Lógica de UI fica no frontend

### Estrutura do Objeto Context

```javascript
{
  id: "uuid-do-usuario",              // userId (não usar para switch)
  userId: "uuid-do-usuario",          // userId (não usar para switch)
  contextId: "uuid-da-organizacao",   // ✅ USAR ESTE para switch
  contextType: "organization",        // ✅ USAR ESTE para switch
  type: "organization",               // Tipo simplificado (não usar)
  organizationId: "uuid-da-organizacao",
  organizationName: "Nome da Org",
  // ... outros campos
}
```

---

## ✅ Checklist de Validação

- [x] Código corrigido em ambos portais
- [x] Filtro de contextos implementado
- [x] IDs corretos sendo enviados
- [x] Nenhum diagnóstico de erro
- [ ] Teste manual no Portal Organização
- [ ] Teste manual no Portal Cliente
- [ ] Validação de logs do backend
- [ ] Teste de troca entre organizações
- [ ] Teste de troca entre clientes

---

## 🚀 Próximos Passos

1. **Testar no browser**:
   - Iniciar servidores (backend + ambos portais)
   - Fazer login com `multicontext@test.com`
   - Verificar filtro de contextos
   - Testar troca de contexto

2. **Validar logs**:
   - Monitorar console do backend
   - Confirmar que `contextId` correto é usado
   - Verificar que troca é bem-sucedida

3. **Documentar resultados**:
   - Preencher checklist acima
   - Criar relatório de teste
   - Atualizar status geral

---

**Sistema agora deve permitir troca de contexto corretamente, mostrando apenas contextos apropriados para cada portal!** 🎉

---

**Autor**: Kiro AI Assistant  
**Data**: 02 de Março de 2026  
**Versão**: 1.0
