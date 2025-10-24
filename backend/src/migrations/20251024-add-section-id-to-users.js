export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('users', 'section_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'sections',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  // Adicionar índice
  await queryInterface.addIndex('users', ['section_id'], {
    name: 'users_section_id_idx'
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('users', 'users_section_id_idx');
  await queryInterface.removeColumn('users', 'section_id');
};
