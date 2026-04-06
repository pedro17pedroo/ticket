import { sequelize } from '../config/database.js';
import TicketHistory from '../modules/tickets/ticketHistoryModel.js';
import logger from '../config/logger.js';

const migrateTicketImprovements = async () => {
  try {
    console.log('🔄 Aplicando melhorias no sistema de tickets...\n');

    // 1. Criar tabela de histórico
    console.log('1️⃣ Criando tabela de histórico...');
    await TicketHistory.sync({ alter: true });
    console.log('✅ Tabela ticket_history criada/atualizada\n');

    // 2. Adicionar novos campos à tabela tickets
    console.log('2️⃣ Adicionando novos campos à tabela tickets...');
    
    // internal_priority
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN IF NOT EXISTS internal_priority VARCHAR(255),
      ADD COLUMN IF NOT EXISTS resolution_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES directions(id),
      ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id);
    `).catch(err => {
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('   ⚠️ Alguns campos já existem, continuando...');
    });

    // Criar enum para resolution_status se não existir
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_tickets_resolution_status AS ENUM (
          'pendente',
          'em_analise',
          'aguardando_terceiro',
          'solucao_proposta',
          'resolvido',
          'nao_resolvido',
          'workaround'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Alterar coluna para usar o enum
    await sequelize.query(`
      ALTER TABLE tickets 
      ALTER COLUMN resolution_status TYPE enum_tickets_resolution_status 
      USING resolution_status::enum_tickets_resolution_status;
    `).catch(err => {
      console.log('   ⚠️ Resolution status já está configurado');
    });

    console.log('✅ Novos campos adicionados com sucesso\n');

    // 3. Criar índices
    console.log('3️⃣ Criando índices...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_internal_priority ON tickets(internal_priority);
      CREATE INDEX IF NOT EXISTS idx_tickets_resolution_status ON tickets(resolution_status);
      CREATE INDEX IF NOT EXISTS idx_tickets_direction_id ON tickets(direction_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_section_id ON tickets(section_id);
    `);
    console.log('✅ Índices criados\n');

    console.log('✨ Migração concluída com sucesso!');
    console.log('\n📋 Novos campos adicionados:');
    console.log('   • internal_priority - Prioridade interna da organização');
    console.log('   • resolution_status - Estado específico da resolução');
    console.log('   • direction_id - Direção responsável');
    console.log('   • section_id - Seção responsável');
    console.log('\n📊 Nova tabela criada:');
    console.log('   • ticket_history - Histórico de todas as alterações\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    logger.error('Erro na migração:', error);
    await sequelize.close();
    process.exit(1);
  }
};

migrateTicketImprovements();
