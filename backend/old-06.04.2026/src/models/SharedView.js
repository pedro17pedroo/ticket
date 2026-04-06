import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SharedView = sequelize.define('SharedView', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  viewType: {
    type: DataTypes.ENUM('list', 'board', 'calendar', 'timeline', 'table'),
    defaultValue: 'list'
  },
  filters: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Filtros aplicados na view'
  },
  columns: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Colunas visíveis (para table view)'
  },
  groupBy: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Campo para agrupar (status, priority, assignee, etc)'
  },
  sortBy: {
    type: DataTypes.JSON,
    defaultValue: [{ field: 'createdAt', order: 'DESC' }]
  },
  layout: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Configuração de layout específica do tipo de view'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sharedWith: {
    type: DataTypes.JSON,
    defaultValue: {
      users: [],
      teams: [],
      departments: []
    },
    comment: 'Com quem a view é compartilhada'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      canEdit: [],
      canDelete: []
    }
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  favoriteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  teamWorkspaceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'TeamWorkspaces',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'shared_views',
  timestamps: true,
  underscored: true
});

export default SharedView;
