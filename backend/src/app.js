import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from './middleware/auth.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import logger from './config/logger.js';

const app = express();

// Segurança
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting (mais permissivo em desenvolvimento)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 100 : 1000), // 1000 em dev, 100 em prod
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limit para requests de mesmo usuário autenticado
  skip: (req) => {
    // Não aplicar rate limit em desenvolvimento local
    if (process.env.NODE_ENV === 'development' && req.ip === '::1' || req.ip === '127.0.0.1') {
      return true;
    }
    return false;
  }
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport
app.use(passport.initialize());

// Logging de requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Rotas
app.use('/api', routes);

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// 404
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;
