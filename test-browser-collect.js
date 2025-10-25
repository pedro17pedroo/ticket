// Script de teste para browser-collect
const axios = require('axios');

// Dados de exemplo
const testInventory = {
  collectedAt: new Date().toISOString(),
  os: 'macOS',
  osVersion: '14.1',
  architecture: 'MacIntel',
  browser: 'Chrome',
  browserVersion: '130.0',
  userAgent: 'Mozilla/5.0...',
  hardware: {
    cpuCores: 8,
    memory: '~16 GB',
    gpu: 'Apple M1',
    screenResolution: '1920x1080',
    colorDepth: 24,
    pixelRatio: 2,
    touchSupport: false
  },
  network: {
    connectionType: 'wifi',
    effectiveType: '4g',
    online: true
  },
  locale: {
    language: 'pt-PT',
    languages: ['pt-PT', 'en-US'],
    timezone: 'Europe/Lisbon'
  },
  capabilities: {
    cookies: true,
    localStorage: true,
    sessionStorage: true,
    webGL: true,
    webRTC: true,
    serviceWorker: true,
    bluetooth: false,
    usb: false
  }
};

async function test() {
  try {
    console.log('🧪 Testando endpoint /api/inventory/browser-collect...\n');
    
    // Você precisa colocar um token válido aqui
    const token = 'SEU_TOKEN_AQUI';
    
    const response = await axios.post('http://localhost:3000/api/inventory/browser-collect', {
      inventory: testInventory,
      source: 'browser'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sucesso!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Erro:', error.response?.status);
    console.log('Mensagem:', error.response?.data);
    console.log('\nDetalhes completos:');
    console.log(JSON.stringify(error.response?.data, null, 2));
  }
}

test();
