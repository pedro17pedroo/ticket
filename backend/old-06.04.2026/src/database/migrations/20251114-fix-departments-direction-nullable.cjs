'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Permitir que direction_id seja NULL
    await queryInterface.changeColumn('departments', 'direction_id', {
      type: Sequelize.UUID,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('departments', 'direction_id', {
      type: Sequelize.UUID,
      allowNull: false
    });
  }
};
