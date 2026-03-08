# 🚀 Guia de Teste Rápido - 5 Minutos

**Objetivo**: Validar que todas as correções estão funcionando

---

## ⚡ Passo 1: Iniciar Servidores (2 min)

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# ✅ Aguardar: "Server running on port 4003"

# Terminal 2 - Portal Organização
cd portalOrganizaçãoTenant
npm run dev
# ✅ Aguardar: "Local: http://localhost:5173"

# Terminal 3 - Portal Cliente (opcional)
cd portalClientEmpresa
npm run dev
# ✅ Aguardar: "Local: http://localhost:5174"
```

---

## 🧪 Passo 2: Testar Login (1 min)

### 2.1 Abrir Portal Organização
```
URL: http://localhost:5173
```

### 2.2 Fazer Login
```
Email: multicontext@test.com
Senha: Test@123
```

### 2.3 Verificar Seleção de Contexto
**✅ SUCESSO**: Mostra 3 contextos para selecionar
```
□ Organização Alpha (org-admin)
□ Organização Beta (agent)
□ Empresa Cliente Gamma (client-admin)
```

**❌ FALHA**: Se não mostrar contextos ou mostrar erro

---

## 🎯 Passo 3: Selecionar Contexto (30 seg)

### 3.1 Clicar em "Organização Alpha"

**✅ SUCESSO**:
- Login funciona sem erro
- Redireciona para dashboard
- Header mostra "Organização Alpha"
- Menus aparecem no sidebar
- Nenhum aviso de permissões

**❌ FALHA**: Se aparecer erro "Acesso negado"

---

## 🔄 Passo 4: Testar Troca de Contexto (1 min)

### 4.1 Clicar no ContextSwitcher no Header
(Ícone de troca no canto superior direito)

**✅ SUCESSO**: Mostra APENAS organizações
```
□ Organização Alpha (atual)
□ Organização Beta
```

**❌ FALHA**: Se mostrar "Empresa Cliente Gamma"

### 4.2 Clicar em "Organização Beta"

**✅ SUCESSO**:
- Troca sem erro
- Página recarrega
- Header mostra "Organização Beta"
- Nenhum erro no console

**❌ FALHA**: Se aparecer erro "Acesso negado"

---

## 📊 Passo 5: Verificar Logs (30 seg)

### 5.1 Verificar Terminal do Backend

**✅ LOGS ESPERADOS (BOM)**:
```
🔐 Login attempt: multicontext@test.com
✅ Found 3 available context(s)
🔀 Context selection attempt: multicontext@test.com Context: organization [UUID]
✅ Context access validated, creating session
debug: ✅ Permissões carregadas: [...]
```

**❌ LOGS DE ERRO (RUIM)**:
```
❌ Context access denied or not found
warn: ❌ Role não encontrado: org-admin
debug: ✅ Permissões carregadas: []
```

### 5.2 Verificar Console do Browser (F12)

**✅ CONSOLE ESPERADO (BOM)**:
```
🔀 Selecionando contexto: {contextId: "...", contextType: "organization"}
✅ Contexto selecionado: {...}
💾 Salvando autenticação com contexto...
```

**❌ CONSOLE DE ERRO (RUIM)**:
```
❌ Erro ao selecionar contexto: Acesso negado
⚠️ Permissões não carregadas do backend
```

---

## ✅ Checklist Rápido

Marque conforme testa:

- [ ] Backend iniciou sem erros
- [ ] Portal Org iniciou sem erros
- [ ] Login mostra 3 contextos
- [ ] Seleção de contexto funciona
- [ ] Dashboard carrega corretamente
- [ ] Menus aparecem no sidebar
- [ ] ContextSwitcher mostra apenas orgs
- [ ] Troca de contexto funciona
- [ ] Nenhum erro "Acesso negado"
- [ ] Logs do backend estão corretos
- [ ] Console do browser sem erros

---

## 🐛 Se Algo Falhar

### Erro: "Acesso negado" ainda aparece

**Solução 1**: Limpar cache
```
Chrome/Edge: Ctrl+Shift+Delete → Limpar cache
Firefox: Ctrl+Shift+Delete → Limpar cache
Safari: Cmd+Option+E
```

**Solução 2**: Verificar código atualizado
```bash
# Deve retornar "context.contextId"
grep "context.contextId" portalOrganizaçãoTenant/src/pages/Login.jsx
```

**Solução 3**: Reiniciar tudo
```bash
# Parar todos os servidores (Ctrl+C)
# Iniciar novamente do Passo 1
```

### Erro: "Permissões não carregadas"

**Verificar roles no banco**:
```bash
cd backend
node src/scripts/create-default-roles.js
# Deve mostrar: "✅ Roles padrão criados com sucesso!"
```

### Erro: "Contextos não aparecem"

**Recriar dados de teste**:
```bash
cd backend
node src/scripts/create-multi-context-test-data.js
```

---

## 📞 Suporte

Se todos os testes passarem: **✅ Sistema funcionando!**

Se algum teste falhar:
1. Verificar troubleshooting acima
2. Ver documentação completa: `RESUMO-FINAL-CORRECOES.md`
3. Ver detalhes técnicos: `CORRECAO-BUG-CONTEXT-SELECTION.md`

---

## 🎉 Resultado Esperado

Após completar todos os passos:

✅ Login funciona perfeitamente  
✅ Seleção de contexto sem erros  
✅ Troca de contexto funcionando  
✅ Filtro de contextos correto  
✅ Permissões carregando  
✅ Menus e funcionalidades disponíveis  

**Tempo total**: 5 minutos  
**Dificuldade**: Fácil  

---

**Boa sorte! 🚀**

---

**Criado por**: Kiro AI Assistant  
**Data**: 02 de Março de 2026
