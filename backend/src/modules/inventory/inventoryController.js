import { Asset, Software, License, AssetLicense, User } from '../models/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import logger from '../../config/logger.js';

// ==================== ASSETS ====================

/**
 * GET /api/inventory/assets
 * Listar assets (com filtros)
 */
export const getAssets = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { 
      clientId, 
      type, 
      status, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    const where = { organizationId };

    if (clientId) {
      where.clientId = clientId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { hostname: { [Op.iLike]: `%${search}%` } },
        { assetTag: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: assets } = await Asset.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      assets,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erro ao listar assets:', error);
    next(error);
  }
};

/**
 * GET /api/inventory/assets/:id
 * Obter asset por ID
 */
export const getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const asset = await Asset.findOne({
      where: { id, organizationId },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Software,
          as: 'software'
        },
        {
          model: License,
          as: 'licenses',
          through: { attributes: ['assignedDate', 'isActive'] }
        }
      ]
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset não encontrado'
      });
    }

    res.json({
      success: true,
      asset
    });
  } catch (error) {
    logger.error('Erro ao buscar asset:', error);
    next(error);
  }
};

/**
 * POST /api/inventory/assets
 * Criar novo asset
 */
export const createAsset = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const assetData = {
      ...req.body,
      organizationId,
      lastSeen: new Date()
    };

    const asset = await Asset.create(assetData);

    logger.info(`Asset criado: ${asset.name} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Asset criado com sucesso',
      asset
    });
  } catch (error) {
    logger.error('Erro ao criar asset:', error);
    next(error);
  }
};

/**
 * PUT /api/inventory/assets/:id
 * Atualizar asset
 */
export const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const asset = await Asset.findOne({
      where: { id, organizationId }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset não encontrado'
      });
    }

    await asset.update(req.body);

    logger.info(`Asset atualizado: ${asset.name} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Asset atualizado com sucesso',
      asset
    });
  } catch (error) {
    logger.error('Erro ao atualizar asset:', error);
    next(error);
  }
};

/**
 * DELETE /api/inventory/assets/:id
 * Deletar asset
 */
export const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const asset = await Asset.findOne({
      where: { id, organizationId }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset não encontrado'
      });
    }

    await asset.destroy();

    logger.info(`Asset deletado: ${asset.name} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Asset deletado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao deletar asset:', error);
    next(error);
  }
};

// ==================== SOFTWARE ====================

/**
 * GET /api/inventory/software
 * Listar software
 */
export const getSoftware = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { assetId, category, search } = req.query;

    const where = { organizationId };

    if (assetId) {
      where.assetId = assetId;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { vendor: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const software = await Software.findAll({
      where,
      include: [
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'name', 'hostname']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      software
    });
  } catch (error) {
    logger.error('Erro ao listar software:', error);
    next(error);
  }
};

/**
 * POST /api/inventory/software
 * Adicionar software a um asset
 */
export const addSoftware = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const softwareData = {
      ...req.body,
      organizationId
    };

    const software = await Software.create(softwareData);

    logger.info(`Software adicionado: ${software.name} ao asset ${software.assetId}`);

    res.status(201).json({
      success: true,
      message: 'Software adicionado com sucesso',
      software
    });
  } catch (error) {
    logger.error('Erro ao adicionar software:', error);
    next(error);
  }
};

/**
 * DELETE /api/inventory/software/:id
 * Remover software
 */
export const deleteSoftware = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const software = await Software.findOne({
      where: { id, organizationId }
    });

    if (!software) {
      return res.status(404).json({
        success: false,
        error: 'Software não encontrado'
      });
    }

    await software.destroy();

    res.json({
      success: true,
      message: 'Software removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover software:', error);
    next(error);
  }
};

// ==================== LICENSES ====================

/**
 * GET /api/inventory/licenses
 * Listar licenças
 */
export const getLicenses = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { clientId, status, expiringDays } = req.query;

    const where = { organizationId };

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    // Licenças expirando em X dias
    if (expiringDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(expiringDays));
      
      where.expiryDate = {
        [Op.lte]: futureDate,
        [Op.gte]: new Date()
      };
    }

    const licenses = await License.findAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Asset,
          as: 'assets',
          through: { 
            attributes: ['assignedDate', 'isActive'],
            where: { isActive: true }
          },
          required: false
        }
      ],
      order: [['expiryDate', 'ASC']]
    });

    res.json({
      success: true,
      licenses
    });
  } catch (error) {
    logger.error('Erro ao listar licenças:', error);
    next(error);
  }
};

/**
 * GET /api/inventory/licenses/:id
 * Obter licença por ID
 */
export const getLicenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const license = await License.findOne({
      where: { id, organizationId },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Asset,
          as: 'assets',
          through: { attributes: ['assignedDate', 'isActive'] }
        }
      ]
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Licença não encontrada'
      });
    }

    res.json({
      success: true,
      license
    });
  } catch (error) {
    logger.error('Erro ao buscar licença:', error);
    next(error);
  }
};

/**
 * POST /api/inventory/licenses
 * Criar nova licença
 */
export const createLicense = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const licenseData = {
      ...req.body,
      organizationId
    };

    const license = await License.create(licenseData);

    logger.info(`Licença criada: ${license.name} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Licença criada com sucesso',
      license
    });
  } catch (error) {
    logger.error('Erro ao criar licença:', error);
    next(error);
  }
};

/**
 * PUT /api/inventory/licenses/:id
 * Atualizar licença
 */
export const updateLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const license = await License.findOne({
      where: { id, organizationId }
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Licença não encontrada'
      });
    }

    await license.update(req.body);

    logger.info(`Licença atualizada: ${license.name} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Licença atualizada com sucesso',
      license
    });
  } catch (error) {
    logger.error('Erro ao atualizar licença:', error);
    next(error);
  }
};

/**
 * DELETE /api/inventory/licenses/:id
 * Deletar licença
 */
export const deleteLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const license = await License.findOne({
      where: { id, organizationId }
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Licença não encontrada'
      });
    }

    await license.destroy();

    logger.info(`Licença deletada: ${license.name} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Licença deletada com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao deletar licença:', error);
    next(error);
  }
};

/**
 * POST /api/inventory/licenses/:id/assign
 * Atribuir licença a um asset
 */
export const assignLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assetId } = req.body;
    const organizationId = req.user.organizationId;

    const license = await License.findOne({
      where: { id, organizationId }
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Licença não encontrada'
      });
    }

    // Verificar se há seats disponíveis
    if (license.usedSeats >= license.totalSeats) {
      return res.status(400).json({
        success: false,
        error: 'Não há seats disponíveis nesta licença'
      });
    }

    // Verificar se asset existe
    const asset = await Asset.findOne({
      where: { id: assetId, organizationId }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset não encontrado'
      });
    }

    // Criar associação
    await AssetLicense.create({
      assetId,
      licenseId: id,
      isActive: true
    });

    // Incrementar usedSeats
    await license.increment('usedSeats');

    logger.info(`Licença ${license.name} atribuída ao asset ${asset.name}`);

    res.json({
      success: true,
      message: 'Licença atribuída com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao atribuir licença:', error);
    next(error);
  }
};

/**
 * POST /api/inventory/licenses/:id/unassign
 * Desatribuir licença de um asset
 */
export const unassignLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assetId } = req.body;
    const organizationId = req.user.organizationId;

    const license = await License.findOne({
      where: { id, organizationId }
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'Licença não encontrada'
      });
    }

    const assetLicense = await AssetLicense.findOne({
      where: { assetId, licenseId: id, isActive: true }
    });

    if (!assetLicense) {
      return res.status(404).json({
        success: false,
        error: 'Atribuição não encontrada'
      });
    }

    // Desativar associação
    await assetLicense.update({
      isActive: false,
      unassignedDate: new Date()
    });

    // Decrementar usedSeats
    await license.decrement('usedSeats');

    logger.info(`Licença ${license.name} desatribuída do asset ${assetId}`);

    res.json({
      success: true,
      message: 'Licença desatribuída com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao desatribuir licença:', error);
    next(error);
  }
};

// ==================== STATISTICS ====================

/**
 * GET /api/inventory/statistics
 * Estatísticas do inventário
 */
export const getStatistics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { clientId } = req.query;

    const where = { organizationId };
    if (clientId) {
      where.clientId = clientId;
    }

    const [
      totalAssets,
      activeAssets,
      totalLicenses,
      expiringSoonLicenses,
      totalSoftware
    ] = await Promise.all([
      Asset.count({ where }),
      Asset.count({ where: { ...where, status: 'active' } }),
      License.count({ where: { organizationId, ...(clientId && { clientId }) } }),
      License.count({
        where: {
          organizationId,
          ...(clientId && { clientId }),
          expiryDate: {
            [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            [Op.gte]: new Date()
          }
        }
      }),
      Software.count({ where })
    ]);

    // Assets por tipo
    const assetsByType = await Asset.findAll({
      where,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    res.json({
      success: true,
      statistics: {
        assets: {
          total: totalAssets,
          active: activeAssets,
          byType: assetsByType
        },
        licenses: {
          total: totalLicenses,
          expiringSoon: expiringSoonLicenses
        },
        software: {
          total: totalSoftware
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    next(error);
  }
};

/**
 * POST /api/inventory/browser-collect
 * Receber dados coletados pelo navegador
 */
export const browserCollect = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { inventory, source } = req.body;

    logger.info('Browser collect request:', { userId, organizationId, hasInventory: !!inventory });

    if (!inventory) {
      return res.status(400).json({ error: 'Dados de inventário não fornecidos' });
    }

    // Detectar tipo de dispositivo baseado no OS
    let deviceType = 'desktop';
    if (inventory.os === 'Android' || inventory.os === 'iOS') {
      deviceType = 'smartphone';
    } else if (inventory.hardware?.touchSupport) {
      deviceType = 'tablet';
    }

    // Verificar se já existe um asset para este usuário com source=browser
    let asset = await Asset.findOne({
      where: {
        organizationId,
        userId,
        assetTag: `BROWSER-${userId}`
      }
    });

    logger.info('Asset lookup result:', { found: !!asset, assetTag: `BROWSER-${userId}` });

    // Montar especificações
    const specifications = {
      os: inventory.os,
      osVersion: inventory.osVersion,
      architecture: inventory.architecture,
      browser: inventory.browser,
      browserVersion: inventory.browserVersion,
      cpu: `${inventory.hardware?.cpuCores || 'Unknown'} cores`,
      ram: inventory.hardware?.memory || 'Unknown',
      gpu: inventory.hardware?.gpu || 'Unknown',
      screenResolution: inventory.hardware?.screenResolution,
      colorDepth: inventory.hardware?.colorDepth,
      timezone: inventory.locale?.timezone,
      language: inventory.locale?.language,
      collectionMethod: 'browser',
      userAgent: inventory.userAgent
    };

    if (asset) {
      // Atualizar asset existente
      logger.info('Updating existing asset:', asset.id);
      await asset.update({
        name: `${inventory.browser} - ${inventory.os}`,
        type: deviceType,
        specifications,
        lastSeen: new Date(),
        lastInventoryUpdate: new Date()
      });

      logger.info(`Asset atualizado via navegador: ${asset.assetTag}`);
    } else {
      // Buscar clientId do usuário (se for cliente)
      logger.info('Fetching user data for clientId:', userId);
      const user = await User.findByPk(userId);
      
      if (!user) {
        logger.error('User not found:', userId);
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      logger.info('User found:', { userId, clientId: user.clientId, role: user.role });
      
      // Criar novo asset
      const assetData = {
        organizationId,
        clientId: user.clientId || null,
        userId,
        assetTag: `BROWSER-${userId}`,
        name: `${inventory.browser} - ${inventory.os}`,
        type: deviceType,
        brand: 'Unknown',
        model: `${inventory.browser} ${inventory.browserVersion}`,
        serialNumber: `BROWSER-${Date.now()}`,
        specifications,
        status: 'active',
        lastSeen: new Date(),
        lastInventoryUpdate: new Date()
      };

      logger.info('Creating asset with data:', assetData);
      
      asset = await Asset.create(assetData);

      logger.info(`Novo asset criado via navegador: ${asset.assetTag}`);
    }

    res.json({
      success: true,
      message: 'Inventário atualizado com sucesso',
      asset: {
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        type: asset.type,
        model: asset.model
      }
    });
  } catch (error) {
    logger.error('Erro ao processar coleta via navegador:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    next(error);
  }
};

export default {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getSoftware,
  addSoftware,
  deleteSoftware,
  getLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  deleteLicense,
  assignLicense,
  unassignLicense,
  getStatistics,
  browserCollect
};
