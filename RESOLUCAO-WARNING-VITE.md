# Resolução - Warning Vite onClick Duplicado

**Data:** 09/03/2026  
**Status:** ✅ Resolvido

---

## ⚠️ Problema

Ao executar `npm run dev` no portal da organização, apareciam warnings:

```
7:53:05 PM [vite] warning: Duplicate "onClick" attribute in JSX element
240|              to={item.path}
241|              onClick={handleLinkClick}
242|              onClick={handleLinkClick}
```

---

## 🔍 Diagnóstico

1. **Verificação do código:** O arquivo `Sidebar.jsx` não continha `onClick` duplicado
2. **Causa identificada:** Cache do Vite com versão antiga do arquivo
3. **Confirmação:** `grep` no arquivo mostrou apenas 1 `onClick` por elemento

---

## ✅ Solução

### Passo 1: Limpar cache do Vite

```bash
cd portalOrganizaçãoTenant
rm -rf node_modules/.vite
```

### Passo 2: Reiniciar o servidor

```bash
npm run dev
```

---

## 📝 Explicação

O Vite mantém um cache de otimização em `node_modules/.vite/` para melhorar a performance. Quando arquivos são modificados externamente (por exemplo, por ferramentas de IA ou git), o cache pode ficar desatualizado e mostrar warnings de versões antigas do código.

---

## 🔧 Comandos Úteis

### Limpar cache do Vite
```bash
rm -rf node_modules/.vite
```

### Limpar cache e node_modules completo
```bash
rm -rf node_modules
npm install
```

### Forçar rebuild completo
```bash
npm run build -- --force
```

---

## 🎯 Prevenção

Para evitar esse problema no futuro:

1. **Sempre limpe o cache** após mudanças significativas no código
2. **Use `git pull`** antes de iniciar o desenvolvimento
3. **Reinicie o servidor** após fazer merge de branches
4. **Atualize dependências** regularmente

---

## ✅ Verificação

Após limpar o cache, o servidor deve iniciar sem warnings:

```bash
VITE v5.4.21  ready in 721 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 📚 Referências

- [Vite - Dependency Pre-Bundling](https://vitejs.dev/guide/dep-pre-bundling.html)
- [Vite - Command Line Interface](https://vitejs.dev/guide/cli.html)

---

**Status:** ✅ Problema resolvido  
**Ação necessária:** Nenhuma (cache já foi limpo)
