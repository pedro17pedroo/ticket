module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('software', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vendor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      version: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      install_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      install_size: {
        type: Sequelize.BIGINT,
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
    await queryInterface.addIndex('software', ['organization_id']);
    await queryInterface.addIndex('software', ['asset_id']);
    await queryInterface.addIndex('software', ['name']);
    await queryInterface.addIndex('software', ['category']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('software');
  }
};
