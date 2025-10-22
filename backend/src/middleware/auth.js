import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../modules/models/index.js';
import logger from '../config/logger.js';

// Configurar estratégia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findByPk(payload.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user || !user.isActive) {
        return done(null, false);
      }
      
      return done(null, user);
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
export const requireAdminOrg = authorize('admin-org');
export const requireAgent = authorize('admin-org', 'agente');

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
  
  if (req.user.role === 'admin-org') {
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
      organizationId: user.organizationId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

export default passport;
