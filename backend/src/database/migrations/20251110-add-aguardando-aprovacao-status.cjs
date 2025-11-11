'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar novo valor ao enum de status
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_tickets_status" ADD VALUE IF NOT EXISTS 'aguardando_aprovacao';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Não é possível remover valores de ENUM no PostgreSQL de forma simples
    // Seria necessário recriar o tipo, o que é mais complexo
    console.log('Não é possível remover valores de ENUM. Execute manualmente se necessário.');
  }
};
