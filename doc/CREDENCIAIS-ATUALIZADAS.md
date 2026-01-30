# Credenciais de Acesso - Sistema TatuTicket

**Atualizado em:** 17 de Janeiro de 2026

---

## 🔐 Portal Backoffice (Super Admin)
**URL:** http://localhost:5175

```
Email: superadmin@tatuticket.com
Senha: Admin@123
Role: super-admin
```

---

## 🏢 Portal Organização (Tenant)
**URL:** http://localhost:5173

### Admin da Organização
```
Email: tenant-admin@empresademo.com
Senha: TenantAdmin@123
Role: org-admin
Organization: Empresa Demo
```

### Agente de Suporte
```
Email: tenant-agente@empresademo.com
Senha: TenantAgente@123
Role: agent
Organization: Empresa Demo
```

### Manager de Suporte
```
Email: tenant-manager@empresademo.com
Senha: TenantManager@123
Role: org-manager
Organization: Empresa Demo
```

---

## 👥 Portal Cliente Empresa
**URL:** http://localhost:5174

### Cliente Admin
```
Email: cliente-admin@clientedemo.com
Senha: ClienteAdmin@123
Role: client-admin
Client: Cliente Demo
```

### Cliente Usuário
```
Email: cliente-user@clientedemo.com
Senha: ClienteUser@123
Role: client
Client: Cliente Demo
```

---

## 🌐 Portal SaaS (Landing Page)
**URL:** http://localhost:5176

Página pública - não requer autenticação

---

## 🗄️ Banco de Dados PostgreSQL

```
Host: localhost
Port: 5432
Database: tatuticket
User: postgres
Password: root
```

### Comandos Úteis

```bash
# Conectar ao banco
PGPASSWORD=root psql -U postgres -d tatuticket

# Listar tabelas
\dt

# Descrever tabela
\d nome_da_tabela

# Executar query
SELECT * FROM users LIMIT 5;
```

---

## 🔧 Backend API

```
URL: http://localhost:4003/api
Health Check: http://localhost:4003/api/health
```

### Endpoints Principais

```
POST /api/auth/login - Login
POST /api/auth/register - Registro
GET /api/tickets - Listar tickets
POST /api/tickets - Criar ticket
GET /api/projects - Listar projetos
POST /api/projects - Criar projeto
GET /api/catalog/categories - Listar categorias do catálogo
GET /api/catalog/items - Listar itens do catálogo
```

---

## 📝 Notas Importantes

1. **Hierarquia de Usuários:**
   - Super Admin (Provider) → Gerencia todo o sistema
   - Org Admin (Tenant) → Gerencia sua organização
   - Client Admin → Gerencia sua empresa cliente
   - Client User → Usuário final

2. **Organizações:**
   - Cada organização (tenant) é isolada
   - Dados não são compartilhados entre organizações
   - Cada organização pode ter múltiplos clientes

3. **Projetos:**
   - Códigos são únicos por organização (PRJ-001, PRJ-002, etc)
   - Cada organização tem sua própria numeração
   - Suporta metodologias: waterfall, agile, scrum, kanban, hybrid

4. **Catálogo de Serviços:**
   - Suporta hierarquia de categorias
   - Roteamento organizacional (direção/departamento/secção)
   - Tipos de itens: incident, service, support, request

---

## 🧪 Testes

### Testar Login
```bash
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant-admin@empresademo.com","password":"TenantAdmin@123"}'
```

### Testar Criação de Projeto
```bash
node backend/test-project-creation.js
```

---

## 🆘 Troubleshooting

### Backend não inicia
```bash
# Verificar se o PostgreSQL está rodando
pg_isready

# Verificar logs do backend
tail -f backend/logs/combined.log
```

### Erro de autenticação
```bash
# Resetar senha do super admin
node backend/reset-backoffice-password.js
```

### Erro de colunas faltantes
```bash
# Executar scripts de correção
PGPASSWORD=root psql -U postgres -d tatuticket -f backend/fix-missing-columns.sql
PGPASSWORD=root psql -U postgres -d tatuticket -f backend/fix-client-users-complete.sql
```

---

**Última Atualização:** Sessão 11 - 17/01/2026
