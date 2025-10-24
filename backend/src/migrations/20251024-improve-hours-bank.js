export const up = async (queryInterface, Sequelize) => {
  // 1. Tornar start_date opcional
  await queryInterface.changeColumn('hours_banks', 'start_date', {
    type: Sequelize.DATE,
    allowNull: true
  });

  // 2. Adicionar allow_negative_balance
  await queryInterface.addColumn('hours_banks', 'allow_negative_balance', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  });

  // 3. Adicionar min_balance
  await queryInterface.addColumn('hours_banks', 'min_balance', {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: true
  });

  console.log('✅ Migration concluída: Bolsa de Horas melhorada');
  console.log('   - start_date agora é opcional');
  console.log('   - Adicionado allow_negative_balance (default: false)');
  console.log('   - Adicionado min_balance (opcional)');
};

export const down = async (queryInterface, Sequelize) => {
  // Reverter alterações
  await queryInterface.changeColumn('hours_banks', 'start_date', {
    type: Sequelize.DATE,
    allowNull: false
  });

  await queryInterface.removeColumn('hours_banks', 'min_balance');
  await queryInterface.removeColumn('hours_banks', 'allow_negative_balance');
};
