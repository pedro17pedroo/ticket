module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asset_licenses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      license_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'licenses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      unassigned_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar índices
    await queryInterface.addIndex('asset_licenses', ['asset_id']);
    await queryInterface.addIndex('asset_licenses', ['license_id']);
    await queryInterface.addIndex('asset_licenses', ['is_active']);
    
    // Criar índice único para evitar duplicatas
    await queryInterface.addIndex('asset_licenses', ['asset_id', 'license_id'], {
      unique: true,
      name: 'asset_license_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('asset_licenses');
  }
};
