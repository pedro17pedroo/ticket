# 🧪 Guia de Teste - Login e Modo Escuro

## 🚀 Como Executar o Portal

```bash
cd portalBackofficeSis
npm install
npm run dev
```

O portal estará disponível em: **http://localhost:5174**

---

## 🔐 Teste de Login

### Passo 1: Acessar a Página de Login
- Abra o navegador em `http://localhost:5174`
- Você verá a tela de login com o logo TatuTicket

### Passo 2: Fazer Login
Use uma das credenciais abaixo:

**Opção 1 - Super Admin:**
```
Email: superadmin@tatuticket.com
Senha: Super@123
```

**Opção 2 - Admin:**
```
Email: admin@tatuticket.com
Senha: Admin@123
```

### Passo 3: Verificar Sucesso
- Após clicar em "Entrar", aguarde ~1 segundo
- Você será redirecionado para o Dashboard
- No header, verá seu nome e email
- No sidebar, verá o menu de navegação

### ✅ Login Funcionando Se:
- ✓ Redirecionamento para /dashboard
- ✓ Nome do usuário aparece no header
- ✓ Menu lateral está visível
- ✓ Não há erros no console (F12)

---

## 🌙 Teste de Modo Escuro

### Passo 1: Localizar o Botão
- Após fazer login, olhe para o header (topo da página)
- À direita, antes do sino de notificações
- Você verá um ícone de **Lua** (modo claro) ou **Sol** (modo escuro)

### Passo 2: Alternar Tema
- Clique no botão de tema
- A interface deve mudar instantaneamente:
  - **Modo Claro:** Fundo branco/cinza claro
  - **Modo Escuro:** Fundo cinza escuro/preto

### Passo 3: Verificar Persistência
- Recarregue a página (F5)
- O tema escolhido deve ser mantido
- Verifique no DevTools (F12) → Application → Local Storage
- Deve existir uma chave `theme` com valor `light` ou `dark`

### ✅ Modo Escuro Funcionando Se:
- ✓ Botão alterna entre Sol e Lua
- ✓ Cores mudam em toda a interface
- ✓ Tema persiste após reload
- ✓ Transição é suave

---

## 🎨 Elementos que Mudam no Dark Mode

### Header
- Fundo: Branco → Cinza escuro
- Texto: Preto → Branco
- Input de busca: Branco → Cinza escuro

### Main Content
- Fundo: Cinza claro → Cinza muito escuro
- Cards: Branco → Cinza escuro
- Texto: Preto → Branco

### Sidebar
- Permanece escuro (já era escuro por padrão)

---

## 🐛 Problemas Comuns

### "Email ou senha inválidos"
- ✓ Verifique se digitou corretamente
- ✓ Use as credenciais exatas (case-sensitive)
- ✓ Copie e cole se necessário

### Botão de tema não aparece
- ✓ Certifique-se de estar logado
- ✓ Recarregue a página
- ✓ Limpe o cache (Ctrl+Shift+R)

### Tema não persiste
- ✓ Verifique se localStorage está habilitado
- ✓ Não está em modo anônimo/privado
- ✓ Verifique permissões do navegador

### Erros no console
- ✓ Abra DevTools (F12) → Console
- ✓ Copie o erro e reporte
- ✓ Verifique se todas as dependências foram instaladas

---

## 📸 Capturas de Tela Esperadas

### 1. Tela de Login
- Logo TatuTicket no topo
- Campos de Email e Senha
- Botão "Entrar" azul
- Credenciais demo visíveis

### 2. Dashboard (Modo Claro)
- Sidebar escuro à esquerda
- Header branco no topo
- Conteúdo com fundo cinza claro
- Botão de Lua no header

### 3. Dashboard (Modo Escuro)
- Sidebar escuro à esquerda (igual)
- Header cinza escuro no topo
- Conteúdo com fundo cinza muito escuro
- Botão de Sol no header

---

## ✅ Checklist de Teste

### Login
- [ ] Página de login carrega corretamente
- [ ] Campos de email e senha funcionam
- [ ] Credenciais demo estão visíveis
- [ ] Login com credenciais corretas funciona
- [ ] Login com credenciais erradas mostra erro
- [ ] Redirecionamento para dashboard funciona
- [ ] Nome do usuário aparece no header
- [ ] Botão de logout funciona

### Modo Escuro
- [ ] Botão de tema aparece no header
- [ ] Ícone muda entre Lua e Sol
- [ ] Clique alterna o tema
- [ ] Cores mudam em toda interface
- [ ] Tema persiste após reload
- [ ] localStorage armazena preferência
- [ ] Transições são suaves
- [ ] Não há erros no console

---

## 🎯 Resultado Esperado

Após seguir todos os passos:

1. ✅ Login funciona com credenciais mock
2. ✅ Redirecionamento para dashboard
3. ✅ Modo escuro alterna corretamente
4. ✅ Tema persiste após reload
5. ✅ Interface responsiva e funcional

---

**Tempo estimado de teste:** 5 minutos  
**Navegadores testados:** Chrome, Firefox, Edge  
**Status:** ✅ Pronto para teste
