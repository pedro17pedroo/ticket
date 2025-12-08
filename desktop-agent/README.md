# 🖥️ TatuTicket Desktop Agent

**Desktop Agent multiplataforma para inventário automático e acesso remoto**

---

## 📋 **Funcionalidades**

### ✅ **Gestão de Tickets** 🆕
- Visualização de todos os seus tickets
- Criação de novos tickets
- Chat em tempo real com suporte
- Indicadores de SLA visuais
- Filtros avançados (status, prioridade, busca)
- Notificações de novas mensagens

### ✅ **Catálogo de Serviços** 🆕
- Navegação por categorias
- Busca de serviços e recursos
- Solicitação com justificativa
- Indicadores de tempo estimado
- Indicadores de aprovação necessária
- Criação automática de ticket

### ✅ **Base de Conhecimento** 🆕
- Artigos e tutoriais
- Busca por título, conteúdo e tags
- Filtros por categoria
- Contador de visualizações
- Sistema de feedback (útil/não útil)
- Acesso offline aos artigos visualizados

### ✅ **Inventário Automático**
- Coleta detalhada de hardware e software
- Sincronização automática periódica
- Informações de segurança (Antivírus, Firewall, Criptografia)
- Detecção de dispositivos (Desktop, Laptop, Servidor)

### ✅ **Acesso Remoto**
- Execução de comandos remotos
- Captura de screenshots
- Monitoramento em tempo real
- Sessões seguras via WebSocket
- Notificações de solicitações de acesso

### ✅ **Interface Moderna**
- Dashboard com gráficos e estatísticas
- Configurações fáceis
- Notificações visuais
- System tray integration
- Design responsivo

---

## 🚀 **Instalação**

### **Pré-requisitos**
- Node.js 18+ instalado
- Conexão com servidor TatuTicket

### **Desenvolvimento**

```bash
# Instalar dependências
cd desktop-agent
npm install

# Executar em modo de desenvolvimento
npm run dev

# Ou modo normal
npm start
```

### **Build para Produção**

```bash
# Build para Windows
npm run build:win

# Build para macOS
npm run build:mac

# Build para Linux
npm run build:linux

# Build para todas as plataformas
npm run build
```

Os instaladores serão criados na pasta `dist/`.

---

## 📦 **Instalação para Usuários**

### **Windows**
1. Baixe o instalador `.exe`
2. Execute e siga o assistente de instalação
3. O agente iniciará automaticamente

### **macOS**
1. Baixe o arquivo `.dmg`
2. Arraste para a pasta Aplicações
3. Abra e permita na segurança do sistema

### **Linux**
1. Baixe o `.AppImage` ou `.deb`
2. Para AppImage: `chmod +x *.AppImage && ./TatuTicket-Agent.AppImage`
3. Para DEB: `sudo dpkg -i tatuticket-agent.deb`

---

## 🔧 **Configuração**

### **Primeira Vez**

1. **Abrir o Agente**
   - Windows/Linux: Clique no ícone na bandeja do sistema
   - macOS: Clique no ícone na barra de menu

2. **Conectar ao Servidor**
   - URL do Servidor: `https://seu-servidor.com` ou `http://localhost:3000`
   - Token: Obtenha no portal web (Perfil → API Token)

3. **Configurações Recomendadas**
   - ✅ Iniciar com o sistema
   - ✅ Sincronização automática
   - ⏱️ Intervalo: 60 minutos
   - 🔒 Acesso remoto: Apenas se necessário

---

## 🎯 **Como Usar**

### **Para Organizações (Administradores)**

#### **Deploy em Massa**

1. **Gerar Token de Organização**
   ```bash
   # No portal web, vá em Configurações → API → Gerar Token de Agente
   ```

2. **Distribuir Instalador**
   - Compartilhe o instalador com os colaboradores
   - Forneça URL do servidor e token

3. **Instalação Silenciosa (Opcional)**
   ```bash
   # Windows
   TatuTicket-Agent-Setup.exe /S /SERVER_URL="https://..." /TOKEN="..."
   
   # Linux
   TATUTICKET_SERVER_URL="https://..." TATUTICKET_TOKEN="..." ./install.sh
   ```

#### **Monitoramento**

- Acesse o portal web → Inventário
- Veja todos os equipamentos conectados
- Status em tempo real
- Última sincronização

### **Para Clientes (Usuários Finais)**

#### **Instalação**

1. Baixe o instalador fornecido pela empresa
2. Execute e siga as instruções
3. Cole o token fornecido
4. Pronto! O agente sincronizará automaticamente

#### **Menu da Bandeja**

```
TatuTicket Agent
├── ✅ Conectado
├── 🟢 Acesso Remoto: Ativo
├── 📊 Abrir Painel
├── 🔄 Sincronizar Agora
├── ⚙️ Configurações
└── 🚪 Sair
```

---

## 🔐 **Segurança e Privacidade**

### **O que é Coletado**

✅ **Hardware:**
- Fabricante, modelo, número de série
- Processador, memória RAM, armazenamento
- Placas gráficas, monitores
- Rede (IP, MAC)

✅ **Software:**
- Sistema operativo e versão
- Aplicações instaladas (até 100)
- Software de sistema

✅ **Segurança:**
- Status do antivírus
- Status do firewall
- Criptografia de disco

❌ **NÃO é Coletado:**
- Arquivos pessoais
- Histórico de navegação
- Senhas ou credenciais
- Conteúdo de documentos
- Dados bancários

### **Acesso Remoto**

- ⚠️ **Desabilitado por padrão**
- ⚠️ **Requer autorização explícita**
- ✅ Todas as sessões são registradas
- ✅ Notificações quando ativo
- ✅ Comandos destrutivos bloqueados

---

## 🛠️ **Solução de Problemas**

### **Não Conecta ao Servidor**

```bash
# Verificar conectividade
ping seu-servidor.com

# Verificar se o servidor está rodando
curl http://localhost:3000/api/health

# Logs do agente
# Windows: %APPDATA%\tatuticket-agent\logs
# Linux/Mac: ~/.config/tatuticket-agent/logs
```

### **Sincronização Falha**

1. Verificar se está conectado
2. Verificar permissões de rede
3. Verificar se o token é válido
4. Clicar em "Sincronizar Agora" manualmente

### **Acesso Remoto Não Funciona**

1. Verificar se está habilitado nas configurações
2. Verificar firewall local
3. Verificar se o WebSocket está acessível
4. Reiniciar o agente

---

## 📊 **Informações Técnicas**

### **Tecnologias Utilizadas**

- **Electron** - Framework desktop multiplataforma
- **systeminformation** - Coleta de informações do sistema
- **Socket.IO** - Comunicação em tempo real
- **Axios** - Cliente HTTP
- **electron-store** - Armazenamento local

### **Requisitos do Sistema**

| OS | Versão Mínima | RAM | Disco |
|----|---------------|-----|-------|
| Windows | 10 | 512 MB | 100 MB |
| macOS | 10.13 | 512 MB | 100 MB |
| Linux | Ubuntu 18.04+ | 512 MB | 100 MB |

### **Portas e Protocolos**

- **HTTP/HTTPS**: Comunicação com API (porta configurável)
- **WebSocket**: Acesso remoto (mesma porta do servidor)
- **Saída**: Apenas conexões de saída (não requer portas abertas)

---

## 🔄 **Atualizações**

### **Automáticas (Recomendado)**

O agente verifica atualizações automaticamente e notifica quando disponível.

### **Manual**

1. Baixe a nova versão
2. Desinstale a versão antiga (configurações são preservadas)
3. Instale a nova versão

---

## 🐛 **Reportar Problemas**

Encontrou um bug ou tem uma sugestão?

1. Acesse: https://github.com/seu-repo/issues
2. Crie um novo issue
3. Descreva o problema detalhadamente
4. Inclua logs se possível

---

## 📝 **Changelog**

### **v2.0.0 - Fase 1 Completa** (06/12/2024) 🆕
- ✨ **Catálogo de Serviços** - Solicite recursos de TI
- ✨ **Base de Conhecimento** - Acesse artigos e tutoriais
- ✨ **Gestão de Tickets** - Interface completa com chat
- ✅ 10 novos endpoints do backend consumidos
- ✅ Indicadores de SLA visuais
- ✅ Filtros avançados de tickets
- ✅ Busca em tempo real
- ✅ Modais responsivos
- ✅ Loading states em todas as operações
- 📚 Documentação completa (2,000+ linhas)

### **v1.0.0** (26/01/2025)
- ✨ Lançamento inicial
- ✅ Inventário automático completo
- ✅ Acesso remoto seguro
- ✅ Interface moderna
- ✅ Suporte Windows, macOS, Linux
- ✅ System tray integration
- ✅ Auto-launch configurável

---

## 📄 **Licença**

MIT License - Veja LICENSE para mais detalhes

---

## 🤝 **Suporte**

- 📧 Email: suporte@tatuticket.com
- 💬 Chat: https://tatuticket.com/suporte
- 📚 Documentação: https://docs.tatuticket.com

---

## 🎉 **Desenvolvido com ❤️ pela Equipe TatuTicket**
