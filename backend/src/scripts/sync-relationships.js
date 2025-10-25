import { sequelize } from '../config/database.js';
import TicketRelationship from '../modules/tickets/ticketRelationshipModel.js';
import logger from '../config/logger.js';

const syncRelationships = async () => {
  try {
    console.log('🔄 Sincronizando tabela de relacionamentos...\n');

    await TicketRelationship.sync({ alter: true });
    console.log('✅ Tabela ticket_relationships criada/atualizada');

    console.log('\n✨ Sincronização concluída com sucesso!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao sincronizar tabela:', error);
    logger.error('Erro na sincronização:', error);
    process.exit(1);
  }
};

syncRelationships();
