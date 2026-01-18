import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ticketService } from '../services/api'
import { Plus, Search, Filter, Eye, User, X, LayoutGrid, FileDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { useAuthStore } from '../store/authStore'
import AdvancedSearch from '../components/AdvancedSearch'
import toast from 'react-hot-toast'
import { exportTicketsToCSV, exportTicketsToPDF } from '../utils/exportUtils'
import PermissionGate from '../components/PermissionGate'

const Tickets = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState([])
  const [slas, setSlas] = useState([])
  const [priorities, setPriorities] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMyTickets, setShowMyTickets] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})
  const [savedSearches, setSavedSearches] = useState([])
  const [ticketOriginFilter, setTicketOriginFilter] = useState('all') // 'all', 'catalog', 'manual'
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const unassigned = searchParams.get('unassigned')

    if (unassigned === 'true') {
      setActiveFilters(prev => ({ ...prev, assigneeId: 'null' }))
    }
  }, [location.search])

  useEffect(() => {
    loadData()
  }, [activeFilters, showMyTickets, ticketOriginFilter, currentPage, itemsPerPage])

  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, [])

  const loadData = async () => {
    await Promise.all([loadTickets(), loadSLAs(), loadPriorities(), loadTypes()])
  }

  const loadSLAs = async () => {
    try {
      const response = await ticketService.getSLAs()
      setSlas(response.slas || [])
    } catch (error) {
      console.error('Erro ao carregar SLAs:', error)
    }
  }

  const loadPriorities = async () => {
    try {
      const response = await ticketService.getPriorities()
      setPriorities(response.priorities || [])
    } catch (error) {
      console.error('Erro ao carregar prioridades:', error)
    }
  }

  const loadTypes = async () => {
    try {
      const response = await ticketService.getTypes()
      setTypes(response.types || [])
    } catch (error) {
      console.error('Erro ao carregar tipos:', error)
    }
  }

  const loadTickets = async () => {
    setLoading(true)
    try {
      const params = { ...activeFilters }
      if (showMyTickets) {
        params.assigneeId = user.id
      }
      
      // Filtrar por origem do ticket
      if (ticketOriginFilter === 'catalog') {
        params.hasCatalogItem = 'true' // Apenas solicitações de serviço
      } else if (ticketOriginFilter === 'manual') {
        params.hasCatalogItem = 'false' // Apenas tickets manuais
      }
      // Se 'all', não adiciona filtro (mostra tudo)
      
      // Add pagination params
      params.page = currentPage
      params.limit = itemsPerPage
      
      console.log('🔍 Carregando tickets com params:', params)
      const data = await ticketService.getAll(params)
      console.log('📊 Resposta da API:', data)
      console.log('🎫 Total de tickets:', data.tickets?.length)
      console.log('📈 Paginação:', data.pagination)
      
      setTickets(data.tickets)
      // Use pagination.total from backend response
      setTotalItems(data.pagination?.total || data.tickets.length)
    } catch (error) {
      console.error('❌ Erro ao carregar tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (filters) => {
    setActiveFilters(filters)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleOriginFilterChange = (origin) => {
    setTicketOriginFilter(origin)
    setCurrentPage(1) // Reset to first page
  }

  const handleSaveSearch = (searchData) => {
    const updated = [...savedSearches, { ...searchData, id: Date.now() }]
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    toast.success('Pesquisa salva com sucesso')
  }

  const handleDeleteSavedSearch = (id) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    toast.success('Pesquisa removida')
  }

  const handleLoadSavedSearch = (filters) => {
    setActiveFilters(filters)
    setCurrentPage(1) // Reset to first page
    toast.success('Pesquisa carregada')
  }

  // Pagination functions
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }
  
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1) // Reset to first page
  }
  
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const getStatusBadge = (status) => {
    const styles = {
      novo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      aguardando_aprovacao: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      em_progresso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      aguardando_cliente: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      resolvido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      fechado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    }
    const labels = {
      novo: 'Novo',
      aguardando_aprovacao: 'Aguardando Aprovação',
      em_progresso: 'Em Progresso',
      aguardando_cliente: 'Aguardando Cliente',
      resolvido: 'Resolvido',
      fechado: 'Fechado',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getPriorityBadge = (priorityName) => {
    // Buscar prioridade dinâmica
    const priority = priorities.find(p =>
      p.name.toLowerCase() === priorityName.toLowerCase()
    )

    // Cores padrão para compatibilidade
    const defaultColors = {
      'baixa': '#10B981',
      'media': '#3B82F6',
      'média': '#3B82F6',
      'alta': '#F59E0B',
      'urgente': '#EF4444'
    }

    const color = priority?.color || defaultColors[priorityName.toLowerCase()] || '#6B7280'
    const displayName = priority?.name || priorityName

    return (
      <span
        className="px-2 py-1 text-xs font-semibold rounded-full"
        style={{
          backgroundColor: `${color}20`,
          color: color
        }}
      >
        {displayName}
      </span>
    )
  }

  const renderSLA = (ticket) => {
    // Tenta usar o SLA que já vem com o ticket (backend association)
    // Se não, tenta encontrar na lista de SLAs pela prioridade (fallback)
    const sla = ticket.sla || slas.find(s => s.priority.toLowerCase() === ticket.priority?.toLowerCase())

    if (!sla) {
      return <span className="text-gray-400">-</span>
    }

    const formatTime = (minutes) => {
      if (!minutes) return '-'
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    return (
      <div className="text-xs">
        <div className="text-gray-600 dark:text-gray-400">
          Resposta: <span className="font-medium text-gray-900 dark:text-gray-100">{formatTime(sla.responseTimeMinutes)}</span>
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          Resolução: <span className="font-medium text-gray-900 dark:text-gray-100">{formatTime(sla.resolutionTimeMinutes)}</span>
        </div>
      </div>
    )
  }

  const handleExportCSV = () => {
    exportTicketsToCSV(tickets, `tickets-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Tickets exportados para CSV')
    setShowExportMenu(false)
  }

  const handleExportPDF = () => {
    exportTicketsToPDF(tickets, `tickets-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Tickets exportados para PDF')
    setShowExportMenu(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie todos os tickets e solicitações
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Origin Filter Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleOriginFilterChange('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                ticketOriginFilter === 'all'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Mostrar todos os tickets"
            >
              Todos
            </button>
            <button
              onClick={() => handleOriginFilterChange('catalog')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                ticketOriginFilter === 'catalog'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Apenas solicitações de serviço do catálogo"
            >
              Solicitações
            </button>
            <button
              onClick={() => handleOriginFilterChange('manual')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                ticketOriginFilter === 'manual'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Apenas tickets criados manualmente"
            >
              Manuais
            </button>
          </div>

          <button
            onClick={() => setShowMyTickets(!showMyTickets)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showMyTickets
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <User className="w-5 h-5" />
            Meus Tickets
          </button>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              title="Exportar Tickets"
            >
              <FileDown className="w-5 h-5" />
              Exportar
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Exportar como CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Exportar como PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/tickets/kanban')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            title="Visualização Kanban"
          >
            <LayoutGrid className="w-5 h-5" />
            Kanban
          </button>
          <PermissionGate permission="tickets.create">
            <button
              onClick={() => navigate('/tickets/new')}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Ticket
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        onSearch={handleSearch}
        onSaveSearch={handleSaveSearch}
      />

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {savedSearches.map((saved) => (
            <button
              key={saved.id}
              onClick={() => handleLoadSavedSearch(saved.filters)}
              className="group flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <Search className="w-3 h-3" />
              <span className="text-sm font-medium">{saved.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSavedSearch(saved.id);
                }}
                className="opacity-0 group-hover:opacity-100 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      )}


      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum ticket encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Solicitante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SLA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {ticket.ticketNumber}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        {ticket.catalogItemId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" title="Solicitação de Serviço">
                            📋
                          </span>
                        )}
                        <span className="truncate">{ticket.subject}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.requester?.name || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.assignee?.name || <span className="text-gray-400 italic">Não atribuído</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {renderSLA(ticket)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.createdAt), 'dd/MM/yyyy', { locale: pt })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/tickets/${ticket.id}`)
                        }}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && tickets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Items per page selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Mostrar
              </span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                por página
              </span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              {/* First page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Primeira página"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>

              {/* Previous page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              {/* Next page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Próxima página"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Last page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Última página"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tickets
