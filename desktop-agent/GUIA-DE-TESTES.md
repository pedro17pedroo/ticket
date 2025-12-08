# 🧪 Guia de Testes - Desktop Agent

**Data:** 06 de Dezembro de 2024  
**Versão:** 2.0 - Fase 1 Completa

---

## 🚀 Como Iniciar o Desktop Agent

### Pré-requisitos
- Node.js 16+ instalado
- Backend TatuTicket rodando em `http://localhost:3000`
- Usuário cadastrado no sistema (Cliente ou Organização)

### Passos para Iniciar

1. **Navegar para o diretório do desktop-agent:**
```bash
cd desktop-agent
```

2. **Instalar dependências (se ainda não instalou):**
```bash
npm install
```

3. **Iniciar o agent em modo desenvolvimento:**
```bash
npm start
```

4. **Fazer login:**
- Email: seu@email.com
- Senha: sua senha
- O sistema irá autenticar e conectar automaticamente

---

## 📋 Checklist de Testes

### ✅ Login e Autenticação

**Objetivo:** Verificar se o login funciona corretamente

**Passos:**
1. Abrir o Desktop Agent
2. Inserir email e senha
3. Clicar em "Entrar"
4. Aguardar tela de loading (4 etapas)
5. Verificar se dashboard é exibido

**Resultado Esperado:**
- ✅ Loading com 4 etapas (Autenticando, Conectando, Sincronizando, Dashboard)
- ✅ Dashboard exibido com nome do usuário
- ✅ Menu lateral com todas as opções
- ✅ Estatísticas carregadas

---

### ✅ Dashboard

**Objetivo:** Verificar se o dashboard exibe informações corretas

**Passos:**
1. Após login, verificar dashboard
2. Observar cards de estatísticas
3. Verificar gráficos (se Chart.js estiver disponível)
4. Verificar informações do sistema

**Resultado Esperado:**
- ✅ Cards com números corretos (Tickets, Resolvidos, etc.)
- ✅ Gráficos de status e prioridade
- ✅ Indicadores de SLA
- ✅ Taxa de resolução
- ✅ Informações do sistema (hostname, OS, CPU, RAM)

---

### ✅ Tickets

**Objetivo:** Verificar se a listagem e detalhes de tickets funcionam

**Passos:**
1. Clicar em "Tickets" no menu
2. Verificar se lista de tickets é exibida
3. Usar filtros (status, prioridade, busca)
4. Clicar em um ticket para ver detalhes
5. Verificar chat de mensagens
6. Enviar uma mensagem
7. Criar um novo ticket

**Resultado Esperado:**
- ✅ Lista de tickets carregada
- ✅ Filtros funcionando
- ✅ Busca em tempo real
- ✅ Modal de detalhes abre corretamente
- ✅ Chat exibe mensagens
- ✅ Mensagem enviada aparece no chat
- ✅ Novo ticket criado com sucesso
- ✅ Indicadores de SLA visíveis

---

### ✅ Catálogo de Serviços (NOVO)

**Objetivo:** Verificar se o catálogo funciona corretamente

**Passos:**
1. Clicar em "Catálogo" no menu
2. Verificar se categorias são exibidas
3. Clicar em uma categoria
4. Verificar se itens são filtrados
5. Usar busca para encontrar um item
6. Clicar em "Solicitar" em um item
7. Preencher justificativa
8. Enviar solicitação
9. Verificar se ticket foi criado
10. Verificar redirecionamento para Tickets

**Resultado Esperado:**
- ✅ Categorias exibidas em grid
- ✅ Categoria selecionada fica destacada (roxo)
- ✅ Itens filtrados por categoria
- ✅ Busca funciona em tempo real
- ✅ Modal de solicitação abre
- ✅ Validação de justificativa vazia
- ✅ Solicitação enviada com sucesso
- ✅ Ticket criado automaticamente
- ✅ Redirecionamento para aba de Tickets

**Casos Especiais para Testar:**
- Item sem categoria
- Item sem ícone
- Item com "Requer aprovação"
- Item com tempo estimado
- Busca sem resultados
- Categoria sem itens

---

### ✅ Base de Conhecimento (NOVO)

**Objetivo:** Verificar se a base de conhecimento funciona

**Passos:**
1. Clicar em "Base de Conhecimento" no menu
2. Verificar se artigos são exibidos
3. Clicar em um filtro de categoria
4. Verificar se artigos são filtrados
5. Usar busca para encontrar um artigo
6. Clicar em um artigo
7. Verificar se modal abre com conteúdo completo
8. Verificar se visualizações incrementam
9. Dar feedback (útil/não útil)

**Resultado Esperado:**
- ✅ Artigos exibidos em lista
- ✅ Filtros de categoria funcionam
- ✅ Busca funciona (título, conteúdo, tags)
- ✅ Modal abre com artigo completo
- ✅ Metadados exibidos (visualizações, data)
- ✅ Tags exibidas
- ✅ Visualizações incrementam automaticamente
- ✅ Botões de feedback funcionam

**Casos Especiais para Testar:**
- Artigo sem categoria
- Artigo sem tags
- Artigo sem visualizações
- Busca sem resultados
- Categoria sem artigos
- Artigo com muitas tags

---

### ✅ Informações do Sistema

**Objetivo:** Verificar se as informações do sistema são coletadas

**Passos:**
1. Clicar em "Informações" no menu
2. Verificar se informações são exibidas
3. Clicar em "Atualizar Informações"
4. Aguardar sincronização
5. Verificar se informações foram atualizadas

**Resultado Esperado:**
- ✅ Hardware exibido (CPU, RAM, Storage, GPU)
- ✅ Sistema exibido (OS, hostname, rede)
- ✅ Software instalado listado
- ✅ Segurança exibida (antivírus, firewall, criptografia)
- ✅ Botão de atualizar funciona
- ✅ Loading exibido durante atualização

---

### ✅ Configurações

**Objetivo:** Verificar se as configurações são salvas

**Passos:**
1. Clicar em "Configurações" no menu
2. Alterar opções (auto-launch, minimizar ao iniciar, auto-sync)
3. Clicar em "Salvar Alterações"
4. Verificar notificação de sucesso
5. Fechar e reabrir o agent
6. Verificar se configurações foram mantidas

**Resultado Esperado:**
- ✅ Configurações carregadas corretamente
- ✅ Alterações salvas com sucesso
- ✅ Notificação de sucesso exibida
- ✅ Configurações persistem após reiniciar

---

### ✅ Acesso Remoto

**Objetivo:** Verificar se notificações de acesso remoto funcionam

**Passos:**
1. Ter um usuário de Organização no backend
2. Solicitar acesso remoto a este computador
3. Verificar se notificação aparece no agent
4. Aceitar ou rejeitar acesso
5. Verificar se ação foi registrada

**Resultado Esperado:**
- ✅ Notificação aparece no canto da tela
- ✅ Informações do solicitante exibidas
- ✅ Botões de aceitar/rejeitar funcionam
- ✅ Ação registrada no backend
- ✅ Notificação desaparece após ação

---

## 🐛 Problemas Conhecidos

### Limitações Atuais

1. **Chart.js Opcional**
   - Se Chart.js não carregar, gráficos não serão exibidos
   - Dashboard ainda funciona sem gráficos

2. **Tray Icon Opcional**
   - Se ícone da bandeja não estiver disponível, app funciona normalmente
   - Menu da bandeja não será exibido

3. **Auto-Launch**
   - Pode não funcionar em alguns sistemas
   - Aviso é exibido no console

---

## 📊 Cenários de Teste por Tipo de Usuário

### Cliente

**Pode:**
- ✅ Ver seus próprios tickets
- ✅ Criar novos tickets
- ✅ Enviar mensagens em tickets
- ✅ Solicitar itens do catálogo
- ✅ Ver artigos da base de conhecimento
- ✅ Ver informações do seu computador

**Não Pode:**
- ❌ Ver tickets de outros clientes
- ❌ Atribuir tickets a agentes
- ❌ Mudar status de tickets (exceto resolver)
- ❌ Ver informações de outros computadores

### Organização (Agente/Admin)

**Pode:**
- ✅ Ver tickets de seus clientes
- ✅ Criar tickets para clientes
- ✅ Atribuir tickets a agentes
- ✅ Mudar status de tickets
- ✅ Enviar mensagens internas
- ✅ Solicitar acesso remoto
- ✅ Ver catálogo e knowledge base

**Não Pode:**
- ❌ Ver tickets de outras organizações
- ❌ Modificar catálogo ou knowledge base (apenas visualizar)

---

## 🔍 Como Verificar Logs

### Console do Electron

**Abrir DevTools:**
- Modo dev: DevTools abre automaticamente
- Produção: Ctrl+Shift+I (Windows/Linux) ou Cmd+Option+I (Mac)

**Logs Importantes:**
```
✅ Conectado ao servidor: http://localhost:3000
✅ Perfil do usuário obtido: { id, name, role, ... }
✅ Tickets carregados: 5
✅ Mensagens carregadas: 10
✅ Item do catálogo solicitado: { id, name, ... }
✅ Artigo carregado: { id, title, ... }
```

**Erros Comuns:**
```
❌ Token inválido ou expirado
❌ Erro ao conectar: ECONNREFUSED
❌ Erro ao obter perfil do usuário: 401
❌ Erro ao carregar tickets: Network Error
```

### Logs do Backend

**Verificar no terminal do backend:**
```bash
cd backend
npm run dev
```

**Logs Esperados:**
```
POST /api/auth/login 200
GET /api/auth/profile 200
GET /api/tickets 200
GET /api/catalog/categories 200
GET /api/knowledge 200
```

---

## 🎯 Métricas de Sucesso

### Funcionalidades Críticas (Devem Funcionar 100%)
- [ ] Login e autenticação
- [ ] Listagem de tickets
- [ ] Criação de tickets
- [ ] Envio de mensagens
- [ ] Catálogo de serviços
- [ ] Base de conhecimento
- [ ] Informações do sistema

### Funcionalidades Importantes (Devem Funcionar 90%)
- [ ] Filtros de tickets
- [ ] Busca de tickets
- [ ] Indicadores de SLA
- [ ] Gráficos do dashboard
- [ ] Notificações de acesso remoto
- [ ] Configurações

### Funcionalidades Opcionais (Podem Falhar)
- [ ] Tray icon
- [ ] Auto-launch
- [ ] Notificações desktop nativas

---

## 🚨 O Que Fazer em Caso de Erro

### Erro de Conexão
1. Verificar se backend está rodando
2. Verificar URL do servidor (http://localhost:3000)
3. Verificar firewall
4. Tentar fazer logout e login novamente

### Erro de Autenticação
1. Verificar se token é válido
2. Fazer logout e login novamente
3. Verificar se usuário existe no backend
4. Verificar logs do backend

### Erro ao Carregar Dados
1. Verificar console do Electron
2. Verificar logs do backend
3. Verificar se endpoint existe
4. Verificar permissões do usuário

### Interface Não Responde
1. Abrir DevTools (Ctrl+Shift+I)
2. Verificar erros no console
3. Recarregar página (Ctrl+R)
4. Reiniciar aplicação

---

## 📞 Suporte

### Logs para Enviar
- Console do Electron (DevTools)
- Logs do backend
- Arquivo `backend/backend.log`
- Arquivo `backend/backend-error.log`

### Informações Úteis
- Sistema operacional
- Versão do Node.js
- Versão do Desktop Agent
- Tipo de usuário (Cliente/Organização)
- Passos para reproduzir o erro

---

## ✅ Checklist Final

Antes de considerar os testes completos, verificar:

### Funcionalidades Básicas
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Tickets listam
- [ ] Tickets abrem
- [ ] Mensagens enviam
- [ ] Novo ticket cria

### Funcionalidades Novas (Fase 1)
- [ ] Catálogo carrega
- [ ] Categorias filtram
- [ ] Itens solicitam
- [ ] Ticket é criado após solicitação
- [ ] Knowledge carrega
- [ ] Artigos abrem
- [ ] Visualizações incrementam
- [ ] Busca funciona

### Qualidade
- [ ] Sem erros no console
- [ ] Loading states aparecem
- [ ] Notificações funcionam
- [ ] Validações funcionam
- [ ] Empty states aparecem quando necessário

### Performance
- [ ] Carregamento < 3 segundos
- [ ] Busca responde < 500ms
- [ ] Filtros aplicam instantaneamente
- [ ] Modais abrem < 200ms

---

**Desenvolvido por:** Kiro AI Assistant  
**Data:** 06 de Dezembro de 2024  
**Versão:** 2.0 - Fase 1 Completa
