# 🚀 Guia de Instalação Rápida - TatuTicket Agent

---

## 📥 **Para Organizações (Deploy em Massa)**

### **Passo 1: Preparar Ambiente**

```bash
# 1. Gerar Token de API no Portal Web
# Acesse: Configurações → API → Gerar Token de Agente

# 2. Anotar URL do servidor
# Exemplo: https://tatuticket.empresa.com
# Ou: http://servidor-local:3000
```

### **Passo 2: Build do Instalador**

```bash
cd desktop-agent
npm install
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

Os instaladores estarão em `desktop-agent/dist/`:
- Windows: `TatuTicket-Agent-Setup-1.0.0.exe`
- macOS: `TatuTicket-Agent-1.0.0.dmg`
- Linux: `TatuTicket-Agent-1.0.0.AppImage` ou `.deb`

### **Passo 3: Distribuir**

#### **Opção A: Manual**
1. Compartilhe o instalador via email/rede
2. Forneça aos usuários:
   - Link do instalador
   - URL do servidor
   - Token de acesso

#### **Opção B: Deploy Automatizado (Windows)**

```powershell
# Script de instalação silenciosa
$installer = "\\servidor\share\TatuTicket-Agent-Setup.exe"
$serverUrl = "https://tatuticket.empresa.com"
$token = "seu-token-aqui"

Start-Process -FilePath $installer -ArgumentList "/S", "/SERVER_URL=$serverUrl", "/TOKEN=$token" -Wait
```

#### **Opção C: GPO (Group Policy)**

1. Copie instalador para compartilhamento de rede
2. Crie GPO para software deployment
3. Configure parâmetros de instalação
4. Aplique ao OU desejado

---

## 👥 **Para Usuários Finais**

### **Windows**

1. **Baixar**
   - Receba o instalador da sua empresa
   - Ou baixe de: https://downloads.tatuticket.com

2. **Instalar**
   ```
   1. Execute o instalador (duplo clique)
   2. Clique em "Avançar" no assistente
   3. Aceite os termos
   4. Escolha pasta (padrão: C:\Program Files\TatuTicket Agent)
   5. Clique em "Instalar"
   6. Aguarde conclusão
   ```

3. **Configurar**
   ```
   1. O agente abrirá automaticamente
   2. Cole a URL do servidor fornecida pela empresa
   3. Cole o token de autenticação
   4. Clique em "Conectar"
   5. ✅ Pronto!
   ```

### **macOS**

1. **Baixar**
   - Arquivo `.dmg` fornecido pela empresa

2. **Instalar**
   ```
   1. Abra o arquivo .dmg
   2. Arraste "TatuTicket Agent" para "Aplicações"
   3. Abra o Launchpad e procure "TatuTicket Agent"
   4. Na primeira vez, clique com botão direito → Abrir
   5. Confirme "Abrir" no aviso de segurança
   ```

3. **Configurar**
   - Igual ao Windows (passo 3 acima)

### **Linux (Ubuntu/Debian)**

1. **Via .deb**
   ```bash
   sudo dpkg -i tatuticket-agent_1.0.0_amd64.deb
   sudo apt-get install -f  # Resolver dependências
   ```

2. **Via AppImage**
   ```bash
   chmod +x TatuTicket-Agent-1.0.0.AppImage
   ./TatuTicket-Agent-1.0.0.AppImage
   ```

3. **Configurar**
   - Igual ao Windows (passo 3)

---

## ⚙️ **Configuração Pós-Instalação**

### **Configurações Recomendadas**

Após conectar, vá em **Configurações**:

✅ **Iniciar com o sistema** - Marca esta opção  
✅ **Minimizar ao iniciar** - Recomendado  
✅ **Sincronização automática** - Deixar ativado  
⏱️ **Intervalo**: 60 minutos (padrão)  
🔒 **Acesso remoto**: Apenas se necessário

### **Testar Funcionamento**

1. Clique no ícone na **bandeja do sistema**
2. Selecione **"Sincronizar Agora"**
3. Aguarde notificação de sucesso
4. Verifique no portal web se o equipamento aparece

---

## 🔐 **Segurança**

### **Token de Acesso**

⚠️ **IMPORTANTE:**
- Nunca compartilhe o token publicamente
- Cada usuário/organização deve ter seu próprio token
- Se comprometido, revogue no portal web

### **Firewall**

O agente precisa de:
- ✅ Conexão de **saída** para servidor (porta 80/443)
- ❌ **NÃO** precisa de portas abertas de entrada

### **Antivírus**

Alguns antivírus podem alertar na primeira instalação:
- É um **falso positivo** comum em apps Electron
- Adicione exceção se necessário
- Assinatura digital será adicionada em versões futuras

---

## 🆘 **Problemas Comuns**

### ❌ "Não conecta ao servidor"

**Soluções:**
1. Verifique se a URL está correta
2. Teste acessar a URL no navegador
3. Verifique firewall/proxy corporativo
4. Verifique se o servidor está online

### ❌ "Token inválido"

**Soluções:**
1. Verifique se copiou o token completo
2. Token pode ter expirado - gere um novo
3. Usuário pode não ter permissão

### ❌ "Agente não inicia"

**Soluções:**
1. Verifique logs em:
   - Windows: `%APPDATA%\tatuticket-agent\`
   - macOS: `~/Library/Application Support/tatuticket-agent/`
   - Linux: `~/.config/tatuticket-agent/`
2. Reinstale o agente
3. Entre em contato com suporte

### ❌ "Sincronização falha"

**Soluções:**
1. Clique em "Sincronizar Agora" manualmente
2. Verifique conexão com internet
3. Verifique se o token ainda é válido
4. Reinicie o agente

---

## 🔄 **Desinstalação**

### **Windows**
```
Painel de Controle → Programas → Desinstalar TatuTicket Agent
```

### **macOS**
```
Arraste "TatuTicket Agent" da pasta Aplicações para a Lixeira
```

### **Linux**
```bash
sudo apt remove tatuticket-agent  # Se instalado via .deb
rm TatuTicket-Agent.AppImage      # Se via AppImage
```

**Nota:** Configurações são removidas automaticamente

---

## 📞 **Suporte**

### **Para Usuários:**
- Contate o departamento de TI da sua empresa

### **Para Administradores:**
- 📧 suporte@tatuticket.com
- 📚 https://docs.tatuticket.com
- 💬 Chat no portal web

---

## ✅ **Checklist de Instalação**

- [ ] Instalador baixado
- [ ] Aplicação instalada
- [ ] URL do servidor configurada
- [ ] Token de acesso inserido
- [ ] Conexão bem-sucedida
- [ ] Sincronização testada
- [ ] Equipamento aparece no portal web
- [ ] Auto-inicialização configurada (opcional)

---

**🎉 Instalação Completa! O agente agora sincronizará automaticamente.**
