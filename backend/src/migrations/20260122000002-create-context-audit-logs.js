export const up = async ({ context: queryInterface }) => {
  const { Sequelize } = queryInterface;

  // 1. Criar ENUM para action (reutiliza context_user_type e context_type se já existirem)
  await queryInterface.sequelize.query(`
    DO $$ BEGIN
      CREATE TYPE context_audit_action AS ENUM ('login', 'context_switch', 'logout');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 2. Criar tabela context_audit_logs
  await queryInterface.createTable('context_audit_logs', {
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
    user_email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: 'Email do usuário para auditoria'
    },
    user_type: {
      type: Sequelize.ENUM('provider', 'organization', 'client'),
      allowNull: false,
      comment: 'Tipo de usuário: provider, organization ou client'
    },
    action: {
      type: Sequelize.ENUM('login', 'context_switch', 'logout'),
      allowNull: false,
      comment: 'Ação realizada: login, context_switch ou logout'
    },
    from_context_id: {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'ID do contexto de origem (null para login)'
    },
    from_context_type: {
      type: Sequelize.ENUM('organization', 'client'),
      allowNull: true,
      comment: 'Tipo do contexto de origem (null para login)'
    },
    to_context_id: {
      type: Sequelize.UUID,
      allowNull: false,
      comment: 'ID do contexto de destino'
    },
    to_context_type: {
      type: Sequelize.ENUM('organization', 'client'),
      allowNull: false,
      comment: 'Tipo do contexto de destino'
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
    success: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Indica se a ação foi bem-sucedida'
    },
    error_message: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Mensagem de erro caso a ação tenha falhado'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // 3. Criar índices para otimização de queries de auditoria
  await queryInterface.addIndex('context_audit_logs', ['user_id'], {
    name: 'idx_context_audit_logs_user_id'
  });

  await queryInterface.addIndex('context_audit_logs', ['user_email'], {
    name: 'idx_context_audit_logs_user_email'
  });

  await queryInterface.addIndex('context_audit_logs', ['action'], {
    name: 'idx_context_audit_logs_action'
  });

  await queryInterface.addIndex('context_audit_logs', ['created_at'], {
    name: 'idx_context_audit_logs_created_at'
  });

  // Índice composto para queries comuns de auditoria
  await queryInterface.addIndex('context_audit_logs', ['user_id', 'created_at'], {
    name: 'idx_context_audit_logs_user_created'
  });

  await queryInterface.addIndex('context_audit_logs', ['user_email', 'action'], {
    name: 'idx_context_audit_logs_email_action'
  });

  // 4. Adicionar comentários na tabela
  await queryInterface.sequelize.query(`
    COMMENT ON TABLE context_audit_logs IS 'Logs de auditoria para ações de contexto multi-organização';
    COMMENT ON COLUMN context_audit_logs.user_id IS 'ID do usuário (organization_users.id ou client_users.id)';
    COMMENT ON COLUMN context_audit_logs.user_email IS 'Email do usuário para auditoria';
    COMMENT ON COLUMN context_audit_logs.user_type IS 'Tipo de usuário: provider, organization ou client';
    COMMENT ON COLUMN context_audit_logs.action IS 'Ação realizada: login, context_switch ou logout';
    COMMENT ON COLUMN context_audit_logs.from_context_id IS 'ID do contexto de origem (null para login)';
    COMMENT ON COLUMN context_audit_logs.from_context_type IS 'Tipo do contexto de origem (null para login)';
    COMMENT ON COLUMN context_audit_logs.to_context_id IS 'ID do contexto de destino';
    COMMENT ON COLUMN context_audit_logs.to_context_type IS 'Tipo do contexto de destino';
    COMMENT ON COLUMN context_audit_logs.ip_address IS 'Endereço IP do cliente (suporta IPv4 e IPv6)';
    COMMENT ON COLUMN context_audit_logs.user_agent IS 'User agent do navegador/cliente';
    COMMENT ON COLUMN context_audit_logs.success IS 'Indica se a ação foi bem-sucedida';
    COMMENT ON COLUMN context_audit_logs.error_message IS 'Mensagem de erro caso a ação tenha falhado';
  `);

  console.log('✅ Tabela context_audit_logs criada com sucesso');
};

export const down = async ({ context: queryInterface }) => {
  // 1. Remover tabela
  await queryInterface.dropTable('context_audit_logs');

  // 2. Remover ENUM (opcional, pode causar problemas se outras tabelas usarem)
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS context_audit_action;
  `);

  console.log('✅ Tabela context_audit_logs removida');
};
