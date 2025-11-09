'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ===== CATALOG CATEGORIES - Adicionar campos =====
    
    await queryInterface.addColumn('catalog_categories', 'color', {
      type: Sequelize.STRING(7),
      defaultValue: '#6B7280',
      comment: 'Cor em hex para UI'
    });

    await queryInterface.addColumn('catalog_categories', 'default_direction_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'directions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('catalog_categories', 'default_department_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // ===== CATALOG ITEMS - Adicionar campos de roteamento =====
    
    await queryInterface.addColumn('catalog_items', 'default_direction_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'directions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('catalog_items', 'default_department_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('catalog_items', 'default_section_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('catalog_items', 'default_workflow_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('catalog_items', 'assignment_type', {
      type: Sequelize.ENUM('department', 'section', 'agent', 'round_robin', 'load_balance', 'manual'),
      defaultValue: 'department',
      comment: 'Tipo de atribuição automática'
    });

    await queryInterface.addColumn('catalog_items', 'default_agent_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Renomear campo assignedDepartmentId para default_department_id (se existir)
    try {
      await queryInterface.renameColumn('catalog_items', 'assigned_department_id', 'default_department_id');
    } catch (error) {
      // Campo pode não existir ou já estar correto
      console.log('Campo assigned_department_id não encontrado ou já renomeado');
    }

    // ===== INDEXES para performance =====
    
    await queryInterface.addIndex('catalog_categories', ['default_direction_id'], {
      name: 'idx_catalog_categories_direction'
    });

    await queryInterface.addIndex('catalog_categories', ['default_department_id'], {
      name: 'idx_catalog_categories_department'
    });

    await queryInterface.addIndex('catalog_items', ['default_direction_id'], {
      name: 'idx_catalog_items_direction'
    });

    await queryInterface.addIndex('catalog_items', ['default_department_id'], {
      name: 'idx_catalog_items_department'
    });

    await queryInterface.addIndex('catalog_items', ['default_section_id'], {
      name: 'idx_catalog_items_section'
    });

    await queryInterface.addIndex('catalog_items', ['assignment_type'], {
      name: 'idx_catalog_items_assignment_type'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover indexes
    await queryInterface.removeIndex('catalog_categories', 'idx_catalog_categories_direction');
    await queryInterface.removeIndex('catalog_categories', 'idx_catalog_categories_department');
    await queryInterface.removeIndex('catalog_items', 'idx_catalog_items_direction');
    await queryInterface.removeIndex('catalog_items', 'idx_catalog_items_department');
    await queryInterface.removeIndex('catalog_items', 'idx_catalog_items_section');
    await queryInterface.removeIndex('catalog_items', 'idx_catalog_items_assignment_type');

    // Remover colunas de catalog_items
    await queryInterface.removeColumn('catalog_items', 'default_agent_id');
    await queryInterface.removeColumn('catalog_items', 'assignment_type');
    await queryInterface.removeColumn('catalog_items', 'default_workflow_id');
    await queryInterface.removeColumn('catalog_items', 'default_section_id');
    await queryInterface.removeColumn('catalog_items', 'default_department_id');
    await queryInterface.removeColumn('catalog_items', 'default_direction_id');

    // Remover colunas de catalog_categories
    await queryInterface.removeColumn('catalog_categories', 'default_department_id');
    await queryInterface.removeColumn('catalog_categories', 'default_direction_id');
    await queryInterface.removeColumn('catalog_categories', 'color');
  }
};
