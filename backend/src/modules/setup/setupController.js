import organizationSeedService from '../../services/organizationSeedService.js';
import logger from '../../config/logger.js';

/**
 * POST /api/setup/defaults
 * Popular dados padrão (prioridades, tipos, categorias, SLAs, categorias de catálogo)
 */
export const setupDefaults = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    logger.info(`[Setup] Starting default data setup for organization: ${organizationId}`);

    // Use the centralized seed service
    const stats = await organizationSeedService.seedOrganizationDefaults(organizationId);

    const totalCreated = stats.priorities + stats.types + stats.categories + stats.slas + stats.catalogCategories;

    if (totalCreated === 0 && stats.skipped.length > 0) {
      return res.json({
        success: true,
        message: 'Dados padrão já existem',
        stats: {
          created: stats,
          skipped: stats.skipped
        }
      });
    }

    logger.info(`[Setup] Default data created for org ${organizationId}:`, stats);

    res.json({
      success: true,
      message: 'Dados padrão criados com sucesso',
      stats: {
        priorities: stats.priorities,
        types: stats.types,
        categories: stats.categories,
        slas: stats.slas,
        catalogCategories: stats.catalogCategories,
        skipped: stats.skipped
      }
    });
  } catch (error) {
    logger.error('[Setup] Error creating default data:', error);
    next(error);
  }
};

/**
 * GET /api/setup/status
 * Verificar status dos dados padrão da organização
 */
export const checkSetupStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const status = await organizationSeedService.checkSeedStatus(organizationId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('[Setup] Error checking setup status:', error);
    next(error);
  }
};

