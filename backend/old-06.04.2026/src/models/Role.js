import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome técnico do role (ex: admin-org, client-admin)'
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome amigável (ex: Administrador, Agente)'
  },
  description: {
    type: DataTypes.TEXT,
    comment: 'Descrição do que este role pode fazer'
  },
  level: {
    type: DataTypes.ENUM('organization', 'client', 'user'),
    allowNull: false,
    comment: 'Nível hierárquico: organization (nível 1), client (nível 2), user (nível 3)'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'NULL = role global do sistema, UUID = role customizado de uma organização'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'NULL = role da organização, UUID = role customizado para um cliente específico'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'true = role padrão do sistema (não pode ser deletado)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Maior número = mais permissões (para hierarquia)'
  }
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['level'] },
    { fields: ['name', 'organizationId'], unique: true }
  ]
});

export default Role;
