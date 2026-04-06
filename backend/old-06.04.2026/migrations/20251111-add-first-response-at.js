export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('tickets', 'first_response_at', {
    type: Sequelize.DATE,
    allowNull: true,
    comment: 'Timestamp da primeira resposta de um agente/técnico ao ticket'
  });

  // Criar índice para consultas de SLA
  await queryInterface.addIndex('tickets', ['first_response_at'], {
    name: 'tickets_first_response_at_idx'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeIndex('tickets', 'tickets_first_response_at_idx');
  await queryInterface.removeColumn('tickets', 'first_response_at');
};
