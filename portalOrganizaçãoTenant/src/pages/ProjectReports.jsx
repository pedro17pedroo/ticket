import { useEffect, useState, useMemo } from 'react'
import { 
  FileText, 
  Search,
  Filter,
  X,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjects, PROJECT_STATUSES, PROJECT_METHODOLOGIES } from '../services/projectService'
import ReportGenerator, { REPORT_TYPES as REPORT_TYPES_CONFIG, colorClasses } from '../components/ReportGenerator'
import ReportHistory from '../components/ReportHistory'

// Report types configuration - use imported config
const REPORT_TYPES = Object.values(REPORT_TYPES_CONFIG)

const ProjectReports = () => {
  // State
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedReportType, setSelectedReportType] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  
  // Filter state for projects
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    methodology: '',
    startDate: '',
    endDate: ''
  })

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await getProjects({ limit: 100 })
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !filters.search || 
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.code.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesStatus = !filters.status || project.status === filters.status
      const matchesMethodology = !filters.methodology || project.methodology === filters.methodology
      
      // Period filter - check if project dates overlap with filter period
      let matchesPeriod = true
      if (filters.startDate || filters.endDate) {
        const projectStart = project.start_date ? new Date(project.start_date) : null
        const projectEnd = project.end_date ? new Date(project.end_date) : null
        const filterStart = filters.startDate ? new Date(filters.startDate) : null
        const filterEnd = filters.endDate ? new Date(filters.endDate) : null
        
        if (filterStart && projectEnd) {
          matchesPeriod = matchesPeriod && projectEnd >= filterStart
        }
        if (filterEnd && projectStart) {
          matchesPeriod = matchesPeriod && projectStart <= filterEnd
        }
      }
      
      return matchesSearch && matchesStatus && matchesMethodology && matchesPeriod
    })
  }, [projects, filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      methodology: '',
      startDate: '',
      endDate: ''
    })
  }

  const hasActiveFilters = useMemo(() => {
    return filters.status || filters.methodology || filters.startDate || filters.endDate
  }, [filters])

  const handleReportSelect = (reportType) => {
    if (!selectedProject) {
      toast.error('Selecione um projeto primeiro')
      return
    }
    setSelectedReportType(reportType.id)
    setShowGenerateModal(true)
  }

  const handleCloseModal = () => {
    setShowGenerateModal(false)
    setSelectedReportType(null)
  }

  const handleReportSuccess = (reportData) => {
    // Optional: refresh history or show additional feedback
    console.log('Report generated successfully:', reportData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Relatórios de Projetos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerar e exportar relatórios dos projetos da organização
        </p>
      </div>

      {/* Project Selection Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">1. Selecionar Projeto</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou código..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
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
                {[filters.status, filters.methodology, filters.startDate, filters.endDate].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {PROJECT_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Methodology Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Metodologia
                </label>
                <select
                  value={filters.methodology}
                  onChange={(e) => handleFilterChange('methodology', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todas</option>
                  {PROJECT_METHODOLOGIES.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
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

        {/* Project Dropdown */}
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = filteredProjects.find(p => p.id === e.target.value)
                setSelectedProject(project || null)
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">Selecione um projeto...</option>
              {filteredProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        )}

        {/* Selected Project Info */}
        {selectedProject && (
          <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary-900 dark:text-primary-100">
                  {selectedProject.code} - {selectedProject.name}
                </p>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Status: {PROJECT_STATUSES.find(s => s.value === selectedProject.status)?.label || selectedProject.status}
                  {' • '}
                  Progresso: {selectedProject.progress || 0}%
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 hover:bg-primary-100 dark:hover:bg-primary-800 rounded"
              >
                <X className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Types Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">2. Selecionar Tipo de Relatório</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {REPORT_TYPES.map((reportType) => {
            const colors = colorClasses[reportType.color]
            const Icon = reportType.icon
            
            return (
              <button
                key={reportType.id}
                onClick={() => handleReportSelect(reportType)}
                disabled={!selectedProject}
                className={`p-4 rounded-xl border-2 transition-all text-left ${colors.bg} ${colors.border} ${colors.hover} ${
                  !selectedProject ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  selectedReportType?.id === reportType.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {reportType.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {reportType.description}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {reportType.formats.map(format => (
                        <span
                          key={format}
                          className="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 uppercase"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {!selectedProject && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
            Selecione um projeto acima para poder gerar relatórios
          </p>
        )}
      </div>

      {/* Report Generation Modal - Using ReportGenerator Component */}
      <ReportGenerator
        isOpen={showGenerateModal}
        onClose={handleCloseModal}
        project={selectedProject}
        reportType={selectedReportType}
        onSuccess={handleReportSuccess}
      />

      {/* Report History Section */}
      <ReportHistory />
    </div>
  )
}

export default ProjectReports
