import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ticketService } from '../services/api'
import { Plus, Search, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const MyTickets = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadTickets()
  }, [statusFilter])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const data = await ticketService.getMyTickets({ status: statusFilter, search })
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      novo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      em_progresso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      aguardando_cliente: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      resolvido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      fechado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    }
    const labels = {
      novo: 'Novo',
      em_progresso: 'Em Progresso',
      aguardando_cliente: 'Aguardando Você',
      resolvido: 'Resolvido',
      fechado: 'Fechado',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      baixa: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      media: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      alta: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      urgente: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    const labels = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      urgente: 'Urgente',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>
        {labels[priority]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meus Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe suas solicitações de suporte
          </p>
        </div>
        <button
          onClick={() => navigate('/tickets/new')}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadTickets()}
              placeholder="Pesquisar tickets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
          >
            <option value="">Todos os Status</option>
            <option value="novo">Novo</option>
            <option value="em_progresso">Em Progresso</option>
            <option value="aguardando_cliente">Aguardando Você</option>
            <option value="resolvido">Resolvido</option>
            <option value="fechado">Fechado</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum ticket encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {ticket.ticketNumber}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        Criado em {format(new Date(ticket.createdAt), 'dd/MM/yyyy', { locale: pt })}
                      </span>
                      {ticket.assignee && (
                        <span>Atendente: {ticket.assignee.name}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/tickets/${ticket.id}`)
                    }}
                    className="flex-shrink-0 p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyTickets
