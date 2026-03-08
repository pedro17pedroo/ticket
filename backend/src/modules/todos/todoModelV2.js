import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * Modelo unificado de To-Do que suporta tanto organizações quanto clientes
 * Permite colaboração cross-tenant (org pode convidar users de clientes)
 */
const TodoV2 = sequelize.define('TodoV2', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id'
    },
    comment: 'Organização dona do todo (segregação multi-tenant)'
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id',
    comment: 'ID do usuário dono (pode ser org ou client user)'
  },
  ownerType: {
    type: DataTypes.ENUM('organization', 'client'),
    allowNull: false,
    field: 'owner_type',
    comment: 'Tipo do dono: organization ou client'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'done'),
    defaultValue: 'todo',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'due_date'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: 'Cor hex para identificação visual (#FF5733)'
  }
}, {
  tableName: 'todos_v2',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['owner_id', 'owner_type'] },
    { fields: ['status'] },
    { fields: ['due_date'] },
    { fields: ['organization_id', 'status'] }
  ]
});

/**
 * Colaboradores de uma tarefa
 * Suporta colaboradores de organizações E clientes
 */
const TodoCollaboratorV2 = sequelize.define('TodoCollaboratorV2', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  todoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'todo_id',
    references: {
      model: 'todos_v2',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    comment: 'ID do colaborador (pode ser org ou client user)'
  },
  userType: {
    type: DataTypes.ENUM('organization', 'client'),
    allowNull: false,
    field: 'user_type',
    comment: 'Tipo do colaborador: organization ou client'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'Se userType=client, qual cliente pertence (para filtros)'
  },
  canEdit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_edit',
    comment: 'Se pode editar a tarefa ou apenas visualizar'
  }
}, {
  tableName: 'todo_collaborators_v2',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['todo_id'] },
    { fields: ['user_id', 'user_type'] },
    { fields: ['client_id'] },
    { unique: true, fields: ['todo_id', 'user_id', 'user_type'] }
  ]
});

// Associações
TodoV2.hasMany(TodoCollaboratorV2, { foreignKey: 'todoId', as: 'collaborators', onDelete: 'CASCADE' });
TodoCollaboratorV2.belongsTo(TodoV2, { foreignKey: 'todoId', as: 'todo' });

export { TodoV2, TodoCollaboratorV2 };
export default TodoV2;
