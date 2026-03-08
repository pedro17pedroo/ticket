export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('payment_receipts', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'payment_transactions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    receiptNumber: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: 'Número único do recibo (ex: REC-2026-001234)',
    },
    pdfPath: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Caminho do arquivo PDF no servidor',
    },
    pdfUrl: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'URL pública do PDF',
    },
    emailedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Data em que o recibo foi enviado por email',
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
  await queryInterface.addIndex('payment_receipts', ['transactionId']);
  await queryInterface.addIndex('payment_receipts', ['receiptNumber']);
  await queryInterface.addIndex('payment_receipts', ['createdAt']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('payment_receipts');
}
