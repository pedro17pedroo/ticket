module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('licenses', {
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
      client_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vendor: {
        type: Sequelize.STRING,
        allowNull: false
      },
      product: {
        type: Sequelize.STRING,
        allowNull: false
      },
      license_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      license_key: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      total_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      used_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      purchase_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      renewal_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'suspended', 'cancelled', 'trial'),
        allowNull: false,
        defaultValue: 'active'
      },
      cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      renewal_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('licenses', ['organization_id']);
    await queryInterface.addIndex('licenses', ['client_id']);
    await queryInterface.addIndex('licenses', ['status']);
    await queryInterface.addIndex('licenses', ['expiry_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('licenses');
  }
};
