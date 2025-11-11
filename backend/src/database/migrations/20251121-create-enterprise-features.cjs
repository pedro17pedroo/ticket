const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Criar tabela tags
    await queryInterface.createTable('tags', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      color: {
        type: DataTypes.STRING(7),
        defaultValue: '#6B7280'
      },
      description: {
        type: DataTypes.TEXT
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Criar tabela ticket_tags (relação muitos-para-muitos)
    await queryInterface.createTable('ticket_tags', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 3. Criar tabela templates
    await queryInterface.createTable('templates', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT
      },
      type: {
        type: DataTypes.ENUM('ticket', 'comment', 'email'),
        defaultValue: 'ticket'
      },
      subject: {
        type: DataTypes.STRING(255)
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      category_id: {
        type: DataTypes.UUID,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      priority_id: {
        type: DataTypes.UUID,
        references: {
          model: 'priorities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type_id: {
        type: DataTypes.UUID,
        references: {
          model: 'types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. Criar tabela ticket_relationships
    await queryInterface.createTable('ticket_relationships', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      related_ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      relationship_type: {
        type: DataTypes.ENUM(
          'blocks',
          'blocked_by',
          'relates_to',
          'duplicates',
          'duplicated_by',
          'parent_of',
          'child_of',
          'precedes',
          'follows',
          'caused_by',
          'causes'
        ),
        allowNull: false,
        defaultValue: 'relates_to'
      },
      created_by: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 5. Criar tabela time_entries
    await queryInterface.createTable('time_entries', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      description: {
        type: DataTypes.TEXT
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      end_time: {
        type: DataTypes.DATE
      },
      duration: {
        type: DataTypes.INTEGER,
        comment: 'Duration in seconds'
      },
      is_billable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True if timer is currently running'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 6. Criar tabela ticket_history
    await queryInterface.createTable('ticket_history', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: DataTypes.ENUM(
          'created',
          'updated',
          'status_changed',
          'priority_changed',
          'assigned',
          'commented',
          'attachment_added',
          'tag_added',
          'tag_removed',
          'relationship_added',
          'relationship_removed'
        ),
        allowNull: false
      },
      field: {
        type: DataTypes.STRING(50)
      },
      old_value: {
        type: DataTypes.TEXT
      },
      new_value: {
        type: DataTypes.TEXT
      },
      description: {
        type: DataTypes.TEXT
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 7. Adicionar coluna hostname na tabela assets se não existir
    const assetsTable = await queryInterface.describeTable('assets');
    if (!assetsTable.hostname) {
      await queryInterface.addColumn('assets', 'hostname', {
        type: DataTypes.STRING(255),
        allowNull: true
      });
    }

    // Criar índices para performance
    await queryInterface.addIndex('tags', ['organization_id']);
    await queryInterface.addIndex('ticket_tags', ['ticket_id']);
    await queryInterface.addIndex('ticket_tags', ['tag_id']);
    await queryInterface.addIndex('templates', ['organization_id']);
    await queryInterface.addIndex('ticket_relationships', ['ticket_id']);
    await queryInterface.addIndex('ticket_relationships', ['related_ticket_id']);
    await queryInterface.addIndex('time_entries', ['ticket_id']);
    await queryInterface.addIndex('time_entries', ['user_id']);
    await queryInterface.addIndex('time_entries', ['is_active']);
    await queryInterface.addIndex('ticket_history', ['ticket_id']);

    console.log('✅ Tabelas enterprise criadas com sucesso!');
  },

  async down(queryInterface, Sequelize) {
    // Remover em ordem reversa devido às foreign keys
    await queryInterface.dropTable('ticket_history');
    await queryInterface.dropTable('time_entries');
    await queryInterface.dropTable('ticket_relationships');
    await queryInterface.dropTable('templates');
    await queryInterface.dropTable('ticket_tags');
    await queryInterface.dropTable('tags');

    // Remover coluna hostname se existir
    const assetsTable = await queryInterface.describeTable('assets');
    if (assetsTable.hostname) {
      await queryInterface.removeColumn('assets', 'hostname');
    }

    console.log('✅ Tabelas enterprise removidas com sucesso!');
  }
};
