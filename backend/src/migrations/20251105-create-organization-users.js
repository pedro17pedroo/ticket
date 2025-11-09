export const up = async ({ context: queryInterface }) => {
  const { Sequelize } = queryInterface;

  // 1. Criar tabela organization_users
  await queryInterface.createTable('organization_users', {
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
    email: {
      type: Sequelize.STRING,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.ENUM('org-admin', 'org-manager', 'agent', 'technician'),
      allowNull: false,
      defaultValue: 'agent'
    },
    avatar: {
      type: Sequelize.STRING,
      allowNull: true
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    direction_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'directions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    department_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    section_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    permissions: {
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    settings: {
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: Sequelize.DATE,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // 2. Criar índices
  await queryInterface.addIndex('organization_users', ['email', 'organization_id'], {
    unique: true,
    name: 'org_users_email_org_unique'
  });
  
  await queryInterface.addIndex('organization_users', ['organization_id']);
  await queryInterface.addIndex('organization_users', ['role']);
  await queryInterface.addIndex('organization_users', ['is_active']);

  // 3. Migrar dados de users que pertencem a organizações TENANT (não provider)
  // Identificar provider: organizações sem parent_id ou com tipo específico
  await queryInterface.sequelize.query(`
    INSERT INTO organization_users (
      id, organization_id, name, email, password, role, avatar, phone,
      direction_id, department_id, section_id, permissions, settings,
      is_active, last_login, created_at, updated_at
    )
    SELECT 
      u.id,
      u.organization_id,
      u.name,
      u.email,
      u.password,
      CASE
        WHEN u.role = 'admin' THEN 'org-admin'::text
        WHEN u.role = 'manager' THEN 'org-manager'::text
        ELSE 'agent'::text
      END::org_users_role,
      u.avatar,
      u.phone,
      u.direction_id,
      u.department_id,
      u.section_id,
      COALESCE(u.permissions, '{}'::jsonb),
      COALESCE(u.settings, '{}'::jsonb),
      u.is_active,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    INNER JOIN organizations o ON u.organization_id = o.id
    WHERE o.parent_id IS NOT NULL  -- Organizações tenant (têm parent)
      AND u.client_id IS NULL      -- Não são usuários de cliente
      AND u.role NOT IN ('client', 'client-admin')  -- Não são roles de cliente
  `);

  console.log('✅ Tabela organization_users criada e dados migrados');
};

export const down = async ({ context: queryInterface }) => {
  // Reverter migração
  await queryInterface.dropTable('organization_users');
  
  console.log('✅ Tabela organization_users removida');
};
