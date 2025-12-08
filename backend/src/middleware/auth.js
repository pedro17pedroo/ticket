import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User, OrganizationUser, ClientUser } from '../modules/models/index.js';
import logger from '../config/logger.js';

// Configurar estratégia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const { id, userType } = payload;

      let user = null;

      // Escolher a tabela correta com base no userType gravado no token
      if (userType === 'provider') {
        user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
      } else if (userType === 'organization') {
        user = await OrganizationUser.findByPk(id, { attributes: { exclude: ['password'] } });
      } else if (userType === 'client') {
        user = await ClientUser.findByPk(id, { attributes: { exclude: ['password'] } });
      } else {
        // Fallback de segurança: tentar em todas as tabelas
        user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
        if (!user) {
          user = await OrganizationUser.findByPk(id, { attributes: { exclude: ['password'] } });
        }
        if (!user) {
          user = await ClientUser.findByPk(id, { attributes: { exclude: ['password'] } });
        }
      }

      if (!user || user.isActive === false) {
        return done(null, false);
      }

      // Adicionar userType e clientId do payload ao objeto user que vai para req.user
      const userData = {
        ...user.toJSON(),
        userType: userType || payload.userType || 'organization',
        clientId: payload.clientId || user.clientId || null
      };

      return done(null, userData);
    } catch (error) {
      logger.error('Erro na autenticação JWT:', error);
      return done(error, false);
    }
  })
);

// Middleware de autenticação
export const authenticate = passport.authenticate('jwt', { session: false });

// Middleware de verificação de role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para acessar este recurso'
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn(`Acesso negado: ${req.user.email} tentou acessar ${req.path} com role ${req.user.role}`);
      
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: `Esta ação requer uma das seguintes permissões: ${roles.join(', ')}`,
        userRole: req.user.role,
        requiredRoles: roles
      });
    }

    next();
  };
};

// Middlewares de autorização específicos
export const requireAdminOrg = authorize('org-admin');
export const requireAgent = authorize('org-admin', 'agente');

// Middleware para verificar se o usuário pertence à mesma organização
export const requireSameOrganization = (req, res, next) => {
  const resourceOrgId = req.params.organizationId || req.body.organizationId;
  
  if (!resourceOrgId) {
    return next();
  }

  if (req.user.organizationId !== resourceOrgId) {
    logger.warn(`Tentativa de acesso cross-org: ${req.user.email} tentou acessar recurso da org ${resourceOrgId}`);
    
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Você não tem permissão para acessar recursos de outra organização'
    });
  }

  next();
};

// Middleware para verificar se o usuário pode acessar o recurso (owner ou admin)
export const requireOwnerOrAdmin = (req, res, next) => {
  const resourceUserId = req.params.userId || req.params.id;
  
  if (req.user.role === 'org-admin') {
    return next();
  }

  if (req.user.id === resourceUserId) {
    return next();
  }

  logger.warn(`Acesso negado: ${req.user.email} tentou acessar recurso do usuário ${resourceUserId}`);
  
  return res.status(403).json({ 
    error: 'Acesso negado',
    message: 'Você não tem permissão para acessar este recurso'
  });
};

// Gerar token JWT
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      organizationId: user.organizationId,
      userType: user.userType || 'organization', // Importante para notificações
      clientId: user.clientId || null
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

export default passport;
