import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório onde os instaladores ficam armazenados
const DOWNLOADS_DIR = path.join(__dirname, '../../../downloads');

// Informações dos instaladores disponíveis
const AGENT_INFO = {
  name: 'TatuTicket Desktop Agent',
  version: '1.0.0',
  description: 'Agente desktop para inventário automático, gestão de tickets e acesso remoto',
  benefits: [
    {
      icon: '📊',
      title: 'Inventário Automático',
      description: 'Coleta automática de informações de hardware e software do seu computador'
    },
    {
      icon: '🎫',
      title: 'Gestão de Tickets',
      description: 'Crie e acompanhe tickets de suporte diretamente do desktop'
    },
    {
      icon: '💬',
      title: 'Chat em Tempo Real',
      description: 'Comunique-se com a equipe de suporte instantaneamente'
    },
    {
      icon: '📚',
      title: 'Base de Conhecimento',
      description: 'Acesse artigos e tutoriais mesmo offline'
    },
    {
      icon: '🔔',
      title: 'Notificações Desktop',
      description: 'Receba alertas de atualizações nos seus tickets'
    },
    {
      icon: '🔒',
      title: 'Acesso Remoto Seguro',
      description: 'Permita que o suporte acesse seu computador de forma segura quando necessário'
    },
    {
      icon: '📡',
      title: 'Modo Offline',
      description: 'Continue trabalhando mesmo sem conexão à internet'
    },
    {
      icon: '⚡',
      title: 'Sincronização Automática',
      description: 'Seus dados são sincronizados automaticamente em segundo plano'
    }
  ],
  requirements: {
    windows: {
      os: 'Windows 10 ou superior',
      ram: '512 MB',
      storage: '100 MB'
    },
    mac: {
      os: 'macOS 10.14 (Mojave) ou superior',
      ram: '512 MB',
      storage: '100 MB'
    },
    linux: {
      os: 'Ubuntu 18.04+ / Debian 10+ / Fedora 32+',
      ram: '512 MB',
      storage: '100 MB'
    }
  },
  instructions: [
    {
      step: 1,
      title: 'Baixe o instalador',
      description: 'Clique no botão de download correspondente ao seu sistema operacional'
    },
    {
      step: 2,
      title: 'Execute o instalador',
      description: 'Abra o arquivo baixado e siga as instruções na tela'
    },
    {
      step: 3,
      title: 'Faça login',
      description: 'Use suas credenciais do TatuTicket para entrar no aplicativo'
    },
    {
      step: 4,
      title: 'Pronto!',
      description: 'O agente começará a sincronizar automaticamente'
    }
  ],
  privacy: {
    collected: [
      'Informações de hardware (CPU, RAM, armazenamento)',
      'Software instalado',
      'Status de segurança (antivírus, firewall)',
      'Informações de rede (IP, hostname)'
    ],
    notCollected: [
      'Arquivos pessoais',
      'Histórico de navegação',
      'Senhas ou credenciais',
      'Dados bancários'
    ]
  }
};

// Garantir que o diretório de downloads existe
const ensureDownloadsDir = () => {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
};

// GET /api/downloads/agent/info - Informações do agente
export const getAgentInfo = async (req, res, next) => {
  try {
    ensureDownloadsDir();
    
    // Verificar quais arquivos estão disponíveis
    const files = fs.existsSync(DOWNLOADS_DIR) ? fs.readdirSync(DOWNLOADS_DIR) : [];
    
    const downloads = {
      windows: null,
      mac: null,
      linux: null
    };
    
    files.forEach(file => {
      const filePath = path.join(DOWNLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      const fileInfo = {
        filename: file,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        updatedAt: stats.mtime
      };
      
      if (file.endsWith('.exe') || file.includes('Setup')) {
        downloads.windows = fileInfo;
      } else if (file.endsWith('.dmg')) {
        downloads.mac = fileInfo;
      } else if (file.endsWith('.AppImage') || file.endsWith('.deb')) {
        if (!downloads.linux || file.endsWith('.AppImage')) {
          downloads.linux = fileInfo;
        }
      }
    });
    
    res.json({
      success: true,
      agent: {
        ...AGENT_INFO,
        downloads
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/downloads/agent/:platform - Download do instalador
export const downloadAgent = async (req, res, next) => {
  try {
    ensureDownloadsDir();
    
    const { platform } = req.params;
    const files = fs.existsSync(DOWNLOADS_DIR) ? fs.readdirSync(DOWNLOADS_DIR) : [];
    
    let targetFile = null;
    
    switch (platform) {
      case 'windows':
        targetFile = files.find(f => f.endsWith('.exe') || f.includes('Setup'));
        break;
      case 'mac':
        targetFile = files.find(f => f.endsWith('.dmg'));
        break;
      case 'linux':
        targetFile = files.find(f => f.endsWith('.AppImage')) || files.find(f => f.endsWith('.deb'));
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Plataforma inválida. Use: windows, mac ou linux'
        });
    }
    
    if (!targetFile) {
      return res.status(404).json({
        success: false,
        error: `Instalador para ${platform} não disponível no momento`
      });
    }
    
    const filePath = path.join(DOWNLOADS_DIR, targetFile);
    
    // Definir headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${targetFile}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream do arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    next(error);
  }
};

// POST /api/downloads/agent/upload - Upload de novo instalador (apenas admin)
export const uploadAgent = async (req, res, next) => {
  try {
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }
    
    ensureDownloadsDir();
    
    if (!req.files || !req.files.installer) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }
    
    const file = req.files.installer;
    const filePath = path.join(DOWNLOADS_DIR, file.name);
    
    await file.mv(filePath);
    
    res.json({
      success: true,
      message: 'Instalador enviado com sucesso',
      file: {
        name: file.name,
        size: formatFileSize(file.size)
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/downloads/agent/:filename - Remover instalador (apenas admin)
export const deleteAgent = async (req, res, next) => {
  try {
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }
    
    const { filename } = req.params;
    const filePath = path.join(DOWNLOADS_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Instalador removido com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Função auxiliar para formatar tamanho de arquivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
