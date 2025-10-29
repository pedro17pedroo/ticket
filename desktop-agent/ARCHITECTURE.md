# 🏗️ Arquitetura - TatuTicket Desktop Agent

**Documentação técnica da arquitetura e funcionamento interno**

---

## 📐 **Visão Geral**

```
┌─────────────────────────────────────────────────────────────┐
│                     TatuTicket Ecosystem                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Web Portal  │◄───────►│   Backend    │                  │
│  │  (React)     │  HTTPS  │  (Node.js)   │                  │
│  └──────────────┘         └───────┬──────┘                  │
│                                    │                          │
│                                    │ WebSocket               │
│                                    │ + REST API              │
│                                    │                          │
│                           ┌────────▼────────┐                │
│                           │  Desktop Agent  │                │
│                           │   (Electron)    │                │
│                           └────────┬────────┘                │
│                                    │                          │
│                           ┌────────▼────────┐                │
│                           │   Client OS     │                │
│                           │ Windows/Mac/Lnx │                │
│                           └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 **Estrutura do Projeto**

```
desktop-agent/
├── package.json              # Dependências e scripts
├── README.md                 # Documentação principal
├── INSTALL.md                # Guia de instalação
├── REMOTE-ACCESS.md          # Documentação de acesso remoto
├── ARCHITECTURE.md           # Este arquivo
│
├── src/
│   ├── main/                 # Processo principal (Node.js)
│   │   └── main.js           # Entry point, gerencia janela e tray
│   │
│   ├── renderer/             # Interface (HTML/CSS/JS)
│   │   ├── index.html        # UI principal
│   │   ├── styles.css        # Estilos
│   │   └── app.js            # Lógica da UI
│   │
│   ├── preload/              # Bridge seguro main↔renderer
│   │   └── preload.js        # Context bridge
│   │
│   └── modules/              # Módulos de funcionalidade
│       ├── inventoryCollector.js  # Coleta de inventário
│       ├── remoteAccess.js        # Acesso remoto
│       └── apiClient.js           # Comunicação com backend
│
└── assets/                   # Recursos estáticos
    ├── icons/                # Ícones da aplicação
    └── tray/                 # Ícones da bandeja do sistema
```

---

## 🔧 **Componentes Principais**

### **1. Main Process (main.js)**

**Responsabilidades:**
- Criar e gerenciar janela da aplicação
- Criar ícone na bandeja do sistema
- Gerenciar lifecycle da aplicação
- Orquestrar módulos (inventory, remote, api)
- Lidar com IPC (comunicação com renderer)

**Tecnologias:**
- Electron Main Process
- Node.js APIs nativas
- electron-store (configuração persistente)
- auto-launch (iniciar com sistema)

**Fluxo:**
```javascript
app.ready
  ↓
createWindow()
  ↓
createTray()
  ↓
initialize()
  ├─ Carregar config
  ├─ Inicializar ApiClient
  ├─ Inicializar InventoryCollector
  └─ Inicializar RemoteAccess
```

---

### **2. Inventory Collector (inventoryCollector.js)**

**Responsabilidades:**
- Coletar informações detalhadas do hardware
- Coletar informações do sistema operativo
- Listar software instalado
- Verificar status de segurança
- Enviar dados para o backend periodicamente

**Tecnologias:**
- **systeminformation**: Biblioteca multiplataforma para info do sistema
- **node-machine-id**: ID único do dispositivo
- **child_process**: Comandos nativos do OS

**Dados Coletados:**

```javascript
{
  // Identificação
  machineId: "unique-machine-id",
  hostname: "LAPTOP-USER01",
  uuid: "system-uuid",
  
  // Hardware
  manufacturer: "Dell",
  model: "Latitude 7420",
  serialNumber: "ABC12345",
  processor: "Intel Core i7-1185G7",
  processorCores: 8,
  ramGB: 16,
  storageGB: 512,
  storageType: "NVMe SSD",
  graphicsCard: "Intel Iris Xe Graphics",
  
  // Sistema Operativo
  os: "Windows 11 Pro",
  osVersion: "22H2",
  osArchitecture: "x64",
  
  // Rede
  ipAddress: "192.168.1.100",
  macAddress: "00:11:22:33:44:55",
  
  // Segurança
  hasAntivirus: true,
  antivirusName: "Windows Defender",
  hasFirewall: true,
  isEncrypted: true,
  
  // Software (até 100 aplicações)
  software: [
    {
      name: "Google Chrome",
      version: "120.0.6099.109",
      publisher: "Google LLC",
      installDate: "2024-01-15",
      category: "application"
    }
  ]
}
```

**Processo de Coleta:**

```
start()
  ↓
Coleta Imediata
  ↓
Agendar Coleta Periódica (60min padrão)
  ↓
┌─────────────────┐
│ collect()       │
│   ↓             │
│ getSystemInfo() │◄─── Loop periódico
│   ↓             │
│ sendToBackend() │
└─────────────────┘
```

---

### **3. Remote Access (remoteAccess.js)**

**Responsabilidades:**
- Estabelecer conexão WebSocket com servidor
- Receber e executar comandos remotos
- Capturar screenshots
- Enviar informações do sistema em tempo real
- Gerenciar sessões de acesso remoto

**Tecnologias:**
- **Socket.IO Client**: Comunicação bidirecional
- **child_process**: Execução de comandos
- **OS-specific tools**: Screenshot (PowerShell, screencapture, scrot)

**Eventos WebSocket:**

```javascript
// Enviados pelo cliente
'agent:register'         // Registrar agente ao conectar
'remote:command-result'  // Resultado de comando
'remote:screenshot-result' // Screenshot capturado
'remote:system-info-result' // Info do sistema

// Recebidos do servidor
'remote:start-session'   // Iniciar sessão
'remote:end-session'     // Encerrar sessão
'remote:execute-command' // Executar comando
'remote:screenshot'      // Capturar screenshot
'remote:get-system-info' // Obter info sistema
```

**Segurança:**

```javascript
// Comandos bloqueados por padrão
const dangerousCommands = [
  'rm -rf',      // Linux/Mac
  'del /f',      // Windows
  'format',      // Windows
  'mkfs',        // Linux
  'dd if='       // Linux/Mac
];

// Timeout de comando
const COMMAND_TIMEOUT = 30000; // 30 segundos
```

---

### **4. API Client (apiClient.js)**

**Responsabilidades:**
- Gerenciar conexão HTTP com backend
- Autenticação via token
- Enviar inventário
- Health checks
- Tratamento de erros

**Endpoints Utilizados:**

```javascript
GET  /api/health                    // Health check
POST /api/inventory/agent-collect   // Enviar inventário
GET  /api/inventory/assets/machine/:id  // Obter info do asset
POST /api/agents/register           // Registrar agente
POST /api/agents/heartbeat          // Manter conexão viva
```

**Axios Interceptors:**

```javascript
// Request: Adicionar token
config.headers.Authorization = `Bearer ${token}`;

// Response: Tratar erros
if (error.response?.status === 401) {
  // Token inválido, desconectar
  this.connected = false;
}
```

---

### **5. Renderer Process (app.js + index.html)**

**Responsabilidades:**
- Interface visual para o usuário
- Formulários de configuração
- Dashboard de status
- Notificações visuais
- Gerenciamento de tabs

**Comunicação com Main:**

```javascript
// Via Context Bridge (preload.js)
window.electronAPI.connect({ serverUrl, token })
window.electronAPI.syncNow()
window.electronAPI.getSystemInfo()
window.electronAPI.toggleRemoteAccess(enabled)

// Eventos recebidos
window.electronAPI.onNotification(callback)
window.electronAPI.onNavigate(callback)
```

**Estados da UI:**

```javascript
state = {
  connected: false,
  config: {
    serverUrl,
    token,
    autoLaunch,
    syncInterval,
    remoteAccessEnabled
  },
  status: {
    hostname,
    machineId,
    lastSync,
    remoteAccessActive
  }
}
```

---

## 🔄 **Fluxos de Trabalho**

### **Fluxo de Conexão Inicial**

```
1. Usuário abre aplicação
   ↓
2. Carrega configurações salvas (electron-store)
   ↓
3. Se tiver token:
   ├─ Conecta automaticamente
   ├─ Inicia InventoryCollector
   ├─ Inicia RemoteAccess (se habilitado)
   └─ Mostra painel conectado
   
4. Se não tiver token:
   └─ Mostra formulário de conexão
```

### **Fluxo de Sincronização**

```
InventoryCollector.collect()
  ↓
Coleta todas informações do sistema (1-2 seg)
  ↓
Prepara objeto JSON
  ↓
ApiClient.sendInventory(data)
  ↓
POST /api/inventory/agent-collect
  ↓
Backend processa:
  ├─ Cria ou atualiza Asset
  ├─ Remove software antigo
  ├─ Adiciona novo software
  └─ Retorna sucesso
  ↓
Atualiza lastSync no store
  ↓
Notifica usuário
```

### **Fluxo de Acesso Remoto**

```
Usuário habilita acesso remoto
  ↓
RemoteAccess.start()
  ↓
Conecta WebSocket ao servidor
  ↓
Emite 'agent:register' com machineId
  ↓
Servidor registra agente como disponível
  ↓
Quando técnico inicia sessão:
  ├─ Servidor emite 'remote:start-session'
  ├─ Agente recebe e armazena sessionId
  ├─ Notifica usuário visualmente
  └─ Aguarda comandos
  
Durante sessão:
  ├─ Servidor emite 'remote:execute-command'
  ├─ Agente valida comando
  ├─ Executa via child_process
  ├─ Captura stdout/stderr
  └─ Emite 'remote:command-result'
  
Fim da sessão:
  ├─ Servidor emite 'remote:end-session'
  ├─ Agente limpa sessionId
  └─ Notifica usuário
```

---

## 🔐 **Segurança**

### **Camadas de Proteção**

1. **Context Isolation (Electron)**
   ```javascript
   webPreferences: {
     contextIsolation: true,  // Isola contextos
     nodeIntegration: false,  // Desabilita Node.js no renderer
     preload: preload.js      // API controlada
   }
   ```

2. **Token-based Authentication**
   - Token JWT armazenado localmente (encrypted)
   - Renovação automática
   - Revogação instantânea

3. **Command Validation**
   - Whitelist de comandos seguros (futuro)
   - Blacklist de comandos destrutivos
   - Timeout de execução

4. **Audit Trail**
   - Todos os comandos registrados
   - Sessões com timestamp
   - Impossível apagar logs

5. **Encrypted Communication**
   - HTTPS para REST API
   - WSS (WebSocket Secure) para real-time

---

## 📊 **Performance**

### **Uso de Recursos**

| Componente | CPU | RAM | Disco | Rede |
|------------|-----|-----|-------|------|
| Idle | <1% | 50 MB | 100 MB | 0 KB/s |
| Coleta | 5-10% | 150 MB | 100 MB | 2 KB/s |
| Acesso Remoto | <5% | 80 MB | 100 MB | 5-10 KB/s |

### **Otimizações**

- **Lazy Loading**: Módulos carregados sob demanda
- **Coleta Incremental**: Apenas mudanças desde última vez (futuro)
- **Compressão**: Dados comprimidos antes de enviar
- **Debounce**: Evitar múltiplas coletas simultâneas

---

## 🧪 **Testing**

### **Para Desenvolvimento**

```bash
# Instalar
npm install

# Rodar em dev mode
npm run dev

# Build de teste
npm run pack  # Sem criar instalador
```

### **Para Testes de Integração**

```bash
# Backend deve estar rodando
cd ../backend
npm start

# Em outro terminal, iniciar agent
cd ../desktop-agent
npm run dev
```

### **Para Testes de Build**

```bash
# Build para plataforma atual
npm run build

# Instalar e testar
# Windows: dist/TatuTicket-Agent-Setup-1.0.0.exe
# macOS: dist/TatuTicket-Agent-1.0.0.dmg
# Linux: dist/TatuTicket-Agent-1.0.0.AppImage
```

---

## 🚀 **Deploy em Produção**

### **1. Preparar Build**

```bash
# Atualizar versão
npm version patch  # 1.0.0 → 1.0.1

# Build para todas plataformas
npm run build
```

### **2. Code Signing (Recomendado)**

**Windows:**
```bash
# Obter certificado code signing
# Configurar em electron-builder
{
  "win": {
    "certificateFile": "cert.pfx",
    "certificatePassword": "..."
  }
}
```

**macOS:**
```bash
# Developer ID Application certificate
# Configurar em electron-builder
{
  "mac": {
    "identity": "Developer ID Application: ..."
  }
}
```

### **3. Distribuição**

- Upload para servidor de downloads
- Criar link de download público
- Atualizar documentação com link
- Notificar usuários de nova versão

### **4. Auto-Update (Futuro)**

```javascript
// Usando electron-updater
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();
```

---

## 📝 **Roadmap de Melhorias**

### **v1.1 (Próxima Versão)**
- [ ] Auto-update integrado
- [ ] Coleta de métricas de performance
- [ ] Relatórios locais em PDF
- [ ] Modo offline (queue de sincronização)

### **v1.2**
- [ ] Transferência de arquivos segura
- [ ] Terminal interativo completo
- [ ] Gravação de sessões remotas
- [ ] Multi-idioma (i18n)

### **v2.0**
- [ ] VNC/RDP integration
- [ ] Mobile companion app
- [ ] AI-assisted troubleshooting
- [ ] Predictive maintenance

---

## 🤝 **Contribuindo**

### **Estrutura de Commits**

```
feat: Nova funcionalidade
fix: Correção de bug
docs: Atualização de documentação
style: Formatação de código
refactor: Refatoração
test: Testes
chore: Manutenção
```

### **Pull Request Process**

1. Fork o repositório
2. Crie branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add AmazingFeature'`)
4. Push para branch (`git push origin feature/AmazingFeature`)
5. Abra Pull Request

---

## 📚 **Referências**

- **Electron**: https://www.electronjs.org/docs
- **systeminformation**: https://systeminformation.io/
- **Socket.IO**: https://socket.io/docs/v4/
- **Electron Builder**: https://www.electron.build/

---

**🏗️ Arquitetura robusta, segura e escalável para inventário de TI moderno.**
