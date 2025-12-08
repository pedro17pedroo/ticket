/**
 * Theme Manager Module
 * Gerencia temas (claro/escuro) do aplicativo
 */

const Store = require('electron-store');
const { nativeTheme } = require('electron');

const store = new Store();

class ThemeManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.currentTheme = store.get('theme', 'light');
    this.themes = ['light', 'dark', 'system'];
    
    // Configurar tema inicial
    this.applyTheme(this.currentTheme);
    
    // Listener para mudanças no tema do sistema
    this.setupSystemThemeListener();
  }

  /**
   * Configurar listener para tema do sistema
   */
  setupSystemThemeListener() {
    nativeTheme.on('updated', () => {
      if (this.currentTheme === 'system') {
        this.notifyRenderer();
      }
    });
  }

  /**
   * Aplicar tema
   * @param {string} theme - Tema (light, dark, system)
   */
  applyTheme(theme) {
    if (!this.themes.includes(theme)) {
      console.warn(`[ThemeManager] Tema inválido: ${theme}`);
      return false;
    }

    this.currentTheme = theme;
    store.set('theme', theme);

    // Aplicar tema no nativeTheme
    if (theme === 'system') {
      nativeTheme.themeSource = 'system';
    } else {
      nativeTheme.themeSource = theme;
    }

    console.log(`[ThemeManager] Tema aplicado: ${theme}`);
    
    // Notificar renderer
    this.notifyRenderer();
    
    return true;
  }

  /**
   * Obter tema atual
   * @returns {string} Tema atual
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Obter tema efetivo (resolvendo 'system')
   * @returns {string} Tema efetivo (light ou dark)
   */
  getEffectiveTheme() {
    if (this.currentTheme === 'system') {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  /**
   * Obter temas disponíveis
   * @returns {array} Lista de temas
   */
  getAvailableThemes() {
    return this.themes.map(theme => ({
      id: theme,
      name: this.getThemeName(theme),
      icon: this.getThemeIcon(theme)
    }));
  }

  /**
   * Obter nome do tema
   * @param {string} theme - ID do tema
   * @returns {string} Nome do tema
   */
  getThemeName(theme) {
    const names = {
      'light': 'Claro',
      'dark': 'Escuro',
      'system': 'Sistema'
    };
    return names[theme] || theme;
  }

  /**
   * Obter ícone do tema
   * @param {string} theme - ID do tema
   * @returns {string} Ícone do tema
   */
  getThemeIcon(theme) {
    const icons = {
      'light': '☀️',
      'dark': '🌙',
      'system': '💻'
    };
    return icons[theme] || '🎨';
  }

  /**
   * Alternar entre temas
   */
  toggleTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    const nextTheme = this.themes[nextIndex];
    
    this.applyTheme(nextTheme);
    return nextTheme;
  }

  /**
   * Verificar se está usando tema escuro
   * @returns {boolean} true se escuro
   */
  isDarkMode() {
    return this.getEffectiveTheme() === 'dark';
  }

  /**
   * Notificar renderer sobre mudança de tema
   */
  notifyRenderer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('theme-changed', {
        theme: this.currentTheme,
        effectiveTheme: this.getEffectiveTheme(),
        isDark: this.isDarkMode()
      });
    }
  }

  /**
   * Obter informações do tema
   * @returns {object} Informações
   */
  getThemeInfo() {
    return {
      current: this.currentTheme,
      effective: this.getEffectiveTheme(),
      isDark: this.isDarkMode(),
      available: this.getAvailableThemes()
    };
  }
}

module.exports = ThemeManager;
