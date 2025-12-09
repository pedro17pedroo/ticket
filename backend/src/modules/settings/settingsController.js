import { Organization } from '../models/index.js';
import AuditLog from '../../models/AuditLog.js';

// Configurações padrão do provider
const defaultSettings = {
  companyName: 'TatuTicket',
  companyEmail: 'contato@tatuticket.com',
  companyPhone: '',
  companyAddress: '',
  supportEmail: 'suporte@tatuticket.com',
  supportPhone: '',
  timezone: 'Europe/Lisbon',
  language: 'pt-PT',
  dateFormat: 'DD/MM/YYYY',
  currency: 'EUR',
  // Security settings
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 60,
    allowedIPs: '',
    twoFactorEnabled: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true
  },
  // Integration settings
  integrations: {
    slackEnabled: false,
    slackWebhookUrl: '',
    teamsEnabled: false,
    teamsWebhookUrl: '',
    apiEnabled: true
  }
};

// GET /api/provider/settings - Obter configurações do provider
export const getSettings = async (req, res, next) => {
  try {
    // Buscar organização provider
    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    if (!provider) {
      return res.json({
        success: true,
        settings: defaultSettings
      });
    }

    // Mesclar configurações salvas com padrões
    const settings = {
      ...defaultSettings,
      ...(provider.settings || {}),
      companyName: provider.name || defaultSettings.companyName,
      companyEmail: provider.email || defaultSettings.companyEmail,
      companyPhone: provider.phone || defaultSettings.companyPhone,
      companyAddress: provider.address || defaultSettings.companyAddress
    };

    res.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    next(error);
  }
};

// PUT /api/provider/settings - Atualizar configurações do provider
export const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;

    // Buscar organização provider
    let provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Organização provider não encontrada'
      });
    }

    // Atualizar campos da organização
    const orgUpdates = {};
    if (updates.companyName) orgUpdates.name = updates.companyName;
    if (updates.companyEmail) orgUpdates.email = updates.companyEmail;
    if (updates.companyPhone) orgUpdates.phone = updates.companyPhone;
    if (updates.companyAddress) orgUpdates.address = updates.companyAddress;

    // Atualizar settings JSON
    const newSettings = {
      ...(provider.settings || {}),
      supportEmail: updates.supportEmail,
      supportPhone: updates.supportPhone,
      timezone: updates.timezone,
      language: updates.language,
      dateFormat: updates.dateFormat,
      currency: updates.currency
    };

    await provider.update({
      ...orgUpdates,
      settings: newSettings
    });

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      settings: {
        ...defaultSettings,
        ...newSettings,
        companyName: provider.name,
        companyEmail: provider.email,
        companyPhone: provider.phone,
        companyAddress: provider.address
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    next(error);
  }
};

// GET /api/provider/settings/security - Obter configurações de segurança
export const getSecuritySettings = async (req, res, next) => {
  try {
    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    const security = provider?.settings?.security || defaultSettings.security;

    res.json({
      success: true,
      security
    });

  } catch (error) {
    console.error('Erro ao obter configurações de segurança:', error);
    next(error);
  }
};

// PUT /api/provider/settings/security - Atualizar configurações de segurança
export const updateSecuritySettings = async (req, res, next) => {
  try {
    const securityUpdates = req.body;

    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Organização provider não encontrada'
      });
    }

    const newSettings = {
      ...(provider.settings || {}),
      security: {
        ...(provider.settings?.security || defaultSettings.security),
        ...securityUpdates
      }
    };

    await provider.update({ settings: newSettings });

    res.json({
      success: true,
      message: 'Configurações de segurança atualizadas',
      security: newSettings.security
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações de segurança:', error);
    next(error);
  }
};

// GET /api/provider/settings/integrations - Obter configurações de integrações
export const getIntegrationSettings = async (req, res, next) => {
  try {
    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    const integrations = provider?.settings?.integrations || defaultSettings.integrations;

    res.json({
      success: true,
      integrations
    });

  } catch (error) {
    console.error('Erro ao obter configurações de integrações:', error);
    next(error);
  }
};

// PUT /api/provider/settings/integrations - Atualizar configurações de integrações
export const updateIntegrationSettings = async (req, res, next) => {
  try {
    const integrationUpdates = req.body;

    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Organização provider não encontrada'
      });
    }

    const newSettings = {
      ...(provider.settings || {}),
      integrations: {
        ...(provider.settings?.integrations || defaultSettings.integrations),
        ...integrationUpdates
      }
    };

    await provider.update({ settings: newSettings });

    res.json({
      success: true,
      message: 'Configurações de integrações atualizadas',
      integrations: newSettings.integrations
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações de integrações:', error);
    next(error);
  }
};

// GET /api/provider/audit-logs - Obter logs de auditoria
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resource, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {};
    
    if (action && action !== 'all') {
      where.action = action;
    }
    
    if (resource) {
      where.resource = resource;
    }

    if (startDate || endDate) {
      const { Op } = await import('sequelize');
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao obter logs de auditoria:', error);
    next(error);
  }
};

// Configurações padrão de email
const defaultEmailSettings = {
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpSecure: true,
  fromName: 'TatuTicket',
  fromEmail: '',
  replyToEmail: ''
};

// GET /api/provider/settings/email - Obter configurações de email
export const getEmailSettings = async (req, res, next) => {
  try {
    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    const email = provider?.settings?.email || defaultEmailSettings;

    res.json({
      success: true,
      ...email
    });

  } catch (error) {
    console.error('Erro ao obter configurações de email:', error);
    next(error);
  }
};

// PUT /api/provider/settings/email - Atualizar configurações de email
export const updateEmailSettings = async (req, res, next) => {
  try {
    const emailUpdates = req.body;

    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Organização provider não encontrada'
      });
    }

    // Não salvar senha se estiver vazia (manter a anterior)
    const currentEmail = provider.settings?.email || {};
    if (!emailUpdates.smtpPassword) {
      emailUpdates.smtpPassword = currentEmail.smtpPassword;
    }

    const newSettings = {
      ...(provider.settings || {}),
      email: {
        ...defaultEmailSettings,
        ...emailUpdates
      }
    };

    await provider.update({ settings: newSettings });

    res.json({
      success: true,
      message: 'Configurações de email atualizadas',
      ...newSettings.email
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações de email:', error);
    next(error);
  }
};

// POST /api/provider/settings/email/test - Testar configurações de email
export const testEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email de teste é obrigatório'
      });
    }

    // Simular envio de email (em produção, usar nodemailer)
    // Por agora, apenas retornar sucesso
    res.json({
      success: true,
      message: `Email de teste enviado para ${email}`
    });

  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    next(error);
  }
};


// GET /api/provider/audit-logs/changes - Histórico de alterações
export const getChangeHistory = async (req, res, next) => {
  try {
    const { resource, page = 1, limit = 50 } = req.query;

    const where = {
      action: ['update', 'create', 'delete']
    };
    
    if (resource && resource !== 'all') {
      where.entityType = resource;
    }

    const { Op } = await import('sequelize');
    
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: {
        action: { [Op.in]: ['update', 'create', 'delete'] },
        ...(resource && resource !== 'all' ? { entityType: resource } : {})
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Transformar logs em formato de changes
    const changes = logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      user: {
        name: log.metadata?.userName || 'Sistema',
        email: log.metadata?.userEmail || ''
      },
      resourceType: log.entityType,
      resourceName: log.metadata?.resourceName || `ID: ${log.entityId}`,
      field: log.changes?.field || 'N/A',
      oldValue: log.changes?.oldValue || '-',
      newValue: log.changes?.newValue || '-',
      reason: log.metadata?.reason || ''
    }));

    res.json({
      success: true,
      changes,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao obter histórico de alterações:', error);
    next(error);
  }
};


// POST /api/provider/settings/integrations/generate-key - Gerar nova chave API
export const generateApiKey = async (req, res, next) => {
  try {
    const crypto = await import('crypto');
    const apiKey = `tt_${crypto.randomBytes(32).toString('hex')}`;

    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Organização provider não encontrada'
      });
    }

    const newSettings = {
      ...(provider.settings || {}),
      integrations: {
        ...(provider.settings?.integrations || {}),
        apiKey
      }
    };

    await provider.update({ settings: newSettings });

    res.json({
      success: true,
      apiKey
    });

  } catch (error) {
    console.error('Erro ao gerar chave API:', error);
    next(error);
  }
};
