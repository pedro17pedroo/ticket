export async function up(queryInterface, Sequelize) {
  // Tabela de Tags
  await queryInterface.createTable('tags', {
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
      type: Sequelize.STRING(50),
      allowNull: false
    },
    color: {
      type: Sequelize.STRING(7),
      defaultValue: '#3B82F6'
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
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

  // Tabela intermediária Ticket-Tag
  await queryInterface.createTable('ticket_tags', {
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
    tag_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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

  // Índices
  await queryInterface.addIndex('tags', ['organization_id', 'name'], {
    unique: true
  });
  await queryInterface.addIndex('ticket_tags', ['ticket_id', 'tag_id'], {
    unique: true
  });
  await queryInterface.addIndex('ticket_tags', ['ticket_id']);
  await queryInterface.addIndex('ticket_tags', ['tag_id']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('ticket_tags');
  await queryInterface.dropTable('tags');
}
