# Portal Organização Tenant - T-Desk

Portal web para gestão de tickets, clientes e departamentos da organização.

## 🛠️ Stack Tecnológica

- **React 18** - Biblioteca UI
- **Vite** - Build tool rápido
- **Tailwind CSS** - Estilização
- **React Router v6** - Roteamento
- **Zustand** - Gestão de estado
- **React Hook Form** - Formulários
- **Axios** - HTTP client
- **Lucide React** - Ícones
- **Recharts** - Gráficos
- **React Hot Toast** - Notificações
- **i18next** - Internacionalização

## ✨ Funcionalidades

- ✅ Dashboard com estatísticas
- ✅ Gestão completa de tickets
- ✅ Sistema de comentários
- ✅ Autenticação JWT
- ✅ Tema escuro/claro
- ✅ Multi-idioma (PT/EN)
- ✅ Responsivo
- 🚧 Gestão de clientes
- 🚧 Gestão de departamentos
- 🚧 Base de conhecimento
- 🚧 Relatórios avançados

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env
nano .env
```

## 💻 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

## 🏗️ Build

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🎨 Tema Escuro/Claro

O sistema detecta automaticamente a preferência do utilizador e permite alternar entre temas.

## 🌍 Multi-idioma

Suporte para Português e Inglês. Para adicionar mais idiomas, edite `src/i18n.js`.

## 📱 Responsividade

Totalmente responsivo com breakpoints Tailwind:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔐 Autenticação

O sistema usa JWT tokens armazenados no localStorage. Sessão expira automaticamente.

## 🎯 Credenciais de Teste

- **Admin:** admin@empresademo.com / Admin@123
- **Agente:** agente@empresademo.com / Agente@123

## 📂 Estrutura de Pastas

```
src/
├── components/      # Componentes reutilizáveis
├── pages/          # Páginas/rotas
├── services/       # Serviços API
├── store/          # Gestão de estado (Zustand)
├── App.jsx         # Componente raiz
├── main.jsx        # Entry point
└── i18n.js         # Configuração i18n
```

## 🔧 Configuração

Edite `src/services/api.js` para alterar a URL base da API.

## 📝 Licença

ISC
