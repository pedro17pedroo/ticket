import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { 
  ArrowLeft,
  Circle,
  Loader2,
  CheckCircle2,
  Eye as EyeIcon,
  Calendar,
  Tag,
  Clock,
  MoreVertical,
  Filter,
  X,
  AlertTriangle
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { 
  getTasks,
  getPhases,
  moveTask,
  getProjectById,
  TASK_PRIORITIES
} from '../services/projectService'
import { getUsers } from '../services/userService'

/**
 * ProjectKanban - Kanban board for project tasks
 * Features:
 * - Columns by status (To Do, In Progress, In Review, Done)
 * - Drag & drop task cards
 * - Filters by phase, assignee, priority
 * - Task count per column
 * 
 * Requirements: 6.1-6.7
 */
const ProjectKanban = () => {
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [phases, setPhases] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filters state
  const [filters, setFilters] = useState({
    phaseId: '',
    assignedTo: '',
    priority: ''
  })

  // Status column configuration - Requirements 6.1
  const statusConfig = {
    todo: {
      label: 'A Fazer',
      color: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-800 dark:text-gray-200',
      borderColor: 'border-gray-300 dark:border-gray-600',
      icon: Circle
    },
    in_progress: {
      label: 'Em Progresso',
      color: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-200',
      borderColor: 'border-blue-300 dark:border-blue-700',
      icon: Loader2
    },
    in_review: {
      label: 'Em Revisão',
      color: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      icon: EyeIcon
    },
    done: {
      label: 'Concluída',
      color: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-300 dark:border-green-700',
      icon: CheckCircle2
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectRes, tasksRes, phasesRes, usersRes] = await Promise.all([
        getProjectById(projectId),
        getTasks(projectId),
        getPhases(projectId),
        getUsers()
      ])
      
      setProject(projectRes.project || projectRes)
      const tasksData = tasksRes.tasks || tasksRes.data || tasksRes || []
      setTasks(Array.isArray(tasksData) ? tasksData : [])
      const phasesData = phasesRes.phases || phasesRes.data || phasesRes || []
      setPhases(Array.isArray(phasesData) ? phasesData : [])
      const usersData = usersRes.users || usersRes.data || usersRes || []
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do projeto')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }


  // Filter tasks based on current filters - Requirements 6.5
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.phaseId && task.phaseId !== filters.phaseId) return false
      if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false
      if (filters.priority && task.priority !== filters.priority) return false
      return true
    })
  }, [tasks, filters])

  // Organize tasks by status columns - Requirements 6.1
  const columns = useMemo(() => {
    return {
      todo: filteredTasks.filter(t => t.status === 'todo'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      in_review: filteredTasks.filter(t => t.status === 'in_review'),
      done: filteredTasks.filter(t => t.status === 'done')
    }
  }, [filteredTasks])

  // Handle drag end - Requirements 6.2, 6.3
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const newStatus = destination.droppableId
    const taskId = draggableId

    // Find the task being moved
    const movedTask = tasks.find(t => t.id === taskId)
    if (!movedTask) return

    // Optimistically update UI
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    )
    setTasks(updatedTasks)

    // Update on backend
    try {
      await moveTask(projectId, taskId, { status: newStatus })
      toast.success(`Tarefa movida para ${statusConfig[newStatus].label}`)
    } catch (error) {
      console.error('Erro ao mover tarefa:', error)
      toast.error('Erro ao atualizar status da tarefa')
      // Revert on error
      loadData()
    }
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'text-red-600 dark:text-red-400',
      high: 'text-orange-600 dark:text-orange-400',
      medium: 'text-blue-600 dark:text-blue-400',
      low: 'text-gray-600 dark:text-gray-400'
    }
    return colors[priority] || colors.medium
  }

  // Get priority label
  const getPriorityLabel = (priority) => {
    const config = TASK_PRIORITIES.find(p => p.value === priority)
    return config?.label || priority
  }

  // Get user name by ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user?.name || 'Não atribuído'
  }

  // Get user initials
  const getUserInitials = (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user?.name) return '?'
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Get phase name by ID
  const getPhaseName = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId)
    return phase?.name || ''
  }

  // Check if task is overdue
  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'done') return false
    return isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      phaseId: '',
      assignedTo: '',
      priority: ''
    })
  }

  // Check if any filter is active
  const hasActiveFilters = filters.phaseId || filters.assignedTo || filters.priority

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                {project?.code}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Kanban</span>
            </div>
            <h1 className="text-2xl font-bold">{project?.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Arraste e solte para alterar o status das tarefas
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              hasActiveFilters 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                {[filters.phaseId, filters.assignedTo, filters.priority].filter(Boolean).length}
              </span>
            )}
          </button>
          <Link
            to={`/projects/${projectId}`}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Ver Dashboard
          </Link>
        </div>
      </div>

      {/* Filters Panel - Requirements 6.5 */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Phase Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fase
              </label>
              <select
                value={filters.phaseId}
                onChange={(e) => setFilters(prev => ({ ...prev, phaseId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas as fases</option>
                {phases.map(phase => (
                  <option key={phase.id} value={phase.id}>{phase.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Responsável
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os responsáveis</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prioridade
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas as prioridades</option>
                {TASK_PRIORITIES.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpar
              </button>
            )}
          </div>
        </div>
      )}


      {/* Kanban Board - Requirements 6.1, 6.2, 6.4, 6.7 */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollBehavior: 'smooth' }}>
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon
            const columnTasks = columns[status] || []

            return (
              <div key={status} className="flex flex-col min-w-[300px] md:min-w-[340px] flex-shrink-0">
                {/* Column Header - Requirements 6.7 */}
                <div className={`${config.color} ${config.textColor} rounded-t-lg p-4 border-b-2 ${config.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
                      <h3 className="font-semibold">{config.label}</h3>
                    </div>
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 rounded-b-lg min-h-[500px] transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : 'bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="space-y-3">
                        {columnTasks.map((task, index) => (
                          <Draggable
                            key={String(task.id)}
                            draggableId={String(task.id)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-move ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''
                                } ${isOverdue(task) ? 'border-l-4 border-l-red-500' : ''}`}
                              >
                                {/* Task Card - Requirements 6.4 */}
                                <div className="space-y-3">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <Link
                                        to={`/projects/${projectId}`}
                                        className="font-medium text-sm hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {task.title}
                                      </Link>
                                      {task.phaseId && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {getPhaseName(task.phaseId)}
                                        </p>
                                      )}
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Priority */}
                                  <div className="flex items-center gap-2">
                                    <Tag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                                    <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                      {getPriorityLabel(task.priority)}
                                    </span>
                                    {isOverdue(task) && (
                                      <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                        <AlertTriangle className="w-3 h-3" />
                                        Atrasada
                                      </span>
                                    )}
                                  </div>

                                  {/* Assignee */}
                                  {task.assignedTo && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                          {getUserInitials(task.assignedTo)}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {getUserName(task.assignedTo)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Footer */}
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                      {task.estimatedHours && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>{task.estimatedHours}h</span>
                                        </div>
                                      )}
                                    </div>
                                    {task.dueDate && (
                                      <div className={`flex items-center gap-1 text-xs ${
                                        isOverdue(task) 
                                          ? 'text-red-600 dark:text-red-400' 
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}>
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                          {format(new Date(task.dueDate), 'dd/MM', { locale: pt })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}

                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                          Nenhuma tarefa
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}

export default ProjectKanban
