import { sequelize } from '../config/database.js';

const runSoftwareMigration = async () => {
  try {
    console.log('🔄 Iniciando migration: add-missing-software-columns...');
    
    const queryInterface = sequelize.getQueryInterface();
    const Sequelize = sequelize.Sequelize;
    
    // Adicionar colunas faltantes na tabela software
    console.log('📌 Adicionando coluna edition...');
    await queryInterface.addColumn('software', 'edition', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('📌 Adicionando coluna architecture...');
    await queryInterface.addColumn('software', 'architecture', {
      type: Sequelize.ENUM('x86', 'x64', 'ARM', 'ARM64', 'Universal'),
      allowNull: true
    });

    console.log('📌 Adicionando coluna install_location...');
    await queryInterface.addColumn('software', 'install_location', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('📌 Adicionando coluna license_type...');
    await queryInterface.addColumn('software', 'license_type', {
      type: Sequelize.ENUM('perpetual', 'subscription', 'trial', 'free', 'open_source'),
      allowNull: true
    });

    console.log('📌 Adicionando coluna license_key...');
    await queryInterface.addColumn('software', 'license_key', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('📌 Adicionando coluna license_expiry...');
    await queryInterface.addColumn('software', 'license_expiry', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    console.log('📌 Adicionando coluna is_licensed...');
    await queryInterface.addColumn('software', 'is_licensed', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    console.log('📌 Adicionando coluna last_used...');
    await queryInterface.addColumn('software', 'last_used', {
      type: Sequelize.DATE,
      allowNull: true
    });

    console.log('📌 Adicionando coluna auto_update...');
    await queryInterface.addColumn('software', 'auto_update', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    console.log('📌 Adicionando coluna publisher...');
    await queryInterface.addColumn('software', 'publisher', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('📌 Adicionando coluna support_url...');
    await queryInterface.addColumn('software', 'support_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('📌 Adicionando coluna uninstall_string...');
    await queryInterface.addColumn('software', 'uninstall_string', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    console.log('📌 Adicionando coluna notes...');
    await queryInterface.addColumn('software', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    console.log('✅ Migration concluída com sucesso!');
    console.log('📌 Todas as colunas faltantes foram adicionadas à tabela software');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
};

runSoftwareMigration();