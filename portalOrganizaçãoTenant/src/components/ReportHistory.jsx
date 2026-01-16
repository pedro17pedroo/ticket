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
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getReportHistory, downloadReport, getProjects } from '../services/projectService'

/**
 * ReportHistory Component
 * 
 * Displays a table with report generation history including:
 * - Filters by project, type, and period
 * - Pagination
 * - Re-download functionality
 * 
 * Requirements: 10.2, 10.3
 */

// Report type configuration for display
const REPORT_TYPE_CONFIG = {
  project_charter: {
    name: 'Termo de Abertura',
    icon: FileText,
    color: 'blue'
  },
  project_closure: {
    name: 'Termo de Encerramento',
    icon: FileCheck,
    color: 'green'
  },
  status_report: {
    name: 'Ponto de Situação',
    icon: BarChart,
    color: 'orange'
  },
  schedule_report: {
    name: 'Cronograma',
    icon: Calendar,
    color: 'purple'
  },
  task_report: {
    name: 'Lista de Tarefas',
    icon: CheckSquare,
    color: 'cyan'
  },
  stakeholder_report: {
    name: 'Lista de Stakeholders',
    icon: Users,
    color: 'pink'
  },
  executive_summary: {
    name: 'Resumo Executivo',
    icon: FileBarChart,
    color: 'indigo'
  }
}

// Color classes for report type badges
const colorClasses = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
}

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Check if report is expired
 */
const isExpired = (expiresAt) => {
  if (!expiresAt) return false
  return new Date() > new Date(expiresAt)
}

const ReportHistory = () => {
  // State
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [projects, setProjects] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Filter state
  const [filters, setFilters] = useState({
    projectId: '',
    type: '',
    startDate: '',
    endDate: ''
  })

  // Load projects for filter dropdown
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await getProjects({ limit: 100 })
        setProjects(response.projects || [])
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    }
    loadProjects()
  }, [])

  // Load report history
  const loadHistory = async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      }
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const response = await getReportHistory(params)
      
      if (response.success) {
        setReports(response.data.reports || [])
        setPagination(prev => ({
          ...prev,
          page: response.data.pagination.page,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }))
      }
    } catch (error) {
      console.error('Error loading report history:', error)
      toast.error('Erro ao carregar histórico de relatórios')
    } finally {
      setLoading(false)
    }
  }

  // Load history on mount and when filters change
  useEffect(() => {
    loadHistory(1)
  }, [filters])

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      projectId: '',
      type: '',
      startDate: '',
      endDate: ''
    })
  }

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.projectId || filters.type || filters.startDate || filters.endDate
  }, [filters])

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadHistory(newPage)
    }
  }

  // Handle report download
  const handleDownload = async (report) => {
    if (isExpired(report.expiresAt)) {
      toast.error('Este relatório expirou e não está mais disponível para download')
      return
    }

    setDownloading(report.id)
    try {
      const blob = await downloadReport(report.project?.id, report.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = report.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Download iniciado')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Erro ao descarregar relatório')
    } finally {
      setDownloading(null)
    }
  }

  // Get report type display info
  const getReportTypeInfo = (type) => {
    return REPORT_TYPE_CONFIG[type] || {
      name: type,
      icon: FileText,
      color: 'gray'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Histórico de Relatórios
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Relatórios gerados anteriormente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadHistory(pagination.page)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                hasActiveFilters
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
              {hasActiveFilters && (
                <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {[filters.projectId, filters.type, filters.startDate, filters.endDate].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Projeto
                </label>
                <select
                  value={filters.projectId}
                  onChange={(e) => handleFilterChange('projectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos os projetos</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.code} - {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Relatório
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos os tipos</option>
                  {Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {hasActiveFilters 
                ? 'Nenhum relatório encontrado com os filtros aplicados'
                : 'Ainda não foram gerados relatórios'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Projeto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Formato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tamanho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gerado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expira em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((report) => {
                const typeInfo = getReportTypeInfo(report.type)
                const Icon = typeInfo.icon
                const expired = isExpired(report.expiresAt)

                return (
                  <tr 
                    key={report.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${expired ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${expired ? 'text-gray-400' : `text-${typeInfo.color}-600`}`} />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[typeInfo.color]}`}>
                          {typeInfo.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {report.project?.name || '-'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {report.project?.code || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                        {report.format === 'pdf' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4" />
                        )}
                        {report.format?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(report.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(report.generatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {expired ? (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Expirado
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(report.expiresAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDownload(report)}
                        disabled={downloading === report.id || expired}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          expired
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50'
                        }`}
                        title={expired ? 'Relatório expirado' : 'Descarregar relatório'}
                      >
                        {downloading === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Download
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && reports.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} relatórios
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportHistory
