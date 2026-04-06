export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('time_tracking', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    ticket_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'tickets',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    organization_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    start_time: {
      type: Sequelize.DATE,
      allowNull: false
    },
    end_time: {
      type: Sequelize.DATE,
      allowNull: true
    },
    paused_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    total_paused_time: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    status: {
      type: Sequelize.ENUM('running', 'paused', 'stopped'),
      defaultValue: 'running'
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    total_seconds: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    auto_consumed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    hours_bank_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'hours_banks',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
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

  await queryInterface.addIndex('time_tracking', ['ticket_id']);
  await queryInterface.addIndex('time_tracking', ['user_id']);
  await queryInterface.addIndex('time_tracking', ['organization_id']);
  await queryInterface.addIndex('time_tracking', ['status']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('time_tracking');
}
