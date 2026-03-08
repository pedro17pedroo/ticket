# Guia de Teste: Validação da Correção do Bug

**Objetivo**: Validar que a correção do bug de seleção de contexto está funcionando corretamente.

---

## 🚀 Pré-requisitos

1. **Backend rodando**: `cd backend && npm run dev` (porta 4003)
2. **Portal Organização rodando**: `cd portalOrganizaçãoTenant && npm run dev` (porta 5173)
3. **Portal Cliente rodando**: `cd portalClientEmpresa && npm run dev` (porta 5174)
4. **Dados de teste criados**: `node backend/src/scripts/create-multi-context-test-data.js`

---

## ✅ Teste 1: Login com Múltiplos Contextos (Portal Organização)

### Passos:
1. Abrir `http://localhost:5173`
2. Fazer login:
   - Email: `multicontext@test.com`
   - Senha: `Test@123`
3. **Resultado esperado**: Deve mostrar tela de seleção de contexto com 3 opções:
   - Alpha Organization (org-admin)
   - Beta Organization (agent)
   - Gamma Client (client-admin)

### Validação:
- [ ] Tela de seleção aparece
- [ ] 3 contextos são exibidos
- [ ] Contextos mostram nome e role corretos

---

## ✅ Teste 2: Seleção de Contexto de Organização

### Passos:
1. Na tela de seleção, clicar em **"Alpha Organization"**
2. **Resultado esperado**: 
   - Login bem-sucedido
   - Redirecionamento para dashboard
   - Header mostra "Alpha Organization"
   - Sem erro "Acesso negado"

### Validação:
- [ ] Login bem-sucedido
- [ ] Dashboard carrega
- [ ] Header mostra organização correta
- [ ] Nenhum erro no console

### Logs Esperados (Backend):
```
🔀 Context selection attempt: multicontext@test.com Context: organization [UUID-da-org]
✅ Context access validated, creating session
✅ Sessão de contexto criada
Contexto selecionado: multicontext@test.com (organization) - organization:[UUID]
```

---

## ✅ Teste 3: Seleção de Contexto de Cliente (Cross-Portal)

### Passos:
1. Fazer logout
2. Fazer login novamente com `multicontext@test.com` / `Test@123`
3. Na tela de seleção, clicar em **"Gamma Client"**
4. **Resultado esperado**:
   - Login bem-sucedido
   - Redirecionamento para `http://localhost:5174` (Portal Cliente)
   - Header mostra "Gamma Client"

### Validação:
- [ ] Login bem-sucedido
- [ ] Redirecionamento para porta 5174
- [ ] Portal Cliente carrega
- [ ] Header mostra cliente correto
- [ ] Nenhum erro no console

---

## ✅ Teste 4: Troca de Contexto no Header

### Passos:
1. Após login em qualquer contexto
2. Clicar no seletor de contexto no header (canto superior direito)
3. Selecionar outro contexto disponível
4. **Resultado esperado**:
   - Troca bem-sucedida
   - Interface atualiza com novo contexto
   - Se trocar de tipo (org ↔ client), redireciona para portal correto

### Validação:
- [ ] Seletor de contexto abre
- [ ] Lista todos os contextos disponíveis
- [ ] Troca funciona sem erro
- [ ] Interface atualiza corretamente
- [ ] Cross-portal redirect funciona (se aplicável)

---

## ✅ Teste 5: Validação de Logs de Auditoria

### Passos:
1. Após realizar login e trocas de contexto
2. Verificar logs no banco de dados:

```sql
-- Ver sessões ativas
SELECT 
  id, 
  user_type, 
  context_type, 
  context_id, 
  is_active, 
  created_at 
FROM context_sessions 
WHERE is_active = true 
ORDER BY created_at DESC;

-- Ver audit logs
SELECT 
  user_email, 
  action, 
  from_context_type, 
  to_context_type, 
  success, 
  created_at 
FROM context_audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Validação:
- [ ] Sessões criadas corretamente
- [ ] Audit logs registram todas as ações
- [ ] IP e User Agent estão presentes
- [ ] Timestamps corretos

---

## ✅ Teste 6: Login no Portal Cliente

### Passos:
1. Abrir `http://localhost:5174`
2. Fazer login:
   - Email: `multicontext@test.com`
   - Senha: `Test@123`
3. Selecionar contexto de cliente (Gamma Client)
4. **Resultado esperado**: Login bem-sucedido no Portal Cliente

### Validação:
- [ ] Tela de seleção aparece
- [ ] Seleção de cliente funciona
- [ ] Dashboard do cliente carrega
- [ ] Nenhum erro

---

## ✅ Teste 7: Validação de Erros

### Teste 7.1: Senha Incorreta
1. Tentar login com senha errada
2. **Resultado esperado**: Erro "Credenciais inválidas"

### Teste 7.2: Email Inexistente
1. Tentar login com email que não existe
2. **Resultado esperado**: Erro "Credenciais inválidas"

### Teste 7.3: Contexto Inválido
1. Tentar selecionar contexto que não pertence ao usuário (via API)
2. **Resultado esperado**: Erro "Acesso negado"

### Validação:
- [ ] Erros são tratados corretamente
- [ ] Mensagens de erro são claras
- [ ] Nenhum crash ou erro 500

---

## 🔍 Checklist de Validação Final

### Frontend
- [ ] ContextSelector renderiza corretamente
- [ ] Seleção de contexto funciona
- [ ] Troca de contexto funciona
- [ ] Cross-portal redirect funciona
- [ ] Erros são tratados
- [ ] Loading states funcionam

### Backend
- [ ] Endpoint `/auth/login` retorna contextos
- [ ] Endpoint `/auth/select-context` aceita contextId correto
- [ ] Endpoint `/auth/switch-context` funciona
- [ ] Sessões são criadas corretamente
- [ ] Audit logs são registrados
- [ ] Validações de segurança funcionam

### Database
- [ ] Sessões são criadas em `context_sessions`
- [ ] Audit logs são criados em `context_audit_logs`
- [ ] Dados estão consistentes
- [ ] Constraints são respeitadas

---

## 📊 Critérios de Sucesso

Para considerar a correção validada, TODOS os testes acima devem passar:

- ✅ Login com múltiplos contextos funciona
- ✅ Seleção de contexto funciona sem erro "Acesso negado"
- ✅ Troca de contexto funciona
- ✅ Cross-portal redirect funciona
- ✅ Audit logs são registrados
- ✅ Erros são tratados corretamente

---

## 🐛 Troubleshooting

### Erro "Acesso negado" ainda aparece

**Verificar**:
1. Código foi atualizado corretamente?
   ```bash
   grep -n "context.contextId" portalOrganizaçãoTenant/src/pages/Login.jsx
   grep -n "context.contextType" portalOrganizaçãoTenant/src/pages/Login.jsx
   ```
2. Frontend foi reiniciado após mudança?
3. Cache do browser foi limpo?

### Contextos não aparecem

**Verificar**:
1. Dados de teste foram criados?
   ```bash
   node backend/src/scripts/create-multi-context-test-data.js
   ```
2. Backend está rodando?
3. Credenciais estão corretas?

### Erro 500 no backend

**Verificar**:
1. Logs do backend: `tail -f backend/logs/combined.log`
2. Database está acessível?
3. Tabelas existem?
   ```sql
   \dt context_*
   ```

---

## 📝 Relatório de Teste

Após executar todos os testes, preencher:

**Data do Teste**: _______________  
**Testador**: _______________  
**Ambiente**: Local / Staging / Produção

**Resultados**:
- [ ] Todos os testes passaram
- [ ] Alguns testes falharam (especificar abaixo)
- [ ] Testes não puderam ser executados (especificar motivo)

**Observações**:
```
[Escrever observações aqui]
```

**Bugs Encontrados**:
```
[Listar bugs encontrados, se houver]
```

**Conclusão**:
- [ ] ✅ Correção validada - Sistema pronto para produção
- [ ] ⚠️ Correção parcial - Requer ajustes
- [ ] ❌ Correção não funciona - Requer investigação

---

**Próximo Passo**: Se todos os testes passarem, sistema está pronto para deploy em produção! 🚀
