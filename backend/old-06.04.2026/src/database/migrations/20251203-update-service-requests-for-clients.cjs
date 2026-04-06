const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Adicionar coluna client_user_id
        await queryInterface.addColumn('service_requests', 'client_user_id', {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'client_users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        // 2. Tornar user_id nullable (para permitir requests apenas de clientes)
        await queryInterface.changeColumn('service_requests', 'user_id', {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Reverter mudanças
        // Nota: isso pode falhar se existirem registros com user_id null
        await queryInterface.changeColumn('service_requests', 'user_id', {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        });

        await queryInterface.removeColumn('service_requests', 'client_user_id');
    }
};
