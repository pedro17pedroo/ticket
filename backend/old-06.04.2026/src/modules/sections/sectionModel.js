import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nome da secção'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição da secção'
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Código/Sigla da secção'
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'department_id',
    comment: 'ID do departamento pai'
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'manager_id',
    comment: 'ID do responsável pela secção'
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
    comment: 'Secção ativa'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    },
    set(value) {
      // Trim whitespace and convert empty strings to null
      const trimmed = typeof value === 'string' ? value.trim() : value;
      if (trimmed === '' || trimmed === null || trimmed === undefined) {
        this.setDataValue('email', null);
      } else {
        this.setDataValue('email', trimmed.toLowerCase());
      }
    },
    comment: 'Email address for automatic ticket routing to this section'
  }
}, {
  tableName: 'sections',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['department_id'] },
    { fields: ['client_id'] },
    { fields: ['manager_id'] },
    { fields: ['organization_id', 'department_id', 'name'], unique: true }
  ]
});

export default Section;
