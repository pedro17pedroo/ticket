import { sequelize } from '../config/database.js';
import TimeTracking from '../modules/timeTracking/timeTrackingModel.js';
import { Tag, TicketTag } from '../modules/tags/tagModel.js';
import ResponseTemplate from '../modules/templates/templateModel.js';
import logger from '../config/logger.js';

const syncAllNewTables = async () => {
  try {
    console.log('🔄 Sincronizando novas tabelas...\n');

    // Time Tracking
    await TimeTracking.sync({ alter: true });
    console.log('✅ Tabela time_tracking criada/atualizada');

    // Tags
    await Tag.sync({ alter: true });
    console.log('✅ Tabela tags criada/atualizada');

    await TicketTag.sync({ alter: true });
    console.log('✅ Tabela ticket_tags criada/atualizada');

    // Templates
    await ResponseTemplate.sync({ alter: true });
    console.log('✅ Tabela response_templates criada/atualizada');

    console.log('\n✨ Sincronização concluída com sucesso!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao sincronizar tabelas:', error);
    logger.error('Erro na sincronização:', error);
    process.exit(1);
  }
};

syncAllNewTables();
