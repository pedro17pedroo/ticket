'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar novos valores ao enum se não existirem
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin-org' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_users_role')) THEN
          ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'admin-org';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'agente' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_users_role')) THEN
          ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'agente';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cliente-org' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_users_role')) THEN
          ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'cliente-org';
        END IF;
      END
      $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Não é possível remover valores de enum no PostgreSQL facilmente
    // Seria necessário recriar o tipo enum do zero
    console.log('Reverter enum values requer recriação do tipo');
  }
};
