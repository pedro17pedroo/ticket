'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ===== BUSINESS INTELLIGENCE TABLES =====
    
    // Dashboards
    await queryInterface.createTable('dashboards', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      layout: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      widgets: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      filters: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      refresh_interval: {
        type: Sequelize.UUID,
        defaultValue: 300
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      favorite_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      view_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Reports
    await queryInterface.createTable('reports', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      type: {
        type: Sequelize.ENUM('tickets', 'sla', 'agents', 'customers', 'categories', 'performance', 'satisfaction', 'custom'),
        defaultValue: 'custom'
      },
      query: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      columns: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      filters: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      group_by: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      order_by: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      schedule: {
        type: Sequelize.JSON,
        defaultValue: null
      },
      format: {
        type: Sequelize.ENUM('table', 'chart', 'pivot', 'list'),
        defaultValue: 'table'
      },
      chart_config: {
        type: Sequelize.JSON,
        defaultValue: null
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_favorite: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      execution_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      last_executed_at: Sequelize.DATE,
      last_execution_time: Sequelize.INTEGER,
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // KPIs
    await queryInterface.createTable('kpis', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      metric: {
        type: Sequelize.STRING,
        allowNull: false
      },
      formula: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      unit: Sequelize.STRING,
      target: Sequelize.DECIMAL(10, 2),
      threshold: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      current_value: Sequelize.DECIMAL(10, 2),
      previous_value: Sequelize.DECIMAL(10, 2),
      trend: {
        type: Sequelize.ENUM('up', 'down', 'stable')
      },
      status: {
        type: Sequelize.ENUM('excellent', 'good', 'acceptable', 'poor', 'critical')
      },
      period: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
        defaultValue: 'monthly'
      },
      category: {
        type: Sequelize.ENUM('performance', 'quality', 'efficiency', 'satisfaction', 'sla', 'finance'),
        defaultValue: 'performance'
      },
      auto_calculate: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      calculation_schedule: {
        type: Sequelize.STRING,
        defaultValue: '0 0 * * *'
      },
      history: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      last_calculated_at: Sequelize.DATE,
      dashboard_widget_config: {
        type: Sequelize.JSON,
        defaultValue: null
      },
      alerts: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // ===== SEARCH TABLES =====
    
    // Search Index
    await queryInterface.createTable('search_indexes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      entity_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      title: Sequelize.TEXT,
      content: Sequelize.TEXT,
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      status: Sequelize.STRING,
      priority: Sequelize.STRING,
      category_id: Sequelize.INTEGER,
      department_id: Sequelize.INTEGER,
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Saved Searches
    await queryInterface.createTable('saved_searches', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      query: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      filters: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      entity_types: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_favorite: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      execution_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      last_executed_at: Sequelize.DATE,
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // ===== COLLABORATION TABLES =====
    
    // Ticket Relationships
    await queryInterface.createTable('ticket_relationships', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      source_ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tickets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tickets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      relationship_type: {
        type: Sequelize.ENUM(
          'parent_of', 'child_of', 'blocks', 'blocked_by', 
          'relates_to', 'duplicates', 'duplicated_by', 
          'caused_by', 'causes', 'follows', 'precedes'
        ),
        allowNull: false
      },
      description: Sequelize.TEXT,
      created_by_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Team Workspaces
    await queryInterface.createTable('team_workspaces', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      type: {
        type: Sequelize.ENUM('department', 'project', 'incident', 'custom'),
        defaultValue: 'custom'
      },
      icon: Sequelize.STRING,
      color: {
        type: Sequelize.STRING,
        defaultValue: '#4F46E5'
      },
      members: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      roles: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      pinned_tickets: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: []
      },
      shared_views: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: []
      },
      goals: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      statistics: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      department_id: {
        type: Sequelize.UUID,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_by_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Shared Views
    await queryInterface.createTable('shared_views', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      view_type: {
        type: Sequelize.ENUM('list', 'board', 'calendar', 'timeline', 'table'),
        defaultValue: 'list'
      },
      filters: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      columns: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      group_by: Sequelize.STRING,
      sort_by: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      layout: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      shared_with: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      icon: Sequelize.STRING,
      color: Sequelize.STRING,
      favorite_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      view_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      team_workspace_id: {
        type: Sequelize.UUID,
        references: { model: 'team_workspaces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_by_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Ticket Mentions
    await queryInterface.createTable('ticket_mentions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tickets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      comment_id: {
        type: Sequelize.UUID,
        references: { model: 'comments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mentioned_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mentioned_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      context: Sequelize.TEXT,
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read_at: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // ===== INDEXES =====
    
    // BI Indexes
    await queryInterface.addIndex('dashboards', ['organization_id']);
    await queryInterface.addIndex('reports', ['organization_id']);
    await queryInterface.addIndex('reports', ['type']);
    await queryInterface.addIndex('kpis', ['organization_id']);
    await queryInterface.addIndex('kpis', ['category']);
    
    // Search Indexes
    await queryInterface.addIndex('search_indexes', ['entity_type', 'entity_id'], { unique: true });
    await queryInterface.addIndex('search_indexes', ['organization_id']);
    await queryInterface.addIndex('saved_searches', ['organization_id']);
    await queryInterface.addIndex('saved_searches', ['user_id']);
    
    // Collaboration Indexes
    await queryInterface.addIndex('ticket_relationships', ['source_ticket_id']);
    await queryInterface.addIndex('ticket_relationships', ['target_ticket_id']);
    await queryInterface.addIndex('ticket_relationships', ['relationship_type']);
    await queryInterface.addIndex('team_workspaces', ['organization_id']);
    await queryInterface.addIndex('shared_views', ['organization_id']);
    await queryInterface.addIndex('shared_views', ['team_workspace_id']);
    await queryInterface.addIndex('ticket_mentions', ['mentioned_user_id', 'is_read']);
    await queryInterface.addIndex('ticket_mentions', ['ticket_id']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('ticket_mentions');
    await queryInterface.dropTable('shared_views');
    await queryInterface.dropTable('team_workspaces');
    await queryInterface.dropTable('ticket_relationships');
    await queryInterface.dropTable('saved_searches');
    await queryInterface.dropTable('search_indexes');
    await queryInterface.dropTable('kpis');
    await queryInterface.dropTable('reports');
    await queryInterface.dropTable('dashboards');
  }
};
