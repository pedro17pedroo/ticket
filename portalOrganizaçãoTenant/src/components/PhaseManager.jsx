import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Calendar,
  X,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'
import Modal from './Modal'
import { 
  getPhases, 
  createPhase, 
  updatePhase, 
  deletePhase, 
  reorderPhases,
  getPhaseTasks,
  createTask,
  updateTask,
  deleteTask,
  PHASE_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES
} from '../services/projectService'
import { getUsers } from '../services/userService'
import { confirmDelete } from '../utils/alerts'

/**
 * PhaseManager - Component for managing project phases
 * Features:
 * - List phases with drag & drop reordering
 * - Modal for creating/editing phases
 * - Delete button with confirmation
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
const PhaseManager = ({ projectId, onPhasesChange, onUpdate }) => {
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'pending'
  })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  
  // Task management state
  const [expandedPhases, setExpandedPhases] = useState({})
  const [phaseTasks, setPhaseTasks] = useState({})
  const [loadingTasks, setLoadingTasks] = useState({})
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedPhaseId, setSelectedPhaseId] = useState(null)
  const [users, setUsers] = useState([])
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    estimatedHours: '',
    startDate: '',
    dueDate: '',
    assignedTo: ''
  })
  const [taskFormErrors, setTaskFormErrors] = useState({})
  const [savingTask, setSavingTask] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadPhases()
      loadUsers()
    }
  }, [projectId])

  const loadPhases = async () => {
    setLoading(true)
    try {
      const response = await getPhases(projectId)
      const phasesData = response.phases || response.data || response || []
      setPhases(Array.isArray(phasesData) ? phasesData : [])
    } catch (error) {
      console.error('Erro ao carregar fases:', error)
      toast.error('Erro ao carregar fases do projeto')
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

  // Load tasks for a specific phase
  const loadPhaseTasks = async (phaseId) => {
    setLoadingTasks(prev => ({ ...prev, [phaseId]: true }))
    try {
      const response = await getPhaseTasks(projectId, phaseId)
      const tasksData = response.tasks || response.data || response || []
      setPhaseTasks(prev => ({ ...prev, [phaseId]: Array.isArray(tasksData) ? tasksData : [] }))
    } catch (error) {
      console.error('Erro ao carregar tarefas da fase:', error)
      toast.error('Erro ao carregar tarefas')
    } finally {
      setLoadingTasks(prev => ({ ...prev, [phaseId]: false }))
    }
  }

  // Toggle phase expansion
  const togglePhaseExpansion = (phaseId) => {
    const isExpanding = !expandedPhases[phaseId]
    setExpandedPhases(prev => ({ ...prev, [phaseId]: isExpanding }))
    
    // Load tasks when expanding if not already loaded
    if (isExpanding && !phaseTasks[phaseId]) {
      loadPhaseTasks(phaseId)
    }
  }

  // Handle drag end for reordering
  const handleDragEnd = async (result) => {
    const { source, destination } = result

    if (!destination) return
    if (source.index === destination.index) return

    // Reorder locally first for immediate feedback
    const reorderedPhases = Array.from(phases)
    const [movedPhase] = reorderedPhases.splice(source.index, 1)
    reorderedPhases.splice(destination.index, 0, movedPhase)

    // Update order indices
    const updatedPhases = reorderedPhases.map((phase, index) => ({
      ...phase,
      orderIndex: index
    }))

    setPhases(updatedPhases)

    // Persist to backend
    try {
      const phaseIds = updatedPhases.map(p => p.id)
      await reorderPhases(projectId, phaseIds)
      toast.success('Ordem das fases atualizada')
      if (onPhasesChange) onPhasesChange(updatedPhases)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao reordenar fases:', error)
      toast.error('Erro ao reordenar fases')
      // Revert on error
      loadPhases()
    }
  }

  // Open modal for creating new phase
  const handleAddPhase = () => {
    setEditingPhase(null)
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'pending'
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Open modal for editing existing phase
  const handleEditPhase = (phase) => {
    setEditingPhase(phase)
    setFormData({
      name: phase.name || '',
      description: phase.description || '',
      startDate: phase.startDate ? format(new Date(phase.startDate), 'yyyy-MM-dd') : '',
      endDate: phase.endDate ? format(new Date(phase.endDate), 'yyyy-MM-dd') : '',
      status: phase.status || 'pending'
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Handle delete phase
  const handleDeletePhase = async (phase) => {
    // Check if phase has tasks
    if (phase.taskCount > 0) {
      toast.error(`Não é possível eliminar a fase "${phase.name}" porque contém ${phase.taskCount} tarefa(s). Remova as tarefas primeiro.`)
      return
    }

    const confirmed = await confirmDelete(
      'Eliminar Fase?',
      `Tem certeza que deseja eliminar a fase "${phase.name}"?`
    )

    if (!confirmed) return

    try {
      await deletePhase(projectId, phase.id)
      toast.success('Fase eliminada com sucesso')
      const updatedPhases = phases.filter(p => p.id !== phase.id)
      setPhases(updatedPhases)
      if (onPhasesChange) onPhasesChange(updatedPhases)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao eliminar fase:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao eliminar fase'
      toast.error(errorMessage)
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'O nome da fase é obrigatório'
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = 'A data de fim deve ser posterior à data de início'
      }
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
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: formData.status
      }

      if (editingPhase) {
        // Update existing phase
        await updatePhase(projectId, editingPhase.id, payload)
        toast.success('Fase atualizada com sucesso')
      } else {
        // Create new phase
        await createPhase(projectId, payload)
        toast.success('Fase criada com sucesso')
      }

      setIsModalOpen(false)
      loadPhases()
      // Notify parent to refresh dashboard
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao guardar fase:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao guardar fase'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = PHASE_STATUSES.find(s => s.value === status)
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[statusConfig?.color] || colorMap.gray}`}>
        {statusConfig?.label || status}
      </span>
    )
  }

  // Get progress bar color
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  // ==================== TASK MANAGEMENT ====================

  // Open modal for creating new task
  const handleAddTask = (phaseId) => {
    setSelectedPhaseId(phaseId)
    setEditingTask(null)
    setTaskFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      estimatedHours: '',
      startDate: '',
      dueDate: '',
      assignedTo: ''
    })
    setTaskFormErrors({})
    setIsTaskModalOpen(true)
  }

  // Open modal for editing existing task
  const handleEditTask = (task, phaseId) => {
    setSelectedPhaseId(phaseId)
    setEditingTask(task)
    setTaskFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      estimatedHours: task.estimatedHours || '',
      startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      assignedTo: task.assignedTo || ''
    })
    setTaskFormErrors({})
    setIsTaskModalOpen(true)
  }

  // Handle delete task
  const handleDeleteTask = async (task, phaseId) => {
    const confirmed = await confirmDelete(
      'Eliminar Tarefa?',
      `Tem certeza que deseja eliminar a tarefa "${task.title}"?`
    )

    if (!confirmed) return

    try {
      await deleteTask(projectId, task.id)
      toast.success('Tarefa eliminada com sucesso')
      // Update local state
      setPhaseTasks(prev => ({
        ...prev,
        [phaseId]: (prev[phaseId] || []).filter(t => t.id !== task.id)
      }))
      // Update phase task count
      setPhases(prev => prev.map(p => 
        p.id === phaseId ? { ...p, taskCount: Math.max(0, (p.taskCount || 1) - 1) } : p
      ))
      // Notify parent to refresh dashboard
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao eliminar tarefa:', error)
      toast.error(error.response?.data?.error || 'Erro ao eliminar tarefa')
    }
  }

  // Validate task form
  const validateTaskForm = () => {
    const errors = {}
    
    if (!taskFormData.title.trim()) {
      errors.title = 'O título da tarefa é obrigatório'
    }

    if (taskFormData.startDate && taskFormData.dueDate) {
      if (new Date(taskFormData.dueDate) < new Date(taskFormData.startDate)) {
        errors.dueDate = 'A data de fim deve ser posterior à data de início'
      }
    }

    if (taskFormData.estimatedHours && (isNaN(taskFormData.estimatedHours) || Number(taskFormData.estimatedHours) < 0)) {
      errors.estimatedHours = 'Horas estimadas deve ser um número positivo'
    }

    setTaskFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle task form submission
  const handleTaskSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateTaskForm()) return

    setSavingTask(true)
    try {
      const payload = {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim() || null,
        status: taskFormData.status,
        priority: taskFormData.priority,
        estimatedHours: taskFormData.estimatedHours ? Number(taskFormData.estimatedHours) : null,
        startDate: taskFormData.startDate || null,
        dueDate: taskFormData.dueDate || null,
        assignedTo: taskFormData.assignedTo || null
      }

      if (editingTask) {
        await updateTask(projectId, editingTask.id, payload)
        toast.success('Tarefa atualizada com sucesso')
      } else {
        await createTask(projectId, selectedPhaseId, payload)
        toast.success('Tarefa criada com sucesso')
        // Update phase task count
        setPhases(prev => prev.map(p => 
          p.id === selectedPhaseId ? { ...p, taskCount: (p.taskCount || 0) + 1 } : p
        ))
      }

      setIsTaskModalOpen(false)
      // Reload tasks for this phase
      loadPhaseTasks(selectedPhaseId)
      // Notify parent to refresh dashboard
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao guardar tarefa:', error)
      toast.error(error.response?.data?.error || 'Erro ao guardar tarefa')
    } finally {
      setSavingTask(false)
    }
  }

  // Handle task form input change
  const handleTaskInputChange = (e) => {
    const { name, value } = e.target
    setTaskFormData(prev => ({ ...prev, [name]: value }))
    if (taskFormErrors[name]) {
      setTaskFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Get task status badge
  const getTaskStatusBadge = (status) => {
    const statusConfig = TASK_STATUSES.find(s => s.value === status)
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorMap[statusConfig?.color] || colorMap.gray}`}>
        {statusConfig?.label || status}
      </span>
    )
  }

  // Get task priority badge
  const getTaskPriorityBadge = (priority) => {
    const priorityConfig = TASK_PRIORITIES.find(p => p.value === priority)
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorMap[priorityConfig?.color] || colorMap.gray}`}>
        {priorityConfig?.label || priority}
      </span>
    )
  }

  // Get task status icon
  const getTaskStatusIcon = (status) => {
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
          <h3 className="text-lg font-semibold">Fases do Projeto</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Arraste para reordenar as fases
          </p>
        </div>
        <button
          onClick={handleAddPhase}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Fase
        </button>
      </div>

      {/* Phases List with Drag & Drop */}
      {phases.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhuma fase criada</p>
          <button
            onClick={handleAddPhase}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Criar primeira fase
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="phases">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 rounded-lg transition-colors ${
                  snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                {phases.map((phase, index) => (
                  <Draggable
                    key={phase.id}
                    draggableId={phase.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-shadow ${
                          snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : 'hover:shadow-md'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>

                            {/* Expand/Collapse Button */}
                            <button
                              onClick={() => togglePhaseExpansion(phase.id)}
                              className="mt-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {expandedPhases[phase.id] ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>

                            {/* Phase Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  #{index + 1}
                                </span>
                                <h4 className="font-medium truncate">{phase.name}</h4>
                                {getStatusBadge(phase.status)}
                              </div>

                              {/* Progress Bar */}
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(phase.progress)}`}
                                    style={{ width: `${Math.min(phase.progress || 0, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                                  {phase.progress || 0}%
                                </span>
                              </div>

                              {/* Meta Info */}
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {(phase.startDate || phase.endDate) && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {phase.startDate && format(new Date(phase.startDate), 'dd/MM', { locale: pt })}
                                    {phase.startDate && phase.endDate && ' - '}
                                    {phase.endDate && format(new Date(phase.endDate), 'dd/MM', { locale: pt })}
                                  </div>
                                )}
                                {phase.taskCount !== undefined && (
                                  <span>
                                    {phase.taskCount} {phase.taskCount === 1 ? 'tarefa' : 'tarefas'}
                                  </span>
                                )}
                              </div>

                              {phase.description && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {phase.description}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleAddTask(phase.id)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Adicionar tarefa"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditPhase(phase)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Editar fase"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePhase(phase)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title={phase.taskCount > 0 ? 'Não é possível eliminar fase com tarefas' : 'Eliminar fase'}
                                disabled={phase.taskCount > 0}
                              >
                                <Trash2 className={`w-4 h-4 ${phase.taskCount > 0 ? 'opacity-50' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Tasks Section */}
                        {expandedPhases[phase.id] && (
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            {loadingTasks[phase.id] ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                              </div>
                            ) : (phaseTasks[phase.id] || []).length === 0 ? (
                              <div className="p-6 text-center">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  Nenhuma tarefa nesta fase
                                </p>
                                <button
                                  onClick={() => handleAddTask(phase.id)}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                  Criar primeira tarefa
                                </button>
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {(phaseTasks[phase.id] || []).map((task) => (
                                  <div 
                                    key={task.id}
                                    className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors"
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Task Status Icon */}
                                      <div className="mt-0.5">
                                        {getTaskStatusIcon(task.status)}
                                      </div>

                                      {/* Task Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h5 className="font-medium text-sm truncate">{task.title}</h5>
                                          {getTaskStatusBadge(task.status)}
                                          {getTaskPriorityBadge(task.priority)}
                                        </div>

                                        {task.description && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">
                                            {task.description}
                                          </p>
                                        )}

                                        {/* Task Meta */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
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
                                              {task.estimatedHours}h
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Task Actions */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleEditTask(task, phase.id)}
                                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                                          title="Editar tarefa"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTask(task, phase.id)}
                                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                                          title="Eliminar tarefa"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Add Task Button at bottom */}
                                <div className="p-3">
                                  <button
                                    onClick={() => handleAddTask(phase.id)}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Tarefa
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Create/Edit Phase Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">
              {editingPhase ? 'Editar Fase' : 'Nova Fase'}
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Fase *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Análise de Requisitos"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
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
                  placeholder="Descrição opcional da fase..."
                />
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
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Status */}
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
                  {PHASE_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
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
                    {editingPhase ? 'Guardar Alterações' : 'Criar Fase'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Create/Edit Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-semibold">
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleTaskSubmit}>
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  value={taskFormData.title}
                  onChange={handleTaskInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    taskFormErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Implementar autenticação"
                />
                {taskFormErrors.title && (
                  <p className="mt-1 text-sm text-red-500">{taskFormErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={taskFormData.description}
                  onChange={handleTaskInputChange}
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
                    value={taskFormData.status}
                    onChange={handleTaskInputChange}
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
                    value={taskFormData.priority}
                    onChange={handleTaskInputChange}
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
                  value={taskFormData.assignedTo}
                  onChange={handleTaskInputChange}
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
                    value={taskFormData.startDate}
                    onChange={handleTaskInputChange}
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
                    value={taskFormData.dueDate}
                    onChange={handleTaskInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      taskFormErrors.dueDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {taskFormErrors.dueDate && (
                    <p className="mt-1 text-sm text-red-500">{taskFormErrors.dueDate}</p>
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
                  value={taskFormData.estimatedHours}
                  onChange={handleTaskInputChange}
                  min="0"
                  step="0.5"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    taskFormErrors.estimatedHours ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 8"
                />
                {taskFormErrors.estimatedHours && (
                  <p className="mt-1 text-sm text-red-500">{taskFormErrors.estimatedHours}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingTask}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
              >
                {savingTask ? (
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
    </div>
  )
}

PhaseManager.propTypes = {
  projectId: PropTypes.string.isRequired,
  onPhasesChange: PropTypes.func
}

export default PhaseManager
