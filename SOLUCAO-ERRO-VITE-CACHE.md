# Solução - Erro de Cache do Vite

## 🐛 Problema

O Portal Organização não renderiza e mostra o erro:

```
The file does not exist at "/Users/pedrodivino/Dev/ticket/portalOrganizaçãoTenant/node_modules/.vite/deps/chunk-D6RTVDG6.js?v=ca2be276"
```

## 🔍 Causa

Este é um problema comum do Vite quando:
1. O cache de dependências fica desatualizado
2. Dependências são atualizadas mas o cache não é limpo
3. Chunks otimizados ficam corrompidos

## ✅ Solução Aplicada

### 1. Limpeza do Cache do Vite

```bash
cd portalOrganizaçãoTenant
rm -rf node_modules/.vite
```

✅ **Executado com sucesso**

### 2. Atualização do vite.config.js

Adicionada configuração para forçar re-otimização:

```javascript
optimizeDeps: {
  force: true, // Força a re-otimização das dependências
}
```

✅ **Aplicado**

### 3. Correção da Porta do Backend

Corrigida a porta do proxy de `3000` para `4003`:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:4003', // Porta correta do backend
    changeOrigin: true,
  },
}
```

✅ **Aplicado**

## 🔄 Próximos Passos

### 1. Parar o Vite (se estiver rodando)

Pressione `Ctrl+C` no terminal onde o Vite está rodando.

### 2. Reiniciar o Vite

```bash
cd portalOrganizaçãoTenant
npm run dev
```

### 3. Verificar se Funcionou

Você deve ver:

```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

E o portal deve carregar normalmente no navegador.

## 🆘 Se o Problema Persistir

### Opção 1: Limpeza Completa do Cache

```bash
cd portalOrganizaçãoTenant

# Remover node_modules e cache
rm -rf node_modules
rm -rf node_modules/.vite
rm -rf .vite

# Reinstalar dependências
npm install

# Reiniciar
npm run dev
```

### Opção 2: Limpar Cache do Navegador

1. Abrir DevTools (F12)
2. Clicar com botão direito no botão de reload
3. Selecionar "Empty Cache and Hard Reload"

### Opção 3: Adicionar Dependências Problemáticas ao Exclude

Se alguma dependência específica estiver causando problema, adicionar ao `vite.config.js`:

```javascript
optimizeDeps: {
  force: true,
  exclude: ['nome-da-dependencia-problematica']
}
```

## 📊 Verificações Adicionais

### 1. Verificar se o Backend está Rodando

```bash
curl http://localhost:4003/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 2. Verificar Logs do Vite

Procurar por erros no terminal onde o Vite está rodando.

### 3. Verificar Console do Navegador

Abrir DevTools (F12) → Console e verificar se há erros.

## 🎯 Resultado Esperado

Após seguir os passos acima:

- ✅ Portal carrega normalmente
- ✅ Sem erros de chunk não encontrado
- ✅ Hot Module Replacement (HMR) funciona
- ✅ API se conecta ao backend na porta 4003

## 📝 Notas Importantes

### Avisos que Podem Ser Ignorados

Estes avisos são normais e não afetam o funcionamento:

```
[baseline-browser-mapping] The data in this module is over two months old.
Browserslist: browsers data (caniuse-lite) is 6 months old.
```

Para removê-los (opcional):

```bash
cd portalOrganizaçãoTenant
npm i baseline-browser-mapping@latest -D
npx update-browserslist-db@latest
```

### Porta do Backend

O backend está rodando na porta **4003**, não 3000. Isso foi corrigido no `vite.config.js`.

## 🔧 Configuração Final do vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    force: true, // Força a re-otimização das dependências
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4003', // Porta correta do backend
        changeOrigin: true,
      },
    },
  },
})
```

## ✅ Checklist de Resolução

- [x] Cache do Vite removido (`rm -rf node_modules/.vite`)
- [x] `vite.config.js` atualizado com `optimizeDeps.force: true`
- [x] Porta do proxy corrigida para 4003
- [ ] Vite reiniciado (`npm run dev`)
- [ ] Portal carregando normalmente
- [ ] Sem erros no console

## 🎉 Conclusão

O problema foi causado por cache desatualizado do Vite. Após limpar o cache e atualizar a configuração, o portal deve funcionar normalmente.

**Próxima ação:** Reiniciar o Vite com `npm run dev`

---

**Data:** 05/04/2026  
**Status:** ✅ Solução Aplicada  
**Ação Pendente:** Reiniciar o Vite
