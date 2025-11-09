'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ===== WEBHOOKS TABLE =====
    
    await queryInterface.createTable('webhooks', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      events: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      headers: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      secret: Sequelize.STRING,
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      retry_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      max_retries: {
        type: Sequelize.UUID,
        defaultValue: 3
      },
      timeout: {
        type: Sequelize.UUID,
        defaultValue: 30000
      },
      last_triggered_at: Sequelize.DATE,
      success_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      failure_count: {
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

    // ===== WEBHOOK LOGS TABLE =====
    
    await queryInterface.createTable('webhook_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      webhook_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'webhooks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      event: {
        type: Sequelize.STRING,
        allowNull: false
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false
      },
      response_status: Sequelize.INTEGER,
      response_body: Sequelize.TEXT,
      error_message: Sequelize.TEXT,
      duration: Sequelize.INTEGER,
      retry_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed', 'retrying'),
        defaultValue: 'pending'
      },
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

    // ===== INTEGRATIONS TABLE =====
    
    await queryInterface.createTable('integrations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(
          'slack', 'teams', 'google_workspace', 'microsoft_365',
          'salesforce', 'jira', 'github', 'gitlab', 'zapier', 'make', 'custom'
        ),
        allowNull: false
      },
      config: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      credentials: Sequelize.JSON,
      settings: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_sync_at: Sequelize.DATE,
      sync_status: {
        type: Sequelize.ENUM('idle', 'syncing', 'error'),
        defaultValue: 'idle'
      },
      error_message: Sequelize.TEXT,
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

    // ===== INDEXES =====
    
    await queryInterface.addIndex('webhooks', ['organization_id']);
    await queryInterface.addIndex('webhooks', ['is_active']);
    
    await queryInterface.addIndex('webhook_logs', ['webhook_id']);
    await queryInterface.addIndex('webhook_logs', ['status']);
    await queryInterface.addIndex('webhook_logs', ['created_at']);
    
    await queryInterface.addIndex('integrations', ['organization_id']);
    await queryInterface.addIndex('integrations', ['type']);
    await queryInterface.addIndex('integrations', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('integrations');
    await queryInterface.dropTable('webhook_logs');
    await queryInterface.dropTable('webhooks');
  }
};
