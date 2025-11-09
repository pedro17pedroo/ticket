export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('roles', 'client_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Cliente específico para o qual este role foi criado (opcional)'
  });

  await queryInterface.addIndex('roles', ['client_id'], {
    name: 'roles_client_id_idx'
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('roles', 'roles_client_id_idx');
  await queryInterface.removeColumn('roles', 'client_id');
};
