/**
 * Migração: Permitir comentários vazios quando há anexos
 * 
 * Altera a coluna 'content' da tabela 'comments' para permitir valores vazios,
 * possibilitando adicionar apenas anexos sem texto.
 */

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn('comments', 'content', {
    type: Sequelize.TEXT,
    allowNull: true,
    defaultValue: ''
  });

  console.log('✅ Coluna content da tabela comments alterada para permitir valores vazios');
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn('comments', 'content', {
    type: Sequelize.TEXT,
    allowNull: false
  });

  console.log('✅ Coluna content da tabela comments revertida para NOT NULL');
};
