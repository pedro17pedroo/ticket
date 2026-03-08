import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id',
    },
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subscriptions',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    get() {
      const value = this.getDataValue('amount');
      return value ? parseFloat(value) : 0;
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'AOA',
  },
  paymentMethod: {
    type: DataTypes.ENUM('ekwanza', 'gpo', 'ref'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID retornado pelo TPagamento',
  },
  referenceCode: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Código de referência do pagamento',
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payment_transactions',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['subscriptionId'] },
    { fields: ['status'] },
    { fields: ['paymentId'] },
    { fields: ['referenceCode'] },
    { fields: ['createdAt'] },
  ],
});

// Instance methods
PaymentTransaction.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

PaymentTransaction.prototype.isPending = function() {
  return this.status === 'pending' || this.status === 'processing';
};

PaymentTransaction.prototype.isCompleted = function() {
  return this.status === 'completed';
};

PaymentTransaction.prototype.isFailed = function() {
  return this.status === 'failed' || this.status === 'expired' || this.status === 'cancelled';
};

PaymentTransaction.prototype.getMethodName = function() {
  const methodNames = {
    ekwanza: 'E-Kwanza',
    gpo: 'Multicaixa Express',
    ref: 'Referência Multicaixa',
  };
  return methodNames[this.paymentMethod] || this.paymentMethod;
};

PaymentTransaction.prototype.getStatusLabel = function() {
  const statusLabels = {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Pago',
    failed: 'Falhado',
    expired: 'Expirado',
    cancelled: 'Cancelado',
  };
  return statusLabels[this.status] || this.status;
};

export default PaymentTransaction;
