# 🚀 Próximos Passos: Testar Correção do Bug

**Status Atual**: ✅ Bug corrigido no código, pendente de teste manual

---

## ⚡ Quick Start (5 minutos)

### 1. Iniciar Servidores

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Aguardar: "Server running on port 4003"

# Terminal 2 - Portal Organização
cd portalOrganizaçãoTenant
npm run dev
# Aguardar: "Local: http://localhost:5173"

# Terminal 3 - Portal Cliente
cd portalClientEmpresa
npm run dev
# Aguardar: "Local: http://localhost:5174"
```

### 2. Testar Login

1. Abrir `http://localhost:5173`
2. Login:
   - Email: `multicontext@test.com`
   - Senha: `Test@123`
3. **Deve mostrar 3 contextos para selecionar**
4. Clicar em qualquer contexto
5. **✅ SUCESSO**: Login funciona sem erro "Acesso negado"
6. **❌ FALHA**: Se aparecer erro, ver troubleshooting abaixo

---

## 📋 Checklist Rápido

- [ ] Backend iniciou sem erros
- [ ] Portal Org iniciou sem erros
- [ ] Portal Cliente iniciou sem erros
- [ ] Login mostra 3 contextos
- [ ] Seleção de contexto funciona
- [ ] Nenhum erro "Acesso negado"
- [ ] Dashboard carrega corretamente

---

## 🐛 Troubleshooting

### Erro: "Acesso negado" ainda aparece

**Solução 1**: Limpar cache do browser
```
Chrome: Ctrl+Shift+Delete → Limpar cache
Firefox: Ctrl+Shift+Delete → Limpar cache
```

**Solução 2**: Verificar se código foi atualizado
```bash
# Deve retornar "context.contextId"
grep "context.contextId" portalOrganizaçãoTenant/src/pages/Login.jsx
```

**Solução 3**: Reiniciar servidores
```bash
# Parar todos (Ctrl+C em cada terminal)
# Iniciar novamente
```

### Erro: "Contextos não aparecem"

**Verificar dados de teste**:
```bash
cd backend
node src/scripts/create-multi-context-test-data.js
```

### Erro: "Cannot connect to backend"

**Verificar se backend está rodando**:
```bash
curl http://localhost:4003/api/health
# Deve retornar: {"status":"ok"}
```

---

## 📊 O Que Observar

### Logs do Backend (Terminal 1)
```
✅ BOM:
🔐 Login attempt: multicontext@test.com
✅ Found 3 available context(s)
🔀 Context selection attempt: multicontext@test.com Context: organization [UUID]
✅ Context access validated, creating session

❌ RUIM:
❌ Context access denied or not found
```

### Console do Browser (F12)
```
✅ BOM:
🔀 Selecionando contexto: {contextId: "...", contextType: "organization"}
✅ Contexto selecionado: {...}
💾 Salvando autenticação com contexto...

❌ RUIM:
❌ Erro ao selecionar contexto: Acesso negado
```

---

## 📝 Após Testar

### Se TUDO FUNCIONAR ✅

1. Marcar como validado:
   ```bash
   echo "✅ Bug corrigido e validado em $(date)" >> TESTE-VALIDADO.txt
   ```

2. Próximo passo: Deploy para staging
   - Ver: `GUIA-DEPLOY-PRODUCAO.md`

### Se ALGO FALHAR ❌

1. Documentar o erro:
   - Screenshot do erro
   - Logs do backend
   - Console do browser

2. Criar issue:
   ```markdown
   # Bug: [Descrição]
   
   ## Passos para Reproduzir
   1. ...
   2. ...
   
   ## Resultado Esperado
   ...
   
   ## Resultado Atual
   ...
   
   ## Logs
   ```

3. Notificar equipe

---

## 📚 Documentação Completa

Se precisar de mais detalhes:

- **Teste completo**: `TESTE-CORRECAO-BUG.md` (7 cenários)
- **Detalhes técnicos**: `CORRECAO-BUG-CONTEXT-SELECTION.md`
- **Histórico**: `SESSAO-CORRECAO-BUG-CONTEXT.md`
- **Status geral**: `STATUS-MULTI-CONTEXT-FINAL.md`

---

## 🎯 Objetivo

**Validar que a correção funciona e sistema está pronto para produção!**

Tempo estimado: 5-10 minutos

---

**Boa sorte! 🚀**
