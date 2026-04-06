module.exports = {
  apps: [
    {
      name: 'tdesk-backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env_file: '/var/www/tdesk/backend/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 4003,
        JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
      }
    }
  ]
};
