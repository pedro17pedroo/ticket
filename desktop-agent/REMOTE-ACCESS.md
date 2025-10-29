# 🔒 Acesso Remoto - TatuTicket Agent

**Guia completo sobre a funcionalidade de acesso remoto**

---

## ⚠️ **AVISO IMPORTANTE**

O acesso remoto permite que técnicos **autorizados** controlem este computador. 

**Use apenas em redes confiáveis e com técnicos conhecidos.**

---

## 🎯 **O que é o Acesso Remoto?**

O módulo de acesso remoto permite que administradores da organização:

✅ Executem comandos no terminal remotamente  
✅ Visualizem informações do sistema em tempo real  
✅ Capturem screenshots da tela  
✅ Monitorem processos e performance  

❌ **NÃO permite:**
- Acesso a arquivos pessoais sem autorização
- Transferência de arquivos (por segurança)
- Controle total do mouse/teclado
- Acesso sem que o usuário saiba

---

## 🔐 **Como Funciona**

### **1. Habilitação**

```
Usuário → Configurações → Habilitar Acesso Remoto ✅
```

### **2. Conexão**

```
Agente ←→ Servidor (WebSocket Seguro) ←→ Portal Web
```

### **3. Sessão**

```
Técnico → Inicia Sessão → Usuário recebe notificação
           ↓
       Comandos executados
           ↓
       Registro de auditoria
           ↓
       Sessão encerrada → Usuário notificado
```

---

## 🛡️ **Segurança Implementada**

### **Proteções Ativas**

1. **Notificações Visuais**
   - 🟢 Quando acesso remoto está ativo
   - 🔵 Quando sessão é iniciada
   - 🔴 Quando sessão é encerrada

2. **Comandos Bloqueados**
   - Comandos destrutivos (rm -rf, format, etc.)
   - Alterações de sistema críticas
   - Instalação de software não autorizado

3. **Timeout Automático**
   - Sessões expiram após 30 minutos de inatividade
   - Conexão automática após reconexão

4. **Auditoria Completa**
   - Todos os comandos são registrados
   - Histórico disponível no portal web
   - Impossível apagar rastros

5. **Autenticação**
   - Token único por dispositivo
   - Apenas usuários autorizados
   - Revogação instantânea

---

## 👨‍💼 **Para Administradores**

### **Iniciar Sessão Remota**

1. **No Portal Web:**
   ```
   Inventário → [Selecionar equipamento] → Ações → Acesso Remoto
   ```

2. **Verificações:**
   - ✅ Agente online
   - ✅ Acesso remoto habilitado
   - ✅ Usuário autorizado

3. **Durante a Sessão:**
   - Execute comandos com responsabilidade
   - Evite operações destrutivas
   - Comunique-se com o usuário
   - Finalize quando concluir

### **Comandos Úteis**

#### **Windows**
```powershell
# Informações do sistema
systeminfo
Get-ComputerInfo

# Processos
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Uso de disco
Get-Volume

# Rede
ipconfig /all
Test-NetConnection servidor.com

# Serviços
Get-Service | Where-Object {$_.Status -eq "Running"}
```

#### **Linux/macOS**
```bash
# Informações do sistema
uname -a
lscpu
free -h

# Processos
top -bn1 | head -20
ps aux --sort=-%cpu | head -10

# Uso de disco
df -h
du -sh /*

# Rede
ifconfig
netstat -tuln
ping -c 4 servidor.com

# Logs
tail -f /var/log/syslog  # Linux
tail -f /var/log/system.log  # macOS
```

### **Boas Práticas**

✅ **FAÇA:**
- Notifique o usuário antes de iniciar
- Explique o que está fazendo
- Documente as ações realizadas
- Finalize a sessão quando terminar

❌ **NÃO FAÇA:**
- Acessar arquivos pessoais sem permissão
- Executar comandos não relacionados ao problema
- Manter sessão aberta desnecessariamente
- Compartilhar credenciais de acesso

---

## 👤 **Para Usuários Finais**

### **Quando Habilitar**

✅ **Habilite quando:**
- Precisa de suporte técnico
- Empresa solicita para manutenção
- Problemas que requerem diagnóstico remoto

❌ **NÃO habilite se:**
- Não confia na organização
- Está em rede pública (WiFi de café, etc.)
- Não foi solicitado oficialmente

### **Durante Sessão Ativa**

**Você verá:**
```
🔵 Sessão de Acesso Remoto Iniciada
Técnico: João Silva
Horário: 14:35
```

**O que fazer:**
- Você pode continuar usando o computador normalmente
- Observe as ações do técnico se desejar
- Comunique qualquer preocupação
- A sessão será registrada para auditoria

**Para encerrar:**
```
Menu da Bandeja → Configurações → Desabilitar Acesso Remoto
```

Isso **encerrará imediatamente** qualquer sessão ativa.

### **Verificar Histórico**

1. Acesse o **Portal do Cliente**
2. Vá em **Meus Equipamentos → [Seu PC]**
3. Aba **Histórico de Acesso**
4. Veja:
   - Quem acessou
   - Quando
   - Quais comandos foram executados
   - Duração da sessão

---

## 📊 **Auditoria e Conformidade**

### **Logs Mantidos**

Todos os eventos são registrados:

```javascript
{
  sessionId: "abc-123-xyz",
  technician: "joao.silva@empresa.com",
  startTime: "2025-01-26 14:35:22",
  endTime: "2025-01-26 14:47:15",
  commands: [
    {
      timestamp: "14:36:10",
      command: "systeminfo",
      output: "...",
      exitCode: 0
    },
    {
      timestamp: "14:38:45",
      command: "Get-Service",
      output: "...",
      exitCode: 0
    }
  ],
  screenshots: 2,
  asset: {
    id: "uuid-do-equipamento",
    hostname: "LAPTOP-USER01"
  }
}
```

### **Retenção**

- Logs mantidos por **2 anos**
- Disponíveis para auditoria
- Exportáveis em JSON/CSV
- Conformidade com LGPD/GDPR

### **Conformidade LGPD**

O sistema está em conformidade com:

✅ **Artigo 6º** - Base legal (legítimo interesse)  
✅ **Artigo 9º** - Consentimento do titular  
✅ **Artigo 18º** - Direito de acesso aos dados  
✅ **Artigo 46º** - Medidas de segurança  

---

## 🚨 **Em Caso de Abuso**

### **Suspeita de Uso Indevido?**

1. **Desabilite imediatamente:**
   ```
   Configurações → Acesso Remoto → ❌ Desabilitar
   ```

2. **Reporte:**
   - Contate o gestor de TI
   - Email: seguranca@empresa.com
   - Telefone: (XX) XXXX-XXXX

3. **Documente:**
   - Horário do incidente
   - Ações observadas
   - Screenshots se possível

### **Ações Tomadas**

A organização irá:
- Investigar os logs completos
- Revogar acessos se necessário
- Aplicar medidas disciplinares
- Notificar autoridades se crime

---

## 📱 **Alternativas ao Acesso Remoto**

Se preferir **não** habilitar acesso remoto, você pode:

1. **Suporte Presencial**
   - Técnico vai até sua estação

2. **Teamviewer / AnyDesk**
   - Ferramentas de terceiros
   - Controle temporário

3. **Diagnóstico Remoto Limitado**
   - Apenas logs e screenshots
   - Sem execução de comandos

4. **Trazer Equipamento ao TI**
   - Manutenção no departamento

---

## ⚙️ **Configurações Avançadas**

### **Para Administradores de Sistema**

#### **Desabilitar Globalmente**

```javascript
// No servidor, arquivo .env
REMOTE_ACCESS_ENABLED=false
```

#### **Timeout Customizado**

```javascript
// desktop-agent/src/modules/remoteAccess.js
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
```

#### **Comandos Bloqueados**

```javascript
// Adicionar à lista de bloqueio
const dangerousCommands = [
  'rm -rf',
  'del /f',
  'format',
  'mkfs',
  'dd if='
];
```

---

## 🔍 **Perguntas Frequentes**

### **É seguro?**
Sim, com as devidas precauções e em redes confiáveis.

### **Quem pode acessar?**
Apenas usuários com permissão "admin-org" ou "agente" na organização.

### **Posso desabilitar depois?**
Sim, a qualquer momento nas configurações.

### **Os dados ficam seguros?**
Sim, todas as comunicações são criptografadas via HTTPS/WSS.

### **Posso ver o que o técnico está fazendo?**
Sim, todos os comandos são visíveis no histórico.

### **E se eu não confiar?**
Não habilite o acesso remoto. Há alternativas disponíveis.

---

## 📞 **Suporte**

**Dúvidas sobre acesso remoto?**

- 📧 suporte@tatuticket.com
- 💬 Chat no portal web
- 📚 https://docs.tatuticket.com/remote-access
- ☎️ (11) 1234-5678

---

**🔒 Sua privacidade e segurança são nossas prioridades.**
