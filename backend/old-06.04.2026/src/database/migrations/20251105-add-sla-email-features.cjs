'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper para verificar se coluna existe
    const tableDescription = await queryInterface.describeTable('tickets');
    
    // Adicionar campos de SLA na tabela tickets (apenas se não existirem)
    if (!tableDescription.sla_id) {
      await queryInterface.addColumn('tickets', 'sla_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'slas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableDescription.sla_time_elapsed) {
      await queryInterface.addColumn('tickets', 'sla_time_elapsed', {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
        comment: 'Tempo decorrido em horas úteis'
      });
    }

    if (!tableDescription.sla_response_status) {
      await queryInterface.addColumn('tickets', 'sla_response_status', {
        type: Sequelize.ENUM('ok', 'attention', 'warning', 'critical', 'violated'),
        allowNull: true,
        defaultValue: 'ok'
      });
    }

    if (!tableDescription.sla_resolution_status) {
      await queryInterface.addColumn('tickets', 'sla_resolution_status', {
        type: Sequelize.ENUM('ok', 'attention', 'warning', 'critical', 'violated'),
        allowNull: true,
        defaultValue: 'ok'
      });
    }

    if (!tableDescription.sla_response_violated_at) {
      await queryInterface.addColumn('tickets', 'sla_response_violated_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.sla_resolution_violated_at) {
      await queryInterface.addColumn('tickets', 'sla_resolution_violated_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.first_response_at) {
      await queryInterface.addColumn('tickets', 'first_response_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.resolved_at) {
      await queryInterface.addColumn('tickets', 'resolved_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.reopened_at) {
      await queryInterface.addColumn('tickets', 'reopened_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.source) {
      await queryInterface.addColumn('tickets', 'source', {
        type: Sequelize.ENUM('portal', 'email', 'api', 'phone', 'chat', 'social'),
        allowNull: true,
        defaultValue: 'portal'
      });
    }

    if (!tableDescription.email_message_id) {
      await queryInterface.addColumn('tickets', 'email_message_id', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID da mensagem de e-mail original'
      });
    }

    if (!tableDescription.tags) {
      await queryInterface.addColumn('tickets', 'tags', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      });
    }

    // Adicionar campo de email_message_id nos comentários
    await queryInterface.addColumn('comments', 'email_message_id', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'ID da mensagem de e-mail do comentário'
    });

    // Criar tabela de templates de e-mail
    await queryInterface.createTable('email_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      type: {
        type: Sequelize.ENUM(
          'auto_response',
          'ticket_created',
          'ticket_updated',
          'ticket_closed',
          'ticket_reopened',
          'sla_warning',
          'sla_violation',
          'password_reset',
          'welcome',
          'custom'
        ),
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      variables: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: 'Lista de variáveis disponíveis no template'
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Criar tabela de attachments se não existir
    await queryInterface.createTable('attachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      original_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      comment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      uploaded_by_id: {
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
    await queryInterface.addIndex('tickets', ['sla_response_status']);
    await queryInterface.addIndex('tickets', ['sla_resolution_status']);
    await queryInterface.addIndex('tickets', ['source']);
    await queryInterface.addIndex('tickets', ['email_message_id']);
    await queryInterface.addIndex('comments', ['email_message_id']);
    await queryInterface.addIndex('email_templates', ['type', 'active']);
    await queryInterface.addIndex('attachments', ['ticket_id']);
    await queryInterface.addIndex('attachments', ['comment_id']);
  },

  async down(queryInterface, Sequelize) {
    // Remover índices
    await queryInterface.removeIndex('attachments', ['comment_id']);
    await queryInterface.removeIndex('attachments', ['ticket_id']);
    await queryInterface.removeIndex('email_templates', ['type', 'active']);
    await queryInterface.removeIndex('comments', ['email_message_id']);
    await queryInterface.removeIndex('tickets', ['email_message_id']);
    await queryInterface.removeIndex('tickets', ['source']);
    await queryInterface.removeIndex('tickets', ['sla_resolution_status']);
    await queryInterface.removeIndex('tickets', ['sla_response_status']);

    // Remover tabelas
    await queryInterface.dropTable('attachments');
    await queryInterface.dropTable('email_templates');

    // Remover colunas
    await queryInterface.removeColumn('comments', 'email_message_id');
    await queryInterface.removeColumn('tickets', 'tags');
    await queryInterface.removeColumn('tickets', 'email_message_id');
    await queryInterface.removeColumn('tickets', 'source');
    await queryInterface.removeColumn('tickets', 'reopened_at');
    await queryInterface.removeColumn('tickets', 'resolved_at');
    await queryInterface.removeColumn('tickets', 'first_response_at');
    await queryInterface.removeColumn('tickets', 'sla_resolution_violated_at');
    await queryInterface.removeColumn('tickets', 'sla_response_violated_at');
    await queryInterface.removeColumn('tickets', 'sla_resolution_status');
    await queryInterface.removeColumn('tickets', 'sla_response_status');
    await queryInterface.removeColumn('tickets', 'sla_time_elapsed');
    await queryInterface.removeColumn('tickets', 'sla_id');
  }
};
