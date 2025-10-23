export const up = async (queryInterface, Sequelize) => {
  // Adicionar client_id às direções
  await queryInterface.addColumn('directions', 'client_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.addIndex('directions', ['client_id'], {
    name: 'directions_client_id_idx'
  });

  // Adicionar client_id aos departamentos
  await queryInterface.addColumn('departments', 'client_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.addIndex('departments', ['client_id'], {
    name: 'departments_client_id_idx'
  });

  // Adicionar client_id às secções
  await queryInterface.addColumn('sections', 'client_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.addIndex('sections', ['client_id'], {
    name: 'sections_client_id_idx'
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('directions', 'directions_client_id_idx');
  await queryInterface.removeColumn('directions', 'client_id');

  await queryInterface.removeIndex('departments', 'departments_client_id_idx');
  await queryInterface.removeColumn('departments', 'client_id');

  await queryInterface.removeIndex('sections', 'sections_client_id_idx');
  await queryInterface.removeColumn('sections', 'client_id');
};
