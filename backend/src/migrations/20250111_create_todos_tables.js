import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  // Criar tabela de todos
  await queryInterface.createTable('todos', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'client_users',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Criar tabela de colaboradores
  await queryInterface.createTable('todo_collaborators', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    todo_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'todos',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'client_users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    can_edit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Índices
  await queryInterface.addIndex('todos', ['client_id']);
  await queryInterface.addIndex('todos', ['owner_id']);
  await queryInterface.addIndex('todos', ['status']);
  await queryInterface.addIndex('todos', ['due_date']);
  await queryInterface.addIndex('todo_collaborators', ['todo_id']);
  await queryInterface.addIndex('todo_collaborators', ['user_id']);
  await queryInterface.addIndex('todo_collaborators', ['todo_id', 'user_id'], { unique: true });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('todo_collaborators');
  await queryInterface.dropTable('todos');
}
