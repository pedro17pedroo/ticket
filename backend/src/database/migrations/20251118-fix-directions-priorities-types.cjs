'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Fix directions table - add code column
    const directionsTable = await queryInterface.describeTable('directions');
    if (!directionsTable.code) {
      await queryInterface.addColumn('directions', 'code', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
    
    // 2. Fix priorities table - add order and is_active columns
    const prioritiesTable = await queryInterface.describeTable('priorities');
    if (!prioritiesTable.order) {
      await queryInterface.addColumn('priorities', 'order', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }
    if (!prioritiesTable.is_active) {
      await queryInterface.addColumn('priorities', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
    }
    
    // 3. Create types table if not exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('types')) {
      await queryInterface.createTable('types', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        icon: {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: 'FileText'
        },
        color: {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: '#6B7280'
        },
        order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
      
      // Create indexes
      await queryInterface.addIndex('types', ['organization_id']);
      await queryInterface.addIndex('types', ['is_active']);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('types');
    await queryInterface.removeColumn('priorities', 'order');
    await queryInterface.removeColumn('directions', 'code');
  }
};
