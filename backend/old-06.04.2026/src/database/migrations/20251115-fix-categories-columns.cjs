'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('categories');
    
    // Adicionar icon se não existir
    if (!tableDescription.icon) {
      await queryInterface.addColumn('categories', 'icon', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Folder'
      });
    }
    
    // Adicionar color se não existir
    if (!tableDescription.color) {
      await queryInterface.addColumn('categories', 'color', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '#3B82F6'
      });
    }
    
    // Adicionar is_active se não existir
    if (!tableDescription.is_active) {
      await queryInterface.addColumn('categories', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('categories', 'is_active');
    await queryInterface.removeColumn('categories', 'color');
    await queryInterface.removeColumn('categories', 'icon');
  }
};
