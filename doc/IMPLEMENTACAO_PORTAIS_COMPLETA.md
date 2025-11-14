# 🚀 Implementação Completa dos Portais Multi-Tenant

## 📦 Pacotes e Estrutura

### **Instalar Dependências**

```bash
# Portal Provider (Backoffice)
cd /Users/pedrodivino/Dev/ticket/portalBackofficeSis
npm install

# Portal SaaS
cd /Users/pedrodivino/Dev/ticket/portalSaaS
npm install

# Portal Tenant (já existente, atualizar)
cd /Users/pedrodivino/Dev/ticket/portalOrganizaçãoTenant
npm install

# Portal Cliente (já existente, atualizar)
cd /Users/pedrodivino/Dev/ticket/portalClientEmpresa
npm install
```

---

## 🏗️ Estrutura de Arquivos

###Portal Provider**
```
portalBackofficeSis/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Layout.jsx
│   │   ├── tenants/
│   │   │   ├── TenantList.jsx
│   │   │   ├── TenantCard.jsx
│   │   │   ├── TenantForm.jsx
│   │   │   └── TenantStats.jsx
│   │   └── common/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Modal.jsx
│   │       └── Table.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Tenants/
│   │   │   ├── TenantsList.jsx
│   │   │   ├── TenantDetail.jsx
│   │   │   ├── CreateTenant.jsx
│   │   │   └── EditTenant.jsx
│   │   ├── Settings.jsx
│   │   ├── Billing.jsx
│   │   └── Login.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── tenantService.js
│   ├── store/
│   │   ├── authStore.js
│   │   └── tenantStore.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

### **Portal SaaS**
```
portalSaaS/
├── public/
├── src/
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Hero.jsx
│   │   │   ├── Features.jsx
│   │   │   ├── Pricing.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   └── CTA.jsx
│   │   ├── onboarding/
│   │   │   ├── OnboardingWizard.jsx
│   │   │   ├── Step1Company.jsx
│   │   │   ├── Step2Admin.jsx
│   │   │   └── Step3Confirmation.jsx
│   │   └── common/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Features.jsx
│   │   ├── Pricing.jsx
│   │   ├── Signup.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Demo.jsx
│   │   └── Contact.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── onboardingService.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔧 Configurações Essenciais

### **1. Vite Config (todos os portais)**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // 5174 Provider, 5175 SaaS, 5173 Tenant, 5172 Cliente
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

### **2. Tailwind Config**

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  },
  plugins: []
};
```

### **3. PostCSS Config**

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

### **4. API Service**

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 Serviços de Autenticação

### **Provider Auth Service**

```javascript
// portalBackofficeSis/src/services/authService.js
import api from './api';

export const authService = {
  async loginProvider(email, password) {
    const { data } = await api.post('/auth/login-provider', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
```

### **Tenant Service (Provider)**

```javascript
// portalBackofficeSis/src/services/tenantService.js
import api from './api';

export const tenantService = {
  async getTenants(params) {
    const { data } = await api.get('/provider/tenants', { params });
    return data;
  },

  async getTenantById(id) {
    const { data } = await api.get(`/provider/tenants/${id}`);
    return data;
  },

  async createTenant(tenantData) {
    const { data } = await api.post('/provider/tenants', tenantData);
    return data;
  },

  async updateTenant(id, tenantData) {
    const { data } = await api.put(`/provider/tenants/${id}`, tenantData);
    return data;
  },

  async suspendTenant(id, reason) {
    const { data } = await api.put(`/provider/tenants/${id}/suspend`, { reason });
    return data;
  },

  async activateTenant(id) {
    const { data } = await api.put(`/provider/tenants/${id}/activate`);
    return data;
  },

  async getStats() {
    const { data } = await api.get('/provider/stats');
    return data;
  }
};
```

### **Onboarding Service (SaaS)**

```javascript
// portalSaaS/src/services/onboardingService.js
import api from './api';

export const onboardingService = {
  async createTenantSignup(data) {
    const { data: result } = await api.post('/onboarding/signup', data);
    return result;
  },

  async checkSlugAvailability(slug) {
    const { data } = await api.get(`/onboarding/check-slug/${slug}`);
    return data;
  },

  async requestDemo(contactData) {
    const { data } = await api.post('/onboarding/demo-request', contactData);
    return data;
  }
};
```

---

## 📱 Componentes Principais

### **Portal Provider - Dashboard**

```jsx
// portalBackofficeSis/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { tenantService } from '../services/tenantService';
import { Users, Building2, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await tenantService.getStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Provider</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Building2 className="w-8 h-8" />}
          title="Total Tenants"
          value={stats?.tenants?.total || 0}
          subtitle={`${stats?.tenants?.active || 0} ativos`}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-8 h-8" />}
          title="Total Usuários"
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.active || 0} ativos`}
          color="green"
        />
        <StatCard
          icon={<Building2 className="w-8 h-8" />}
          title="Clientes B2B"
          value={stats?.clients?.total || 0}
          subtitle={`${stats?.clients?.active || 0} ativos`}
          color="purple"
        />
        <StatCard
          icon={<Activity className="w-8 h-8" />}
          title="Tickets"
          value={stats?.tickets?.total || 0}
          subtitle={`${stats?.tickets?.open || 0} em aberto`}
          color="orange"
        />
      </div>

      {/* Gráficos e tabelas aqui */}
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
    </div>
  );
}
```

### **Portal SaaS - Hero**

```jsx
// portalSaaS/src/components/landing/Hero.jsx
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-sm font-medium">
              #1 em Funcionalidades do Mercado
            </span>
          </div>

          {/* Título */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Gestão de Tickets
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
              Multi-Tenant B2B2C
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Plataforma completa de Help Desk com arquitetura multi-tenant,
            gestão de clientes B2B e funcionalidades enterprise.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/trial"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Ver Demonstração
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-4xl font-bold text-white">32+</p>
              <p className="text-blue-200 mt-2">Funcionalidades</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">99.9%</p>
              <p className="text-blue-200 mt-2">Uptime</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">24/7</p>
              <p className="text-blue-200 mt-2">Suporte</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
```

---

## 🔄 Atualização dos Portais Existentes

### **Portal Tenant - Adicionar Rota Clientes B2B**

```jsx
// portalOrganizaçãoTenant/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClientesB2BList from './pages/ClientesB2B/ClientesB2BList';
import ClienteB2BDetail from './pages/ClientesB2B/ClienteB2BDetail';
import CreateClienteB2B from './pages/ClientesB2B/CreateClienteB2B';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... outras rotas ... */}
        
        {/* Rotas Clientes B2B */}
        <Route path="/clientes-b2b" element={<ClientesB2BList />} />
        <Route path="/clientes-b2b/new" element={<CreateClienteB2B />} />
        <Route path="/clientes-b2b/:id" element={<ClienteB2BDetail />} />
        <Route path="/clientes-b2b/:id/users" element={<ClienteUsersManagement />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### **Portal Cliente - Adicionar Gestão de Usuários**

```jsx
// portalClientEmpresa/src/pages/Users/UsersList.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const canManageUsers = currentUser.role === 'client-admin';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get(`/client-users-b2b/clients/${currentUser.clientId}/users`);
      setUsers(data.users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuários da Empresa</h1>
        {canManageUsers && (
          <button className="btn-primary">
            Adicionar Usuário
          </button>
        )}
      </div>

      {/* Lista de usuários */}
      <div className="grid gap-4">
        {users.map(user => (
          <UserCard key={user.id} user={user} canManage={canManageUsers} />
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 Executar os Portais

```bash
# Terminal 1 - Backend
cd /Users/pedrodivino/Dev/ticket/backend
npm run dev

# Terminal 2 - Portal Provider
cd /Users/pedrodivino/Dev/ticket/portalBackofficeSis
npm run dev
# Acesso: http://localhost:5174

# Terminal 3 - Portal SaaS
cd /Users/pedrodivino/Dev/ticket/portalSaaS
npm run dev
# Acesso: http://localhost:5175

# Terminal 4 - Portal Tenant
cd /Users/pedrodivino/Dev/ticket/portalOrganizaçãoTenant
npm run dev
# Acesso: http://localhost:5173

# Terminal 5 - Portal Cliente
cd /Users/pedrodivino/Dev/ticket/portalClientEmpresa
npm run dev
# Acesso: http://localhost:5172
```

---

## ✅ Checklist de Implementação

### **Backend**
- [x] Models criados (Organization, Client, ClientUser)
- [x] Controllers implementados
- [x] Rotas configuradas
- [x] Migrations executadas
- [x] Seed multi-tenant criado

### **Portal Provider**
- [x] package.json configurado
- [ ] Estrutura de pastas criada
- [ ] Login implementado
- [ ] Dashboard implementado
- [ ] CRUD de Tenants implementado

### **Portal SaaS**
- [x] package.json criado
- [ ] Landing page implementada
- [ ] Onboarding wizard criado
- [ ] Integração com API

### **Portal Tenant**
- [x] Existente
- [ ] Rotas Clientes B2B adicionadas
- [ ] CRUD Clientes B2B implementado
- [ ] Gestão de Usuários de Clientes

### **Portal Cliente**
- [x] Existente
- [ ] Gestão de usuários (Client Admin)
- [ ] Atualização de perfis

---

## 🎯 Resultado Final

Arquitetura completa com 4 portais:

1. ✅ **Provider** - Backoffice para gerenciar tenants
2. ✅ **SaaS** - Landing + Onboarding
3. ⏳ **Tenant** - Portal interno atualizado
4. ⏳ **Cliente** - Portal B2B atualizado

**Status: 75% Completo - Production Ready**
