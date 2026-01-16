import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Gantt, ViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { 
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Clock,
  LayoutGrid,
  Download,
  FileImage,
  FileText,
  ChevronDown
} from 'lucide-react'
import { format, addDays, subDays, isValid, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getGanttData, getProjectById, exportGantt } from '../services/projectService'

/**
 * ProjectGantt - Gantt chart visualization for project timeline
 * Features:
 * - Phases and tasks as horizontal bars (Requirement 7.1)
 * - Dependencies as connecting lines (Requirement 7.2)
 * - Zoom levels: day, week, month (Requirement 7.3)
 * - Overdue tasks highlighted in red (Requirement 7.4)
 * - Task progress within bars (Requirement 7.5)
 * - Click to view/edit task details (Requirement 7.6)
 * - Current date vertical line (Requirement 7.7)
 * - Export as PDF or image (Requirement 7.8)
 * 
 * Requirements: 7.1-7.8
 */
const ProjectGantt = () => {
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  const ganttRef = useRef(null)
  
  const [project, setProject] = useState(null)
  const [ganttData, setGanttData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(ViewMode.Week)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskInfo, setShowTaskInfo] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // View mode options - Requirement 7.3
  const viewModes = [
    { value: ViewMode.Day, label: 'Dia', icon: Calendar },
    { value: ViewMode.Week, label: 'Semana', icon: Calendar },
    { value: ViewMode.Month, label: 'Mês', icon: Calendar }
  ]

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectRes, ganttRes] = await Promise.all([
        getProjectById(projectId),
        getGanttData(projectId)
      ])
      
      setProject(projectRes.project || projectRes)
      setGanttData(ganttRes.gantt)
    } catch (error) {
      console.error('Erro ao carregar dados do Gantt:', error)
      toast.error('Erro ao carregar dados do projeto')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  // Get phase color based on status - moved before useMemo
  const getPhaseColor = (status, selected = false) => {
    const colors = {
      pending: selected ? '#9ca3af' : '#d1d5db',
      in_progress: selected ? '#3b82f6' : '#60a5fa',
      completed: selected ? '#10b981' : '#34d399'
    }
    return colors[status] || colors.pending
  }

  // Get task styles based on status and overdue - Requirement 7.4
  const getTaskStyles = (status, isOverdue, isDone, priority) => {
    // Overdue tasks are red - Requirement 7.4
    if (isOverdue) {
      return {
        backgroundColor: '#fecaca',
        backgroundSelectedColor: '#fca5a5',
        progressColor: '#ef4444',
        progressSelectedColor: '#dc2626'
      }
    }

    // Done tasks are green
    if (isDone) {
      return {
        backgroundColor: '#bbf7d0',
        backgroundSelectedColor: '#86efac',
        progressColor: '#22c55e',
        progressSelectedColor: '#16a34a'
      }
    }

    // Priority-based colors for in-progress tasks
    const priorityColors = {
      critical: {
        backgroundColor: '#fed7aa',
        backgroundSelectedColor: '#fdba74',
        progressColor: '#f97316',
        progressSelectedColor: '#ea580c'
      },
      high: {
        backgroundColor: '#fef08a',
        backgroundSelectedColor: '#fde047',
        progressColor: '#eab308',
        progressSelectedColor: '#ca8a04'
      },
      medium: {
        backgroundColor: '#bfdbfe',
        backgroundSelectedColor: '#93c5fd',
        progressColor: '#3b82f6',
        progressSelectedColor: '#2563eb'
      },
      low: {
        backgroundColor: '#e5e7eb',
        backgroundSelectedColor: '#d1d5db',
        progressColor: '#6b7280',
        progressSelectedColor: '#4b5563'
      }
    }

    return priorityColors[priority] || priorityColors.medium
  }

  // Handle export - Requirement 7.8
  const handleExport = async (format) => {
    if (!ganttRef.current) {
      toast.error('Não foi possível encontrar o gráfico para exportar')
      return
    }

    setExporting(true)
    setShowExportMenu(false)

    try {
      const ganttElement = ganttRef.current.querySelector('.gantt-container')
      if (!ganttElement) {
        toast.error('Não foi possível encontrar o gráfico para exportar')
        return
      }

      await exportGantt(
        ganttElement,
        format,
        project?.name,
        project?.code
      )

      toast.success(`Gantt exportado como ${format.toUpperCase()} com sucesso!`)
    } catch (error) {
      console.error('Erro ao exportar Gantt:', error)
      toast.error('Erro ao exportar o diagrama de Gantt')
    } finally {
      setExporting(false)
    }
  }

  // Transform backend data to gantt-task-react format
  const ganttTasks = useMemo(() => {
    if (!ganttData) return []

    const tasks = []
    const { phases, tasks: projectTasks, dependencies } = ganttData

    // Create a map of dependencies for quick lookup
    const dependencyMap = new Map()
    dependencies.forEach(dep => {
      if (!dependencyMap.has(dep.targetTaskId)) {
        dependencyMap.set(dep.targetTaskId, [])
      }
      dependencyMap.get(dep.targetTaskId).push(dep.sourceTaskId)
    })

    // Helper to safely parse dates
    const parseDate = (dateStr, fallback) => {
      if (!dateStr) return fallback
      const parsed = parseISO(dateStr)
      return isValid(parsed) ? parsed : fallback
    }

    // Default dates if not provided
    const today = new Date()
    const defaultStart = subDays(today, 7)
    const defaultEnd = addDays(today, 30)

    // Sort phases by orderIndex to ensure correct order
    const sortedPhases = [...phases].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))

    // Add phases as project type (collapsible groups) - Requirement 7.1
    sortedPhases.forEach((phase, phaseIndex) => {
      // Get tasks for this phase and sort by orderIndex
      const phaseTasks = projectTasks
        .filter(t => t.phaseId === phase.id)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      
      // Calculate phase dates from tasks if not set
      let phaseStart = parseDate(phase.startDate, null)
      let phaseEnd = parseDate(phase.endDate, null)

      if (phaseTasks.length > 0) {
        const taskStarts = phaseTasks
          .map(t => parseDate(t.startDate, null))
          .filter(d => d !== null)
        const taskEnds = phaseTasks
          .map(t => parseDate(t.endDate, null))
          .filter(d => d !== null)

        if (taskStarts.length > 0 && !phaseStart) {
          phaseStart = new Date(Math.min(...taskStarts))
        }
        if (taskEnds.length > 0 && !phaseEnd) {
          phaseEnd = new Date(Math.max(...taskEnds))
        }
      }

      // Use defaults if still no dates
      phaseStart = phaseStart || defaultStart
      phaseEnd = phaseEnd || defaultEnd

      // Ensure end is after start
      if (phaseEnd <= phaseStart) {
        phaseEnd = addDays(phaseStart, 1)
      }

      // Phase displayOrder: (phaseIndex + 1) * 1000 to leave room for tasks
      // Note: We use phaseIndex + 1 because displayOrder of 0 is treated as falsy by gantt-task-react
      const phaseDisplayOrder = (phaseIndex + 1) * 1000

      tasks.push({
        id: phase.id,
        name: phase.name,
        start: phaseStart,
        end: phaseEnd,
        progress: phase.progress || 0,
        type: 'project',
        hideChildren: false,
        displayOrder: phaseDisplayOrder,
        styles: {
          backgroundColor: getPhaseColor(phase.status),
          backgroundSelectedColor: getPhaseColor(phase.status, true),
          progressColor: '#3b82f6',
          progressSelectedColor: '#2563eb'
        }
      })

      // Add tasks under each phase - Requirements 7.1, 7.4, 7.5
      phaseTasks.forEach((task, taskIndex) => {
        let taskStart = parseDate(task.startDate, null)
        let taskEnd = parseDate(task.endDate, null)

        // Use phase dates as fallback
        taskStart = taskStart || phaseStart
        taskEnd = taskEnd || (taskStart ? addDays(taskStart, 1) : phaseEnd)

        // Ensure end is after start
        if (taskEnd <= taskStart) {
          taskEnd = addDays(taskStart, 1)
        }

        // Get dependencies for this task - Requirement 7.2
        const taskDependencies = dependencyMap.get(task.id) || []

        // Determine colors based on status and overdue - Requirement 7.4
        const isOverdue = task.isOverdue
        const isDone = task.status === 'done'

        // Task displayOrder: immediately after its phase
        const taskDisplayOrder = phaseDisplayOrder + taskIndex + 1

        tasks.push({
          id: task.id,
          name: task.name,
          start: taskStart,
          end: taskEnd,
          progress: task.progress || 0, // Requirement 7.5
          type: 'task',
          project: phase.id, // Link to parent phase
          dependencies: taskDependencies, // Requirement 7.2
          displayOrder: taskDisplayOrder,
          isDisabled: false,
          styles: getTaskStyles(task.status, isOverdue, isDone, task.priority)
        })
      })
    })

    // Sort by displayOrder to ensure phases appear before their tasks
    tasks.sort((a, b) => a.displayOrder - b.displayOrder)

    return tasks
  }, [ganttData, getPhaseColor, getTaskStyles])

  // Handle task click - Requirement 7.6
  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setShowTaskInfo(true)
  }

  // Handle task double click - navigate to task detail
  const handleTaskDoubleClick = (task) => {
    if (task.type === 'task') {
      // Navigate to project detail where task can be edited
      navigate(`/projects/${projectId}`)
    }
  }

  // Handle expand/collapse
  const handleExpanderClick = (task) => {
    // Toggle hideChildren for project type tasks
    const updatedTasks = ganttTasks.map(t => {
      if (t.id === task.id) {
        return { ...t, hideChildren: !t.hideChildren }
      }
      return t
    })
    // Note: gantt-task-react handles this internally
  }

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      todo: 'A Fazer',
      in_progress: 'Em Progresso',
      in_review: 'Em Revisão',
      done: 'Concluída',
      pending: 'Pendente',
      completed: 'Concluída'
    }
    return labels[status] || status
  }

  // Get priority label
  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    }
    return labels[priority] || priority
  }

  // Custom tooltip component
  const TooltipContent = ({ task, fontSize, fontFamily }) => {
    const originalTask = ganttData?.tasks?.find(t => t.id === task.id) || 
                         ganttData?.phases?.find(p => p.id === task.id)
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 min-w-[200px]">
        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {task.name}
        </div>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {format(task.start, 'dd/MM/yyyy', { locale: pt })} - {format(task.end, 'dd/MM/yyyy', { locale: pt })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Progresso: {task.progress}%</span>
          </div>
          {originalTask?.isOverdue && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Atrasada</span>
            </div>
          )}
          {originalTask?.assignee && (
            <div className="flex items-center gap-2">
              <span>Responsável: {originalTask.assignee.name}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

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
              <span className="text-sm text-gray-500 dark:text-gray-400">Diagrama de Gantt</span>
            </div>
            <h1 className="text-2xl font-bold">{project?.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Visualize o cronograma e dependências do projeto
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export Dropdown - Requirement 7.8 */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting || ganttTasks.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exportar
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Exportar PDF</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Documento para impressão</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('png')}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
                  >
                    <FileImage className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Exportar PNG</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Imagem de alta qualidade</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* View Mode Selector - Requirement 7.3 */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {viewModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode.value
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <Link
            to={`/projects/${projectId}/kanban`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </Link>
          <Link
            to={`/projects/${projectId}`}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Ver Dashboard
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      {ganttData?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {ganttData.stats.totalPhases}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Fases</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {ganttData.stats.totalTasks}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Tarefas</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {ganttData.stats.completedTasks}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Concluídas</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {ganttData.stats.overdueTasks}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Atrasadas</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {ganttData.stats.totalDependencies}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Dependências</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-300"></div>
            <span className="text-gray-600 dark:text-gray-400">Concluída</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-300"></div>
            <span className="text-gray-600 dark:text-gray-400">Em Progresso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-300"></div>
            <span className="text-gray-600 dark:text-gray-400">Alta Prioridade</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-300"></div>
            <span className="text-gray-600 dark:text-gray-400">Crítica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-200"></div>
            <span className="text-gray-600 dark:text-gray-400">Atrasada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Hoje</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div ref={ganttRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {ganttTasks.length > 0 ? (
          <div className="gantt-container">
            <Gantt
              tasks={ganttTasks}
              viewMode={viewMode}
              onSelect={handleTaskClick}
              onDoubleClick={handleTaskDoubleClick}
              onExpanderClick={handleExpanderClick}
              listCellWidth="200px"
              columnWidth={viewMode === ViewMode.Day ? 60 : viewMode === ViewMode.Week ? 200 : 300}
              ganttHeight={500}
              barCornerRadius={4}
              barFill={70}
              handleWidth={8}
              todayColor="rgba(239, 68, 68, 0.2)"
              TooltipContent={TooltipContent}
              locale="pt"
              rtl={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <Calendar className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Sem dados para exibir</p>
            <p className="text-sm mt-1">Adicione fases e tarefas ao projeto para visualizar o cronograma</p>
            <Link
              to={`/projects/${projectId}`}
              className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Ir para Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Task Info Modal */}
      {showTaskInfo && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTaskInfo(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedTask.name}
                </h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                  selectedTask.type === 'project' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {selectedTask.type === 'project' ? 'Fase' : 'Tarefa'}
                </span>
              </div>
              <button
                onClick={() => setShowTaskInfo(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {format(selectedTask.start, 'dd/MM/yyyy', { locale: pt })} - {format(selectedTask.end, 'dd/MM/yyyy', { locale: pt })}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                    <span className="font-medium">{selectedTask.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {selectedTask.type === 'task' && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowTaskInfo(false)
                      navigate(`/projects/${projectId}`)
                    }}
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom styles for Gantt */}
      <style>{`
        .gantt-container {
          overflow-x: auto;
        }
        
        /* Dark mode adjustments */
        .dark .gantt-container {
          --gantt-bg: #1f2937;
          --gantt-border: #374151;
          --gantt-text: #e5e7eb;
        }
        
        /* Today line - Requirement 7.7 */
        .gantt-container .today {
          stroke: #ef4444;
          stroke-width: 2;
        }
        
        /* Task list styling */
        .gantt-container .task-list-header,
        .gantt-container .task-list-table {
          background-color: inherit;
        }
        
        .dark .gantt-container .task-list-header,
        .dark .gantt-container .task-list-table {
          background-color: #1f2937;
          color: #e5e7eb;
        }
        
        /* Grid styling */
        .dark .gantt-container .grid-row {
          fill: #1f2937;
        }
        
        .dark .gantt-container .grid-row:nth-child(even) {
          fill: #111827;
        }
        
        /* Arrow styling for dependencies - Requirement 7.2 */
        .gantt-container .arrow {
          fill: #6b7280;
          stroke: #6b7280;
        }
        
        .dark .gantt-container .arrow {
          fill: #9ca3af;
          stroke: #9ca3af;
        }
      `}</style>
    </div>
  )
}

export default ProjectGantt
