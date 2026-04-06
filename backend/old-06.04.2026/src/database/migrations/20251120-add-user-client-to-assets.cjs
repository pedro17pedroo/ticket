'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const assetsTable = await queryInterface.describeTable('assets');
    
    // Add user_id column if not exists
    if (!assetsTable.user_id) {
      await queryInterface.addColumn('assets', 'user_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      
      await queryInterface.addIndex('assets', ['user_id']);
    }
    
    // Add client_id column if not exists
    if (!assetsTable.client_id) {
      await queryInterface.addColumn('assets', 'client_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      
      await queryInterface.addIndex('assets', ['client_id']);
    }
    
    // Add collection_method column if not exists
    if (!assetsTable.collection_method) {
      await queryInterface.addColumn('assets', 'collection_method', {
        type: Sequelize.ENUM('manual', 'web', 'agent', 'script', 'api'),
        defaultValue: 'manual'
      });
    }
    
    // Migrate existing data from assigned_to to user_id
    await queryInterface.sequelize.query(`
      UPDATE assets 
      SET user_id = assigned_to 
      WHERE assigned_to IS NOT NULL AND user_id IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('assets', 'user_id');
    await queryInterface.removeColumn('assets', 'client_id');
  }
};
