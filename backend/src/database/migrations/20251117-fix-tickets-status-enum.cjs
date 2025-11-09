'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar novos valores ao enum de status se não existirem
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        -- Adicionar 'novo' se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'novo' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tickets_status')) THEN
          ALTER TYPE enum_tickets_status ADD VALUE IF NOT EXISTS 'novo';
        END IF;
        
        -- Adicionar 'em_progresso' se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'em_progresso' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tickets_status')) THEN
          ALTER TYPE enum_tickets_status ADD VALUE IF NOT EXISTS 'em_progresso';
        END IF;
        
        -- Adicionar 'aguardando_cliente' se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_cliente' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tickets_status')) THEN
          ALTER TYPE enum_tickets_status ADD VALUE IF NOT EXISTS 'aguardando_cliente';
        END IF;
        
        -- Adicionar 'resolvido' se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'resolvido' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tickets_status')) THEN
          ALTER TYPE enum_tickets_status ADD VALUE IF NOT EXISTS 'resolvido';
        END IF;
        
        -- Adicionar 'fechado' se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'fechado' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tickets_status')) THEN
          ALTER TYPE enum_tickets_status ADD VALUE IF NOT EXISTS 'fechado';
        END IF;
        
        -- Adicionar 'cancelado' se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelado' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tickets_status')) THEN
          ALTER TYPE enum_tickets_status ADD VALUE IF NOT EXISTS 'cancelado';
        END IF;
      END
      $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Não é possível remover valores de enum no PostgreSQL facilmente
    console.log('Reverter enum values requer recriação do tipo');
  }
};
