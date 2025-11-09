'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('departments');
    
    // Adicionar code se não existir
    if (!tableDescription.code) {
      await queryInterface.addColumn('departments', 'code', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
    
    // Adicionar manager_id se não existir
    if (!tableDescription.manager_id) {
      await queryInterface.addColumn('departments', 'manager_id', {
        type: Sequelize.UUID,
        allowNull: true
      });
    }
    
    // Adicionar email se não existir
    if (!tableDescription.email) {
      await queryInterface.addColumn('departments', 'email', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    // Adicionar client_id se não existir
    if (!tableDescription.client_id) {
      await queryInterface.addColumn('departments', 'client_id', {
        type: Sequelize.UUID,
        allowNull: true
      });
    }
    
    // Adicionar is_active se não existir
    if (!tableDescription.is_active) {
      await queryInterface.addColumn('departments', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('departments', 'is_active');
    await queryInterface.removeColumn('departments', 'client_id');
    await queryInterface.removeColumn('departments', 'email');
    await queryInterface.removeColumn('departments', 'manager_id');
    await queryInterface.removeColumn('departments', 'code');
  }
};
