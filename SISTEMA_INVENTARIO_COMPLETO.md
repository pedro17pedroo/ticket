# 📦 SISTEMA DE INVENTÁRIO COMPLETO

**Sistema de Gestão de Ativos de TI**  
**Última Atualização:** 04/11/2025 23:54

---

## 🎯 VISÃO GERAL

O sistema de inventário do TatuTicket é **extremamente completo** e armazena:

- ✅ **Hardware** (CPU, RAM, Storage, GPU, etc.)
- ✅ **Software** (Aplicações instaladas, versões, licenças)
- ✅ **Segurança** (Antivírus, Firewall, Encriptação)
- ✅ **Rede** (IP, MAC, Hostname, Domínio)
- ✅ **Licenças** (Gestão completa de licenças de software)
- ✅ **Localização Física** (Edifício, Piso, Sala)
- ✅ **Informações Financeiras** (Preço de compra, valor atual, fornecedor)
- ✅ **Sistema Operativo** (OS, Versão, Build, Arquitetura)
- ✅ **Garantias e Suporte** (Datas de expiração, níveis de suporte)

---

## 📊 ESTRUTURA DE DADOS

### **1. ASSETS (Hardware e Equipamentos)**

#### **Identificação**
```javascript
{
  id: UUID,
  assetTag: STRING (único),
  name: STRING,
  type: ENUM [
    'desktop', 'laptop', 'server', 'tablet',
    'smartphone', 'printer', 'scanner',
    'network_device', 'monitor', 'other'
  ],
  status: ENUM ['active', 'inactive', 'maintenance', 'retired', 'lost', 'stolen']
}
```

#### **Hardware**
```javascript
{
  manufacturer: STRING,        // Ex: Dell, HP, Lenovo
  model: STRING,               // Ex: Latitude 7420
  serialNumber: STRING,        // Número de série único
  
  // CPU
  processor: STRING,           // Ex: Intel Core i7-11850H
  processorCores: INTEGER,     // Ex: 8 cores
  
  // Memória RAM
  ram: STRING,                 // Descrição completa
  ramGB: FLOAT,                // Ex: 16.0 GB
  
  // Armazenamento
  storage: STRING,             // Descrição completa
  storageGB: FLOAT,            // Ex: 512.0 GB
  storageType: ENUM ['HDD', 'SSD', 'NVME', 'Hybrid', 'Other'],
  
  // GPU
  graphicsCard: STRING         // Ex: NVIDIA GeForce RTX 3060
}
```

#### **Sistema Operativo**
```javascript
{
  os: STRING,                  // Ex: Windows 11 Pro
  osVersion: STRING,           // Ex: 23H2
  osBuild: STRING,             // Ex: 22631.4037
  osArchitecture: ENUM ['x86', 'x64', 'ARM', 'ARM64']
}
```

#### **Rede**
```javascript
{
  hostname: STRING,            // Ex: PC-JOAO-001
  ipAddress: STRING,           // Ex: 192.168.1.100
  macAddress: STRING,          // Ex: 00:1B:44:11:3A:B7
  domain: STRING               // Ex: empresa.local
}
```

#### **🔒 Segurança**
```javascript
{
  // Antivírus
  hasAntivirus: BOOLEAN,
  antivirusName: STRING,       // Ex: Windows Defender
  antivirusVersion: STRING,    // Ex: 4.18.24080.9
  antivirusUpdated: DATE,      // Última atualização
  
  // Proteção
  hasFirewall: BOOLEAN,        // Firewall ativo
  isEncrypted: BOOLEAN         // Disco encriptado (BitLocker, FileVault)
}
```

#### **Localização Física**
```javascript
{
  location: STRING,            // Ex: Sede Lisboa
  building: STRING,            // Ex: Edifício Principal
  floor: STRING,               // Ex: 3º Andar
  room: STRING                 // Ex: Sala 305
}
```

#### **💰 Financeiro**
```javascript
{
  purchaseDate: DATE,          // Data de compra
  purchasePrice: DECIMAL,      // Preço de compra
  currentValue: DECIMAL,       // Valor atual (depreciação)
  warrantyExpiry: DATE,        // Expiração da garantia
  supplier: STRING             // Fornecedor
}
```

#### **Rastreamento**
```javascript
{
  lastSeen: DATE,              // Última vez visto online
  lastInventoryScan: DATE,     // Último scan de inventário
  collectionMethod: ENUM ['manual', 'web', 'agent', 'script', 'api'],
  rawData: JSONB,              // Dados brutos do último scan
  notes: TEXT                  // Observações
}
```

---

### **2. SOFTWARE (Aplicações Instaladas)**

#### **Identificação**
```javascript
{
  id: UUID,
  assetId: UUID,               // Asset onde está instalado
  name: STRING,                // Ex: Microsoft Office 365
  vendor: STRING,              // Ex: Microsoft
  version: STRING,             // Ex: 16.0.16827.20166
  edition: STRING,             // Ex: Professional Plus
  architecture: ENUM ['x86', 'x64', 'ARM', 'ARM64', 'Universal']
}
```

#### **Categoria**
```javascript
{
  category: ENUM [
    'operating_system',        // Sistema Operativo
    'office_suite',            // Suite de escritório
    'security',                // Segurança
    'development',             // Desenvolvimento
    'database',                // Base de dados
    'design',                  // Design gráfico
    'communication',           // Comunicação
    'browser',                 // Navegador
    'productivity',            // Produtividade
    'utility',                 // Utilitários
    'game',                    // Jogos
    'other'                    // Outros
  ]
}
```

#### **Instalação**
```javascript
{
  installDate: DATE,           // Data de instalação
  installLocation: STRING,     // Ex: C:\Program Files\...
  installSize: BIGINT,         // Tamanho em bytes
  publisher: STRING,           // Publicador
  uninstallString: TEXT        // Comando de desinstalação
}
```

#### **🔑 Licença**
```javascript
{
  licenseType: ENUM ['perpetual', 'subscription', 'trial', 'free', 'open_source'],
  licenseKey: STRING,          // Chave de licença
  licenseExpiry: DATE,         // Data de expiração
  isLicensed: BOOLEAN          // Licenciado ou não
}
```

#### **Status e Uso**
```javascript
{
  isActive: BOOLEAN,           // Software ativo
  lastUsed: DATE,              // Última vez usado
  autoUpdate: BOOLEAN,         // Atualização automática
  supportUrl: STRING,          // URL de suporte
  notes: TEXT                  // Observações
}
```

---

### **3. LICENSES (Gestão de Licenças)**

#### **Identificação**
```javascript
{
  id: UUID,
  name: STRING,                // Nome da licença
  vendor: STRING,              // Fornecedor (Ex: Adobe, Microsoft)
  product: STRING,             // Produto (Ex: Creative Cloud, Office 365)
  version: STRING              // Versão
}
```

#### **Licença**
```javascript
{
  licenseKey: STRING,          // Chave de licença
  licenseType: ENUM [
    'perpetual',               // Perpétua
    'subscription',            // Subscrição
    'trial',                   // Teste
    'volume',                  // Licença de volume
    'oem',                     // OEM
    'academic',                // Académica
    'nfr'                      // Not For Resale
  ]
}
```

#### **📊 Gestão de Lugares (Seats)**
```javascript
{
  totalSeats: INTEGER,         // Total de lugares comprados
  usedSeats: INTEGER,          // Lugares em uso
  availableSeats: VIRTUAL      // Lugares disponíveis (calculado)
}
```

#### **📅 Datas Importantes**
```javascript
{
  purchaseDate: DATE,          // Data de compra
  activationDate: DATE,        // Data de ativação
  expiryDate: DATE,            // Data de expiração
  renewalDate: DATE,           // Data de renovação
  supportExpiry: DATE          // Expiração do suporte
}
```

#### **Status**
```javascript
{
  status: ENUM ['active', 'expired', 'suspended', 'cancelled', 'trial'],
  autoRenew: BOOLEAN           // Renovação automática
}
```

#### **💰 Financeiro**
```javascript
{
  purchasePrice: DECIMAL,      // Preço de compra
  renewalPrice: DECIMAL,       // Preço de renovação
  currency: STRING,            // Moeda (EUR, USD)
  billingCycle: ENUM ['monthly', 'quarterly', 'yearly', 'one_time']
}
```

#### **Fornecedor**
```javascript
{
  supplier: STRING,            // Nome do fornecedor
  supplierContact: STRING,     // Contacto
  supplierEmail: STRING        // Email
}
```

#### **📄 Documentação**
```javascript
{
  purchaseOrder: STRING,       // Número de ordem de compra
  invoiceNumber: STRING,       // Número de fatura
  contractDocument: STRING     // Caminho para documento
}
```

#### **🆘 Suporte**
```javascript
{
  supportLevel: ENUM ['none', 'basic', 'standard', 'premium', 'enterprise'],
  supportContact: STRING,      // Contacto de suporte
  supportExpiry: DATE          // Expiração do suporte
}
```

#### **🔔 Alertas**
```javascript
{
  notifyDaysBefore: INTEGER,   // Dias antes para notificar (padrão: 30)
  lastNotificationSent: DATE   // Última notificação enviada
}
```

---

### **4. ASSET_LICENSES (Relação Asset ↔ Licença)**

```javascript
{
  id: UUID,
  assetId: UUID,               // Asset que usa a licença
  licenseId: UUID,             // Licença atribuída
  assignedDate: DATE,          // Data de atribuição
  notes: TEXT                  // Observações
}
```

---

## 🔄 MÉTODOS DE COLETA

### **1. Manual**
- Inserção manual de dados via interface web
- Ideal para equipamentos que não podem ter agente

### **2. Web**
- Coleta via browser (JavaScript)
- Informações básicas do sistema

### **3. Agent (Desktop Agent)**
- **Agente instalado no PC/Mac**
- Coleta automática completa:
  - Hardware detalhado
  - Software instalado
  - Segurança (antivírus, firewall)
  - Rede (IP, MAC, hostname)
  - Sistema operativo completo

### **4. Script**
- PowerShell (Windows)
- Bash (Linux/Mac)
- Execução periódica via task scheduler/cron

### **5. API**
- Integração com outras ferramentas
- MDM (Mobile Device Management)
- RMM (Remote Monitoring and Management)

---

## 📈 FUNCIONALIDADES DO SISTEMA

### **1. Dashboard de Inventário**
```
✅ Total de Assets por tipo
✅ Assets ativos vs inativos
✅ Assets por localização
✅ Software mais instalado
✅ Licenças a expirar
✅ Garantias a expirar
✅ Assets sem antivírus
✅ Assets desatualizados
```

### **2. Alertas Automáticos**
```
🔔 Licenças expirando em X dias
🔔 Garantias expirando
🔔 Antivírus desatualizado
🔔 Assets offline há mais de X dias
🔔 Licenças sem lugares disponíveis
🔔 Software não licenciado detectado
```

### **3. Relatórios**
```
📊 Inventário completo de hardware
📊 Lista de software instalado
📊 Gestão de licenças e compliance
📊 Custos de TI (TCO - Total Cost of Ownership)
📊 Assets por utilizador/cliente
📊 Software por versão
📊 Análise de segurança (antivírus, firewall)
```

### **4. Gestão de Ciclo de Vida**
```
🔄 Purchase → Active → Maintenance → Retired
📅 Tracking de garantias
💰 Depreciação de valor
🔄 Renovação de licenças
```

---

## 🔍 QUERIES ÚTEIS

### **Assets sem Antivírus**
```javascript
const unsafeAssets = await Asset.findAll({
  where: {
    type: ['desktop', 'laptop', 'server'],
    hasAntivirus: false,
    status: 'active'
  }
});
```

### **Licenças a Expirar (30 dias)**
```javascript
const expiringLicenses = await License.findAll({
  where: {
    expiryDate: {
      [Op.between]: [new Date(), add(new Date(), { days: 30 })]
    },
    status: 'active'
  }
});
```

### **Software Não Licenciado**
```javascript
const unlicensedSoftware = await Software.findAll({
  where: {
    licenseType: { [Op.in]: ['trial', 'free'] },
    isLicensed: false,
    category: { [Op.notIn]: ['utility', 'browser'] }
  }
});
```

### **Assets por Utilizador**
```javascript
const userAssets = await User.findOne({
  where: { id: userId },
  include: [{
    model: Asset,
    as: 'userAssets',
    include: [{ model: Software, as: 'software' }]
  }]
});
```

---

## 🎯 CASOS DE USO

### **1. Auditoria de Compliance**
```
✓ Verificar se todo o software está licenciado
✓ Identificar software pirata
✓ Garantir conformidade com contratos
✓ Relatórios para auditorias ISO/GDPR
```

### **2. Gestão de Segurança**
```
✓ Identificar PCs sem antivírus
✓ Verificar atualizações de segurança
✓ Monitorizar encriptação de discos
✓ Alertar sobre vulnerabilidades
```

### **3. Gestão Financeira**
```
✓ TCO (Total Cost of Ownership)
✓ ROI de equipamentos
✓ Planeamento de substituição
✓ Controlo de custos de licenças
```

### **4. Suporte Técnico**
```
✓ Ver configuração do PC do utilizador
✓ Histórico de alterações
✓ Software instalado
✓ Problemas conhecidos
```

---

## 🔐 SEGURANÇA DOS DADOS

### **Dados Sensíveis Protegidos:**
```
🔒 Licensekeys (encriptadas)
🔒 Informações financeiras
🔒 Dados de localização
🔒 Informações de utilizadores
```

### **Multi-Tenant:**
```
✓ Isolamento por organizationId
✓ Separação cliente/tenant
✓ Controlo de acesso granular
```

---

## 📱 AGENTE DESKTOP

O **Desktop Agent** é uma aplicação standalone que:

```
✅ Coleta automática de inventário
✅ Atualização em tempo real
✅ Lightweight (baixo consumo)
✅ Cross-platform (Windows, Mac, Linux)
✅ Comunicação segura (API REST)
✅ Execução em background
✅ Scan periódico configurável
```

**Informações Coletadas pelo Agent:**
- Hardware completo (CPU, RAM, Storage)
- Software instalado (nome, versão, vendor)
- Sistema operativo (versão, build, patches)
- Rede (IP, MAC, hostname, domínio)
- Segurança (antivírus, firewall, encriptação)
- Usuário atual
- Última vez online

---

## 🎉 RESULTADO FINAL

O sistema de inventário do TatuTicket é **enterprise-grade** e compete com soluções comerciais como:

- ✅ **Lansweeper** - Sistema de descoberta de assets
- ✅ **GLPI** - Gestão de inventário IT
- ✅ **Snow License Manager** - Gestão de licenças
- ✅ **ManageEngine AssetExplorer** - Gestão de ativos
- ✅ **Flexera** - Software Asset Management

---

## 📊 ESTATÍSTICAS

```
✅ 3 Tabelas principais (Assets, Software, Licenses)
✅ 100+ campos de dados
✅ 20+ índices otimizados
✅ 5 métodos de coleta
✅ 10+ tipos de assets
✅ 12+ categorias de software
✅ 7+ tipos de licenças
✅ Alertas automáticos
✅ Relatórios avançados
✅ Multi-tenant completo
```

---

**Sistema de Inventário 100% Completo e Pronto para Produção! 🚀**
