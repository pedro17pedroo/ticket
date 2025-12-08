/**
 * Auto Updater Module
 * Gerencia verificação e instalação de atualizações automáticas
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog } = require('electron');
const log = require('electron-log');
const Store = require('electron-store');

const store = new Store();

class AutoUpdaterManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateAvailable = false;
    this.updateDownloaded = false;
    this.updateInfo = null;
    this.checkInterval = null;
    this.checkIntervalMs = 4 * 60 * 60 * 1000; // 4 horas
    
    // Configurar logger
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    
    // Configurar auto-updater
    this.configure();
    
    // Configurar event listeners
    this.setupListeners();
  }

  /**
   * Configurar auto-updater
   */
  configure() {
    // Configurações
    autoUpdater.autoDownload = false; // Não baixar automaticamente
    autoUpdater.autoInstallOnAppQuit = true; // Instalar ao fechar
    
    // Configurar canal de atualização
    const channel = store.get('updateChannel', 'latest');
    autoUpdater.channel = channel;
    
    log.info('[AutoUpdater] Configurado:', {
      channel,
      autoDownload: autoUpdater.autoDownload,
      autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit
    });
  }

  /**
   * Configurar event listeners
   */
  setupListeners() {
    // Verificando atualizações
    autoUpdater.on('checking-for-update', () => {
      log.info('[AutoUpdater] Verificando atualizações...');
      this.sendToRenderer('update-checking');
    });

    // Atualização disponível
    autoUpdater.on('update-available', (info) => {
      log.info('[AutoUpdater] Atualização disponível:', info.version);
      this.updateAvailable = true;
      this.updateInfo = info;
      this.sendToRenderer('update-available', info);
      this.showUpdateAvailableDialog(info);
    });

    // Nenhuma atualização disponível
    autoUpdater.on('update-not-available', (info) => {
      log.info('[AutoUpdater] Nenhuma atualização disponível');
      this.updateAvailable = false;
      this.sendToRenderer('update-not-available', info);
    });

    // Erro ao verificar
    autoUpdater.on('error', (error) => {
      log.error('[AutoUpdater] Erro:', error);
      this.sendToRenderer('update-error', { message: error.message });
    });

    // Progresso do download
    autoUpdater.on('download-progress', (progress) => {
      log.info('[AutoUpdater] Progresso:', progress.percent.toFixed(2) + '%');
      this.sendToRenderer('update-download-progress', progress);
    });

    // Download concluído
    autoUpdater.on('update-downloaded', (info) => {
      log.info('[AutoUpdater] Atualização baixada:', info.version);
      this.updateDownloaded = true;
      this.sendToRenderer('update-downloaded', info);
      this.showUpdateDownloadedDialog(info);
    });
  }

  /**
   * Iniciar verificação periódica
   */
  startPeriodicCheck() {
    // Verificação inicial após 30 segundos
    setTimeout(() => {
      this.checkForUpdates(false);
    }, 30000);

    // Verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkForUpdates(false);
    }, this.checkIntervalMs);

    log.info('[AutoUpdater] Verificação periódica iniciada');
  }

  /**
   * Parar verificação periódica
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      log.info('[AutoUpdater] Verificação periódica parada');
    }
  }

  /**
   * Verificar atualizações
   * @param {boolean} showNoUpdateDialog - Mostrar dialog se não houver atualização
   */
  async checkForUpdates(showNoUpdateDialog = true) {
    try {
      log.info('[AutoUpdater] Iniciando verificação manual');
      
      const result = await autoUpdater.checkForUpdates();
      
      if (showNoUpdateDialog && !this.updateAvailable) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Sem Atualizações',
          message: 'Você está usando a versão mais recente!',
          buttons: ['OK']
        });
      }
      
      return result;
    } catch (error) {
      log.error('[AutoUpdater] Erro ao verificar atualizações:', error);
      
      if (showNoUpdateDialog) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'error',
          title: 'Erro',
          message: 'Não foi possível verificar atualizações.',
          detail: error.message,
          buttons: ['OK']
        });
      }
      
      throw error;
    }
  }

  /**
   * Baixar atualização
   */
  async downloadUpdate() {
    try {
      log.info('[AutoUpdater] Iniciando download da atualização');
      this.sendToRenderer('update-downloading');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('[AutoUpdater] Erro ao baixar atualização:', error);
      throw error;
    }
  }

  /**
   * Instalar atualização e reiniciar
   */
  installUpdate() {
    log.info('[AutoUpdater] Instalando atualização e reiniciando');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Mostrar dialog de atualização disponível
   * @param {object} info - Informações da atualização
   */
  showUpdateAvailableDialog(info) {
    const currentVersion = app.getVersion();
    const newVersion = info.version;
    
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Atualização Disponível',
      message: `Nova versão disponível: ${newVersion}`,
      detail: `Versão atual: ${currentVersion}\n\nDeseja baixar a atualização agora?`,
      buttons: ['Baixar Agora', 'Depois'],
      defaultId: 0,
      cancelId: 1
    }).then(result => {
      if (result.response === 0) {
        this.downloadUpdate();
      }
    });
  }

  /**
   * Mostrar dialog de atualização baixada
   * @param {object} info - Informações da atualização
   */
  showUpdateDownloadedDialog(info) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Atualização Pronta',
      message: `Versão ${info.version} foi baixada!`,
      detail: 'A atualização será instalada quando você fechar o aplicativo.\n\nDeseja reiniciar agora?',
      buttons: ['Reiniciar Agora', 'Depois'],
      defaultId: 0,
      cancelId: 1
    }).then(result => {
      if (result.response === 0) {
        this.installUpdate();
      }
    });
  }

  /**
   * Enviar evento para o renderer
   * @param {string} event - Nome do evento
   * @param {object} data - Dados do evento
   */
  sendToRenderer(event, data = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('auto-updater', { event, data });
    }
  }

  /**
   * Obter informações da atualização
   * @returns {object} Informações
   */
  getUpdateInfo() {
    return {
      updateAvailable: this.updateAvailable,
      updateDownloaded: this.updateDownloaded,
      updateInfo: this.updateInfo,
      currentVersion: app.getVersion()
    };
  }

  /**
   * Definir canal de atualização
   * @param {string} channel - Canal (latest, beta, alpha)
   */
  setChannel(channel) {
    autoUpdater.channel = channel;
    store.set('updateChannel', channel);
    log.info('[AutoUpdater] Canal alterado para:', channel);
  }

  /**
   * Obter canal atual
   * @returns {string} Canal
   */
  getChannel() {
    return autoUpdater.channel;
  }

  /**
   * Definir intervalo de verificação
   * @param {number} intervalMs - Intervalo em milissegundos
   */
  setCheckInterval(intervalMs) {
    this.checkIntervalMs = intervalMs;
    
    // Reiniciar verificação periódica
    this.stopPeriodicCheck();
    this.startPeriodicCheck();
    
    log.info('[AutoUpdater] Intervalo de verificação alterado para:', intervalMs);
  }

  /**
   * Habilitar/desabilitar auto-download
   * @param {boolean} enabled - Habilitar
   */
  setAutoDownload(enabled) {
    autoUpdater.autoDownload = enabled;
    store.set('autoDownload', enabled);
    log.info('[AutoUpdater] Auto-download:', enabled ? 'habilitado' : 'desabilitado');
  }

  /**
   * Obter configurações
   * @returns {object} Configurações
   */
  getSettings() {
    return {
      channel: this.getChannel(),
      autoDownload: autoUpdater.autoDownload,
      autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit,
      checkIntervalMs: this.checkIntervalMs
    };
  }
}

module.exports = AutoUpdaterManager;
