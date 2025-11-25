'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = ['users', 'organization_users', 'client_users'];

    for (const table of tables) {
      const definition = await queryInterface.describeTable(table);

      if (!definition.password_reset_token) {
        await queryInterface.addColumn(table, 'password_reset_token', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Token temporário para recuperação de senha'
        });
        await queryInterface.addIndex(table, ['password_reset_token'], {
          name: `${table}_password_reset_token_idx`
        });
      }

      if (!definition.password_reset_expires) {
        await queryInterface.addColumn(table, 'password_reset_expires', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Data de expiração do token de recuperação'
        });
      }
    }
  },

  down: async (queryInterface) => {
    const tables = ['users', 'organization_users', 'client_users'];

    for (const table of tables) {
      await queryInterface.removeIndex(table, `${table}_password_reset_token_idx`).catch(() => {});
      await queryInterface.removeColumn(table, 'password_reset_token').catch(() => {});
      await queryInterface.removeColumn(table, 'password_reset_expires').catch(() => {});
    }
  }
};
