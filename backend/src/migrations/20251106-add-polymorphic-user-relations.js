export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    console.log('🔄 MIGRAÇÃO: Adicionando relacionamentos polimórficos...\n');

    // ==========================================
    // 1. TICKETS - Adicionar campos polimórficos
    // ==========================================
    console.log('📦 Atualizando tabela TICKETS...');
    
    // Adicionar requester_type
    await queryInterface.addColumn('tickets', 'requester_type', {
      type: Sequelize.STRING(20),
      allowNull: true, // Temporariamente NULL
      defaultValue: 'client'
    }, { transaction });

    // Adicionar FKs polimórficas para requester
    await queryInterface.addColumn('tickets', 'requester_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('tickets', 'requester_org_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organization_users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('tickets', 'requester_client_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'client_users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    // Migrar dados de requester_id para os novos campos
    await queryInterface.sequelize.query(`
      UPDATE tickets SET
        requester_client_user_id = cu.id,
        requester_type = 'client'
      FROM client_users cu
      WHERE tickets.requester_id = cu.id
    `, { transaction });

    await queryInterface.sequelize.query(`
      UPDATE tickets SET
        requester_org_user_id = ou.id,
        requester_type = 'organization'
      FROM organization_users ou
      WHERE tickets.requester_id = ou.id
    `, { transaction });

    await queryInterface.sequelize.query(`
      UPDATE tickets SET
        requester_user_id = u.id,
        requester_type = 'provider'
      FROM users u
      WHERE tickets.requester_id = u.id
        AND requester_client_user_id IS NULL
        AND requester_org_user_id IS NULL
    `, { transaction });

    // Renomear assignee_id para novo padrão (sempre org_user)
    await queryInterface.renameColumn('tickets', 'assignee_id', 'assignee_org_user_id', { transaction });

    // Adicionar constraint para garantir apenas um requester
    await queryInterface.sequelize.query(`
      ALTER TABLE tickets
      ADD CONSTRAINT check_requester_single CHECK (
        (requester_type = 'provider' AND requester_user_id IS NOT NULL 
         AND requester_org_user_id IS NULL AND requester_client_user_id IS NULL)
        OR
        (requester_type = 'organization' AND requester_org_user_id IS NOT NULL 
         AND requester_user_id IS NULL AND requester_client_user_id IS NULL)
        OR
        (requester_type = 'client' AND requester_client_user_id IS NOT NULL 
         AND requester_user_id IS NULL AND requester_org_user_id IS NULL)
        OR
        (requester_type IS NULL AND requester_user_id IS NULL 
         AND requester_org_user_id IS NULL AND requester_client_user_id IS NULL)
      )
    `, { transaction });

    // Criar índices
    await queryInterface.addIndex('tickets', ['requester_type'], { transaction });
    await queryInterface.addIndex('tickets', ['requester_user_id'], { transaction });
    await queryInterface.addIndex('tickets', ['requester_org_user_id'], { transaction });
    await queryInterface.addIndex('tickets', ['requester_client_user_id'], { transaction });

    console.log('✅ Tabela TICKETS atualizada\n');

    // ==========================================
    // 2. COMMENTS - Adicionar campos polimórficos
    // ==========================================
    console.log('📦 Atualizando tabela COMMENTS...');
    
    await queryInterface.addColumn('comments', 'author_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: 'organization'
    }, { transaction });

    await queryInterface.addColumn('comments', 'author_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('comments', 'author_org_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organization_users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('comments', 'author_client_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'client_users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    // Migrar dados existentes
    await queryInterface.sequelize.query(`
      UPDATE comments SET
        author_client_user_id = cu.id,
        author_type = 'client'
      FROM client_users cu
      WHERE comments.user_id = cu.id
    `, { transaction });

    await queryInterface.sequelize.query(`
      UPDATE comments SET
        author_org_user_id = ou.id,
        author_type = 'organization'
      FROM organization_users ou
      WHERE comments.user_id = ou.id
    `, { transaction });

    await queryInterface.sequelize.query(`
      UPDATE comments SET
        author_user_id = u.id,
        author_type = 'provider'
      FROM users u
      WHERE comments.user_id = u.id
        AND author_client_user_id IS NULL
        AND author_org_user_id IS NULL
    `, { transaction });

    // Constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE comments
      ADD CONSTRAINT check_author_single CHECK (
        (author_type = 'provider' AND author_user_id IS NOT NULL 
         AND author_org_user_id IS NULL AND author_client_user_id IS NULL)
        OR
        (author_type = 'organization' AND author_org_user_id IS NOT NULL 
         AND author_user_id IS NULL AND author_client_user_id IS NULL)
        OR
        (author_type = 'client' AND author_client_user_id IS NOT NULL 
         AND author_user_id IS NULL AND author_org_user_id IS NULL)
        OR
        (author_type IS NULL AND author_user_id IS NULL 
         AND author_org_user_id IS NULL AND author_client_user_id IS NULL)
      )
    `, { transaction });

    // Índices
    await queryInterface.addIndex('comments', ['author_type'], { transaction });
    await queryInterface.addIndex('comments', ['author_user_id'], { transaction });
    await queryInterface.addIndex('comments', ['author_org_user_id'], { transaction });
    await queryInterface.addIndex('comments', ['author_client_user_id'], { transaction });

    console.log('✅ Tabela COMMENTS atualizada\n');

    // ==========================================
    // 3. ATTACHMENTS - Adicionar campos polimórficos
    // ==========================================
    console.log('📦 Atualizando tabela ATTACHMENTS...');
    
    await queryInterface.addColumn('attachments', 'uploaded_by_type', {
      type: Sequelize.STRING(20),
      allowNull: true
    }, { transaction });

    await queryInterface.addColumn('attachments', 'uploaded_by_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('attachments', 'uploaded_by_org_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organization_users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('attachments', 'uploaded_by_client_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'client_users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    // Migrar dados
    await queryInterface.sequelize.query(`
      UPDATE attachments SET
        uploaded_by_client_user_id = cu.id,
        uploaded_by_type = 'client'
      FROM client_users cu
      WHERE attachments.uploaded_by_id = cu.id
    `, { transaction });

    await queryInterface.sequelize.query(`
      UPDATE attachments SET
        uploaded_by_org_user_id = ou.id,
        uploaded_by_type = 'organization'
      FROM organization_users ou
      WHERE attachments.uploaded_by_id = ou.id
    `, { transaction });

    await queryInterface.sequelize.query(`
      UPDATE attachments SET
        uploaded_by_user_id = u.id,
        uploaded_by_type = 'provider'
      FROM users u
      WHERE attachments.uploaded_by_id = u.id
        AND uploaded_by_client_user_id IS NULL
        AND uploaded_by_org_user_id IS NULL
    `, { transaction });

    // Índices
    await queryInterface.addIndex('attachments', ['uploaded_by_type'], { transaction });
    await queryInterface.addIndex('attachments', ['uploaded_by_user_id'], { transaction });
    await queryInterface.addIndex('attachments', ['uploaded_by_org_user_id'], { transaction });
    await queryInterface.addIndex('attachments', ['uploaded_by_client_user_id'], { transaction });

    console.log('✅ Tabela ATTACHMENTS atualizada\n');

    // ==========================================
    // 4. KNOWLEDGE_ARTICLES - Adicionar campos polimórficos
    // ==========================================
    console.log('📦 Atualizando tabela KNOWLEDGE_ARTICLES...');
    
    await queryInterface.addColumn('knowledge_articles', 'author_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: 'organization'
    }, { transaction });

    await queryInterface.addColumn('knowledge_articles', 'author_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    await queryInterface.addColumn('knowledge_articles', 'author_org_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organization_users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    // Migrar dados
    await queryInterface.sequelize.query(`
      UPDATE knowledge_articles SET
        author_org_user_id = ou.id,
        author_type = 'organization'
      FROM organization_users ou
      WHERE knowledge_articles.author_id = ou.id
    `, { transaction });

    await queryInterface.sequelize.query(`
      UPDATE knowledge_articles SET
        author_user_id = u.id,
        author_type = 'provider'
      FROM users u
      WHERE knowledge_articles.author_id = u.id
        AND author_org_user_id IS NULL
    `, { transaction });

    console.log('✅ Tabela KNOWLEDGE_ARTICLES atualizada\n');

    // ==========================================
    // 5. ASSETS - Ajustar campos específicos
    // ==========================================
    console.log('📦 Atualizando tabela ASSETS...');
    
    // assigned_to sempre é client_user
    await queryInterface.renameColumn('assets', 'assigned_to', 'assigned_to_client_user_id', { transaction });
    
    // Adicionar managed_by (org_user)
    await queryInterface.addColumn('assets', 'managed_by_org_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organization_users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }, { transaction });

    console.log('✅ Tabela ASSETS atualizada\n');

    await transaction.commit();
    console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ ERRO NA MIGRAÇÃO:', error);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    console.log('🔄 REVERTENDO MIGRAÇÃO...\n');

    // Reverter TICKETS
    await queryInterface.removeConstraint('tickets', 'check_requester_single', { transaction });
    await queryInterface.removeColumn('tickets', 'requester_client_user_id', { transaction });
    await queryInterface.removeColumn('tickets', 'requester_org_user_id', { transaction });
    await queryInterface.removeColumn('tickets', 'requester_user_id', { transaction });
    await queryInterface.removeColumn('tickets', 'requester_type', { transaction });
    await queryInterface.renameColumn('tickets', 'assignee_org_user_id', 'assignee_id', { transaction });

    // Reverter COMMENTS
    await queryInterface.removeConstraint('comments', 'check_author_single', { transaction });
    await queryInterface.removeColumn('comments', 'author_client_user_id', { transaction });
    await queryInterface.removeColumn('comments', 'author_org_user_id', { transaction });
    await queryInterface.removeColumn('comments', 'author_user_id', { transaction });
    await queryInterface.removeColumn('comments', 'author_type', { transaction });

    // Reverter ATTACHMENTS
    await queryInterface.removeColumn('attachments', 'uploaded_by_client_user_id', { transaction });
    await queryInterface.removeColumn('attachments', 'uploaded_by_org_user_id', { transaction });
    await queryInterface.removeColumn('attachments', 'uploaded_by_user_id', { transaction });
    await queryInterface.removeColumn('attachments', 'uploaded_by_type', { transaction });

    // Reverter KNOWLEDGE_ARTICLES
    await queryInterface.removeColumn('knowledge_articles', 'author_org_user_id', { transaction });
    await queryInterface.removeColumn('knowledge_articles', 'author_user_id', { transaction });
    await queryInterface.removeColumn('knowledge_articles', 'author_type', { transaction });

    // Reverter ASSETS
    await queryInterface.removeColumn('assets', 'managed_by_org_user_id', { transaction });
    await queryInterface.renameColumn('assets', 'assigned_to_client_user_id', 'assigned_to', { transaction });

    await transaction.commit();
    console.log('✅ MIGRAÇÃO REVERTIDA\n');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ ERRO AO REVERTER:', error);
    throw error;
  }
}
