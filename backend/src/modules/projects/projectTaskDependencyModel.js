import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const ProjectTaskDependency = sequelize.define('ProjectTaskDependency', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'task_id',
    references: {
      model: 'project_tasks',
      key: 'id'
    }
  },
  dependsOnTaskId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'depends_on_task_id',
    references: {
      model: 'project_tasks',
      key: 'id'
    }
  },
  dependencyType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'finish_to_start',
    field: 'dependency_type',
    validate: {
      isIn: {
        args: [['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']],
        msg: 'Dependency type must be one of: finish_to_start, start_to_start, finish_to_finish, start_to_finish'
      }
    }
  }
}, {
  tableName: 'project_task_dependencies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    { fields: ['task_id'] },
    { fields: ['depends_on_task_id'] },
    { 
      fields: ['task_id', 'depends_on_task_id'],
      unique: true,
      name: 'unique_task_dependency'
    }
  ],
  validate: {
    notSelfDependency() {
      if (this.taskId === this.dependsOnTaskId) {
        throw new Error('A task cannot depend on itself');
      }
    }
  },
  hooks: {
    beforeValidate: (dependency) => {
      // Prevent self-dependency
      if (dependency.taskId === dependency.dependsOnTaskId) {
        throw new Error('A task cannot depend on itself');
      }
    },
    beforeCreate: async (dependency) => {
      // Check for circular dependencies
      const hasCircular = await ProjectTaskDependency.checkCircularDependency(
        dependency.taskId,
        dependency.dependsOnTaskId
      );
      if (hasCircular) {
        throw new Error('Circular dependency detected');
      }
    }
  }
});

// Static method to check for circular dependencies
ProjectTaskDependency.checkCircularDependency = async function(taskId, dependsOnTaskId, visited = new Set()) {
  // If we've already visited this task, we have a cycle
  if (visited.has(dependsOnTaskId)) {
    return dependsOnTaskId === taskId;
  }
  
  visited.add(dependsOnTaskId);
  
  // Get all tasks that dependsOnTaskId depends on
  const dependencies = await ProjectTaskDependency.findAll({
    where: { taskId: dependsOnTaskId },
    attributes: ['dependsOnTaskId']
  });
  
  for (const dep of dependencies) {
    // If any of those tasks is our original task, we have a cycle
    if (dep.dependsOnTaskId === taskId) {
      return true;
    }
    
    // Recursively check
    const hasCircular = await ProjectTaskDependency.checkCircularDependency(
      taskId,
      dep.dependsOnTaskId,
      visited
    );
    if (hasCircular) {
      return true;
    }
  }
  
  return false;
};

// Static method to get all dependencies for a task (including transitive)
ProjectTaskDependency.getAllDependencies = async function(taskId, visited = new Set()) {
  if (visited.has(taskId)) {
    return [];
  }
  
  visited.add(taskId);
  
  const directDeps = await ProjectTaskDependency.findAll({
    where: { taskId },
    attributes: ['dependsOnTaskId', 'dependencyType']
  });
  
  const allDeps = [...directDeps];
  
  for (const dep of directDeps) {
    const transitiveDeps = await ProjectTaskDependency.getAllDependencies(
      dep.dependsOnTaskId,
      visited
    );
    allDeps.push(...transitiveDeps);
  }
  
  return allDeps;
};

export default ProjectTaskDependency;
