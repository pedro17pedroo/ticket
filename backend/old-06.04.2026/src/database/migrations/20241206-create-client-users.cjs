'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Criar ENUM para roles de client users
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_client_users_role AS ENUM ('client-admin', 'client-manager', 'client-user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar tabela client_users
    await queryInterface.createTable('client_users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Tenant - para multi-tenancy'
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Empresa cliente à qual pertence'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('client-admin', 'client-manager', 'client-user'),
        allowNull: false,
        defaultValue: 'client-user',
        comment: 'client-admin pode criar users, client-manager aprova, client-user apenas usa'
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      position: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Cargo na empresa cliente'
      },
      department_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Departamento dentro da empresa cliente'
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'building, floor, room, site para multi-site'
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: {
          canCreateTickets: true,
          canViewAllClientTickets: false,
          canApproveRequests: false,
          canAccessKnowledgeBase: true,
          canRequestServices: true
        }
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {
          notifications: true,
          emailNotifications: true,
          theme: 'light',
          language: 'pt',
          autoWatchTickets: true
        }
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_expires: {
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

    // Criar índices
    await queryInterface.addIndex('client_users', ['email', 'organization_id'], {
      unique: true,
      name: 'client_users_email_org_unique'
    });

    await queryInterface.addIndex('client_users', ['client_id'], {
      name: 'client_users_client_id'
    });

    await queryInterface.addIndex('client_users', ['organization_id'], {
      name: 'client_users_organization_id'
    });

    await queryInterface.addIndex('client_users', ['role'], {
      name: 'client_users_role'
    });

    await queryInterface.addIndex('client_users', ['is_active'], {
      name: 'client_users_is_active'
    });

    console.log('✅ Tabela client_users criada com sucesso!');
  },

  async down(queryInterface, Sequelize) {
    // Remover tabela
    await queryInterface.dropTable('client_users');

    // Remover ENUM
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_client_users_role;
    `);

    console.log('✅ Tabela client_users removida!');
  }
};
