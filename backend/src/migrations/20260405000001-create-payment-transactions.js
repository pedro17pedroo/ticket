export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('payment_transactions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    organization_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    subscription_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Valor do pagamento'
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
      comment: 'Moeda (EUR, USD, AOA, etc.)'
    },
    status: {
      type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status do pagamento'
    },
    payment_method: {
      type: Sequelize.STRING(50),
      allowNull: false,
      comment: 'Método de pagamento (multicaixa_express, bank_transfer, etc.)'
    },
    payment_reference: {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Referência do pagamento'
    },
    transaction_id: {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'ID da transação no gateway de pagamento'
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Descrição do pagamento'
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Metadados adicionais'
    },
    paid_at: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Data de confirmação do pagamento'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  // Índices
  await queryInterface.addIndex('payment_transactions', ['organization_id'], {
    name: 'payment_transactions_organization_id'
  });
  
  await queryInterface.addIndex('payment_transactions', ['subscription_id'], {
    name: 'payment_transactions_subscription_id'
  });
  
  await queryInterface.addIndex('payment_transactions', ['status'], {
    name: 'payment_transactions_status'
  });
  
  await queryInterface.addIndex('payment_transactions', ['payment_method'], {
    name: 'payment_transactions_payment_method'
  });
  
  await queryInterface.addIndex('payment_transactions', ['created_at'], {
    name: 'payment_transactions_created_at'
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('payment_transactions');
}
