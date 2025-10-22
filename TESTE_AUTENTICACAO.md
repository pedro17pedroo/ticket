# 🔐 Sistema de Autenticação - Guia de Teste

## ✅ Sistema Implementado

### Backend
- ✅ Autenticação JWT com Passport
- ✅ Controle de acesso baseado em roles (RBAC)
- ✅ Middleware de autorização com logs
- ✅ Proteção de rotas por organização
- ✅ Verificação de ownership (owner ou admin)
- ✅ Base de dados populada com dados de teste

### Frontend
- ✅ Página de login funcional
- ✅ Gerenciamento de estado com Zustand
- ✅ Persistência de token no localStorage
- ✅ Rotas protegidas com redirecionamento
- ✅ Interceptor Axios para token e erros
- ✅ Logout funcional
- ✅ Exibição de perfil e role do usuário

## 👥 Credenciais de Teste

### Administrador
- **Email:** admin@empresademo.com
- **Senha:** Admin@123
- **Permissões:** Acesso total ao sistema

### Agente
- **Email:** agente@empresademo.com
- **Senha:** Agente@123
- **Permissões:** Gerenciar tickets, atender clientes

### Cliente
- **Email:** cliente@empresademo.com
- **Senha:** Cliente@123
- **Permissões:** Criar e visualizar próprios tickets

## 🚀 Como Testar

### 1. Backend (já rodando na porta 3000)
```bash
# Verificar se está rodando
curl http://localhost:3000/api/health

# Testar login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresademo.com","password":"Admin@123"}'
```

### 2. Frontend
1. Acesse: http://localhost:5173/login
2. Use uma das credenciais acima
3. Teste o login
4. Navegue pelas páginas protegidas
5. Teste o logout

## 🔒 Controles de Acesso Implementados

### Rotas Públicas
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro de cliente
- `GET /api/health` - Health check

### Rotas Protegidas (Autenticação Obrigatória)
- `GET /api/auth/profile` - Perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/change-password` - Alterar senha

### Rotas com Autorização por Role

#### Tickets
- `GET /api/tickets` - Todos (filtrado por organização)
- `GET /api/tickets/:id` - Todos
- `POST /api/tickets` - Todos (criar ticket)
- `PUT /api/tickets/:id` - Admin e Agente (atualizar)
- `POST /api/tickets/:id/comments` - Todos

#### Departamentos
- `GET /api/departments` - Todos
- `POST /api/departments` - Admin
- `PUT /api/departments/:id` - Admin
- `DELETE /api/departments/:id` - Admin

## 🛡️ Middlewares de Segurança

### authenticate
Verifica se o usuário possui um token JWT válido.

### authorize(...roles)
Verifica se o usuário tem uma das roles permitidas.
```javascript
authorize('admin-org', 'agente')
```

### requireAdminOrg
Shortcut para `authorize('admin-org')`

### requireAgent
Shortcut para `authorize('admin-org', 'agente')`

### requireSameOrganization
Garante que o usuário só acessa recursos da própria organização.

### requireOwnerOrAdmin
Permite acesso se for admin OU o próprio usuário (para perfis).

## 📊 Dados Criados no Seed

### Organização
- **Nome:** Empresa Demo
- **Slug:** empresa-demo

### Departamentos
- Suporte Técnico
- Desenvolvimento
- Comercial

### Categorias
- Bug/Erro
- Nova Funcionalidade
- Dúvida
- Melhoria

### SLAs
- Urgente (30min resposta, 4h resolução)
- Alta (2h resposta, 8h resolução)
- Média (4h resposta, 16h resolução)
- Baixa (8h resposta, 32h resolução)

## 🔄 Fluxo de Autenticação

1. **Login:**
   - Frontend envia email/senha para `/api/auth/login`
   - Backend valida credenciais
   - Backend gera JWT token com dados do usuário
   - Frontend armazena token e dados do usuário no Zustand + localStorage

2. **Requisições Autenticadas:**
   - Interceptor Axios adiciona `Authorization: Bearer <token>`
   - Backend valida token via Passport JWT
   - Backend adiciona `req.user` com dados do usuário
   - Middlewares de autorização verificam permissões

3. **Logout:**
   - Frontend remove token e dados do localStorage
   - Frontend redireciona para /login

4. **Token Expirado:**
   - Interceptor detecta erro 401
   - Frontend faz logout automático
   - Redireciona para /login

## ✨ Próximos Passos

- [ ] Implementar refresh token
- [ ] Adicionar autenticação de dois fatores (2FA)
- [ ] Implementar recuperação de senha
- [ ] Adicionar logs de auditoria de login
- [ ] Implementar bloqueio de conta após tentativas falhas
- [ ] Adicionar histórico de sessões ativas
