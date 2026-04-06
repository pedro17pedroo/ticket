export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('response_templates', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
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
    name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    subject: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    is_public: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    category_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    usage_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0
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

  await queryInterface.addIndex('response_templates', ['organization_id']);
  await queryInterface.addIndex('response_templates', ['created_by']);
  await queryInterface.addIndex('response_templates', ['category_id']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('response_templates');
}
