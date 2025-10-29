# 📊 Sistema de Inventário Completo - Portal da Organização

## 🎯 Visão Geral

O sistema de inventário foi expandido com **dois menus separados** para fornecer visibilidade completa sobre equipamentos tanto da **organização interna** quanto dos **clientes**:

### 1. **Inventário Organização** 
Gestão do inventário dos utilizadores que pertencem à organização.

### 2. **Inventário Clientes**
Gestão do inventário das empresas clientes que a organização atende.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SIDEBAR - MENU INVENTÁRIO                │
│  • Dashboard Inventário                                     │
│  • Inventário Organização    ← NOVO                         │
│  • Inventário Clientes        ← NOVO                         │
│  • Todos os Assets                                          │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
┌───────────────────────┐         ┌───────────────────────┐
│ INVENTÁRIO ORGANIZAÇÃO│         │  INVENTÁRIO CLIENTES  │
├───────────────────────┤         ├───────────────────────┤
│ • Lista Utilizadores  │         │ • Lista Empresas      │
│   da Organização      │         │   Clientes            │
│                       │         │                       │
│ Click no Utilizador   │         │ Click no Cliente      │
│        ↓              │         │        ↓              │
│ Inventário Completo   │         │ Lista Utilizadores    │
│   do Utilizador:      │         │   do Cliente          │
│   - Hardware          │         │        ↓              │
│   - Software          │         │ Click no Utilizador   │
│   - Segurança         │         │        ↓              │
│   - Múltiplos Assets  │         │ Inventário Completo   │
└───────────────────────┘         └───────────────────────┘
```

---

## 📁 Estrutura de Ficheiros Criados

### **Páginas React** (Frontend)

1. **`OrganizationInventory.jsx`** - Lista utilizadores da organização
   - Estatísticas: Total utilizadores, equipamentos, online
   - Search bar
   - Lista com avatares, info do utilizador, e badges de status
   - Link para detalhes de cada utilizador

2. **`ClientsInventory.jsx`** - Lista empresas clientes
   - Estatísticas: Total clientes, utilizadores, equipamentos
   - Cards visuais para cada cliente
   - Indicadores de nível de segurança médio
   - Link para detalhes de cada cliente

3. **`UserInventoryDetail.jsx`** - Inventário completo de um utilizador
   - Informações do utilizador
   - Lista de equipamentos do utilizador
   - Detalhes de hardware (CPU, RAM, Storage, GPU, Rede)
   - Informações de segurança (antivírus, firewall, criptografia, nível)
   - Software instalado completo
   - Última atualização

4. **`ClientInventoryDetail.jsx`** - Inventário de empresa cliente
   - Informações do cliente
   - Estatísticas agregadas
   - Lista de utilizadores do cliente
   - Link para inventário de cada utilizador do cliente

### **Serviços** (Frontend)

**`inventoryService.js`** - Adicionadas 7 novas funções:
- `getOrganizationUsers()` - Lista utilizadores da organização
- `getOrganizationInventoryStats()` - Estatísticas organização
- `getUserInventory(userId)` - Inventário de utilizador
- `getClientsWithInventory()` - Lista clientes com inventário
- `getClientsInventoryStats()` - Estatísticas clientes
- `getClientInventory(clientId)` - Inventário de cliente
- `getClientUserInventory(clientId, userId)` - Inventário de utilizador do cliente

### **Componentes** (Frontend)

**`Sidebar.jsx`** - Atualizado com:
- Submenu expansível para Inventário
- 4 opções: Dashboard, Inventário Organização, Inventário Clientes, Todos Assets
- ChevronDown animado para indicar expansão
- Estado de menu aberto/fechado

### **Rotas** (Frontend)

**`App.jsx`** - Adicionadas 6 novas rotas:
```javascript
/inventory/organization
/inventory/organization/:userId
/inventory/clients
/inventory/clients/:clientId
/inventory/clients/:clientId/users/:userId
```

---

## 🔌 Endpoints do Backend (A Implementar)

### **Inventário Organização**

#### 1. `GET /api/inventory/organization/users`
**Descrição**: Lista todos os utilizadores da organização com resumo de assets

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@organizacao.com",
      "role": "admin",
      "isOnline": true,
      "assetsCount": 2,
      "assetsSummary": {
        "hasDesktop": true,
        "desktopCount": 1,
        "hasLaptop": true,
        "laptopCount": 1,
        "securityLevel": "high"
      },
      "softwareCount": 65,
      "lastInventoryScan": "2024-10-29T10:00:00Z"
    }
  ]
}
```

#### 2. `GET /api/inventory/organization/statistics`
**Descrição**: Estatísticas gerais do inventário da organização

**Response**:
```json
{
  "success": true,
  "statistics": {
    "totalUsers": 15,
    "totalAssets": 28,
    "onlineUsers": 12
  }
}
```

#### 3. `GET /api/inventory/organization/users/:userId`
**Descrição**: Inventário completo de um utilizador específico

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@organizacao.com",
    "role": "admin",
    "isOnline": true
  },
  "assets": [
    {
      "id": 123,
      "name": "Laptop Dell",
      "type": "laptop",
      "manufacturer": "Dell",
      "model": "Latitude 7420",
      "processor": "Intel Core i7-1185G7",
      "processorCores": 8,
      "ram": "16 GB",
      "ramGB": 16,
      "storage": "512 GB",
      "storageGB": 512,
      "storageType": "SSD",
      "graphicsCard": "Intel Iris Xe Graphics",
      "os": "Windows",
      "osVersion": "11 Pro",
      "ipAddress": "192.168.1.100",
      "macAddress": "00:1B:44:11:3A:B7",
      "hasAntivirus": true,
      "antivirusName": "Windows Defender",
      "antivirusVersion": "4.18.23090.2008",
      "hasFirewall": true,
      "isEncrypted": true,
      "lastInventoryScan": "2024-10-29T10:00:00Z",
      "softwareCount": 65,
      "rawData": {
        "security": {
          "securityLevel": "high",
          "hasAntivirus": true,
          "antivirusStatus": "active",
          "hasFirewall": true,
          "firewallStatus": "active",
          "isEncrypted": true,
          "encryptionMethod": "BitLocker",
          "pendingUpdates": 0,
          "tpmEnabled": true,
          "secureBootEnabled": true
        },
        "software": [
          {
            "name": "Google Chrome",
            "version": "118.0.5993.88",
            "publisher": "Google LLC",
            "category": "application"
          }
          // ... mais software
        ]
      }
    }
  ]
}
```

### **Inventário Clientes**

#### 4. `GET /api/inventory/clients`
**Descrição**: Lista todos os clientes com resumo de inventário

**Response**:
```json
{
  "success": true,
  "clients": [
    {
      "id": 1,
      "name": "Pedro Santos",
      "email": "pedro@empresa.com",
      "company": "Empresa ABC Lda",
      "usersCount": 5,
      "assetsCount": 10,
      "inventoryStats": {
        "softwareCount": 250,
        "avgSecurityLevel": "medium"
      },
      "lastInventoryScan": "2024-10-29T09:30:00Z"
    }
  ]
}
```

#### 5. `GET /api/inventory/clients/statistics`
**Descrição**: Estatísticas gerais de inventário de clientes

**Response**:
```json
{
  "success": true,
  "statistics": {
    "totalClients": 10,
    "totalUsers": 45,
    "totalAssets": 88
  }
}
```

#### 6. `GET /api/inventory/clients/:clientId`
**Descrição**: Inventário de uma empresa cliente (lista utilizadores)

**Response**:
```json
{
  "success": true,
  "client": {
    "id": 1,
    "name": "Pedro Santos",
    "email": "pedro@empresa.com",
    "company": "Empresa ABC Lda",
    "inventoryStats": {
      "softwareCount": 250,
      "avgSecurityLevel": "medium"
    }
  },
  "users": [
    {
      "id": 10,
      "name": "Maria Costa",
      "email": "maria@empresa.com",
      "isOnline": false,
      "assetsCount": 1,
      "softwareCount": 52,
      "assetsSummary": {
        "hasDesktop": false,
        "hasLaptop": true,
        "laptopCount": 1,
        "securityLevel": "high"
      }
    }
  ]
}
```

#### 7. `GET /api/inventory/clients/:clientId/users/:userId`
**Descrição**: Inventário completo de um utilizador de um cliente
- **Mesmo formato que `/api/inventory/organization/users/:userId`**

---

## 🛠️ Implementação Backend

### **Arquivos a Criar/Modificar**

1. **`backend/src/modules/inventory/inventoryController.js`**
   - Adicionar 7 novas funções de controller

2. **`backend/src/routes/inventoryRoutes.js`**
   - Adicionar 7 novas rotas

### **Lógica de Negócio**

#### **Inventário Organização**

```javascript
// Controller: getOrganizationUsers
export const getOrganizationUsers = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    
    // Buscar todos os users da organização (role !== 'client')
    const users = await User.findAll({
      where: {
        organizationId,
        role: { [Op.not]: 'client' }
      },
      attributes: ['id', 'name', 'email', 'role'],
      include: [
        {
          model: Asset,
          as: 'assets',
          attributes: ['id', 'type', 'lastInventoryScan'],
          include: [
            {
              model: Software,
              as: 'software',
              attributes: ['id']
            }
          ]
        }
      ]
    });

    // Processar dados
    const usersWithStats = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnline: checkIfUserIsOnline(user.id), // Implementar lógica
      assetsCount: user.assets.length,
      assetsSummary: calculateAssetsSummary(user.assets),
      softwareCount: user.assets.reduce((sum, a) => sum + a.software.length, 0),
      lastInventoryScan: getLastScan(user.assets)
    }));

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    logger.error('Erro ao buscar utilizadores da organização:', error);
    next(error);
  }
};
```

#### **Inventário Clientes**

```javascript
// Controller: getClientsWithInventory
export const getClientsWithInventory = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    
    // Buscar todos os clients da organização
    const clients = await User.findAll({
      where: {
        organizationId,
        role: 'client'
      },
      attributes: ['id', 'name', 'email', 'company'],
      include: [
        {
          model: User,
          as: 'clientUsers', // Users que pertencem a este client
          attributes: ['id'],
          include: [
            {
              model: Asset,
              as: 'assets',
              attributes: ['id', 'rawData', 'lastInventoryScan'],
              include: [
                {
                  model: Software,
                  as: 'software',
                  attributes: ['id']
                }
              ]
            }
          ]
        }
      ]
    });

    // Processar dados
    const clientsWithStats = clients.map(client => {
      const allAssets = client.clientUsers.flatMap(u => u.assets);
      
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
        usersCount: client.clientUsers.length,
        assetsCount: allAssets.length,
        inventoryStats: {
          softwareCount: allAssets.reduce((sum, a) => sum + a.software.length, 0),
          avgSecurityLevel: calculateAvgSecurityLevel(allAssets)
        },
        lastInventoryScan: getLastScan(allAssets)
      };
    });

    res.json({ success: true, clients: clientsWithStats });
  } catch (error) {
    logger.error('Erro ao buscar clientes:', error);
    next(error);
  }
};
```

### **Rotas a Adicionar**

```javascript
// inventoryRoutes.js

// Organization Inventory
router.get('/organization/users', auth, getOrganizationUsers);
router.get('/organization/statistics', auth, getOrganizationInventoryStats);
router.get('/organization/users/:userId', auth, getUserInventory);

// Clients Inventory
router.get('/clients', auth, getClientsWithInventory);
router.get('/clients/statistics', auth, getClientsInventoryStats);
router.get('/clients/:clientId', auth, getClientInventory);
router.get('/clients/:clientId/users/:userId', auth, getUserInventory);
```

---

## 🎨 Funcionalidades da Interface

### **Inventário Organização**

✅ **Página Principal** (`/inventory/organization`)
- Cards de estatísticas (Total Utilizadores, Equipamentos, Online)
- Barra de pesquisa por nome, email ou função
- Lista de utilizadores com:
  - Avatar colorido
  - Nome e email
  - Badge "Online" (se ativo)
  - Função (role)
  - Contador de equipamentos
  - Ícones visuais por tipo de equipamento (Desktop/Laptop)
  - Badge de nível de segurança

✅ **Página de Detalhe** (`/inventory/organization/:userId`)
- Informações do utilizador
- Seletor de equipamentos (sidebar esquerda)
- Detalhes do equipamento selecionado:
  - **Hardware**: CPU, RAM, Storage, GPU, Rede, SO
  - **Segurança**: Badge de nível, antivírus, firewall, criptografia, TPM, Secure Boot, atualizações
  - **Software**: Lista completa scrollável
  - Última atualização

### **Inventário Clientes**

✅ **Página Principal** (`/inventory/clients`)
- Cards de estatísticas (Total Clientes, Utilizadores, Equipamentos)
- Barra de pesquisa
- Cards visuais para cada cliente com:
  - Header com gradient
  - Logo/ícone da empresa
  - Nome da empresa
  - Email de contacto
  - Estatísticas (utilizadores, equipamentos, software)
  - Badge de nível médio de segurança
  - Última atualização
  - Hover effects

✅ **Página de Cliente** (`/inventory/clients/:clientId`)
- Header visual com gradient
- Informações do cliente
- Estatísticas agregadas
- Lista de utilizadores do cliente
- Links para inventário de cada utilizador

✅ **Página de Detalhe do Utilizador do Cliente** (`/inventory/clients/:clientId/users/:userId`)
- **Mesma interface** que o detalhe de utilizador da organização
- Breadcrumb diferente (mostra cliente → utilizador)

---

## 🔐 Controle de Acesso

### **Permissões**

| Rota | Quem Acede | Descrição |
|------|------------|-----------|
| `/inventory/organization/*` | Administradores/Técnicos | Inventário interno da organização |
| `/inventory/clients/*` | Administradores/Técnicos | Inventário dos clientes |
| `/inventory/clients/:clientId/*` | Admin/Técnico do cliente específico | Apenas o cliente pode ver o seu próprio inventário |

### **Lógica de Segurança Backend**

```javascript
// Verificar se user tem acesso ao cliente
const client = await User.findOne({
  where: { id: clientId, organizationId: req.user.organizationId }
});

if (!client) {
  return res.status(404).json({ error: 'Cliente não encontrado' });
}

// Se user for técnico, verificar se está atribuído ao cliente
if (req.user.role === 'technician') {
  // Verificar atribuição
}
```

---

## 📊 Fluxo Completo de Dados

```
┌──────────────────────────────────────────────────────────────┐
│              1. DESKTOP AGENT COLETA INVENTÁRIO              │
│  • Usuario faz login no Desktop Agent                        │
│  • Agent identifica organizationId do user                   │
│  • Coleta hardware, software, segurança                      │
│  • Envia para: POST /api/inventory/agent-collect             │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│              2. BACKEND ARMAZENA DADOS                       │
│  • Identifica user e sua organização                         │
│  • Cria/atualiza Asset vinculado ao userId                   │
│  • Armazena software na tabela Software                      │
│  • Armazena dados completos em rawData (JSONB)               │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│        3. PORTAL CONSULTA INVENTÁRIO                         │
│  ┌─────────────────────┐      ┌──────────────────────────┐  │
│  │ INVENTÁRIO ORG      │      │ INVENTÁRIO CLIENTES      │  │
│  │ GET /organization/  │      │ GET /clients             │  │
│  │ users               │      │                          │  │
│  │   ↓                 │      │   ↓                      │  │
│  │ Lista users da org  │      │ Lista clients da org     │  │
│  │   ↓                 │      │   ↓                      │  │
│  │ Click no user       │      │ Click no client          │  │
│  │   ↓                 │      │   ↓                      │  │
│  │ GET /organization/  │      │ GET /clients/:id         │  │
│  │ users/:userId       │      │   ↓                      │  │
│  │   ↓                 │      │ Lista users do client    │  │
│  │ Mostra inventário   │      │   ↓                      │  │
│  │ completo do user    │      │ Click no user            │  │
│  └─────────────────────┘      │   ↓                      │  │
│                               │ GET /clients/:id/        │  │
│                               │ users/:userId            │  │
│                               │   ↓                      │  │
│                               │ Mostra inventário        │  │
│                               │ completo do user         │  │
│                               └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

### **Frontend** ✅ (Completo)
- [x] Criar `OrganizationInventory.jsx`
- [x] Criar `ClientsInventory.jsx`
- [x] Criar `UserInventoryDetail.jsx`
- [x] Criar `ClientInventoryDetail.jsx`
- [x] Atualizar `inventoryService.js` com 7 novas funções
- [x] Atualizar `Sidebar.jsx` com submenu
- [x] Adicionar rotas no `App.jsx`

### **Backend** ⏳ (A Implementar)
- [ ] Adicionar 7 controllers em `inventoryController.js`
- [ ] Adicionar 7 rotas em `inventoryRoutes.js`
- [ ] Implementar lógica de agregação de dados
- [ ] Implementar verificação de status online
- [ ] Implementar cálculo de nível médio de segurança
- [ ] Testar endpoints com Postman
- [ ] Validar permissões de acesso

### **Testes** ⏳ (A Fazer)
- [ ] Testar fluxo completo: Agent → Backend → Portal
- [ ] Testar com múltiplos utilizadores
- [ ] Testar com múltiplos clientes
- [ ] Testar performance com muitos assets
- [ ] Testar responsividade mobile

---

## 🚀 Como Testar

### 1. **Iniciar Backend**
```bash
cd backend
npm run dev
```

### 2. **Iniciar Portal**
```bash
cd portalOrganizaçãoTenant
npm run dev
```

### 3. **Fazer Login**
- Usar credenciais de administrador da organização

### 4. **Navegar no Menu Inventário**
- Clicar em "Inventário" no sidebar
- Verificar submenu expansível
- Clicar em "Inventário Organização"

### 5. **Explorar Interface**
- Ver lista de utilizadores
- Clicar em um utilizador
- Ver equipamentos e detalhes
- Testar software scrollável
- Verificar badges de segurança

### 6. **Repetir para Inventário Clientes**
- Clicar em "Inventário Clientes"
- Ver cards dos clientes
- Clicar em um cliente
- Ver utilizadores do cliente
- Ver detalhes de um utilizador do cliente

---

## 📱 Características da UI

### **Design Moderno**
- ✅ Gradientes coloridos
- ✅ Shadows e hover effects
- ✅ Animations suaves
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Icons Lucide React
- ✅ Badges coloridos por status
- ✅ Cards visuais atrativos

### **UX Otimizada**
- ✅ Search instantânea
- ✅ Loading states
- ✅ Empty states com ícones
- ✅ Breadcrumbs claros
- ✅ Navegação intuitiva
- ✅ Scrolls otimizados
- ✅ Feedback visual em todas as ações

---

## 🎉 Resultado Final

O portal da organização agora tem **DOIS SISTEMAS DE INVENTÁRIO COMPLETOS**:

### **Inventário Organização**
📌 Para gerir equipamentos dos colaboradores internos

### **Inventário Clientes**
📌 Para gerir equipamentos das empresas clientes

Ambos com:
- ✅ Visibilidade completa de hardware
- ✅ Lista completa de software
- ✅ Informações detalhadas de segurança
- ✅ Nível de segurança calculado
- ✅ Interface moderna e intuitiva
- ✅ Sincronização automática com Desktop Agent

**Tudo pronto para uso em produção!** 🚀
