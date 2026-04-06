/**
 * Migração: Adicionar campos de sessão, expiração e auditoria ao RemoteAccess
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('remote_accesses', 'connection_type', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Tipo de conexão: webrtc, anydesk, teamviewer, vnc'
    });

    await queryInterface.addColumn('remote_accesses', 'connection_id', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'ID da sessão de conexão (AnyDesk ID, Room ID, etc)'
    });

    await queryInterface.addColumn('remote_accesses', 'expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Data de expiração da solicitação'
    });

    await queryInterface.addColumn('remote_accesses', 'duration_seconds', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Duração total da sessão em segundos'
    });

    await queryInterface.addColumn('remote_accesses', 'client_ip', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'IP do cliente para auditoria'
    });

    await queryInterface.addColumn('remote_accesses', 'requester_ip', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'IP do solicitante para auditoria'
    });

    await queryInterface.addColumn('remote_accesses', 'audit_log', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Log de auditoria de ações durante a sessão'
    });

    await queryInterface.addColumn('remote_accesses', 'chat_messages', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Mensagens de chat durante a sessão'
    });

    // Criar índice para buscar sessões expiradas
    await queryInterface.addIndex('remote_accesses', ['expires_at'], {
      name: 'remote_accesses_expires_at_idx'
    });

    // Criar índice para buscar por tipo de conexão
    await queryInterface.addIndex('remote_accesses', ['connection_type'], {
      name: 'remote_accesses_connection_type_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('remote_accesses', 'remote_accesses_expires_at_idx');
    await queryInterface.removeIndex('remote_accesses', 'remote_accesses_connection_type_idx');
    
    await queryInterface.removeColumn('remote_accesses', 'connection_type');
    await queryInterface.removeColumn('remote_accesses', 'connection_id');
    await queryInterface.removeColumn('remote_accesses', 'expires_at');
    await queryInterface.removeColumn('remote_accesses', 'duration_seconds');
    await queryInterface.removeColumn('remote_accesses', 'client_ip');
    await queryInterface.removeColumn('remote_accesses', 'requester_ip');
    await queryInterface.removeColumn('remote_accesses', 'audit_log');
    await queryInterface.removeColumn('remote_accesses', 'chat_messages');
  }
};
