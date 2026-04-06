const { DataTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Adicionar coluna is_public na tabela templates
        await queryInterface.addColumn('templates', 'is_public', {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        });

        console.log('✅ Coluna is_public adicionada à tabela templates');
    },

    async down(queryInterface, Sequelize) {
        // Remover coluna is_public
        await queryInterface.removeColumn('templates', 'is_public');

        console.log('✅ Coluna is_public removida da tabela templates');
    }
};
