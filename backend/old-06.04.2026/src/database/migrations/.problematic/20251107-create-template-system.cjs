'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Criar tabela de templates de ticket
    await queryInterface.createTable('ticket_templates', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM(
          'response',
          'macro',
          'workflow',
          'email',
          'ticket',
          'knowledge'
        ),
        defaultValue: 'response'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      trigger: {
        type: Sequelize.ENUM(
          'manual',
          'automatic',
          'scheduled',
          'condition'
        ),
        defaultValue: 'manual'
      },
      trigger_conditions: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      variables: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      actions: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      attachments: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      shortcuts: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      usage_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tags: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      quick_access: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      priority: {
        type: Sequelize.UUID,
        defaultValue: 100
      },
      department_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar tabela de macros
    await queryInterface.createTable('macros', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING,
        defaultValue: '#4F46E5'
      },
      actions: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      conditions: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      execution_order: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      shortcuts: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      require_confirmation: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      confirmation_message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      execution_count: {
        type: Sequelize.UUID,
        defaultValue: 0
      },
      last_executed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      execution_history: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      quick_access: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      priority: {
        type: Sequelize.UUID,
        defaultValue: 100
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar índices para melhor performance
    await queryInterface.addIndex('ticket_templates', ['organization_id']);
    await queryInterface.addIndex('ticket_templates', ['type']);
    await queryInterface.addIndex('ticket_templates', ['is_active']);
    await queryInterface.addIndex('ticket_templates', ['quick_access']);
    await queryInterface.addIndex('ticket_templates', ['category']);
    
    await queryInterface.addIndex('macros', ['organization_id']);
    await queryInterface.addIndex('macros', ['is_active']);
    await queryInterface.addIndex('macros', ['quick_access']);
    await queryInterface.addIndex('macros', ['execution_count']);
    
    // Criar templates padrão
    const now = new Date();
    await queryInterface.bulkInsert('email_templates', [
      {
        name: 'Resposta Padrão - Ticket Recebido',
        type: 'auto_response',
        subject: 'Recebemos sua solicitação - Ticket #{{ticketNumber}}',
        content: `
          <p>Olá {{requester.name}},</p>
          <p>Recebemos sua solicitação e criamos o ticket <strong>#{{ticketNumber}}</strong>.</p>
          <p>Nossa equipe analisará seu caso e responderá em breve.</p>
          <p>Você pode acompanhar o status através do nosso portal.</p>
          <p>Atenciosamente,<br>Equipe de Suporte</p>
        `,
        variables: JSON.stringify(['ticketNumber', 'requester.name', 'subject']),
        active: true,
        organization_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Ticket Resolvido',
        type: 'ticket_closed',
        subject: 'Ticket #{{ticketNumber}} foi resolvido',
        content: `
          <p>Olá {{requester.name}},</p>
          <p>Seu ticket <strong>#{{ticketNumber}}</strong> foi resolvido.</p>
          <p>Se você tiver mais dúvidas, não hesite em nos contactar.</p>
          <p>Atenciosamente,<br>{{agent.name}}</p>
        `,
        variables: JSON.stringify(['ticketNumber', 'requester.name', 'agent.name']),
        active: true,
        organization_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Solicitação de Informação Adicional',
        type: 'custom',
        subject: 'Informação adicional necessária - Ticket #{{ticketNumber}}',
        content: `
          <p>Olá {{requester.name}},</p>
          <p>Para dar continuidade ao atendimento do seu ticket <strong>#{{ticketNumber}}</strong>, precisamos de informações adicionais.</p>
          <p>[ESPECIFICAR INFORMAÇÕES NECESSÁRIAS]</p>
          <p>Por favor, responda a este e-mail com as informações solicitadas.</p>
          <p>Atenciosamente,<br>{{agent.name}}</p>
        `,
        variables: JSON.stringify(['ticketNumber', 'requester.name', 'agent.name']),
        active: true,
        organization_id: 1,
        created_at: now,
        updated_at: now
      }
    ]);

    // Criar templates de resposta padrão
    await queryInterface.bulkInsert('ticket_templates', [
      {
        name: 'Saudação Inicial',
        description: 'Template de saudação para primeiro contato',
        type: 'response',
        content: 'Olá {{requester.name}},\n\nObrigado por entrar em contato conosco.',
        variables: JSON.stringify(['requester.name']),
        is_active: true,
        is_public: true,
        quick_access: true,
        priority: 1,
        organization_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Solicitação em Análise',
        description: 'Informar que o ticket está sendo analisado',
        type: 'response',
        content: 'Estamos analisando sua solicitação e retornaremos em breve com uma solução.',
        variables: JSON.stringify([]),
        is_active: true,
        is_public: true,
        quick_access: true,
        priority: 2,
        organization_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Encerramento Cordial',
        description: 'Template para encerrar o atendimento',
        type: 'response',
        content: 'Espero ter ajudado com sua solicitação. Caso tenha mais dúvidas, não hesite em nos contactar.\n\nAtenciosamente,\n{{agent.name}}',
        variables: JSON.stringify(['agent.name']),
        is_active: true,
        is_public: true,
        quick_access: true,
        priority: 3,
        organization_id: 1,
        created_at: now,
        updated_at: now
      }
    ]);

    // Criar macros padrão
    await queryInterface.bulkInsert('macros', [
      {
        name: 'Resolver e Fechar',
        description: 'Marca o ticket como resolvido e adiciona comentário de encerramento',
        icon: 'check-circle',
        color: '#10B981',
        actions: JSON.stringify([
          { type: 'status', value: 'resolvido' },
          { type: 'addComment', value: 'Ticket resolvido conforme solicitado.', isPublic: true }
        ]),
        is_active: true,
        is_public: true,
        quick_access: true,
        priority: 1,
        organization_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Escalar para Supervisor',
        description: 'Aumenta prioridade e atribui ao supervisor',
        icon: 'arrow-up-circle',
        color: '#F59E0B',
        actions: JSON.stringify([
          { type: 'priority', value: 'alta' },
          { type: 'addComment', value: 'Ticket escalado para análise do supervisor.', isPublic: false }
        ]),
        conditions: JSON.stringify({
          priority: ['baixa', 'media']
        }),
        is_active: true,
        is_public: false,
        quick_access: true,
        priority: 2,
        organization_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Aguardando Cliente',
        description: 'Define status como aguardando resposta do cliente',
        icon: 'clock',
        color: '#6B7280',
        actions: JSON.stringify([
          { type: 'status', value: 'aguardando_cliente' },
          { type: 'addComment', value: 'Aguardando resposta do cliente para prosseguir.', isPublic: true }
        ]),
        is_active: true,
        is_public: true,
        quick_access: true,
        priority: 3,
        organization_id: 1,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remover índices
    await queryInterface.removeIndex('macros', ['organization_id']);
    await queryInterface.removeIndex('macros', ['is_active']);
    await queryInterface.removeIndex('macros', ['quick_access']);
    await queryInterface.removeIndex('macros', ['execution_count']);
    
    await queryInterface.removeIndex('ticket_templates', ['organization_id']);
    await queryInterface.removeIndex('ticket_templates', ['type']);
    await queryInterface.removeIndex('ticket_templates', ['is_active']);
    await queryInterface.removeIndex('ticket_templates', ['quick_access']);
    await queryInterface.removeIndex('ticket_templates', ['category']);
    
    // Remover tabelas
    await queryInterface.dropTable('macros');
    await queryInterface.dropTable('ticket_templates');
  }
};
