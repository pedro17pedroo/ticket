'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('organizations');
    
    // Adicionar slug se não existir (renomear subdomain)
    if (tableDescription.subdomain && !tableDescription.slug) {
      await queryInterface.renameColumn('organizations', 'subdomain', 'slug');
    } else if (!tableDescription.slug) {
      await queryInterface.addColumn('organizations', 'slug', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        defaultValue: 'default-org'
      });
    }
    
    // Adicionar logo se não existir
    if (!tableDescription.logo) {
      await queryInterface.addColumn('organizations', 'logo', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    // Adicionar primary_color se não existir
    if (!tableDescription.primary_color) {
      await queryInterface.addColumn('organizations', 'primary_color', {
        type: Sequelize.STRING,
        defaultValue: '#3B82F6'
      });
    }
    
    // Adicionar secondary_color se não existir
    if (!tableDescription.secondary_color) {
      await queryInterface.addColumn('organizations', 'secondary_color', {
        type: Sequelize.STRING,
        defaultValue: '#10B981'
      });
    }
    
    // Adicionar email se não existir
    if (!tableDescription.email) {
      await queryInterface.addColumn('organizations', 'email', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    // Adicionar phone se não existir
    if (!tableDescription.phone) {
      await queryInterface.addColumn('organizations', 'phone', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    // Adicionar address se não existir
    if (!tableDescription.address) {
      await queryInterface.addColumn('organizations', 'address', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('organizations', 'address');
    await queryInterface.removeColumn('organizations', 'phone');
    await queryInterface.removeColumn('organizations', 'email');
    await queryInterface.removeColumn('organizations', 'secondary_color');
    await queryInterface.removeColumn('organizations', 'primary_color');
    await queryInterface.removeColumn('organizations', 'logo');
    await queryInterface.renameColumn('organizations', 'slug', 'subdomain');
  }
};
