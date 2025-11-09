import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Department = sequelize.define('Department', {
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
  directionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'direction_id',
    references: {
      model: 'directions',
      key: 'id'
    },
    comment: 'ID da direção pai (obrigatório)'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Código/Sigla do departamento'
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'manager_id',
    comment: 'ID do responsável pelo departamento'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'ID da empresa cliente B2B (se pertencer a um cliente)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'departments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['direction_id'] },
    { fields: ['client_id'] },
    { fields: ['manager_id'] },
    { fields: ['is_active'] },
    { fields: ['organization_id', 'direction_id', 'name'], unique: true }
  ]
});

export default Department;
