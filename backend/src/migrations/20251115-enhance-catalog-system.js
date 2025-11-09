/**
 * Migration: Aprimoramento do Sistema de Catálogo
 * 
 * Adiciona:
 * - Hierarquia de categorias (subcategorias)
 * - Tipos de item (incidente, serviço, suporte)
 * - Imagens para categorias e itens
 * - Roteamento organizacional completo (Direction, Department, Section)
 * - Cor para categorias
 */

export async function up(queryInterface, Sequelize) {
  console.log('🔧 Iniciando aprimoramento do sistema de catálogo...');

  // ========== CATALOG_CATEGORIES ==========
  
  // Adicionar parentCategoryId para hierarquia
  await queryInterface.addColumn('catalog_categories', 'parent_category_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'catalog_categories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'ID da categoria pai (para subcategorias)'
  });

  // Adicionar imageUrl
  await queryInterface.addColumn('catalog_categories', 'image_url', {
    type: Sequelize.STRING(500),
    allowNull: true,
    comment: 'URL da imagem/logo da categoria'
  });

  // Adicionar color (se não existir)
  const categoriesTable = await queryInterface.describeTable('catalog_categories');
  if (!categoriesTable.color) {
    await queryInterface.addColumn('catalog_categories', 'color', {
      type: Sequelize.STRING(7),
      defaultValue: '#6B7280',
      comment: 'Cor em hex (ex: #4A90E2)'
    });
  }

  // Adicionar level para facilitar queries hierárquicas
  await queryInterface.addColumn('catalog_categories', 'level', {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    comment: 'Nível hierárquico (1=raiz, 2=subcategoria, etc)'
  });

  // Adicionar roteamento organizacional padrão
  if (!categoriesTable.default_direction_id) {
    await queryInterface.addColumn('catalog_categories', 'default_direction_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'directions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Direção padrão para esta categoria'
    });
  }

  if (!categoriesTable.default_department_id) {
    await queryInterface.addColumn('catalog_categories', 'default_department_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Departamento padrão para esta categoria'
    });
  }

  // ========== CATALOG_ITEMS ==========

  // Adicionar itemType (tipo do item/serviço)
  await queryInterface.addColumn('catalog_items', 'item_type', {
    type: Sequelize.ENUM('incident', 'service', 'support', 'request'),
    defaultValue: 'service',
    allowNull: false,
    comment: 'Tipo: incident=Incidente, service=Serviço, support=Suporte, request=Requisição'
  });

  // Adicionar imageUrl
  await queryInterface.addColumn('catalog_items', 'image_url', {
    type: Sequelize.STRING(500),
    allowNull: true,
    comment: 'URL da imagem/logo do item'
  });

  // Completar roteamento organizacional (se não existirem)
  const itemsTable = await queryInterface.describeTable('catalog_items');
  
  if (!itemsTable.default_direction_id) {
    await queryInterface.addColumn('catalog_items', 'default_direction_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'directions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Direção responsável'
    });
  }

  if (!itemsTable.default_section_id) {
    await queryInterface.addColumn('catalog_items', 'default_section_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Seção responsável'
    });
  }

  // Renomear assigned_department_id para default_department_id (padronizar nomenclatura)
  if (itemsTable.assigned_department_id && !itemsTable.default_department_id) {
    await queryInterface.renameColumn('catalog_items', 'assigned_department_id', 'default_department_id');
  } else if (!itemsTable.default_department_id) {
    await queryInterface.addColumn('catalog_items', 'default_department_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Departamento responsável'
    });
  }

  // Adicionar campos específicos para incidentes
  await queryInterface.addColumn('catalog_items', 'auto_assign_priority', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: 'Auto-definir prioridade baseado no tipo (incidentes sempre alta/crítica)'
  });

  await queryInterface.addColumn('catalog_items', 'skip_approval_for_incidents', {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    comment: 'Incidentes pulam aprovação automática'
  });

  // Adicionar workflow por tipo (sem FK constraint - será adicionada quando workflows existir)
  await queryInterface.addColumn('catalog_items', 'incident_workflow_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    comment: 'Workflow específico para quando o tipo é incident'
  });

  // Adicionar tags/keywords para busca
  await queryInterface.addColumn('catalog_items', 'keywords', {
    type: Sequelize.ARRAY(Sequelize.STRING),
    defaultValue: [],
    comment: 'Palavras-chave para busca e categorização'
  });

  // ========== SERVICE_REQUESTS ==========

  // Adicionar tipo do request (herda do catalog item)
  await queryInterface.addColumn('service_requests', 'request_type', {
    type: Sequelize.ENUM('incident', 'service', 'support', 'request'),
    allowNull: true,
    comment: 'Tipo do request (copiado do catalog item)'
  });

  // Adicionar prioridade final (pode ser diferente do item se ajustada)
  await queryInterface.addColumn('service_requests', 'final_priority', {
    type: Sequelize.ENUM('baixa', 'media', 'alta', 'critica'),
    allowNull: true,
    comment: 'Prioridade final aplicada ao ticket'
  });

  // ========== ÍNDICES ==========

  // Índices para hierarquia de categorias
  await queryInterface.addIndex('catalog_categories', ['parent_category_id'], {
    name: 'idx_catalog_categories_parent_id'
  });

  await queryInterface.addIndex('catalog_categories', ['level'], {
    name: 'idx_catalog_categories_level'
  });

  await queryInterface.addIndex('catalog_categories', ['default_direction_id'], {
    name: 'idx_catalog_categories_direction'
  });

  await queryInterface.addIndex('catalog_categories', ['default_department_id'], {
    name: 'idx_catalog_categories_department'
  });

  // Índices para catalog items
  await queryInterface.addIndex('catalog_items', ['item_type'], {
    name: 'idx_catalog_items_type'
  });

  await queryInterface.addIndex('catalog_items', ['default_direction_id'], {
    name: 'idx_catalog_items_direction'
  });

  await queryInterface.addIndex('catalog_items', ['default_section_id'], {
    name: 'idx_catalog_items_section'
  });

  // Índice para busca por keywords (PostgreSQL GIN)
  try {
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_catalog_items_keywords ON catalog_items USING GIN (keywords);'
    );
  } catch (error) {
    console.log('⚠️  Índice GIN para keywords não criado (requer PostgreSQL)');
  }

  // Índices para service requests
  await queryInterface.addIndex('service_requests', ['request_type'], {
    name: 'idx_service_requests_type'
  });

  console.log('✅ Sistema de catálogo aprimorado com sucesso!');
}

export async function down(queryInterface, Sequelize) {
  console.log('🔄 Revertendo aprimoramentos do catálogo...');

  // Remover índices
  await queryInterface.removeIndex('catalog_categories', 'idx_catalog_categories_parent_id');
  await queryInterface.removeIndex('catalog_categories', 'idx_catalog_categories_level');
  await queryInterface.removeIndex('catalog_categories', 'idx_catalog_categories_direction');
  await queryInterface.removeIndex('catalog_categories', 'idx_catalog_categories_department');
  
  await queryInterface.removeIndex('catalog_items', 'idx_catalog_items_type');
  await queryInterface.removeIndex('catalog_items', 'idx_catalog_items_direction');
  await queryInterface.removeIndex('catalog_items', 'idx_catalog_items_section');
  
  await queryInterface.removeIndex('service_requests', 'idx_service_requests_type');

  try {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_catalog_items_keywords;');
  } catch (error) {
    // Ignorar erro se não existir
  }

  // Remover colunas de catalog_categories
  await queryInterface.removeColumn('catalog_categories', 'parent_category_id');
  await queryInterface.removeColumn('catalog_categories', 'image_url');
  await queryInterface.removeColumn('catalog_categories', 'level');
  await queryInterface.removeColumn('catalog_categories', 'default_direction_id');
  await queryInterface.removeColumn('catalog_categories', 'default_department_id');

  // Remover colunas de catalog_items
  await queryInterface.removeColumn('catalog_items', 'item_type');
  await queryInterface.removeColumn('catalog_items', 'image_url');
  await queryInterface.removeColumn('catalog_items', 'default_direction_id');
  await queryInterface.removeColumn('catalog_items', 'default_section_id');
  await queryInterface.removeColumn('catalog_items', 'auto_assign_priority');
  await queryInterface.removeColumn('catalog_items', 'skip_approval_for_incidents');
  await queryInterface.removeColumn('catalog_items', 'incident_workflow_id');
  await queryInterface.removeColumn('catalog_items', 'keywords');

  // Remover colunas de service_requests
  await queryInterface.removeColumn('service_requests', 'request_type');
  await queryInterface.removeColumn('service_requests', 'final_priority');

  // Remover ENUMs
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_catalog_items_item_type";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_service_requests_request_type";');

  console.log('✅ Revertido com sucesso!');
}
