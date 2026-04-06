export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('users', 'direction_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'directions',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  // Adicionar índice
  await queryInterface.addIndex('users', ['direction_id'], {
    name: 'users_direction_id_idx'
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('users', 'users_direction_id_idx');
  await queryInterface.removeColumn('users', 'direction_id');
};
