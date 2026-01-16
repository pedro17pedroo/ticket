import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  FileCheck,
  BarChart,
  Calendar,
  CheckSquare,
  Users,
  FileBarChart,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertTriangle,
  X,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import {
  generateProjectReport,
  downloadReport,
  getPhases,
  TASK_STATUSES,
  TASK_PRIORITIES
} from '../services/projectService'

/**
 * ReportGenerator Component
 * 
 * A reusable component for generating project reports with:
 * - Preview of report options
 * - Format selection (PDF/Excel)
 * - Report-specific options (period, filters, grouping)
 * - Download functionality
 * - Loading state
 * 
 * Requirements: 3.2, 5.2, 5.3, 6.3, 7.2, 8.3
 */

// Report types configuration
const REPORT_TYPES = {
  project_charter: {
    id: 'project_charter',
    name: 'Termo de Abertura',
    description: 'Documento formal de autorização do projeto',
    icon: FileText,
    formats: ['pdf'],
    color: 'blue'
  },
  project_closure: {
    id: 'project_closure',
    name: 'Termo de Encerramento',
    description: 'Documento de conclusão do projeto',
    icon: FileCheck,
    formats: ['pdf'],
    color: 'green'
  },
  status_report: {
    id: 'status_report',
    name: 'Ponto de Situação',
    description: 'Relatório periódico do estado do projeto',
    icon: BarChart,
    formats: ['pdf', 'excel'],
    color: 'orange'
  },
  schedule_report: {
    id: 'schedule_report',
    name: 'Cronograma',
    description: 'Visão temporal de fases e tarefas',
    icon: Calendar,
    formats: ['pdf', 'excel'],
    color: 'purple'
  },
  task_report: {
    id: 'task_report',
    name: 'Lista de Tarefas',
    description: 'Relatório detalhado de todas as tarefas',
    icon: CheckSquare,
    formats: ['pdf', 'excel'],
    color: 'cyan'
  },
  stakeholder_report: {
    id: 'stakeholder_report',
    name: 'Lista de Stakeholders',
    description: 'Partes interessadas do projeto',
    icon: Users,
    formats: ['pdf', 'excel'],
    color: 'pink'
  },
  executive_summary: {
    id: 'executive_summary',
    name: 'Resumo Executivo',
    description: 'Visão geral em 1-2 páginas',
    icon: FileBarChart,
    formats: ['pdf'],
    color: 'indigo'
  }
}

// Color mapping for report cards
const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400'
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: 'text-cyan-600 dark:text-cyan-400'
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    icon: 'text-pink-600 dark:text-pink-400'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-600 dark:text-indigo-400'
  }
}

/**
 * Default options for each report type
 */
const getDefaultOptions = (reportType) => {
  switch (reportType) {
    case 'status_report':
      return {
        periodStart: '',
        periodEnd: '',
        includeOverdueTasks: true,
        includeCharts: true
      }
    case 'task_report':
      return {
        filterByStatus: [],
        filterByPriority: [],
        filterByPhase: [],
        groupBy: 'phase'
      }
    case 'schedule_report':
      return {
        filterByPhase: [],
        includeGantt: true,
        includeDependencies: true
      }
    case 'stakeholder_report':
      return {
        groupBy: 'type'
      }
    default:
      return {}
  }
}

/**
 * Build options object for API call based on report type
 */
export const buildReportOptions = (reportType, options) => {
  const apiOptions = {}

  switch (reportType) {
    case 'status_report':
      if (options.periodStart || options.periodEnd) {
        apiOptions.period = {
          start: options.periodStart || null,
          end: options.periodEnd || null
        }
      }
      apiOptions.includeOverdueTasks = options.includeOverdueTasks
      apiOptions.includeCharts = options.includeCharts
      break

    case 'task_report':
      apiOptions.filters = {
        status: options.filterByStatus?.length > 0 ? options.filterByStatus : null,
        priority: options.filterByPriority?.length > 0 ? options.filterByPriority : null,
        phaseId: options.filterByPhase?.length > 0 ? options.filterByPhase : null,
        groupBy: options.groupBy
      }
      break

    case 'schedule_report':
      apiOptions.filters = {
        phaseId: options.filterByPhase?.length > 0 ? options.filterByPhase : null,
        includeGantt: options.includeGantt,
        includeDependencies: options.includeDependencies
      }
      break

    case 'stakeholder_report':
      apiOptions.filters = {
        groupBy: options.groupBy
      }
      break

    default:
      break
  }

  return apiOptions
}

/**
 * Apply filters to items based on filter criteria
 * Used for client-side filtering validation
 * 
 * @param {Array} items - Items to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered items
 */
export const applyFilters = (items, filters) => {
  if (!items || !Array.isArray(items)) return []
  if (!filters || Object.keys(filters).length === 0) return items

  return items.filter(item => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(item.priority)) return false
    }

    // Phase filter
    if (filters.phaseId && filters.phaseId.length > 0) {
      const itemPhaseId = item.phaseId || item.phase?.id
      if (!filters.phaseId.includes(itemPhaseId)) return false
    }

    // Assignee filter
    if (filters.assigneeId && filters.assigneeId.length > 0) {
      const itemAssigneeId = item.assignedTo || item.assignee?.id
      if (!filters.assigneeId.includes(itemAssigneeId)) return false
    }

    // Period filter (for date-based items)
    if (filters.period) {
      const { start, end } = filters.period
      const itemDate = item.dueDate || item.endDate || item.createdAt
      if (itemDate) {
        const date = new Date(itemDate)
        if (start && date < new Date(start)) return false
        if (end && date > new Date(end)) return false
      }
    }

    return true
  })
}

/**
 * StatusReportOptions Component
 * Options specific to status reports
 * Requirements: 5.2
 */
const StatusReportOptions = ({ options, onChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Opções do Relatório
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            Data Início
          </label>
          <input
            type="date"
            value={options.periodStart || ''}
            onChange={(e) => onChange('periodStart', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            Data Fim
          </label>
          <input
            type="date"
            value={options.periodEnd || ''}
            onChange={(e) => onChange('periodEnd', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeOverdueTasks"
          checked={options.includeOverdueTasks}
          onChange={(e) => onChange('includeOverdueTasks', e.target.checked)}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="includeOverdueTasks" className="text-sm text-gray-700 dark:text-gray-300">
          Destacar tarefas em atraso
        </label>
      </div>
    </div>
  )
}


/**
 * TaskReportOptions Component
 * Options specific to task reports with filters
 * Requirements: 7.2
 */
const TaskReportOptions = ({ options, onChange, phases = [] }) => {
  const handleMultiSelectChange = (field, value, checked) => {
    const currentValues = options[field] || []
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value)
    onChange(field, newValues)
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Filtros do Relatório
      </h4>

      {/* Status Filter */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
          Filtrar por Estado
        </label>
        <div className="flex flex-wrap gap-2">
          {TASK_STATUSES.map(status => (
            <label
              key={status.value}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                options.filterByStatus?.includes(status.value)
                  ? 'bg-primary-100 border-primary-300 dark:bg-primary-900/30 dark:border-primary-700'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={options.filterByStatus?.includes(status.value) || false}
                onChange={(e) => handleMultiSelectChange('filterByStatus', status.value, e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{status.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
          Filtrar por Prioridade
        </label>
        <div className="flex flex-wrap gap-2">
          {TASK_PRIORITIES.map(priority => (
            <label
              key={priority.value}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                options.filterByPriority?.includes(priority.value)
                  ? 'bg-primary-100 border-primary-300 dark:bg-primary-900/30 dark:border-primary-700'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={options.filterByPriority?.includes(priority.value) || false}
                onChange={(e) => handleMultiSelectChange('filterByPriority', priority.value, e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{priority.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Phase Filter */}
      {phases.length > 0 && (
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
            Filtrar por Fase
          </label>
          <div className="flex flex-wrap gap-2">
            {phases.map(phase => (
              <label
                key={phase.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  options.filterByPhase?.includes(phase.id)
                    ? 'bg-primary-100 border-primary-300 dark:bg-primary-900/30 dark:border-primary-700'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.filterByPhase?.includes(phase.id) || false}
                  onChange={(e) => handleMultiSelectChange('filterByPhase', phase.id, e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{phase.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Group By */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Agrupar por
        </label>
        <select
          value={options.groupBy || 'phase'}
          onChange={(e) => onChange('groupBy', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
        >
          <option value="phase">Fase</option>
          <option value="status">Estado</option>
          <option value="priority">Prioridade</option>
          <option value="assignee">Responsável</option>
        </select>
      </div>
    </div>
  )
}

/**
 * ScheduleReportOptions Component
 * Options specific to schedule reports
 * Requirements: 6.3
 */
const ScheduleReportOptions = ({ options, onChange, phases = [] }) => {
  const handlePhaseChange = (phaseId, checked) => {
    const currentPhases = options.filterByPhase || []
    const newPhases = checked
      ? [...currentPhases, phaseId]
      : currentPhases.filter(id => id !== phaseId)
    onChange('filterByPhase', newPhases)
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Opções do Relatório
      </h4>

      {/* Phase Filter */}
      {phases.length > 0 && (
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
            Filtrar por Fase
          </label>
          <div className="flex flex-wrap gap-2">
            {phases.map(phase => (
              <label
                key={phase.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  options.filterByPhase?.includes(phase.id)
                    ? 'bg-primary-100 border-primary-300 dark:bg-primary-900/30 dark:border-primary-700'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.filterByPhase?.includes(phase.id) || false}
                  onChange={(e) => handlePhaseChange(phase.id, e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{phase.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Gantt Options */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeGantt"
            checked={options.includeGantt}
            onChange={(e) => onChange('includeGantt', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="includeGantt" className="text-sm text-gray-700 dark:text-gray-300">
            Incluir diagrama de Gantt
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeDependencies"
            checked={options.includeDependencies}
            onChange={(e) => onChange('includeDependencies', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="includeDependencies" className="text-sm text-gray-700 dark:text-gray-300">
            Incluir dependências entre tarefas
          </label>
        </div>
      </div>
    </div>
  )
}

/**
 * StakeholderReportOptions Component
 * Options specific to stakeholder reports
 * Requirements: 8.3
 */
const StakeholderReportOptions = ({ options, onChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Opções do Relatório
      </h4>
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Agrupar por
        </label>
        <select
          value={options.groupBy || 'type'}
          onChange={(e) => onChange('groupBy', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
        >
          <option value="type">Tipo (Interno/Externo)</option>
          <option value="role">Papel no Projeto</option>
        </select>
      </div>
    </div>
  )
}


/**
 * ReportGenerator Component
 * Main component for generating project reports
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.project - Selected project object
 * @param {string} props.reportType - Report type ID
 * @param {Function} props.onSuccess - Callback when report is generated successfully
 */
const ReportGenerator = ({
  isOpen,
  onClose,
  project,
  reportType,
  onSuccess
}) => {
  // State
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [generating, setGenerating] = useState(false)
  const [options, setOptions] = useState({})
  const [phases, setPhases] = useState([])
  const [loadingPhases, setLoadingPhases] = useState(false)

  // Get report type configuration
  const reportConfig = useMemo(() => {
    return REPORT_TYPES[reportType] || null
  }, [reportType])

  // Reset state when modal opens or report type changes
  useEffect(() => {
    if (isOpen && reportType) {
      setSelectedFormat(reportConfig?.formats[0] || 'pdf')
      setOptions(getDefaultOptions(reportType))
    }
  }, [isOpen, reportType, reportConfig])

  // Load phases when needed for filters
  useEffect(() => {
    const loadPhases = async () => {
      if (!project?.id) return
      if (!['task_report', 'schedule_report'].includes(reportType)) return

      setLoadingPhases(true)
      try {
        const response = await getPhases(project.id)
        setPhases(response.phases || response || [])
      } catch (error) {
        console.error('Error loading phases:', error)
        setPhases([])
      } finally {
        setLoadingPhases(false)
      }
    }

    if (isOpen) {
      loadPhases()
    }
  }, [isOpen, project?.id, reportType])

  // Handle option change
  const handleOptionChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  // Check if project is not completed (for closure report warning)
  const showClosureWarning = reportType === 'project_closure' && 
    project?.status !== 'completed'

  // Handle report generation
  const handleGenerate = async () => {
    if (!project || !reportType) return

    setGenerating(true)
    try {
      // Build options for API
      const apiOptions = buildReportOptions(reportType, options)

      // Call backend API to generate report
      const response = await generateProjectReport(project.id, {
        type: reportType,
        format: selectedFormat,
        options: apiOptions
      })

      if (response.success && response.data) {
        toast.success(`Relatório "${reportConfig?.name}" gerado com sucesso!`)

        // Trigger download
        try {
          const blob = await downloadReport(project.id, response.data.reportId)
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = response.data.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (downloadError) {
          console.error('Erro ao descarregar relatório:', downloadError)
          toast.error('Relatório gerado mas erro ao descarregar. Tente novamente no histórico.')
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(response.data)
        }

        // Close modal
        onClose()
      } else {
        throw new Error(response.error || 'Erro ao gerar relatório')
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error(error.response?.data?.error || 'Erro ao gerar relatório. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  // Don't render if no report config
  if (!reportConfig) return null

  const Icon = reportConfig.icon
  const colors = colorClasses[reportConfig.color]

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Icon className={`w-6 h-6 ${colors.icon}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {reportConfig.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {project?.code} - {project?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Closure Warning */}
        {showClosureWarning && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Projeto não concluído
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Este projeto ainda não está marcado como concluído. O relatório será gerado com os dados atuais.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report Description */}
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {reportConfig.description}
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Formato do Relatório
          </label>
          <div className="flex gap-3">
            {reportConfig.formats.map(format => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                disabled={generating}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedFormat === format
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {format === 'pdf' ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5" />
                )}
                <span className="font-medium uppercase">{format}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Report-specific Options */}
        <div className="mb-6">
          {loadingPhases ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">A carregar opções...</span>
            </div>
          ) : (
            <>
              {reportType === 'status_report' && (
                <StatusReportOptions
                  options={options}
                  onChange={handleOptionChange}
                />
              )}

              {reportType === 'task_report' && (
                <TaskReportOptions
                  options={options}
                  onChange={handleOptionChange}
                  phases={phases}
                />
              )}

              {reportType === 'schedule_report' && (
                <ScheduleReportOptions
                  options={options}
                  onChange={handleOptionChange}
                  phases={phases}
                />
              )}

              {reportType === 'stakeholder_report' && (
                <StakeholderReportOptions
                  options={options}
                  onChange={handleOptionChange}
                />
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || loadingPhases}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                A gerar...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Gerar Relatório
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ReportGenerator
export { REPORT_TYPES, colorClasses, getDefaultOptions }
