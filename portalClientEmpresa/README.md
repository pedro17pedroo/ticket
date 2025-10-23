# Portal Cliente - TatuTicket

Portal de autoatendimento para clientes abrirem e acompanharem tickets de suporte.

## 🛠️ Stack Tecnológica

- **React 18** - Biblioteca UI
- **Vite** - Build tool rápido
- **Tailwind CSS** - Estilização
- **React Router v6** - Roteamento
- **Zustand** - Gestão de estado
- **React Hook Form** - Formulários
- **Axios** - HTTP client
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações
- **date-fns** - Manipulação de datas

## ✨ Funcionalidades

- ✅ Login e Registo
- ✅ Dashboard com estatísticas pessoais
- ✅ Criar novos tickets
- ✅ Acompanhar meus tickets
- ✅ Adicionar respostas/comentários
- ✅ Ver histórico completo de interações
- ✅ Tema escuro/claro
- ✅ Responsivo (Mobile/Tablet/Desktop)
- 🚧 Base de conhecimento (em desenvolvimento)

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env (se necessário)
nano .env
```

## 💻 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:5174

## 🏗️ Build

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🎨 Tema Escuro/Claro

O sistema detecta automaticamente a preferência do utilizador e permite alternar entre temas clicando no ícone de lua/sol.

## 🔐 Autenticação

O sistema usa JWT tokens armazenados no localStorage.

- Login com email e senha
- Registo de novos clientes
- Sessão expira automaticamente
- Apenas role `cliente-org` tem acesso

## 🎯 Credenciais de Teste

```
Email: cliente@empresademo.com
Senha: Cliente@123
```

## 📱 Responsividade

Totalmente responsivo com breakpoints Tailwind:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 📂 Estrutura de Pastas

```
src/
├── components/      # Componentes reutilizáveis
│   ├── Layout.jsx
│   ├── Sidebar.jsx
│   └── Header.jsx
├── pages/          # Páginas/rotas
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── MyTickets.jsx
│   ├── NewTicket.jsx
│   ├── TicketDetail.jsx
│   ├── KnowledgeBase.jsx
│   └── Profile.jsx
├── services/       # Serviços API
│   └── api.js
├── store/          # Gestão de estado (Zustand)
│   ├── authStore.js
│   └── themeStore.js
├── App.jsx         # Componente raiz
└── main.jsx        # Entry point
```

## 🔧 Configuração

A URL base da API pode ser configurada em `.env`:

```bash
VITE_API_URL=http://localhost:3000/api
```

## 📖 Páginas Disponíveis

### Login (/login)
- Autenticação com email/senha
- Validação de campos
- Link para registo

### Registo (/register)
- Criação de nova conta
- Validação de senha
- Confirmação de senha

### Dashboard (/)
- Estatísticas dos tickets
- Ações rápidas
- Lista de tickets recentes

### Meus Tickets (/tickets)
- Lista completa de tickets
- Filtros por status
- Pesquisa
- Badges de status e prioridade

### Novo Ticket (/tickets/new)
- Formulário completo
- Validação de campos
- Seleção de prioridade e tipo
- Dicas para melhor atendimento

### Detalhe do Ticket (/tickets/:id)
- Visualização completa
- Histórico de respostas
- Adicionar comentários
- Informações do ticket

### Base de Conhecimento (/knowledge)
- Em desenvolvimento

### Perfil (/profile)
- Informações da conta
- Avatar personalizado

## 🎯 Diferenças vs Portal Organização

### Funcionalidades Simplificadas
- Apenas **visualiza tickets próprios** (não de outros clientes)
- **Não pode** atribuir tickets
- **Não pode** alterar status (apenas comentar)
- **Não vê** notas internas dos agentes
- **Não tem** acesso a gestão de clientes/departamentos

### Foco em Autoatendimento
- Interface mais simples e intuitiva
- Guias e dicas para criação de tickets
- Feedback visual claro do status
- Base de conhecimento (futuro)

## 📝 Licença

ISC

---

**Nota:** Este portal é específico para clientes finais. Para gestão de tickets, use o Portal de Organização.
