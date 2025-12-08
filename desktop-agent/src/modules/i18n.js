/**
 * Internationalization (i18n) Module
 * Gerencia traduções e idiomas do aplicativo
 */

const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

class I18n {
  constructor() {
    this.currentLocale = store.get('locale', 'pt-BR');
    this.translations = {};
    this.availableLocales = ['pt-BR', 'en-US'];
    this.fallbackLocale = 'pt-BR';
    
    // Carregar traduções
    this.loadTranslations();
  }

  /**
   * Carregar traduções de todos os idiomas
   */
  loadTranslations() {
    const localesDir = path.join(__dirname, '../locales');
    
    this.availableLocales.forEach(locale => {
      try {
        const filePath = path.join(localesDir, `${locale}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          this.translations[locale] = JSON.parse(content);
          console.log(`[i18n] Traduções carregadas: ${locale}`);
        }
      } catch (error) {
        console.error(`[i18n] Erro ao carregar traduções ${locale}:`, error);
      }
    });
  }

  /**
   * Obter tradução por chave
   * @param {string} key - Chave da tradução (ex: 'menu.dashboard')
   * @param {object} params - Parâmetros para interpolação
   * @returns {string} Tradução
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let translation = this.translations[this.currentLocale];
    
    // Navegar pela estrutura de objetos
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = undefined;
        break;
      }
    }
    
    // Se não encontrou, tentar fallback
    if (translation === undefined) {
      translation = this.getFallbackTranslation(key);
    }
    
    // Se ainda não encontrou, retornar a chave
    if (translation === undefined) {
      console.warn(`[i18n] Tradução não encontrada: ${key}`);
      return key;
    }
    
    // Interpolar parâmetros
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      translation = this.interpolate(translation, params);
    }
    
    return translation;
  }

  /**
   * Obter tradução do idioma fallback
   * @param {string} key - Chave da tradução
   * @returns {string|undefined} Tradução
   */
  getFallbackTranslation(key) {
    const keys = key.split('.');
    let translation = this.translations[this.fallbackLocale];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        return undefined;
      }
    }
    
    return translation;
  }

  /**
   * Interpolar parâmetros na string
   * @param {string} str - String com placeholders
   * @param {object} params - Parâmetros
   * @returns {string} String interpolada
   */
  interpolate(str, params) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Definir idioma atual
   * @param {string} locale - Código do idioma
   */
  setLocale(locale) {
    if (this.availableLocales.includes(locale)) {
      this.currentLocale = locale;
      store.set('locale', locale);
      console.log(`[i18n] Idioma alterado para: ${locale}`);
      return true;
    } else {
      console.warn(`[i18n] Idioma não disponível: ${locale}`);
      return false;
    }
  }

  /**
   * Obter idioma atual
   * @returns {string} Código do idioma
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * Obter idiomas disponíveis
   * @returns {array} Lista de idiomas
   */
  getAvailableLocales() {
    return this.availableLocales.map(locale => ({
      code: locale,
      name: this.getLocaleName(locale),
      nativeName: this.getLocaleNativeName(locale)
    }));
  }

  /**
   * Obter nome do idioma em inglês
   * @param {string} locale - Código do idioma
   * @returns {string} Nome do idioma
   */
  getLocaleName(locale) {
    const names = {
      'pt-BR': 'Portuguese (Brazil)',
      'en-US': 'English (United States)'
    };
    return names[locale] || locale;
  }

  /**
   * Obter nome nativo do idioma
   * @param {string} locale - Código do idioma
   * @returns {string} Nome nativo
   */
  getLocaleNativeName(locale) {
    const names = {
      'pt-BR': 'Português (Brasil)',
      'en-US': 'English (United States)'
    };
    return names[locale] || locale;
  }

  /**
   * Obter todas as traduções do idioma atual
   * @returns {object} Traduções
   */
  getAllTranslations() {
    return this.translations[this.currentLocale] || {};
  }

  /**
   * Verificar se uma chave existe
   * @param {string} key - Chave da tradução
   * @returns {boolean} true se existe
   */
  has(key) {
    const translation = this.t(key);
    return translation !== key;
  }

  /**
   * Recarregar traduções
   */
  reload() {
    this.translations = {};
    this.loadTranslations();
    console.log('[i18n] Traduções recarregadas');
  }
}

// Singleton
let instance = null;

module.exports = {
  /**
   * Obter instância do i18n
   * @returns {I18n} Instância
   */
  getInstance() {
    if (!instance) {
      instance = new I18n();
    }
    return instance;
  },
  
  /**
   * Criar nova instância (para testes)
   * @returns {I18n} Nova instância
   */
  createInstance() {
    return new I18n();
  }
};
