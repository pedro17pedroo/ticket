'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Criar tabela de serviços
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM(
          'core',
          'api',
          'database',
          'storage',
          'network',
          'authentication',
          'payment',
          'notification',
          'integration',
          'other'
        ),
        defaultValue: 'core'
      },
      status: {
        type: Sequelize.ENUM(
          'operational',
          'degraded_performance',
          'partial_outage',
          'major_outage',
          'under_maintenance'
        ),
        defaultValue: 'operational'
      },
      status_message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      monitoring_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      health_check_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      health_check_interval: {
        type: Sequelize.INTEGER,
        defaultValue: 60
      },
      last_health_check: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response_time: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      uptime: {
        type: Sequelize.FLOAT,
        defaultValue: 100
      },
      uptime_history: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      dependencies: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      metrics: {
        type: Sequelize.JSON,
        defaultValue: {}
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar tabela de incidentes
    await queryInterface.createTable('incidents', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          'investigating',
          'identified',
          'monitoring',
          'resolved',
          'postmortem'
        ),
        defaultValue: 'investigating'
      },
      impact: {
        type: Sequelize.ENUM(
          'none',
          'minor',
          'major',
          'critical'
        ),
        defaultValue: 'minor'
      },
      affected_services: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      updates: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      identified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      postmortem_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      postmortem_body: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      root_cause: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      preventive_measures: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      notify_subscribers: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      affected_users: {
        type: Sequelize.INTEGER,
        allowNull: true
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
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      resolved_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
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

    // Criar tabela de manutenções
    await queryInterface.createTable('maintenances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          'scheduled',
          'in_progress',
          'completed',
          'cancelled'
        ),
        defaultValue: 'scheduled'
      },
      affected_services: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      scheduled_start_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      scheduled_end_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      actual_start_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actual_end_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expected_downtime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      actual_downtime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      maintenance_type: {
        type: Sequelize.ENUM(
          'routine',
          'upgrade',
          'emergency',
          'security',
          'infrastructure',
          'database',
          'other'
        ),
        defaultValue: 'routine'
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      notify_subscribers: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      notifications_sent: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      updates: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      completion_notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      completed_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
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

    // Criar tabela de inscrições
    await queryInterface.createTable('status_subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM(
          'all',
          'incidents',
          'maintenances',
          'specific_services'
        ),
        defaultValue: 'all'
      },
      services: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      frequency: {
        type: Sequelize.ENUM(
          'immediate',
          'hourly',
          'daily',
          'weekly'
        ),
        defaultValue: 'immediate'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      unsubscribe_token: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      preferences: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      last_notification_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notification_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar índices
    await queryInterface.addIndex('services', ['organization_id', 'status']);
    await queryInterface.addIndex('services', ['monitoring_enabled']);
    await queryInterface.addIndex('services', ['is_public']);
    
    await queryInterface.addIndex('incidents', ['organization_id', 'status']);
    await queryInterface.addIndex('incidents', ['is_public']);
    await queryInterface.addIndex('incidents', ['started_at']);
    
    await queryInterface.addIndex('maintenances', ['organization_id', 'status']);
    await queryInterface.addIndex('maintenances', ['scheduled_start_at']);
    await queryInterface.addIndex('maintenances', ['is_public']);
    
    await queryInterface.addIndex('status_subscriptions', ['email', 'organization_id'], { unique: true });
    await queryInterface.addIndex('status_subscriptions', ['unsubscribe_token']);
    await queryInterface.addIndex('status_subscriptions', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    // Remover tabelas na ordem inversa
    await queryInterface.dropTable('status_subscriptions');
    await queryInterface.dropTable('maintenances');
    await queryInterface.dropTable('incidents');
    await queryInterface.dropTable('services');
  }
};
