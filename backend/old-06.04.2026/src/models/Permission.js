import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Recurso/Módulo (ex: tickets, users, reports)'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Ação (ex: create, read, update, delete, manage, export)'
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome amigável (ex: "Criar Tickets", "Ver Relatórios")'
  },
  description: {
    type: DataTypes.TEXT,
    comment: 'Descrição detalhada do que esta permissão permite'
  },
  scope: {
    type: DataTypes.ENUM('global', 'organization', 'client', 'own'),
    defaultValue: 'own',
    comment: 'Escopo: global (tudo), organization (da org), client (do cliente), own (próprios)'
  },
  category: {
    type: DataTypes.STRING,
    comment: 'Categoria para agrupar (ex: Tickets, Utilizadores, Relatórios)'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'true = permissão padrão do sistema'
  }
}, {
  tableName: 'permissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['resource', 'action'], unique: true },
    { fields: ['category'] }
  ]
});

export default Permission;
