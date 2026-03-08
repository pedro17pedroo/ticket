import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PaymentReceipt = sequelize.define('PaymentReceipt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'payment_transactions',
      key: 'id',
    },
  },
  receiptNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Número único do recibo (ex: REC-2026-001234)',
  },
  pdfPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Caminho do arquivo PDF no servidor',
  },
  pdfUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL pública do PDF',
  },
  emailedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data em que o recibo foi enviado por email',
  },
}, {
  tableName: 'payment_receipts',
  timestamps: true,
  indexes: [
    { fields: ['transactionId'] },
    { fields: ['receiptNumber'] },
    { fields: ['createdAt'] },
  ],
});

// Instance methods
PaymentReceipt.prototype.wasEmailed = function() {
  return !!this.emailedAt;
};

PaymentReceipt.prototype.hasPdf = function() {
  return !!this.pdfPath;
};

export default PaymentReceipt;
