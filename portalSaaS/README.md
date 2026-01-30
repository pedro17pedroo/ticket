# 🚀 Portal SaaS T-Desk

Portal SaaS completo para onboarding de organizações tenant no T-Desk.

## 📋 Funcionalidades Implementadas

### ✅ **Landing Page Profissional**
- **Hero Section** com call-to-action
- **Funcionalidades** destacadas
- **Preços** e planos
- **Depoimentos** e casos de uso
- **Footer** completo com links

### ✅ **Sistema de Onboarding Multi-Step**
- **Step 1:** Informações da Empresa
  - Nome da organização
  - Slug/domínio personalizado (verificação em tempo real)
  - Setor e tamanho da empresa
  - Informações de contato

- **Step 2:** Administrador
  - Dados do admin principal
  - Senha segura com validação
  - Verificação de força da senha

- **Step 3:** Configurações
  - Seleção de plano (Starter/Business/Enterprise)
  - Localização e idioma
  - Tema e preferências
  - Configurações de notificação

- **Step 4:** Revisão
  - Resumo de todas as informações
  - Termos e condições
  - Informações sobre trial

- **Step 5:** Sucesso
  - Confirmação da criação
  - Credenciais de acesso
  - Links úteis e próximos passos

### ✅ **Dashboard SaaS Admin**
- **Overview** com métricas principais
- **Gestão de Organizações**
- **Analytics** e relatórios
- **Configurações** do sistema

### ✅ **Integração com Backend**
- API service com interceptors
- Gestão de estado com Zustand
- Autenticação JWT
- Tratamento de erros

## 🛠 Tecnologias Utilizadas

- **React 18** - Framework principal
- **Vite** - Build tool e dev server
- **TailwindCSS** - Styling
- **React Router Dom** - Roteamento
- **React Hook Form** - Formulários
- **Zustand** - Gestão de estado
- **Axios** - HTTP client
- **Framer Motion** - Animações
- **React Hot Toast** - Notificações
- **Lucide React** - Ícones

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Backend T-Desk rodando na porta 3000

### Instalação
```bash
# Navegar para o diretório
cd /Users/pedrodivino/Dev/ticket/portalSaaS

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

### URLs Disponíveis
- **Desenvolvimento:** http://localhost:5175
- **Landing Page:** http://localhost:5175/
- **Onboarding:** http://localhost:5175/onboarding
- **SaaS Admin:** http://localhost:5175/saas

## 📁 Estrutura do Projeto

```
portalSaaS/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── Layout.jsx       # Layout principal
│   │   ├── Header.jsx       # Header global
│   │   ├── Footer.jsx       # Footer global
│   │   ├── onboarding/      # Componentes do onboarding
│   │   └── saas/           # Componentes do dashboard
│   ├── pages/              # Páginas principais
│   │   ├── Home.jsx        # Landing page
│   │   ├── Onboarding.jsx  # Fluxo de onboarding
│   │   ├── About.jsx       # Sobre nós
│   │   ├── Contact.jsx     # Contato
│   │   └── SaasDashboard.jsx # Dashboard admin
│   ├── services/           # Serviços e APIs
│   │   └── api.js         # Cliente HTTP
│   ├── store/             # Gestão de estado
│   │   └── saasStore.js   # Store principal
│   └── App.jsx            # App principal
├── package.json
└── README.md
```

## 🔄 Fluxo de Onboarding

1. **Usuário acessa** `/onboarding`
2. **Preenche informações** em 4 steps
3. **Sistema valida** dados em tempo real
4. **Cria organização** no backend
5. **Usuário recebe** credenciais de acesso
6. **Redirecionamento** para portal específico

## 🎯 Endpoints Utilizados

### Backend APIs
- `POST /api/organizations` - Criar organização
- `GET /api/organizations/check-slug/:slug` - Verificar slug
- `POST /api/trial-requests` - Solicitação de trial
- `POST /api/contact` - Formulário de contato
- `POST /api/newsletter/subscribe` - Newsletter

## 🔧 Configurações

### Variáveis de Ambiente
```env
VITE_API_URL=http://localhost:3000/api
VITE_SAAS_NAME=T-Desk
VITE_SAAS_DOMAIN=tatuticket.com
```

### Features Flags
- Analytics integrado
- Chat support
- Demo interativo

## 🎨 Design System

### Cores Principais
- **Azul:** `#2563eb` (blue-600)
- **Índigo:** `#4f46e5` (indigo-600)
- **Verde:** `#10b981` (green-500)
- **Cinza:** `#6b7280` (gray-500)

### Componentes Padrão
- **Botões** com gradiente azul-índigo
- **Cards** com sombra suave
- **Formulários** com validação visual
- **Modais** com backdrop blur

## 📊 Métricas e Analytics

### Dados Coletados
- Organizações criadas
- Conversão do onboarding
- Planos mais escolhidos
- Tempo no processo

### Dashboard Admin
- Total de organizações
- Usuários ativos
- Receita mensal
- Distribuição de planos

## 🔐 Segurança

### Implementado
- Validação de formulários
- Sanitização de inputs
- Verificação de domínio único
- Autenticação JWT
- HTTPS obrigatório em produção

## 🚢 Deploy

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Produção
- Configure variáveis de ambiente
- Execute build otimizado
- Deploy em CDN (Netlify/Vercel)

## 📞 Suporte

Para dúvidas sobre implementação:
- **Email:** dev@tatuticket.com
- **Documentação:** `/docs`
- **Issues:** GitHub repository

---

**Portal SaaS T-Desk** - Sistema completo de onboarding multi-tenant B2B2C
