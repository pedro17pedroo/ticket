import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  X,
  Save,
  AlertCircle,
  User,
  Clock,
  Link2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'
import Modal from './Modal'
import { 
  getTasks,
  createTask, 
  updateTask, 
  deleteTask,
  getTaskDependencies,
  addTaskDependency,
  removeTaskDependency,
  TASK_STATUSES,
  TASK_PRIORITIES,
  DEPENDENCY_TYPES
} from '../services/projectService'
import { getUsers } from '../services/userService'
import { confirmDelete } from '../utils/alerts'
import TaskDetail from './TaskDetail'

/**
 * TaskList - Component for managing project tasks
 * Features:
 * - List tasks by phase
 * - Modal for creating/editing tasks
 * - Assignee selection
 * - Dependency management
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
const TaskList = ({ projectId, phases, onTasksChange }) => {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedTaskForDeps, setSelectedTaskForDeps] = useState(null)
  const [taskDependencies, setTaskDependencies] = useState([])
  const [expandedPhases, setExpandedPhases] = useState({})
  const [loadingDeps, setLoadingDeps] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    estimatedHours: '',
    startDate: '',
    dueDate: '',
    assignedTo: '',
    phaseId: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Initialize expanded phases
  useEffect(() => {
    if (phases && phases.length > 0) {
      const expanded = {}
      phases.forEach(phase => {
        expanded[phase.id] = true
      })
      setExpandedPhases(expanded)
    }
  }, [phases])

  useEffect(() => {
    if (projectId) {
      loadTasks()
      loadUsers()
    }
  }, [projectId])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const response = await getTasks(projectId)
      const tasksData = response.tasks || response.data || response || []
      setTasks(Array.isArray(tasksData) ? tasksData : [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      toast.error('Erro ao carregar tarefas do projeto')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await getUsers()
      const usersData = response.users || response.data || response || []
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error)
    }
  }

  // Toggle phase expansion
  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }))
  }

  // Get tasks for a specific phase
  const getTasksByPhase = (phaseId) => {
    return tasks.filter(task => task.phaseId === phaseId)
  }

  // Open modal for creating new task
  const handleAddTask = (phaseId = '') => {
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      estimatedHours: '',
      startDate: '',
      dueDate: '',
      assignedTo: '',
      phaseId: phaseId || (phases && phases.length > 0 ? phases[0].id : '')
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Open modal for editing existing task
  const handleEditTask = (task) => {
    setEditingTask(task)
    setFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      estimatedHours: task.estimatedHours || '',
      startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      assignedTo: task.assignedTo || '',
      phaseId: task.phaseId || ''
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Open task detail modal
  const handleViewTaskDetails = (task) => {
    setSelectedTaskId(task.id)
    setIsDetailModalOpen(true)
  }

  // Handle delete task
  const handleDeleteTask = async (task) => {
    const confirmed = await confirmDelete(
      'Eliminar Tarefa?',
      `Tem certeza que deseja eliminar a tarefa "${task.title}"?`
    )

    if (!confirmed) return

    try {
      await deleteTask(projectId, task.id)
      toast.success('Tarefa eliminada com sucesso')
      const updatedTasks = tasks.filter(t => t.id !== task.id)
      setTasks(updatedTasks)
      if (onTasksChange) onTasksChange(updatedTasks)
    } catch (error) {
      console.error('Erro ao eliminar tarefa:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao eliminar tarefa'
      toast.error(errorMessage)
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    
    if (!formData.title.trim()) {
      errors.title = 'O título da tarefa é obrigatório'
    }

    if (!formData.phaseId) {
      errors.phaseId = 'Selecione uma fase'
    }

    if (formData.startDate && formData.dueDate) {
      if (new Date(formData.dueDate) < new Date(formData.startDate)) {
        errors.dueDate = 'A data de fim deve ser posterior à data de início'
      }
    }

    if (formData.estimatedHours && (isNaN(formData.estimatedHours) || Number(formData.estimatedHours) < 0)) {
      errors.estimatedHours = 'Horas estimadas deve ser um número positivo'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : null,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        assignedTo: formData.assignedTo || null
      }

      if (editingTask) {
        // Update existing task
        await updateTask(projectId, editingTask.id, payload)
        toast.success('Tarefa atualizada com sucesso')
      } else {
        // Create new task
        await createTask(projectId, formData.phaseId, payload)
        toast.success('Tarefa criada com sucesso')
      }

      setIsModalOpen(false)
      loadTasks()
    } catch (error) {
      console.error('Erro ao guardar tarefa:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao guardar tarefa'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Open dependency modal
  const handleManageDependencies = async (task) => {
    setSelectedTaskForDeps(task)
    setLoadingDeps(true)
    setIsDependencyModalOpen(true)
    
    try {
      const response = await getTaskDependencies(projectId, task.id)
      const deps = response.dependencies || response.data || response || []
      setTaskDependencies(Array.isArray(deps) ? deps : [])
    } catch (error) {
      console.error('Erro ao carregar dependências:', error)
      toast.error('Erro ao carregar dependências')
      setTaskDependencies([])
    } finally {
      setLoadingDeps(false)
    }
  }

  // Add dependency
  const handleAddDependency = async (dependsOnTaskId, dependencyType = 'finish_to_start') => {
    if (!selectedTaskForDeps) return

    try {
      await addTaskDependency(projectId, selectedTaskForDeps.id, {
        dependsOnTaskId,
        dependencyType
      })
      toast.success('Dependência adicionada')
      
      // Reload dependencies
      const response = await getTaskDependencies(projectId, selectedTaskForDeps.id)
      const deps = response.dependencies || response.data || response || []
      setTaskDependencies(Array.isArray(deps) ? deps : [])
    } catch (error) {
      console.error('Erro ao adicionar dependência:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao adicionar dependência'
      toast.error(errorMessage)
    }
  }

  // Remove dependency
  const handleRemoveDependency = async (dependencyId) => {
    if (!selectedTaskForDeps) return

    try {
      await removeTaskDependency(projectId, selectedTaskForDeps.id, dependencyId)
      toast.success('Dependência removida')
      setTaskDependencies(prev => prev.filter(d => d.id !== dependencyId))
    } catch (error) {
      console.error('Erro ao remover dependência:', error)
      toast.error('Erro ao remover dependência')
    }
  }

  // Get available tasks for dependencies (exclude self and already dependent)
  const getAvailableTasksForDependency = () => {
    if (!selectedTaskForDeps) return []
    
    const dependentIds = taskDependencies.map(d => d.dependsOnTaskId)
    return tasks.filter(t => 
      t.id !== selectedTaskForDeps.id && 
      !dependentIds.includes(t.id)
    )
  }

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = TASK_STATUSES.find(s => s.value === status)
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[statusConfig?.color] || colorMap.gray}`}>
        {statusConfig?.label || status}
      </span>
    )
  }

  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    const priorityConfig = TASK_PRIORITIES.find(p => p.value === priority)
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[priorityConfig?.color] || colorMap.gray}`}>
        {priorityConfig?.label || priority}
      </span>
    )
  }

  // Get status icon
  const getStatusIcon = (status) => {
    if (status === 'done') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    }
    if (status === 'in_progress' || status === 'in_review') {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    }
    return <Circle className="w-4 h-4 text-gray-400" />
  }

  // Get user name by ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : 'Não atribuído'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tarefas do Projeto</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'} no total
          </p>
        </div>
        <button
          onClick={() => handleAddTask()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          disabled={!phases || phases.length === 0}
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* No phases warning */}
      {(!phases || phases.length === 0) && (
        <div className="text-center py-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <p className="text-yellow-700 dark:text-yellow-400 mb-2">Crie uma fase primeiro</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            As tarefas precisam estar associadas a uma fase do projeto
          </p>
        </div>
      )}

      {/* Tasks by Phase */}
      {phases && phases.length > 0 && (
        <div className="space-y-4">
          {phases.map((phase) => {
            const phaseTasks = getTasksByPhase(phase.id)
            const isExpanded = expandedPhases[phase.id]
            
            return (
              <div 
                key={phase.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Phase Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <h4 className="font-medium">{phase.name}</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({phaseTasks.length} {phaseTasks.length === 1 ? 'tarefa' : 'tarefas'})
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddTask(phase.id)
                    }}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Adicionar tarefa a esta fase"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Tasks List */}
                {isExpanded && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {phaseTasks.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma tarefa nesta fase</p>
                        <button
                          onClick={() => handleAddTask(phase.id)}
                          className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Criar primeira tarefa
                        </button>
                      </div>
                    ) : (
                      phaseTasks.map((task) => (
                        <div 
                          key={task.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {/* Status Icon */}
                            <div className="mt-1">
                              {getStatusIcon(task.status)}
                            </div>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium truncate">{task.title}</h5>
                                {getStatusBadge(task.status)}
                                {getPriorityBadge(task.priority)}
                              </div>

                              {task.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Task Meta */}
                              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {task.assignedTo && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {getUserName(task.assignedTo)}
                                  </div>
                                )}
                                {task.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: pt })}
                                  </div>
                                )}
                                {task.estimatedHours && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {task.estimatedHours}h estimadas
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleViewTaskDetails(task)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleManageDependencies(task)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Gerir dependências"
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Editar tarefa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar tarefa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-semibold">
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {/* Phase Selection (only for new tasks) */}
              {!editingTask && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fase *
                  </label>
                  <select
                    name="phaseId"
                    value={formData.phaseId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formErrors.phaseId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma fase</option>
                    {phases && phases.map(phase => (
                      <option key={phase.id} value={phase.id}>
                        {phase.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.phaseId && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.phaseId}</p>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Implementar autenticação"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                  placeholder="Descrição detalhada da tarefa..."
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {TASK_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {TASK_PRIORITIES.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Responsável
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Não atribuído</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formErrors.dueDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.dueDate && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.dueDate}</p>
                  )}
                </div>
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Horas Estimadas
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.estimatedHours ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 8"
                />
                {formErrors.estimatedHours && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.estimatedHours}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    A guardar...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingTask ? 'Guardar Alterações' : 'Criar Tarefa'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Dependency Management Modal */}
      <Modal isOpen={isDependencyModalOpen} onClose={() => setIsDependencyModalOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <div>
              <h2 className="text-xl font-semibold">Dependências</h2>
              {selectedTaskForDeps && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedTaskForDeps.title}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsDependencyModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {loadingDeps ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                {/* Current Dependencies */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Dependências Atuais
                  </h3>
                  {taskDependencies.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      Esta tarefa não tem dependências
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {taskDependencies.map((dep) => {
                        const dependentTask = tasks.find(t => t.id === dep.dependsOnTaskId)
                        const depType = DEPENDENCY_TYPES.find(d => d.value === dep.dependencyType)
                        
                        return (
                          <div 
                            key={dep.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {dependentTask?.title || 'Tarefa não encontrada'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {depType?.label || dep.dependencyType}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveDependency(dep.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remover dependência"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Add New Dependency */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Adicionar Dependência
                  </h3>
                  {getAvailableTasksForDependency().length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      Não há tarefas disponíveis para adicionar como dependência
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {getAvailableTasksForDependency().map((task) => {
                        const phase = phases?.find(p => p.id === task.phaseId)
                        
                        return (
                          <div 
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{task.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {phase?.name || 'Fase desconhecida'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddDependency(task.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Adicionar como dependência"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
            <button
              onClick={() => setIsDependencyModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      <TaskDetail
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedTaskId(null)
        }}
        projectId={projectId}
        taskId={selectedTaskId}
        onTaskUpdate={loadTasks}
      />
    </div>
  )
}

TaskList.propTypes = {
  projectId: PropTypes.string.isRequired,
  phases: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })),
  onTasksChange: PropTypes.func
}

export default TaskList
