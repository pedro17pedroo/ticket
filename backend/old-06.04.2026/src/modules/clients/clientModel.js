import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Client = sequelize.define('Client', {
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
    },
    comment: 'Tenant ao qual este cliente pertence'
  },
  // Identificação da Empresa
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    },
    comment: 'Razão social da empresa'
  },
  tradeName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome fantasia'
  },
  taxId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'NIF/CNPJ da empresa'
  },
  industryType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Setor: technology, healthcare, retail, etc'
  },
  // Contato Principal
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  // Endereço
  address: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Endereço completo: street, city, postalCode, country'
  },
  // Contrato/SLA
  contract: {
    type: DataTypes.JSONB,
    defaultValue: {
      status: 'active',
      slaLevel: 'standard',
      supportHours: 'business-hours',
      maxUsers: 10,
      maxTicketsPerMonth: 100
    },
    comment: 'Detalhes do contrato e SLA específico'
  },
  // Faturação
  billing: {
    type: DataTypes.JSONB,
    defaultValue: {
      currency: 'EUR',
      billingCycle: 'monthly',
      paymentMethod: 'bank-transfer'
    },
    comment: 'Informações de billing e pagamento'
  },
  // Contato Primário
  primaryContact: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Pessoa de contato principal na empresa'
  },
  // Configurações do Cliente
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      allowUserRegistration: false,
      requireApproval: true,
      autoAssignTickets: false,
      notificationPreferences: {
        email: true,
        sms: false
      }
    }
  },
  // Estatísticas (cache para performance)
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      totalUsers: 0,
      activeUsers: 0,
      totalTickets: 0,
      openTickets: 0
    },
    comment: 'Cache de estatísticas para performance'
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  suspendedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  suspendedReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'clients',
  timestamps: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['tax_id'] },
    { fields: ['email'] },
    { fields: ['is_active'] },
    { 
      fields: ['name', 'organization_id'],
      name: 'clients_name_org_idx'
    }
  ]
});

export default Client;
