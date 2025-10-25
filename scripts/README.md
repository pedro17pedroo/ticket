# 🖥️ TatuTicket - Scripts de Inventário

Scripts para coleta automática de informações de hardware e software das máquinas dos clientes.

---

## 📋 **VISÃO GERAL**

Existem **3 métodos** de coleta de inventário:

### 1. **Script Manual** (Este diretório)
- Execute periodicamente (semanal/mensal)
- Coleta completa de hardware e software
- Requer autenticação

### 2. **Coleta Web Básica** (No portal do cliente)
- Automática ao fazer login
- Informações limitadas do navegador
- Não requer instalação

### 3. **Agent Desktop** (Futuro)
- Aplicação instalada permanentemente
- Coleta automática periódica
- Acesso total ao sistema

---

## 🪟 **WINDOWS - PowerShell**

### **Pré-requisitos:**
- Windows 7 ou superior
- PowerShell 5.1+
- Permissões de administrador (recomendado)

### **Como Usar:**

1. **Obtenha o Token de Autenticação:**
   - Faça login no portal do cliente
   - Vá em: **Configurações → Inventário → Gerar Token**
   - Copie o token

2. **Execute o Script:**
   ```powershell
   # Método 1: Execução direta
   powershell -ExecutionPolicy Bypass -File inventory-scan-windows.ps1 -Token "SEU_TOKEN_AQUI"
   
   # Método 2: Com parâmetros personalizados
   powershell -ExecutionPolicy Bypass -File inventory-scan-windows.ps1 `
       -Token "SEU_TOKEN_AQUI" `
       -ApiUrl "https://api.tatuticket.com/api" `
       -AssetTag "LAP-001"
   ```

3. **Agendar Execução Automática:**
   ```powershell
   # Criar tarefa agendada (executar como Admin)
   $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
       -Argument '-ExecutionPolicy Bypass -File "C:\TatuTicket\inventory-scan-windows.ps1" -Token "SEU_TOKEN"'
   
   $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
   
   Register-ScheduledTask -TaskName "TatuTicket Inventory" `
       -Action $action -Trigger $trigger `
       -Description "Coleta semanal de inventário"
   ```

---

## 🐧 **LINUX / 🍎 MAC - Bash**

### **Pré-requisitos:**
- Linux ou macOS
- Bash 4.0+
- curl instalado
- Permissões de sudo (para algumas informações)

### **Como Usar:**

1. **Tornar o Script Executável:**
   ```bash
   chmod +x inventory-scan-unix.sh
   ```

2. **Executar:**
   ```bash
   # Método 1: Básico
   ./inventory-scan-unix.sh --token "SEU_TOKEN_AQUI"
   
   # Método 2: Com parâmetros personalizados
   ./inventory-scan-unix.sh \
       --token "SEU_TOKEN_AQUI" \
       --api-url "https://api.tatuticket.com/api" \
       --asset-tag "LAP-001"
   ```

3. **Agendar com Cron:**
   ```bash
   # Editar crontab
   crontab -e
   
   # Adicionar linha (executa toda segunda-feira às 9h)
   0 9 * * 1 /path/to/inventory-scan-unix.sh --token "SEU_TOKEN" >> /var/log/tatuticket-inventory.log 2>&1
   ```

---

## 📊 **INFORMAÇÕES COLETADAS**

### **Hardware:**
- ✅ Fabricante e modelo
- ✅ Número de série
- ✅ Processador (modelo e núcleos)
- ✅ Memória RAM (GB)
- ✅ Armazenamento (GB e tipo)
- ✅ Placa gráfica

### **Sistema Operativo:**
- ✅ Nome e versão
- ✅ Build/Kernel
- ✅ Arquitetura (x86/x64/ARM)

### **Rede:**
- ✅ Hostname
- ✅ Endereço IP
- ✅ Endereço MAC
- ✅ Domínio

### **Segurança:**
- ✅ Antivírus (nome e status)
- ✅ Firewall ativo
- ✅ Criptografia de disco

### **Software (Windows):**
- ✅ Lista completa de programas instalados
- ✅ Versão e fabricante
- ✅ Data de instalação
- ✅ Tamanho ocupado

---

## 🔒 **SEGURANÇA E PRIVACIDADE**

### **O que é enviado:**
- ✅ Informações de hardware (não sensíveis)
- ✅ Sistema operativo
- ✅ Lista de software instalado
- ✅ Informações de rede local

### **O que NÃO é enviado:**
- ❌ Senhas ou credenciais
- ❌ Ficheiros ou documentos
- ❌ Histórico de navegação
- ❌ Dados pessoais
- ❌ Conteúdo de emails

### **Armazenamento Local:**
Todos os dados são salvos localmente em:
- **Windows:** `%USERPROFILE%\TatuTicket\`
- **Linux/Mac:** `$HOME/TatuTicket/`

Você pode revisar os dados antes de enviá-los!

---

## 🚨 **RESOLUÇÃO DE PROBLEMAS**

### **Windows: "Running scripts is disabled"**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### **Erro 401 - Unauthorized**
- Token expirado ou inválido
- Gere um novo token no portal

### **Erro 404 - Not Found**
- URL da API incorreta
- Verifique o parâmetro `-ApiUrl`

### **Erro de Rede**
- Firewall bloqueando conexão
- Verifique conectividade: `curl -I http://localhost:3000/api/health`

### **Sem Permissões (Linux/Mac)**
```bash
# Executar com sudo para informações completas
sudo ./inventory-scan-unix.sh --token "SEU_TOKEN"
```

---

## 📞 **SUPORTE**

Problemas com os scripts?

1. **Verificar logs:** 
   - Windows: `%USERPROFILE%\TatuTicket\`
   - Linux/Mac: `$HOME/TatuTicket/`

2. **Abrir ticket:**
   - Portal: Novo Ticket → Categoria: "Suporte Técnico"
   - Anexe o ficheiro JSON gerado

3. **Email:**
   - suporte@tatuticket.com

---

## 🔄 **ATUALIZAÇÕES**

Os scripts são atualizados automaticamente no portal.

**Versão Atual:** 1.0.0  
**Última Atualização:** Janeiro 2025

---

## ⚙️ **PARÂMETROS AVANÇADOS**

### **PowerShell:**
```powershell
-Token <string>      # Token de autenticação (obrigatório)
-ApiUrl <string>     # URL da API (padrão: http://localhost:3000/api)
-AssetTag <string>   # Etiqueta/Tag do asset (opcional)
```

### **Bash:**
```bash
--token <string>      # Token de autenticação (obrigatório)
--api-url <string>    # URL da API (padrão: http://localhost:3000/api)
--asset-tag <string>  # Etiqueta/Tag do asset (opcional)
```

---

## 📈 **ROADMAP**

### **Versão 2.0 (Q2 2025):**
- [ ] Agent Desktop (Electron app)
- [ ] Coleta automática em background
- [ ] Dashboard em tempo real
- [ ] Alertas de mudanças de hardware
- [ ] Geolocalização opcional

### **Versão 3.0 (Q3 2025):**
- [ ] Monitoramento de performance
- [ ] Uso de disco e CPU
- [ ] Previsão de falhas
- [ ] Inventário de dispositivos móveis

---

**Desenvolvido com ❤️ pela equipa TatuTicket**
