'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ===== GAMIFICATION TABLES =====
    
    // Badges
    await queryInterface.createTable('badges', {
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
      icon: Sequelize.STRING,
      color: {
        type: Sequelize.STRING,
        defaultValue: '#4F46E5'
      },
      category: {
        type: Sequelize.ENUM(
          'productivity', 'quality', 'speed', 'collaboration',
          'leadership', 'milestone', 'special'
        ),
        defaultValue: 'productivity'
      },
      criteria: {
        type: Sequelize.JSON,
        allowNull: false
      },
      points: {
        type: Sequelize.UUID,
        defaultValue: 10
      },
      rarity: {
        type: Sequelize.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
        defaultValue: 'common'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      times_awarded: {
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
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // User Badges
    await queryInterface.createTable('user_badges', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      badge_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'badges', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      awarded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      reason: Sequelize.TEXT,
      is_displayed: {
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
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Game Points
    await queryInterface.createTable('game_points', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      points: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      level: {
        type: Sequelize.UUID,
        defaultValue: 1
      },
      total_points_earned: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      current_streak: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      longest_streak: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      last_activity_date: Sequelize.DATEONLY,
      statistics: {
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
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // ===== SECURITY TABLES =====
    
    // Audit Logs
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entity_type: Sequelize.STRING,
      entity_id: Sequelize.INTEGER,
      changes: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      ip_address: Sequelize.STRING,
      user_agent: Sequelize.TEXT,
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'low'
      },
      status: {
        type: Sequelize.ENUM('success', 'failure', 'pending'),
        defaultValue: 'success'
      },
      error_message: Sequelize.TEXT,
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

    // IP Whitelist
    await queryInterface.createTable('ip_whitelists', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: Sequelize.TEXT,
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      expires_at: Sequelize.DATE,
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
    
    // Gamification Indexes
    await queryInterface.addIndex('badges', ['organization_id']);
    await queryInterface.addIndex('badges', ['category']);
    await queryInterface.addIndex('badges', ['rarity']);
    await queryInterface.addIndex('user_badges', ['user_id', 'badge_id'], { unique: true });
    await queryInterface.addIndex('user_badges', ['organization_id']);
    await queryInterface.addIndex('game_points', ['user_id', 'organization_id'], { unique: true });
    await queryInterface.addIndex('game_points', ['points']);
    await queryInterface.addIndex('game_points', ['level']);
    
    // Security Indexes
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['organization_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
    await queryInterface.addIndex('audit_logs', ['severity']);
    await queryInterface.addIndex('ip_whitelists', ['organization_id']);
    await queryInterface.addIndex('ip_whitelists', ['ip_address']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ip_whitelists');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('game_points');
    await queryInterface.dropTable('user_badges');
    await queryInterface.dropTable('badges');
  }
};
