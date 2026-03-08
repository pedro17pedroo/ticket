export const up = async ({ context: queryInterface }) => {
  const { Sequelize } = queryInterface;

  // 1. Criar ENUM para userType
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      CREATE TYPE context_user_type AS ENUM ('provider', 'organization', 'client');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 2. Criar ENUM para contextType
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      CREATE TYPE context_type AS ENUM ('organization', 'client');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 3. Criar tabela context_sessions
  await queryInterface.createTable('context_sessions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      comment: 'ID do usuário (organization_users.id ou client_users.id)'
    },
    user_type: {
      type: Sequelize.ENUM('provider', 'organization', 'client'),
      allowNull: false,
      comment: 'Tipo de usuário: provider, organization ou client'
    },
    context_id: {
      type: Sequelize.UUID,
      allowNull: false,
      comment: 'ID do contexto (organization_id ou client_id)'
    },
    context_type: {
      type: Sequelize.ENUM('organization', 'client'),
      allowNull: false,
      comment: 'Tipo de contexto: organization ou client'
    },
    session_token: {
      type: Sequelize.STRING(500),
      allowNull: false,
      unique: true,
      comment: 'Token JWT da sessão'
    },
    ip_address: {
      type: Sequelize.STRING(45),
      allowNull: true,
      comment: 'Endereço IP do cliente (suporta IPv4 e IPv6)'
    },
    user_agent: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'User agent do navegador/cliente'
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Indica se a sessão está ativa'
    },
    last_activity_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      comment: 'Timestamp da última atividade na sessão'
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
      comment: 'Timestamp de expiração da sessão'
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

  // 4. Criar índices para otimização de queries
  await queryInterface.addIndex('context_sessions', ['session_token'], {
    unique: true,
    name: 'idx_context_sessions_token'
  });

  await queryInterface.addIndex('context_sessions', ['user_id'], {
    name: 'idx_context_sessions_user_id'
  });

  await queryInterface.addIndex('context_sessions', ['is_active'], {
    name: 'idx_context_sessions_is_active'
  });

  await queryInterface.addIndex('context_sessions', ['user_id', 'is_active'], {
    name: 'idx_context_sessions_user_active'
  });

  await queryInterface.addIndex('context_sessions', ['expires_at'], {
    name: 'idx_context_sessions_expires_at'
  });

  // 5. Adicionar comentários na tabela
  await queryInterface.sequelize.query(`
    COMMENT ON TABLE context_sessions IS 'Sessões de contexto para multi-organização';
    COMMENT ON COLUMN context_sessions.user_id IS 'ID do usuário (organization_users.id ou client_users.id)';
    COMMENT ON COLUMN context_sessions.user_type IS 'Tipo de usuário: provider, organization ou client';
    COMMENT ON COLUMN context_sessions.context_id IS 'ID do contexto (organization_id ou client_id)';
    COMMENT ON COLUMN context_sessions.context_type IS 'Tipo de contexto: organization ou client';
    COMMENT ON COLUMN context_sessions.session_token IS 'Token JWT da sessão';
    COMMENT ON COLUMN context_sessions.ip_address IS 'Endereço IP do cliente (suporta IPv4 e IPv6)';
    COMMENT ON COLUMN context_sessions.user_agent IS 'User agent do navegador/cliente';
    COMMENT ON COLUMN context_sessions.is_active IS 'Indica se a sessão está ativa';
    COMMENT ON COLUMN context_sessions.last_activity_at IS 'Timestamp da última atividade na sessão';
    COMMENT ON COLUMN context_sessions.expires_at IS 'Timestamp de expiração da sessão';
  `);

  // 6. Criar trigger para updated_at
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION update_context_sessions_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_context_sessions_updated_at
      BEFORE UPDATE ON context_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_context_sessions_updated_at();
  `);

  console.log('✅ Tabela context_sessions criada com sucesso');
};

export const down = async ({ context: queryInterface }) => {
  // 1. Remover trigger
  await queryInterface.sequelize.query(`
    DROP TRIGGER IF EXISTS trigger_context_sessions_updated_at ON context_sessions;
    DROP FUNCTION IF EXISTS update_context_sessions_updated_at();
  `);

  // 2. Remover tabela
  await queryInterface.dropTable('context_sessions');

  // 3. Remover ENUMs (opcional, pode causar problemas se outras tabelas usarem)
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS context_type;
    DROP TYPE IF EXISTS context_user_type;
  `);

  console.log('✅ Tabela context_sessions removida');
};
