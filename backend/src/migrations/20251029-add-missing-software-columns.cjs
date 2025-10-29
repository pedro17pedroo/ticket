module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar colunas faltantes na tabela software
    await queryInterface.addColumn('software', 'edition', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('software', 'architecture', {
      type: Sequelize.ENUM('x86', 'x64', 'ARM', 'ARM64', 'Universal'),
      allowNull: true
    });

    await queryInterface.addColumn('software', 'install_location', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('software', 'license_type', {
      type: Sequelize.ENUM('perpetual', 'subscription', 'trial', 'free', 'open_source'),
      allowNull: true
    });

    await queryInterface.addColumn('software', 'license_key', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('software', 'license_expiry', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('software', 'is_licensed', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('software', 'last_used', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('software', 'auto_update', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('software', 'publisher', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('software', 'support_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('software', 'uninstall_string', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('software', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Atualizar o tipo da coluna category para ENUM
    await queryInterface.changeColumn('software', 'category', {
      type: Sequelize.ENUM(
        'operating_system',
        'office_suite',
        'security',
        'development',
        'database',
        'design',
        'communication',
        'browser',
        'productivity',
        'utility',
        'game',
        'other'
      ),
      defaultValue: 'other'
    });

    // Adicionar índices para as novas colunas
    await queryInterface.addIndex('software', ['vendor']);
    await queryInterface.addIndex('software', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remover colunas adicionadas
    await queryInterface.removeColumn('software', 'edition');
    await queryInterface.removeColumn('software', 'architecture');
    await queryInterface.removeColumn('software', 'install_location');
    await queryInterface.removeColumn('software', 'license_type');
    await queryInterface.removeColumn('software', 'license_key');
    await queryInterface.removeColumn('software', 'license_expiry');
    await queryInterface.removeColumn('software', 'is_licensed');
    await queryInterface.removeColumn('software', 'last_used');
    await queryInterface.removeColumn('software', 'auto_update');
    await queryInterface.removeColumn('software', 'publisher');
    await queryInterface.removeColumn('software', 'support_url');
    await queryInterface.removeColumn('software', 'uninstall_string');
    await queryInterface.removeColumn('software', 'notes');

    // Reverter o tipo da coluna category para STRING
    await queryInterface.changeColumn('software', 'category', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Remover índices
    await queryInterface.removeIndex('software', ['vendor']);
    await queryInterface.removeIndex('software', ['is_active']);
  }
};