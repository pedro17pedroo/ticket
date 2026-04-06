import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { connectPostgreSQL, connectMongoDB, syncDatabase } from '../config/database.js';
import { 
  Organization, 
  Direction,
  setupAssociations 
} from '../modules/models/index.js';
import logger from '../config/logger.js';

const runDirectionsSeed = async () => {
  try {
    logger.info('🌱 Iniciando seed de direções...');

    // Conectar bancos
    await connectPostgreSQL();
    await connectMongoDB();
    setupAssociations();
    await syncDatabase();

    // Buscar organizações existentes
    const organizations = await Organization.findAll();
    
    if (organizations.length === 0) {
      logger.error('❌ Nenhuma organização encontrada!');
      logger.error('➡️  Execute primeiro: node src/seeds/provider-seed.js');
      process.exit(1);
    }

    // Criar direções padrão para cada organização
    for (const org of organizations) {
      logger.info(`📁 Criando direções para: ${org.name}`);
      
      const directions = await Direction.bulkCreate([
        {
          organizationId: org.id,
          name: 'Direção Geral',
          description: 'Direção executiva e administrativa',
          code: 'DG'
        },
        {
          organizationId: org.id,
          name: 'Direção Técnica',
          description: 'Direção de tecnologia e desenvolvimento',
          code: 'DT'
        },
        {
          organizationId: org.id,
          name: 'Direção Comercial',
          description: 'Direção de vendas e marketing',
          code: 'DC'
        },
        {
          organizationId: org.id,
          name: 'Direção Operacional',
          description: 'Direção de operações e suporte',
          code: 'DO'
        }
      ], {
        ignoreDuplicates: true
      });
      
      logger.info(`✅ ${directions.length} direções criadas para ${org.name}`);
    }

    logger.info('✨ Seed de direções concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao executar seed de direções:', error);
    process.exit(1);
  }
};

runDirectionsSeed();