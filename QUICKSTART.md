# ⚡ Quick Start - TatuTicket

Guia rápido para começar a usar o TatuTicket em 5 minutos.

## 🐳 Opção 1: Docker (Mais Fácil)

```bash
# 1. Iniciar todos os serviços
docker-compose up -d

# 2. Aguardar inicialização (30-60 segundos)
docker-compose logs -f backend

# 3. Executar seed de dados
docker-compose exec backend node src/seeds/initialSeed.js

# 4. Acessar
# Portal: http://localhost:8080
# API: http://localhost:3000
```

**Credenciais:**
- Admin: `admin@empresademo.com` / `Admin@123`
- Agente: `agente@empresademo.com` / `Agente@123`
- Cliente: `cliente@empresademo.com` / `Cliente@123`

## 💻 Opção 2: Manual (Desenvolvimento)

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+

### Backend

```bash
cd backend
npm install
cp .env.example .env

# Criar database PostgreSQL
createdb tatuticket

# Iniciar serviços (em terminais separados)
redis-server
mongod

# Executar seed
node src/seeds/initialSeed.js

# Iniciar backend
npm run dev
# http://localhost:3000
```

### Portal Organização

```bash
cd portalOrganizaçãoTenant
npm install
cp .env.example .env

npm run dev
# http://localhost:5173
```

## 📱 Primeiros Passos

1. **Login**: Acesse http://localhost:5173 (ou 8080 se Docker)
2. **Usar credenciais**: `admin@empresademo.com` / `Admin@123`
3. **Explorar Dashboard**: Veja estatísticas de tickets
4. **Criar Ticket**: Clique em "Novo Ticket"
5. **Gerir Tickets**: Lista, filtros, comentários

## 🎯 Funcionalidades Disponíveis

### Portal Organização
- ✅ Login e autenticação
- ✅ Dashboard com gráficos
- ✅ Criar e gerir tickets
- ✅ Comentários públicos e internos
- ✅ Filtros avançados
- ✅ Tema escuro/claro
- ✅ Multi-idioma (PT/EN)

### API Backend
- ✅ `POST /api/auth/login` - Login
- ✅ `GET /api/tickets` - Listar tickets
- ✅ `POST /api/tickets` - Criar ticket
- ✅ `GET /api/tickets/:id` - Ver ticket
- ✅ `POST /api/tickets/:id/comments` - Comentar
- ✅ `GET /api/departments` - Departamentos

## 🔧 Configuração Rápida

### Alterar Porta do Backend
```bash
# backend/.env
PORT=4000
```

### Alterar URL da API no Frontend
```bash
# portalOrganizaçãoTenant/.env
VITE_API_URL=http://localhost:4000/api
```

### Tema Padrão
No Portal, clique no ícone de lua/sol no header.

### Idioma
No futuro: Settings > Preferências > Idioma

## 🐛 Problemas Comuns

### Backend não inicia
```bash
# Verificar se bancos estão rodando
pg_isready
redis-cli ping
mongosh --eval "db.adminCommand('ping')"
```

### Frontend não conecta ao backend
1. Verificar VITE_API_URL em `.env`
2. Verificar CORS no backend
3. Limpar cache do navegador

### Docker não inicia
```bash
# Limpar e reiniciar
docker-compose down -v
docker-compose up -d --build
```

## 📚 Próximos Passos

1. Ler [README.md](README.md) completo
2. Consultar [IMPLEMENTACAO.md](IMPLEMENTACAO.md) para roadmap
3. Ver [DEPLOY.md](DEPLOY.md) para produção
4. Explorar [PRD.md](PRD.md) para requisitos completos

## 🆘 Suporte

- **Documentação**: Consulte os arquivos `.md` na raiz
- **Logs Backend**: `npm run dev` ou `docker-compose logs backend`
- **Logs Frontend**: Console do navegador (F12)

## 🎉 Pronto!

Você agora tem um sistema de tickets completo rodando!

**Experimente:**
1. Criar um ticket como admin
2. Adicionar comentários
3. Alterar tema para escuro
4. Filtrar tickets por status
5. Ver detalhes do ticket

---

**Desenvolvimento ativo** - Mais funcionalidades em breve!
