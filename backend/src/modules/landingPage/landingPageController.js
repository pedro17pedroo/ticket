import LandingPageConfig from './landingPageModel.js';
import logger from '../../config/logger.js';

/**
 * GET /api/landing-page/config
 * Obter configuração da landing page (público)
 */
export const getConfig = async (req, res, next) => {
  try {
    let config = await LandingPageConfig.findOne({
      where: { isActive: true },
      order: [['updatedAt', 'DESC']]
    });

    // Se não existir, criar configuração padrão
    if (!config) {
      config = await LandingPageConfig.create({});
      logger.info('Configuração padrão da landing page criada');
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    logger.error('Erro ao obter configuração da landing page:', error);
    next(error);
  }
};

/**
 * PUT /api/landing-page/config
 * Atualizar configuração da landing page (admin)
 */
export const updateConfig = async (req, res, next) => {
  try {
    const updates = req.body;

    let config = await LandingPageConfig.findOne({
      where: { isActive: true },
      order: [['updatedAt', 'DESC']]
    });

    if (!config) {
      config = await LandingPageConfig.create(updates);
    } else {
      await config.update(updates);
    }

    logger.info(`Landing page atualizada por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      config
    });
  } catch (error) {
    logger.error('Erro ao atualizar configuração da landing page:', error);
    next(error);
  }
};

/**
 * POST /api/landing-page/config/reset
 * Resetar para configuração padrão (admin)
 */
export const resetConfig = async (req, res, next) => {
  try {
    // Desativar configuração atual
    await LandingPageConfig.update(
      { isActive: false },
      { where: { isActive: true } }
    );

    // Criar nova configuração padrão
    const config = await LandingPageConfig.create({});

    logger.info(`Landing page resetada por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Configuração resetada para padrão',
      config
    });
  } catch (error) {
    logger.error('Erro ao resetar configuração da landing page:', error);
    next(error);
  }
};

/**
 * GET /api/landing-page/config/history
 * Obter histórico de configurações (admin)
 */
export const getConfigHistory = async (req, res, next) => {
  try {
    const configs = await LandingPageConfig.findAll({
      order: [['updatedAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      configs
    });
  } catch (error) {
    logger.error('Erro ao obter histórico da landing page:', error);
    next(error);
  }
};
