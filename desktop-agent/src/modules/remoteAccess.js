const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

class RemoteAccess {
  constructor(apiClient, store) {
    this.apiClient = apiClient;
    this.store = store;
    this.isActive = false;
    this.socket = null;
    this.sessionId = null;
  }

  async start() {
    const enabled = this.store.get('remoteAccessEnabled', false);
    
    if (!enabled || !this.apiClient.isConnected()) {
      console.log('⚪ Acesso remoto não habilitado ou não conectado');
      return;
    }

    try {
      // Conectar ao servidor WebSocket
      await this.connectWebSocket();
      
      this.isActive = true;
      console.log('🟢 Acesso remoto iniciado');
      
      if (global.sendNotification) {
        global.sendNotification('info', 'Acesso remoto ativado');
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar acesso remoto:', error);
      this.isActive = false;
    }
  }

  async stop() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isActive = false;
    this.sessionId = null;
    console.log('⚪ Acesso remoto parado');
    
    if (global.sendNotification) {
      global.sendNotification('info', 'Acesso remoto desativado');
    }
  }

  async restart(config) {
    await this.stop();
    if (config.remoteAccessEnabled) {
      await this.start();
    }
  }

  async connectWebSocket() {
    const io = require('socket.io-client');
    const serverUrl = this.store.get('serverUrl', 'http://localhost:3000');
    const token = this.store.get('token');
    
    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado para acesso remoto');
      this.socket.emit('agent:register', {
        machineId: this.store.get('machineId'),
        hostname: os.hostname(),
        platform: os.platform()
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      this.isActive = false;
    });

    this.socket.on('remote:start-session', async (data) => {
      console.log('🔵 Sessão de acesso remoto iniciada:', data.sessionId);
      this.sessionId = data.sessionId;
      
      if (global.sendNotification) {
        global.sendNotification('warning', 'Sessão de acesso remoto iniciada');
      }
    });

    this.socket.on('remote:end-session', () => {
      console.log('🔴 Sessão de acesso remoto encerrada');
      this.sessionId = null;
      
      if (global.sendNotification) {
        global.sendNotification('info', 'Sessão de acesso remoto encerrada');
      }
    });

    // Comandos remotos
    this.socket.on('remote:execute-command', async (data) => {
      if (!this.sessionId || data.sessionId !== this.sessionId) {
        return;
      }

      try {
        const result = await this.executeCommand(data.command);
        this.socket.emit('remote:command-result', {
          sessionId: this.sessionId,
          commandId: data.commandId,
          success: true,
          output: result
        });
      } catch (error) {
        this.socket.emit('remote:command-result', {
          sessionId: this.sessionId,
          commandId: data.commandId,
          success: false,
          error: error.message
        });
      }
    });

    // Screenshot
    this.socket.on('remote:screenshot', async (data) => {
      if (!this.sessionId || data.sessionId !== this.sessionId) {
        return;
      }

      try {
        const screenshot = await this.captureScreenshot();
        this.socket.emit('remote:screenshot-result', {
          sessionId: this.sessionId,
          requestId: data.requestId,
          success: true,
          image: screenshot
        });
      } catch (error) {
        this.socket.emit('remote:screenshot-result', {
          sessionId: this.sessionId,
          requestId: data.requestId,
          success: false,
          error: error.message
        });
      }
    });

    // Informações do sistema em tempo real
    this.socket.on('remote:get-system-info', async (data) => {
      if (!this.sessionId || data.sessionId !== this.sessionId) {
        return;
      }

      try {
        const si = require('systeminformation');
        const info = {
          cpu: await si.currentLoad(),
          memory: await si.mem(),
          processes: await si.processes(),
          network: await si.networkStats()
        };

        this.socket.emit('remote:system-info-result', {
          sessionId: this.sessionId,
          requestId: data.requestId,
          success: true,
          data: info
        });
      } catch (error) {
        this.socket.emit('remote:system-info-result', {
          sessionId: this.sessionId,
          requestId: data.requestId,
          success: false,
          error: error.message
        });
      }
    });
  }

  async executeCommand(command) {
    // Validar comando por segurança
    const dangerousCommands = ['rm -rf', 'del /f', 'format', 'mkfs', 'dd if='];
    
    if (dangerousCommands.some(cmd => command.toLowerCase().includes(cmd))) {
      throw new Error('Comando bloqueado por segurança');
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 segundos
        maxBuffer: 1024 * 1024 // 1MB
      });

      return {
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0
      };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1
      };
    }
  }

  async captureScreenshot() {
    const platform = os.platform();
    let command;

    try {
      if (platform === 'win32') {
        // Windows: usar PowerShell
        command = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen(0, 0, 0, 0, $bitmap.Size); $ms = New-Object System.IO.MemoryStream; $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); [Convert]::ToBase64String($ms.ToArray())"';
      } else if (platform === 'darwin') {
        // macOS: usar screencapture
        const tempFile = `/tmp/screenshot-${Date.now()}.png`;
        command = `screencapture -x ${tempFile} && base64 ${tempFile} && rm ${tempFile}`;
      } else {
        // Linux: usar scrot ou import
        const tempFile = `/tmp/screenshot-${Date.now()}.png`;
        command = `scrot ${tempFile} && base64 ${tempFile} && rm ${tempFile}`;
      }

      const { stdout } = await execAsync(command);
      return stdout.trim();
    } catch (error) {
      console.error('Erro ao capturar screenshot:', error);
      throw new Error('Não foi possível capturar screenshot');
    }
  }

  isActive() {
    return this.isActive;
  }

  getSessionId() {
    return this.sessionId;
  }
}

module.exports = RemoteAccess;
