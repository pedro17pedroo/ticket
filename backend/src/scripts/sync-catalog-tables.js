import { sequelize } from '../config/database.js';
import { CatalogCategory, CatalogItem, ServiceRequest } from '../modules/catalog/catalogModel.js';
import logger from '../config/logger.js';

const syncCatalogTables = async () => {
  try {
    console.log('🔄 Sincronizando tabelas do Catálogo de Serviços...');

    // Sincronizar tabelas (force: false para não dropar tabelas existentes)
    await CatalogCategory.sync({ alter: true });
    console.log('✅ Tabela catalog_categories criada/atualizada');

    await CatalogItem.sync({ alter: true });
    console.log('✅ Tabela catalog_items criada/atualizada');

    await ServiceRequest.sync({ alter: true });
    console.log('✅ Tabela service_requests criada/atualizada');

    console.log('✨ Sincronização concluída com sucesso!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao sincronizar tabelas:', error);
    logger.error('Erro na sincronização do catálogo:', error);
    process.exit(1);
  }
};

syncCatalogTables();
