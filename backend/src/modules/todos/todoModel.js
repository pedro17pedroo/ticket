import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Todo = sequelize.define('Todo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id',
    references: {
      model: 'client_users',
      key: 'id'
    },
    comment: 'Usuário dono da tarefa'
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
    comment: 'Cor hex para identificação visual'
  }
}, {
  tableName: 'todos',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['client_id'] },
    { fields: ['owner_id'] },
    { fields: ['status'] },
    { fields: ['due_date'] }
  ]
});

// Modelo para colaboradores de uma tarefa
const TodoCollaborator = sequelize.define('TodoCollaborator', {
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
      model: 'todos',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'client_users',
      key: 'id'
    }
  },
  canEdit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_edit'
  }
}, {
  tableName: 'todo_collaborators',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['todo_id'] },
    { fields: ['user_id'] },
    { unique: true, fields: ['todo_id', 'user_id'] }
  ]
});

// Associações
Todo.hasMany(TodoCollaborator, { foreignKey: 'todoId', as: 'collaborators' });
TodoCollaborator.belongsTo(Todo, { foreignKey: 'todoId', as: 'todo' });

export { Todo, TodoCollaborator };
export default Todo;
