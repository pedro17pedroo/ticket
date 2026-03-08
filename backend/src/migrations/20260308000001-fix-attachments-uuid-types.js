export default {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔧 Corrigindo tipos de dados da tabela attachments...');
      
      // 1. Remover constraints e índices que dependem das colunas
      console.log('📌 Removendo constraints...');
      await queryInterface.sequelize.query(
        `ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_pkey CASCADE;`,
        { transaction }
      );
      
      // 2. Converter coluna id de INTEGER para UUID
      console.log('🔄 Convertendo id para UUID...');
      await queryInterface.sequelize.query(
        `ALTER TABLE attachments 
         ALTER COLUMN id DROP DEFAULT,
         ALTER COLUMN id TYPE UUID USING uuid_generate_v4(),
         ALTER COLUMN id SET DEFAULT uuid_generate_v4();`,
        { transaction }
      );
      
      // 3. Converter ticket_id de INTEGER para UUID
      console.log('🔄 Convertendo ticket_id para UUID...');
      await queryInterface.sequelize.query(
        `ALTER TABLE attachments 
         ALTER COLUMN ticket_id TYPE UUID USING uuid_generate_v4();`,
        { transaction }
      );
      
      // 4. Converter comment_id de INTEGER para UUID (se existir)
      console.log('🔄 Convertendo comment_id para UUID...');
      await queryInterface.sequelize.query(
        `ALTER TABLE attachments 
         ALTER COLUMN comment_id TYPE UUID USING uuid_generate_v4();`,
        { transaction }
      );
      
      // 5. Converter uploaded_by_id de INTEGER para UUID (se existir)
      console.log('🔄 Convertendo uploaded_by_id para UUID...');
      await queryInterface.sequelize.query(
        `ALTER TABLE attachments 
         ALTER COLUMN uploaded_by_id TYPE UUID USING uuid_generate_v4();`,
        { transaction }
      );
      
      // 6. Adicionar campos polimórficos se não existirem
      console.log('➕ Adicionando campos polimórficos...');
      
      // Verificar se uploaded_by_type existe
      const [uploadedByTypeExists] = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'attachments' AND column_name = 'uploaded_by_type';`,
        { transaction }
      );
      
      if (uploadedByTypeExists.length === 0) {
        await queryInterface.addColumn('attachments', 'uploaded_by_type', {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'provider, organization, client'
        }, { transaction });
      }
      
      // Verificar se uploaded_by_user_id existe
      const [uploadedByUserIdExists] = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'attachments' AND column_name = 'uploaded_by_user_id';`,
        { transaction }
      );
      
      if (uploadedByUserIdExists.length === 0) {
        await queryInterface.addColumn('attachments', 'uploaded_by_user_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction });
      }
      
      // Verificar se uploaded_by_org_user_id existe
      const [uploadedByOrgUserIdExists] = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'attachments' AND column_name = 'uploaded_by_org_user_id';`,
        { transaction }
      );
      
      if (uploadedByOrgUserIdExists.length === 0) {
        await queryInterface.addColumn('attachments', 'uploaded_by_org_user_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'organization_users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction });
      }
      
      // Verificar se uploaded_by_client_user_id existe
      const [uploadedByClientUserIdExists] = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'attachments' AND column_name = 'uploaded_by_client_user_id';`,
        { transaction }
      );
      
      if (uploadedByClientUserIdExists.length === 0) {
        await queryInterface.addColumn('attachments', 'uploaded_by_client_user_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'client_users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction });
      }
      
      // 7. Recriar primary key
      console.log('🔑 Recriando primary key...');
      await queryInterface.sequelize.query(
        `ALTER TABLE attachments ADD PRIMARY KEY (id);`,
        { transaction }
      );
      
      // 8. Recriar índices
      console.log('📊 Recriando índices...');
      await queryInterface.addIndex('attachments', ['ticket_id'], { 
        name: 'idx_attachments_ticket_id_uuid',
        transaction 
      });
      await queryInterface.addIndex('attachments', ['comment_id'], { 
        name: 'idx_attachments_comment_id_uuid',
        transaction 
      });
      await queryInterface.addIndex('attachments', ['uploaded_by_type'], { 
        name: 'idx_attachments_uploaded_by_type',
        transaction 
      });
      await queryInterface.addIndex('attachments', ['uploaded_by_user_id'], { 
        name: 'idx_attachments_uploaded_by_user_id',
        transaction 
      });
      await queryInterface.addIndex('attachments', ['uploaded_by_org_user_id'], { 
        name: 'idx_attachments_uploaded_by_org_user_id',
        transaction 
      });
      await queryInterface.addIndex('attachments', ['uploaded_by_client_user_id'], { 
        name: 'idx_attachments_uploaded_by_client_user_id',
        transaction 
      });
      
      await transaction.commit();
      console.log('✅ Tabela attachments corrigida com sucesso!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erro ao corrigir tabela attachments:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('⏪ Revertendo correções da tabela attachments...');
      
      // Remover campos polimórficos
      await queryInterface.removeColumn('attachments', 'uploaded_by_client_user_id', { transaction });
      await queryInterface.removeColumn('attachments', 'uploaded_by_org_user_id', { transaction });
      await queryInterface.removeColumn('attachments', 'uploaded_by_user_id', { transaction });
      await queryInterface.removeColumn('attachments', 'uploaded_by_type', { transaction });
      
      // Converter de volta para INTEGER (ATENÇÃO: isso vai perder dados!)
      await queryInterface.sequelize.query(
        `ALTER TABLE attachments 
         ALTER COLUMN id TYPE INTEGER USING 1,
         ALTER COLUMN ticket_id TYPE INTEGER USING 1,
         ALTER COLUMN comment_id TYPE INTEGER USING 1,
         ALTER COLUMN uploaded_by_id TYPE INTEGER USING 1;`,
        { transaction }
      );
      
      await transaction.commit();
      console.log('✅ Reversão concluída!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erro ao reverter:', error);
      throw error;
    }
  }
};
