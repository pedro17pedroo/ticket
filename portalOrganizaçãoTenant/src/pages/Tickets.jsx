import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ticketService } from '../services/api'
import { Plus, Search, Filter, Eye, User, X, LayoutGrid, FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { useAuthStore } from '../store/authStore'
import AdvancedSearch from '../components/AdvancedSearch'
import toast from 'react-hot-toast'
import { exportTicketsToCSV, exportTicketsToPDF } from '../utils/exportUtils'

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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const unassigned = searchParams.get('unassigned')

    if (unassigned === 'true') {
      setActiveFilters(prev => ({ ...prev, assigneeId: 'null' }))
    }
  }, [location.search])

  useEffect(() => {
    loadData()
  }, [activeFilters, showMyTickets])

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
      const data = await ticketService.getAll(params)
      setTickets(data.tickets)
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (filters) => {
    setActiveFilters(filters)
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
    toast.success('Pesquisa carregada')
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
            Gerir todos os tickets do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => navigate('/tickets/new')}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Ticket
          </button>
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
                    <td className="px-6 py-4 max-w-xs truncate">
                      {ticket.subject}
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
    </div>
  )
}

export default Tickets
