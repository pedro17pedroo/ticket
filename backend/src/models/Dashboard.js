import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Dashboard = sequelize.define('Dashboard', {
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
  layout: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Grid layout dos widgets'
    /*
    Exemplo:
    [
      {
        id: 'widget1',
        type: 'chart',
        x: 0, y: 0, w: 6, h: 4,
        config: { chartType: 'line', metric: 'tickets_created' }
      }
    ]
    */
  },
  widgets: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Configuração dos widgets'
  },
  filters: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Filtros globais do dashboard'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Dashboard padrão para novos usuários'
  },
  refreshInterval: {
    type: DataTypes.INTEGER,
    defaultValue: 300,
    comment: 'Intervalo de atualização em segundos'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      view: [],
      edit: [],
      share: []
    }
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
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
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'dashboards',
  timestamps: true,
  underscored: true
});

export default Dashboard;
