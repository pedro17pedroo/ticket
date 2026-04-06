const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGIN || '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const allowedOrigins = parseAllowedOrigins();

export const corsOptions = {
  origin: (origin, callback) => {
    // Permitir ferramentas locais (sem origin) e cenários sem restrição configurada
    if (!origin || allowedOrigins.length === 0) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
};

export const socketCorsOptions = {
  origin: allowedOrigins.length === 0 ? '*' : allowedOrigins,
  credentials: true
};
