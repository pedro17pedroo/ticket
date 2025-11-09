import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Direction = sequelize.define('Direction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nome da direção'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição da direção'
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Código/Sigla da direção'
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'manager_id',
    comment: 'ID do responsável pela direção'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    comment: 'ID da organização'
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
    defaultValue: true,
    field: 'is_active',
    comment: 'Direção ativa'
  }
}, {
  tableName: 'directions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['manager_id'] },
    { fields: ['organization_id', 'name'], unique: true }
  ]
});

export default Direction;
