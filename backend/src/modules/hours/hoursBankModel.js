import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const HoursBank = sequelize.define('HoursBank', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  usedHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  availableHours: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.totalHours - this.usedHours;
    }
  },
  packageType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo de pacote contratado (ex: Básico 10h, Premium 50h)'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de início (opcional - para pacotes com validade)'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de fim (opcional - para pacotes com validade)'
  },
  allowNegativeBalance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Permite saldo negativo (crédito para o cliente)'
  },
  minBalance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Saldo mínimo permitido se negativo habilitado (ex: -10.00)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'hours_banks',
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['client_id'] },
    { fields: ['is_active'] }
  ]
});

const HoursTransaction = sequelize.define('HoursTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  hoursBankId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'hours_banks',
      key: 'id'
    }
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  hours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('adicao', 'consumo', 'ajuste'),
    allowNull: false,
    defaultValue: 'consumo'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  performedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'hours_transactions',
  indexes: [
    { fields: ['hours_bank_id'] },
    { fields: ['ticket_id'] },
    { fields: ['created_at'] }
  ]
});

export { HoursBank, HoursTransaction };
