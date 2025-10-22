# TatuTicket Backend

Backend compartilhado do sistema TatuTicket - Plataforma modular de gestão de tickets.

## 🛠️ Stack Tecnológica

- **Runtime:** Node.js (LTS)
- **Framework:** Express.js
- **Bancos de Dados:**
  - PostgreSQL (dados principais)
  - MongoDB (logs e auditoria)
  - Redis (cache e sessões)
- **Autenticação:** JWT + Passport.js
- **Validação:** Joi
- **Logs:** Winston
- **Upload:** Multer
- **ORM:** Sequelize (PostgreSQL) + Mongoose (MongoDB)

## 📁 Estrutura de Diretórios

```
backend/
├── src/
│   ├── config/           # Configurações (DB, Redis, Logger)
│   ├── middleware/       # Middlewares (Auth, Validação, Auditoria)
│   ├── modules/          # Módulos de negócio (estrutura modular)
│   │   ├── auth/
│   │   ├── tickets/
│   │   ├── users/
│   │   ├── departments/
│   │   ├── categories/
│   │   ├── slas/
│   │   ├── knowledge/
│   │   ├── hours/
│   │   └── audit/
│   ├── routes/           # Rotas agregadas
│   ├── seeds/            # Seeds para dados iniciais
│   ├── app.js            # Configuração do Express
│   └── server.js         # Inicialização do servidor
├── tests/                # Testes unitários e integração
├── logs/                 # Arquivos de log
├── uploads/              # Arquivos enviados
├── .env.example          # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

## 🚀 Instalação e Configuração

### 1. Pré-requisitos

- Node.js (v18+)
- PostgreSQL (v14+)
- MongoDB (v6+)
- Redis (v7+)

### 2. Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
nano .env
```

### 3. Configurar Bancos de Dados

#### PostgreSQL
```bash
# Criar banco de dados
createdb tatuticket

# Ou via psql
psql -U postgres
CREATE DATABASE tatuticket;
```

#### MongoDB
```bash
# MongoDB geralmente não precisa criar database manualmente
# Será criado automaticamente na primeira conexão
```

#### Redis
```bash
# Iniciar Redis
redis-server
```

### 4. Executar Seed (Dados Iniciais)

```bash
npm run seed
```

Isso criará:
- 1 Organização Demo
- 3 Departamentos
- 4 Categorias
- 4 SLAs
- 3 Usuários (Admin, Agente, Cliente)

### 5. Iniciar Servidor

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

O servidor estará disponível em: `http://localhost:3000`

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro de cliente
- `GET /api/auth/profile` - Perfil do usuário (autenticado)
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/change-password` - Alterar senha

### Tickets
- `GET /api/tickets` - Listar tickets (com filtros e paginação)
- `GET /api/tickets/:id` - Buscar ticket por ID
- `POST /api/tickets` - Criar ticket
- `PUT /api/tickets/:id` - Atualizar ticket (apenas admin/agente)
- `POST /api/tickets/:id/comments` - Adicionar comentário
- `POST /api/tickets/:id/attachments` - Upload de anexos
- `GET /api/tickets/statistics` - Estatísticas de tickets

### Departamentos
- `GET /api/departments` - Listar departamentos
- `POST /api/departments` - Criar departamento (apenas admin)
- `PUT /api/departments/:id` - Atualizar departamento
- `DELETE /api/departments/:id` - Remover departamento

### Health Check
- `GET /api/health` - Status do servidor

## 🔐 Autenticação e Autorização

### Roles
- `admin-org`: Administrador da organização (acesso total)
- `agente`: Agente de suporte (gerencia tickets)
- `cliente-org`: Cliente da organização (abre e acompanha tickets)

### Headers de Autenticação
```
Authorization: Bearer <JWT_TOKEN>
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com cobertura
npm run test:coverage
```

## 📝 Variáveis de Ambiente

Ver `.env.example` para todas as variáveis disponíveis.

Principais:
- `NODE_ENV`: Ambiente (development/production)
- `PORT`: Porta do servidor
- `POSTGRES_*`: Configurações PostgreSQL
- `MONGODB_URI`: URI do MongoDB
- `REDIS_*`: Configurações Redis
- `JWT_SECRET`: Chave secreta JWT
- `JWT_EXPIRES_IN`: Tempo de expiração do token

## 🔒 Segurança

- Helmet para headers de segurança
- Rate limiting (100 req/15min por IP)
- Bcrypt para hash de senhas
- JWT para autenticação stateless
- Validação de entrada com Joi
- CORS configurável

## 📊 Logs e Auditoria

- **Winston**: Logs estruturados em arquivos (`logs/`)
- **MongoDB**: Auditoria completa de ações (collection `audit_logs`)

## 🐳 Docker (Em Breve)

```bash
# Build
docker-compose build

# Executar
docker-compose up
```

## 📚 Próximos Passos

- [ ] Adicionar endpoints para Categories, SLAs, Knowledge, Hours
- [ ] Implementar notificações por email
- [ ] Integração com WhatsApp
- [ ] Relatórios avançados
- [ ] Testes E2E
- [ ] CI/CD com GitHub Actions

## 👥 Equipa

Equipa TatuTicket - Outubro 2025

## 📄 Licença

ISC
