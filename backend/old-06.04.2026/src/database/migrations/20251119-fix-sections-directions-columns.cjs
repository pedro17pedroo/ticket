'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Fix sections table - add missing columns
    const sectionsTable = await queryInterface.describeTable('sections');
    
    if (!sectionsTable.code) {
      await queryInterface.addColumn('sections', 'code', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
    
    if (!sectionsTable.manager_id) {
      await queryInterface.addColumn('sections', 'manager_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    
    if (!sectionsTable.email) {
      await queryInterface.addColumn('sections', 'email', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!sectionsTable.client_id) {
      await queryInterface.addColumn('sections', 'client_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    
    if (!sectionsTable.is_active) {
      await queryInterface.addColumn('sections', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
    }
    
    // 2. Fix directions table - add missing columns
    const directionsTable = await queryInterface.describeTable('directions');
    
    if (!directionsTable.manager_id) {
      await queryInterface.addColumn('directions', 'manager_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    
    if (!directionsTable.email) {
      await queryInterface.addColumn('directions', 'email', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!directionsTable.client_id) {
      await queryInterface.addColumn('directions', 'client_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    
    if (!directionsTable.is_active) {
      await queryInterface.addColumn('directions', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sections', 'is_active');
    await queryInterface.removeColumn('sections', 'client_id');
    await queryInterface.removeColumn('sections', 'email');
    await queryInterface.removeColumn('sections', 'manager_id');
    await queryInterface.removeColumn('sections', 'code');
    
    await queryInterface.removeColumn('directions', 'is_active');
    await queryInterface.removeColumn('directions', 'client_id');
    await queryInterface.removeColumn('directions', 'email');
    await queryInterface.removeColumn('directions', 'manager_id');
  }
};
