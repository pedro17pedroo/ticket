import { Asset, Software as SoftwareInstalled, License as SoftwareLicense, AssetLicense } from '../models/index.js';
import { OrganizationUser, ClientUser, Client } from '../models/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import logger from '../../config/logger.js';

// ==================== HELPERS ====================

/**
 * Busca um usuário em qualquer uma das 3 tabelas
 * @param {string} userId - ID do usuário
 * @returns {Promise<{user: Object, userType: string} | null>}
 */
async function findUserAnyTable(userId) {
  // Tentar OrganizationUser primeiro
  let user = await OrganizationUser.findByPk(userId);
  if (user) {
    return { user, userType: 'organization', clientId: null };
  }

  // Tentar ClientUser
  user = await ClientUser.findByPk(userId);
  if (user) {
    return { user, userType: 'client', clientId: user.clientId };
  }

  return null;
}

// ==================== ASSETS ====================

/**
 * GET /api/inventory/assets
 * Listar assets (com filtros)
 */
export const getAssets = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const { 
      type, 
      status, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    const where = { organizationId };

    // Se for cliente, mostrar apenas seus equipamentos
    if (userRole && userRole.startsWith('client')) {
      where.userId = userId;
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
        { serialNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: assets } = await Asset.findAndCountAll({
      where,
      include: [
        {
          model: SoftwareInstalled,
          as: 'software',
          attributes: ['id', 'name', 'vendor', 'version'],
          required: false
        },
        {
          model: SoftwareLicense,
          as: 'licenses',
          attributes: ['id', 'softwareName', 'vendor', 'licenseType'],
          through: { attributes: [] },
          required: false
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const where = { id, organizationId };
    
    // Se for cliente, verificar se o asset pertence a ele
    if (userRole && userRole.startsWith('client')) {
      where.userId = userId;
    }

    const asset = await Asset.findOne({
      where,
      include: [
        {
          model: SoftwareInstalled,
          as: 'software',
          attributes: ['id', 'name', 'vendor', 'version', 'installDate'],
          required: false
        },
        {
          model: SoftwareLicense,
          as: 'licenses',
          attributes: ['id', 'softwareName', 'vendor', 'licenseType', 'expiryDate'],
          through: { attributes: [] },
          required: false
        }
      ]
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Equipamento não encontrado'
      });
    }

    res.json({
      success: true,
      asset
    });
  } catch (error) {
    logger.error('Erro ao buscar asset:', {
      message: error.message,
      stack: error.stack,
      assetId: req.params.id
    });
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const where = { organizationId };
    
    // Se for cliente, mostrar apenas seus equipamentos
    if (userRole && userRole.startsWith('client')) {
      where.userId = userId;
    }

    const [
      totalAssets,
      activeAssets,
      totalSoftware,
      totalLicenses
    ] = await Promise.all([
      Asset.count({ where }),
      Asset.count({ where: { ...where, status: 'active' } }),
      SoftwareInstalled.count({ 
        include: [{
          model: Asset,
          as: 'asset',
          where,
          attributes: []
        }]
      }),
      SoftwareLicense.count({ where: { organizationId } })
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
        software: {
          total: totalSoftware
        },
        licenses: {
          total: totalLicenses
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

    // Preparar dados do asset
    const assetData = {
      name: `${inventory.browser} - ${inventory.os}`,
      type: deviceType,
      manufacturer: 'Browser Detection',
      model: `${inventory.browser} ${inventory.browserVersion}`,
      os: inventory.os,
      osVersion: inventory.osVersion,
      processor: inventory.hardware?.gpu || null,
      processorCores: inventory.hardware?.cpuCores || null,
      ram: inventory.hardware?.memory || null,
      graphicsCard: inventory.hardware?.gpu || null,
      hostname: inventory.userAgent?.split(' ')[0] || null,
      lastSeen: new Date(),
      lastInventoryScan: new Date(),
      collectionMethod: 'web',
      rawData: {
        ...inventory,
        collectedAt: new Date().toISOString()
      }
    };

    if (asset) {
      // Atualizar asset existente
      logger.info('Updating existing asset:', asset.id);
      await asset.update(assetData);

      logger.info(`Asset atualizado via navegador: ${asset.assetTag}`);
    } else {
      // Buscar clientId do usuário (se for cliente)
      logger.info('Fetching user data for clientId:', userId);
      const userData = await findUserAnyTable(userId);
      
      if (!userData) {
        logger.error('User not found:', userId);
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      logger.info('User found:', { userId, clientId: userData.clientId, userType: userData.userType });
      
      // Criar novo asset com todos os dados
      const newAssetData = {
        organizationId,
        clientId: userData.clientId,
        userId,
        assetTag: `BROWSER-${userId}`,
        serialNumber: `BROWSER-${Date.now()}`,
        status: 'active',
        ...assetData
      };

      logger.info('Creating asset with data');
      
      asset = await Asset.create(newAssetData);

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
      name: error.name,
      sql: error.sql,
      original: error.original?.message
    });
    
    // Retornar erro detalhado para debug
    res.status(500).json({
      error: 'Erro ao processar inventário',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * POST /api/inventory/agent-collect
 * Receber dados coletados pelo Desktop Agent
 */
export const agentCollect = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { inventory, source } = req.body;

    logger.info('Agent collect request:', { userId, organizationId, machineId: inventory.machineId });

    if (!inventory) {
      return res.status(400).json({ error: 'Dados de inventário não fornecidos' });
    }

    // Verificar se já existe um asset com este machineId
    let asset = await Asset.findOne({
      where: {
        organizationId,
        assetTag: inventory.machineId
      }
    });

    // Buscar usuário para obter clientId
    const userData = await findUserAnyTable(userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userData.user;

    // Preparar dados do asset
    const assetData = {
      name: inventory.hostname || `${inventory.manufacturer} ${inventory.model}`,
      type: inventory.type || 'desktop',
      manufacturer: inventory.manufacturer,
      model: inventory.model,
      serialNumber: inventory.serialNumber,
      os: inventory.os,
      osVersion: inventory.osVersion,
      osBuild: inventory.osBuild,
      osArchitecture: inventory.osArchitecture?.toLowerCase() === 'arm64' ? 'ARM64' : 
                       inventory.osArchitecture?.toLowerCase() === 'arm' ? 'ARM' :
                       inventory.osArchitecture?.toLowerCase() === 'x64' ? 'x64' : 'x86',
      processor: inventory.processor,
      processorCores: inventory.processorCores,
      ram: inventory.ram,
      ramGB: inventory.ramGB,
      storage: inventory.storage,
      storageGB: inventory.storageGB,
      storageType: inventory.storageType?.toUpperCase(),
      graphicsCard: inventory.graphicsCard,
      hostname: inventory.hostname,
      ipAddress: inventory.ipAddress,
      macAddress: inventory.macAddress,
      domain: inventory.domain || null,
      hasAntivirus: inventory.security?.hasAntivirus || false,
      antivirusName: inventory.security?.antivirusName,
      antivirusVersion: inventory.security?.antivirusVersion,
      antivirusUpdated: inventory.security?.antivirusUpdated,
      hasFirewall: inventory.security?.hasFirewall || false,
      isEncrypted: inventory.security?.isEncrypted || false,
      lastSeen: new Date(),
      lastInventoryScan: new Date(),
      collectionMethod: inventory.collectionMethod || 'agent',
      rawData: {
        ...inventory,
        collectedAt: new Date().toISOString()
      }
    };

    if (asset) {
      // Atualizar asset existente
      await asset.update(assetData);
      logger.info(`Asset atualizado via desktop agent: ${asset.assetTag}`);
    } else {
      // Criar novo asset
      const newAssetData = {
        organizationId,
        clientId: user.clientId || null,
        userId,
        assetTag: inventory.machineId,
        status: 'active',
        ...assetData
      };

      asset = await Asset.create(newAssetData);
      logger.info(`Novo asset criado via desktop agent: ${asset.assetTag}`);
    }

    // Processar software instalado
    if (inventory.software && inventory.software.length > 0) {
      // Remover software antigo
      await Software.destroy({
        where: { assetId: asset.id }
      });

      // Adicionar novo software - TODAS as aplicações
      const softwarePromises = inventory.software.map(sw => {
        return Software.create({
          assetId: asset.id,
          organizationId,
          name: sw.name,
          version: sw.version,
          publisher: sw.publisher || sw.vendor,
          category: sw.category || 'application',
          installDate: sw.installDate,
          size: sw.size
        });
      });

      await Promise.all(softwarePromises);
      logger.info(`${softwarePromises.length} aplicações registradas para asset ${asset.id}`);
    }

    res.json({
      success: true,
      message: 'Inventário recebido e processado com sucesso',
      asset: {
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        type: asset.type
      }
    });
  } catch (error) {
    logger.error('Erro ao processar coleta via desktop agent:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Erro ao processar inventário',
      message: error.message
    });
  }
};

// ==================== ORGANIZATION INVENTORY ====================

/**
 * GET /api/inventory/organization/users
 * Listar usuários da organização com contagem de assets
 */
export const getOrganizationUsers = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const users = await OrganizationUser.findAll({
      where: { 
        organizationId
      },
      attributes: ['id', 'name', 'email', 'role', 'isActive'],
      include: [
        {
          model: Asset,
          as: 'userAssets',
          attributes: ['id', 'type', 'collectionMethod'],
          required: false
        }
      ]
    });

    // Calcular estatísticas por usuário
    const usersWithStats = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      assetsCount: user.userAssets?.length || 0,
      assetsSummary: {
        hasDesktop: user.userAssets?.some(a => a.type === 'desktop') || false,
        hasLaptop: user.userAssets?.some(a => a.type === 'laptop') || false,
        desktopCount: user.userAssets?.filter(a => a.type === 'desktop').length || 0,
        laptopCount: user.userAssets?.filter(a => a.type === 'laptop').length || 0,
        agentCount: user.userAssets?.filter(a => a.collectionMethod === 'agent').length || 0,
        webCount: user.userAssets?.filter(a => a.collectionMethod === 'web').length || 0
      }
    }));

    res.json({
      success: true,
      users: usersWithStats
    });
  } catch (error) {
    logger.error('Erro ao buscar usuários da organização:', error);
    next(error);
  }
};

/**
 * GET /api/inventory/organization/statistics
 * Estatísticas de inventário da organização
 */
export const getOrganizationInventoryStats = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const [totalUsers, totalAssets, onlineUsers] = await Promise.all([
      OrganizationUser.count({ 
        where: { 
          organizationId
        }
      }),
      Asset.count({ where: { organizationId } }),
      OrganizationUser.count({ 
        where: { 
          organizationId
          // Adicionar lógica de online se tiver campo lastSeen
        }
      })
    ]);

    res.json({
      success: true,
      statistics: {
        totalUsers,
        totalAssets,
        onlineUsers: 0 // Placeholder até implementar lastSeen
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas da organização:', error);
    next(error);
  }
};

// ==================== CLIENTS INVENTORY ====================

/**
 * GET /api/inventory/clients
 * Listar clientes com informações de inventário
 */
export const getClientsWithInventory = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    // Buscar empresas clientes da tabela clients
    const clients = await Client.findAll({
      where: { 
        organizationId
      },
      attributes: ['id', 'name', 'tradeName', 'isActive'],
      include: [
        {
          model: Asset,
          as: 'clientAssets',
          attributes: ['id', 'type', 'collectionMethod'],
          required: false
        }
      ]
    });

    // Para cada cliente, contar quantos usuários tem
    const clientsWithUserCounts = await Promise.all(
      clients.map(async (client) => {
        const usersCount = await ClientUser.count({
          where: {
            organizationId,
            clientId: client.id // Usuários que pertencem a este cliente
          }
        });
        return {
          ...client.toJSON(),
          usersCount
        };
      })
    );

    // Calcular estatísticas por cliente (usando clientsWithUserCounts que tem usersCount)
    const clientsWithStats = clientsWithUserCounts.map(client => ({
      id: client.id,
      name: client.name,
      tradeName: client.tradeName,
      isActive: client.isActive,
      usersCount: client.usersCount,
      assetsCount: client.clientAssets?.length || 0,
      assetsSummary: {
        hasDesktop: client.clientAssets?.some(a => a.type === 'desktop') || false,
        hasLaptop: client.clientAssets?.some(a => a.type === 'laptop') || false,
        desktopCount: client.clientAssets?.filter(a => a.type === 'desktop').length || 0,
        laptopCount: client.clientAssets?.filter(a => a.type === 'laptop').length || 0,
        agentCount: client.clientAssets?.filter(a => a.collectionMethod === 'agent').length || 0,
        webCount: client.clientAssets?.filter(a => a.collectionMethod === 'web').length || 0
      }
    }));

    res.json({
      success: true,
      clients: clientsWithStats
    });
  } catch (error) {
    logger.error('Erro ao buscar clientes:', error);
    next(error);
  }
};

/**
 * GET /api/inventory/clients/statistics
 * Estatísticas de inventário de clientes
 */
export const getClientsInventoryStats = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const [totalClients, totalClientUsers, totalClientAssets] = await Promise.all([
      // Total de empresas clientes
      Client.count({ 
        where: { 
          organizationId
        }
      }),
      // Total de usuários de empresas clientes
      ClientUser.count({ 
        where: { 
          organizationId
        }
      }),
      // Assets das empresas clientes
      Asset.count({ 
        where: { 
          organizationId,
          clientId: { [Op.ne]: null }
        }
      })
    ]);

    res.json({
      success: true,
      statistics: {
        totalClients,
        totalClientUsers,
        totalUsers: totalClientUsers,
        totalAssets: totalClientAssets
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de clientes:', error);
    next(error);
  }
};

/**
 * GET /api/inventory/users/:userId
 * Obter inventário de um usuário específico
 */
export const getUserInventory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const organizationId = req.user.organizationId;

    const userData = await findUserAnyTable(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const user = userData.user;

    const assets = await Asset.findAll({
      where: { 
        organizationId,
        [Op.or]: [
          { userId },
          { clientId: userId }
        ]
      },
      include: [
        {
          model: SoftwareInstalled,
          as: 'software',
          attributes: ['id', 'name', 'vendor', 'version'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      user,
      assets
    });
  } catch (error) {
    logger.error('Erro ao buscar inventário do usuário:', error);
    next(error);
  }
};

/**
 * GET /api/inventory/clients/:clientId
 * Obter inventário de um cliente específico
 */
export const getClientInventory = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const organizationId = req.user.organizationId;

    // Buscar empresa cliente
    const client = await Client.findOne({
      where: { 
        id: clientId, 
        organizationId
      },
      attributes: ['id', 'name', 'tradeName', 'isActive'],
      include: [
        {
          model: Asset,
          as: 'clientAssets',
          attributes: ['id', 'type', 'collectionMethod', 'name'],
          required: false,
          include: [
            {
              model: SoftwareInstalled,
              as: 'software',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Empresa cliente não encontrada'
      });
    }

    // Buscar usuários da empresa cliente
    const users = await ClientUser.findAll({
      where: { 
        organizationId,
        clientId
      },
      attributes: ['id', 'name', 'email', 'isActive'],
      include: [
        {
          model: Asset,
          as: 'userAssets',
          attributes: ['id', 'type', 'collectionMethod'],
          required: false,
          include: [
            {
              model: SoftwareInstalled,
              as: 'software',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        }
      ]
    });

    // Mapear usuários com suas estatísticas
    const usersWithStats = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      assetsCount: u.userAssets?.length || 0,
      assetsSummary: {
        hasDesktop: u.userAssets?.some(a => a.type === 'desktop') || false,
        hasLaptop: u.userAssets?.some(a => a.type === 'laptop') || false,
        desktopCount: u.userAssets?.filter(a => a.type === 'desktop').length || 0,
        laptopCount: u.userAssets?.filter(a => a.type === 'laptop').length || 0,
        agentCount: u.userAssets?.filter(a => a.collectionMethod === 'agent').length || 0,
        webCount: u.userAssets?.filter(a => a.collectionMethod === 'web').length || 0
      }
    }));

    res.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        tradeName: client.tradeName,
        isActive: client.isActive,
        assetsCount: client.clientAssets?.length || 0,
        assetsSummary: {
          hasDesktop: client.clientAssets?.some(a => a.type === 'desktop') || false,
          hasLaptop: client.clientAssets?.some(a => a.type === 'laptop') || false,
          desktopCount: client.clientAssets?.filter(a => a.type === 'desktop').length || 0,
          laptopCount: client.clientAssets?.filter(a => a.type === 'laptop').length || 0,
          agentCount: client.clientAssets?.filter(a => a.collectionMethod === 'agent').length || 0,
          webCount: client.clientAssets?.filter(a => a.collectionMethod === 'web').length || 0
        }
      },
      users: usersWithStats, // Apenas usuários reais
      totalUsers: usersWithStats.length,
      totalAssets: (client.clientAssets?.length || 0) + users.reduce((acc, u) => acc + (u.userAssets?.length || 0), 0),
      totalSoftware: (
        // Software dos assets do cliente master
        (client.clientAssets?.reduce((acc, asset) => acc + (asset.software?.length || 0), 0) || 0) +
        // Software dos assets dos usuários filhos
        users.reduce((acc, u) => 
          acc + (u.userAssets?.reduce((assetAcc, asset) => 
            assetAcc + (asset.software?.length || 0), 0) || 0
          ), 0
        )
      )
    });
  } catch (error) {
    logger.error('Erro ao buscar inventário do cliente:', error);
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
  browserCollect,
  agentCollect,
  getOrganizationUsers,
  getOrganizationInventoryStats,
  getClientsWithInventory,
  getClientsInventoryStats,
  getUserInventory,
  getClientInventory
};
