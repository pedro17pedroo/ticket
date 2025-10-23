export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('users', 'client_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.addIndex('users', ['client_id'], {
    name: 'users_client_id_idx'
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('users', 'users_client_id_idx');
  await queryInterface.removeColumn('users', 'client_id');
};
