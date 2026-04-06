export async function up(queryInterface, Sequelize) {
  // Tabela de Categorias do Catálogo
  await queryInterface.createTable('catalog_categories', {
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
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    icon: {
      type: Sequelize.STRING(50),
      defaultValue: 'FolderOpen'
    },
    order: {
      type: Sequelize.INTEGER,
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

  // Tabela de Itens do Catálogo
  await queryInterface.createTable('catalog_items', {
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
    category_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'catalog_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    short_description: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    full_description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    icon: {
      type: Sequelize.STRING(50),
      defaultValue: 'Box'
    },
    sla_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'slas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    default_ticket_category_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    default_priority: {
      type: Sequelize.ENUM('baixa', 'media', 'alta', 'critica'),
      defaultValue: 'media'
    },
    requires_approval: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    default_approver_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    assigned_department_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    estimated_cost: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    },
    cost_currency: {
      type: Sequelize.STRING(3),
      defaultValue: 'EUR'
    },
    estimated_delivery_time: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    custom_fields: {
      type: Sequelize.JSON,
      defaultValue: '[]'
    },
    request_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    is_public: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    order: {
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

  // Tabela de Service Requests
  await queryInterface.createTable('service_requests', {
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
    catalog_item_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'catalog_items',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    requester_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    ticket_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tickets',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    form_data: {
      type: Sequelize.JSON,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending_approval'
    },
    approver_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    approval_date: {
      type: Sequelize.DATE,
      allowNull: true
    },
    approval_comments: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    approved_cost: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    },
    rejection_reason: {
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

  // Índices
  await queryInterface.addIndex('catalog_categories', ['organization_id']);
  await queryInterface.addIndex('catalog_items', ['organization_id']);
  await queryInterface.addIndex('catalog_items', ['category_id']);
  await queryInterface.addIndex('catalog_items', ['is_active', 'is_public']);
  await queryInterface.addIndex('service_requests', ['organization_id']);
  await queryInterface.addIndex('service_requests', ['requester_id']);
  await queryInterface.addIndex('service_requests', ['catalog_item_id']);
  await queryInterface.addIndex('service_requests', ['status']);
  await queryInterface.addIndex('service_requests', ['ticket_id']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('service_requests');
  await queryInterface.dropTable('catalog_items');
  await queryInterface.dropTable('catalog_categories');
}
