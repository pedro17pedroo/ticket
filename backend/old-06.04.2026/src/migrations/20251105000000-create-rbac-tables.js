export async function up(queryInterface, Sequelize) {
  // 1. Criar tabela de Roles
  await queryInterface.createTable('roles', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    display_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    level: {
      type: Sequelize.ENUM('organization', 'client', 'user'),
      allowNull: false
    },
    organization_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    client_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    is_system: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    priority: {
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

  // 2. Criar tabela de Permissions
  await queryInterface.createTable('permissions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    resource: {
      type: Sequelize.STRING,
      allowNull: false
    },
    action: {
      type: Sequelize.STRING,
      allowNull: false
    },
    display_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    scope: {
      type: Sequelize.ENUM('global', 'organization', 'client', 'own'),
      defaultValue: 'own'
    },
    category: {
      type: Sequelize.STRING
    },
    is_system: {
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

  // 3. Criar tabela de relacionamento Role-Permission
  await queryInterface.createTable('role_permissions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    role_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    permission_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    granted: {
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

  // 4. Criar tabela de permissões específicas de utilizador
  await queryInterface.createTable('user_permissions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    permission_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    granted: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    granted_by: {
      type: Sequelize.UUID,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    reason: {
      type: Sequelize.TEXT
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

  // 5. Criar índices
  await queryInterface.addIndex('roles', ['organization_id']);
  await queryInterface.addIndex('roles', ['client_id']);
  await queryInterface.addIndex('roles', ['level']);
  await queryInterface.addIndex('roles', ['name', 'organization_id'], { unique: true });
  
  await queryInterface.addIndex('permissions', ['resource', 'action'], { unique: true });
  await queryInterface.addIndex('permissions', ['category']);
  
  await queryInterface.addIndex('role_permissions', ['role_id']);
  await queryInterface.addIndex('role_permissions', ['permission_id']);
  await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], { unique: true });
  
  await queryInterface.addIndex('user_permissions', ['user_id']);
  await queryInterface.addIndex('user_permissions', ['permission_id']);
  await queryInterface.addIndex('user_permissions', ['user_id', 'permission_id'], { unique: true });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('user_permissions');
  await queryInterface.dropTable('role_permissions');
  await queryInterface.dropTable('permissions');
  await queryInterface.dropTable('roles');
}
