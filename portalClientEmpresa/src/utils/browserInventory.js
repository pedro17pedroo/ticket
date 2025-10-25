/**
 * Coleta de informações do sistema via navegador
 * Limitado por segurança do navegador, mas coleta o máximo possível
 */

export const collectBrowserInventory = async () => {
  const info = {
    // Timestamp
    collectedAt: new Date().toISOString(),
    
    // Sistema Operativo
    os: detectOS(),
    osVersion: detectOSVersion(),
    architecture: navigator.platform,
    
    // Navegador
    browser: detectBrowser(),
    browserVersion: detectBrowserVersion(),
    userAgent: navigator.userAgent,
    
    // Hardware (Limitado)
    hardware: {
      cpuCores: navigator.hardwareConcurrency || 'Desconhecido',
      memory: getMemoryInfo(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      gpu: await detectGPU(),
    },
    
    // Rede
    network: {
      connectionType: getConnectionType(),
      effectiveType: getEffectiveConnectionType(),
      online: navigator.onLine,
    },
    
    // Localização
    locale: {
      language: navigator.language,
      languages: navigator.languages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    
    // Capacidades
    capabilities: {
      cookies: navigator.cookieEnabled,
      localStorage: isLocalStorageAvailable(),
      sessionStorage: isSessionStorageAvailable(),
      webGL: hasWebGL(),
      webRTC: hasWebRTC(),
      serviceWorker: 'serviceWorker' in navigator,
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
    }
  };
  
  return info;
};

// ========== Funções Auxiliares ==========

function detectOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (userAgent.includes('win')) return 'Windows';
  if (userAgent.includes('mac')) return 'macOS';
  if (userAgent.includes('linux')) return 'Linux';
  if (userAgent.includes('android')) return 'Android';
  if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
  
  if (platform.includes('win')) return 'Windows';
  if (platform.includes('mac')) return 'macOS';
  if (platform.includes('linux')) return 'Linux';
  
  return 'Desconhecido';
}

function detectOSVersion() {
  const userAgent = navigator.userAgent;
  
  // Windows
  if (userAgent.includes('Windows NT 10.0')) return '10/11';
  if (userAgent.includes('Windows NT 6.3')) return '8.1';
  if (userAgent.includes('Windows NT 6.2')) return '8';
  if (userAgent.includes('Windows NT 6.1')) return '7';
  
  // macOS
  const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
  if (macMatch) {
    return macMatch[1].replace(/_/g, '.');
  }
  
  // Linux
  if (userAgent.includes('Linux')) {
    const distroMatch = userAgent.match(/Linux ([^\)]+)/);
    if (distroMatch) return distroMatch[1];
    return 'Linux';
  }
  
  return 'Desconhecido';
}

function detectBrowser() {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Chrome';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) return 'Opera';
  
  return 'Desconhecido';
}

function detectBrowserVersion() {
  const userAgent = navigator.userAgent;
  
  const patterns = [
    /Edg\/([\d.]+)/,
    /Chrome\/([\d.]+)/,
    /Safari\/([\d.]+)/,
    /Firefox\/([\d.]+)/,
    /OPR\/([\d.]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = userAgent.match(pattern);
    if (match) return match[1];
  }
  
  return 'Desconhecido';
}

function getMemoryInfo() {
  // Apenas disponível em alguns navegadores
  if (navigator.deviceMemory) {
    return `~${navigator.deviceMemory} GB`;
  }
  
  // Estimativa aproximada baseada em performance
  if (performance && performance.memory) {
    const gb = (performance.memory.jsHeapSizeLimit / (1024 ** 3)).toFixed(1);
    return `~${gb} GB (estimado)`;
  }
  
  return 'Desconhecido';
}

async function detectGPU() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'WebGL não suportado';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor} - ${renderer}`;
    }
    
    return 'GPU disponível (detalhes restritos)';
  } catch (error) {
    return 'Desconhecido';
  }
}

function getConnectionType() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection?.type || 'Desconhecido';
}

function getEffectiveConnectionType() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection?.effectiveType || 'Desconhecido';
}

function isLocalStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function isSessionStorageAvailable() {
  try {
    const test = '__test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

function hasWebRTC() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || 
            navigator.mozGetUserMedia || navigator.msGetUserMedia ||
            (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection));
}

// ========== Funções de Envio ==========

export const sendInventoryToServer = async (apiClient) => {
  try {
    const inventory = await collectBrowserInventory();
    
    // Envia para o backend
    const response = await apiClient.post('/inventory/browser-collect', {
      inventory,
      source: 'browser'
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar inventário:', error);
    throw error;
  }
};

// ========== Auto-Update Periódico ==========

export const startAutoInventoryUpdate = (apiClient, intervalHours = 24) => {
  // Envia imediatamente
  sendInventoryToServer(apiClient).catch(console.error);
  
  // Configura envio periódico
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const intervalId = setInterval(() => {
    sendInventoryToServer(apiClient).catch(console.error);
  }, intervalMs);
  
  // Retorna função para parar
  return () => clearInterval(intervalId);
};

export default {
  collectBrowserInventory,
  sendInventoryToServer,
  startAutoInventoryUpdate
};
