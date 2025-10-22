import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[a-z0-9-]+$/
    }
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  primaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#3B82F6',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  secondaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#10B981',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      language: 'pt',
      timezone: 'Europe/Lisbon',
      dateFormat: 'DD/MM/YYYY',
      allowSelfRegistration: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'organizations',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['is_active'] }
  ]
});

export default Organization;
