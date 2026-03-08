export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('payment_transactions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    organizationId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    subscriptionId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'AOA',
    },
    paymentMethod: {
      type: Sequelize.ENUM('ekwanza', 'gpo', 'ref'),
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentId: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'ID retornado pelo TPagamento',
    },
    referenceCode: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Código de referência do pagamento',
    },
    customerName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    customerEmail: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    customerPhone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    paidAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    failureReason: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  // Add indexes
  await queryInterface.addIndex('payment_transactions', ['organizationId']);
  await queryInterface.addIndex('payment_transactions', ['subscriptionId']);
  await queryInterface.addIndex('payment_transactions', ['status']);
  await queryInterface.addIndex('payment_transactions', ['paymentId']);
  await queryInterface.addIndex('payment_transactions', ['referenceCode']);
  await queryInterface.addIndex('payment_transactions', ['createdAt']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('payment_transactions');
}
