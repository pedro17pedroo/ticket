export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('attachments', 'comment_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  // Adicionar índice para melhorar performance das queries
  await queryInterface.addIndex('attachments', ['comment_id'], {
    name: 'attachments_comment_id_idx'
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('attachments', 'attachments_comment_id_idx');
  await queryInterface.removeColumn('attachments', 'comment_id');
};
