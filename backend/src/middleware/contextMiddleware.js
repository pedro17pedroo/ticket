import contextService from '../services/contextService.js';
import logger from '../config/logger.js';

/**
 * Middleware para extrair e validar contexto do token JWT
 * Valida que a sessão ainda está ativa e não expirou
 * 
 * Este middleware deve ser usado APÓS o middleware authenticate
 * para garantir que req.user já está populado
 */
export const validateContext = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para acessar este recurso'
      });
    }

    // Extrair informações de contexto do token
    const { sessionId, contextId, contextType } = req.user;

    // Verificar se o token contém informações de contexto
    if (!sessionId || !contextId || !contextType) {
      logger.warn('Token sem informações de contexto:', {
        userId: req.user.id,
        email: req.user.email
      });
      
      return res.status(401).json({
        error: 'Contexto inválido',
        message: 'Token não contém informações de contexto válidas. Por favor, faça login novamente.'
      });
    }

    // Validar que a sessão ainda está ativa
    const activeContext = await contextService.getActiveContext(sessionId);

    if (!activeContext) {
      logger.warn('Sessão inválida ou expirada:', {
        sessionId,
        userId: req.user.id,
        email: req.user.email
      });

      return res.status(401).json({
        error: 'Sessão expirada',
        message: 'Sua sessão expirou. Por favor, faça login novamente.'
      });
    }

    // Verificar se o contexto da sessão corresponde ao contexto do token
    if (activeContext.contextId !== contextId || activeContext.contextType !== contextType) {
      logger.error('Inconsistência entre token e sessão:', {
        tokenContext: { contextId, contextType },
        sessionContext: { 
          contextId: activeContext.contextId, 
          contextType: activeContext.contextType 
        }
      });

      return res.status(401).json({
        error: 'Contexto inválido',
        message: 'Inconsistência detectada. Por favor, faça login novamente.'
      });
    }

    // Contexto validado com sucesso
    next();
  } catch (error) {
    logger.error('Erro ao validar contexto:', error);
    
    return res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao validar contexto da sessão'
    });
  }
};

/**
 * Middleware para injetar informações de contexto no objeto req
 * Adiciona req.context com informações completas do contexto ativo
 * 
 * Este middleware deve ser usado APÓS o middleware authenticate
 */
export const injectContext = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para acessar este recurso'
      });
    }

    // Extrair informações de contexto do token
    const { 
      sessionId, 
      contextId, 
      contextType, 
      organizationId,
      clientId,
      role,
      permissions 
    } = req.user;

    // Criar objeto de contexto para injetar no req
    req.context = {
      sessionId,
      contextId,
      contextType,
      organizationId,
      clientId: clientId || null,
      role,
      permissions: permissions || [],
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      userType: req.user.userType
    };

    next();
  } catch (error) {
    logger.error('Erro ao injetar contexto:', error);
    
    return res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao processar contexto da requisição'
    });
  }
};

/**
 * Middleware para validar que recursos acessados pertencem ao contexto ativo
 * Verifica se o organizationId do recurso corresponde ao organizationId do contexto
 * 
 * Este middleware deve ser usado APÓS injectContext
 * 
 * @param {Object} options - Opções de configuração
 * @param {string} options.resourceOrgIdParam - Nome do parâmetro que contém o organizationId do recurso (ex: 'organizationId')
 * @param {string} options.resourceOrgIdBody - Nome do campo no body que contém o organizationId do recurso
 * @param {boolean} options.allowCrossOrg - Se true, permite acesso cross-org para admins
 */
export const validateResourceContext = (options = {}) => {
  const {
    resourceOrgIdParam = 'organizationId',
    resourceOrgIdBody = 'organizationId',
    allowCrossOrg = false
  } = options;

  return (req, res, next) => {
    try {
      // Verificar se o contexto foi injetado
      if (!req.context) {
        logger.error('validateResourceContext chamado sem req.context');
        return res.status(500).json({
          error: 'Erro interno',
          message: 'Contexto não disponível'
        });
      }

      // Extrair organizationId do recurso (params ou body)
      const resourceOrgId = req.params[resourceOrgIdParam] || req.body[resourceOrgIdBody];

      // Se não há organizationId no recurso, permitir acesso
      // (o recurso pode não estar vinculado a uma organização específica)
      if (!resourceOrgId) {
        return next();
      }

      // Verificar se o recurso pertence à organização do contexto ativo
      if (resourceOrgId !== req.context.organizationId) {
        // Se allowCrossOrg está habilitado e o usuário é admin, permitir
        if (allowCrossOrg && req.context.role === 'org-admin') {
          logger.info('Acesso cross-org permitido para admin:', {
            userId: req.context.userId,
            userOrg: req.context.organizationId,
            resourceOrg: resourceOrgId
          });
          return next();
        }

        logger.warn('Tentativa de acesso a recurso de outra organização:', {
          userId: req.context.userId,
          userEmail: req.context.userEmail,
          userOrg: req.context.organizationId,
          resourceOrg: resourceOrgId,
          path: req.path
        });

        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar recursos de outra organização'
        });
      }

      // Recurso pertence à organização do contexto ativo
      next();
    } catch (error) {
      logger.error('Erro ao validar contexto do recurso:', error);
      
      return res.status(500).json({
        error: 'Erro interno',
        message: 'Erro ao validar acesso ao recurso'
      });
    }
  };
};

/**
 * Middleware para validar que recursos de cliente pertencem ao contexto ativo
 * Verifica se o clientId do recurso corresponde ao clientId do contexto
 * 
 * Este middleware deve ser usado APÓS injectContext
 * Útil para contextos de tipo 'client' onde precisamos validar acesso a recursos específicos do cliente
 * 
 * @param {Object} options - Opções de configuração
 * @param {string} options.resourceClientIdParam - Nome do parâmetro que contém o clientId do recurso
 * @param {string} options.resourceClientIdBody - Nome do campo no body que contém o clientId do recurso
 */
export const validateClientResourceContext = (options = {}) => {
  const {
    resourceClientIdParam = 'clientId',
    resourceClientIdBody = 'clientId'
  } = options;

  return (req, res, next) => {
    try {
      // Verificar se o contexto foi injetado
      if (!req.context) {
        logger.error('validateClientResourceContext chamado sem req.context');
        return res.status(500).json({
          error: 'Erro interno',
          message: 'Contexto não disponível'
        });
      }

      // Se o contexto não é do tipo 'client', permitir acesso
      // (validação de organização já foi feita por validateResourceContext)
      if (req.context.contextType !== 'client') {
        return next();
      }

      // Extrair clientId do recurso (params ou body)
      const resourceClientId = req.params[resourceClientIdParam] || req.body[resourceClientIdBody];

      // Se não há clientId no recurso, permitir acesso
      if (!resourceClientId) {
        return next();
      }

      // Verificar se o recurso pertence ao cliente do contexto ativo
      if (resourceClientId !== req.context.clientId) {
        logger.warn('Tentativa de acesso a recurso de outro cliente:', {
          userId: req.context.userId,
          userEmail: req.context.userEmail,
          userClient: req.context.clientId,
          resourceClient: resourceClientId,
          path: req.path
        });

        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar recursos de outro cliente'
        });
      }

      // Recurso pertence ao cliente do contexto ativo
      next();
    } catch (error) {
      logger.error('Erro ao validar contexto do recurso de cliente:', error);
      
      return res.status(500).json({
        error: 'Erro interno',
        message: 'Erro ao validar acesso ao recurso'
      });
    }
  };
};
