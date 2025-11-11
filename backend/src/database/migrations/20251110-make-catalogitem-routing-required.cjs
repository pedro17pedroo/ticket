'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tornar APENAS direção obrigatória, departamento e secção opcionais
    await queryInterface.changeColumn('catalog_items', 'default_direction_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'directions',
        key: 'id'
      },
      comment: 'Direção responsável pelo item/serviço (OBRIGATÓRIO)'
    });

    // Departamento e Secção permanecem opcionais (já são allowNull: true)
    // Apenas adicionar comentários
    await queryInterface.changeColumn('catalog_items', 'default_department_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      comment: 'Departamento responsável pelo item/serviço (Opcional)'
    });

    await queryInterface.changeColumn('catalog_items', 'default_section_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      },
      comment: 'Secção responsável pelo item/serviço (Opcional)'
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverter direção para opcional
    await queryInterface.changeColumn('catalog_items', 'default_direction_id', {
      type: Sequelize.UUID,
      allowNull: true
    });

    // Departamento e Secção permanecem opcionais
  }
};
