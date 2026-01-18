import AuditLog from './src/models/AuditLog.js';
import { sequelize } from './src/config/database.js';
import { Op } from 'sequelize';

const test = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco');

    // Testar query simples
    const all = await AuditLog.findAll();
    console.log(`📊 Total de logs (findAll):`, all.length);

    // Testar com where
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const filtered = await AuditLog.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    console.log(`📊 Logs dos últimos 7 dias:`, filtered.length);
    
    if (filtered.length > 0) {
      console.log('📋 Primeiro log:', JSON.stringify(filtered[0].toJSON(), null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
};

test();
