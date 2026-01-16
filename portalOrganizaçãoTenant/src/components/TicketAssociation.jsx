import { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  X,
  Save,
  Ticket,
  Search,
  Link2,
  ExternalLink,
  ListTodo,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'
import Modal from './Modal'
import { 
  getLinkedTickets, 
  linkTicket, 
  unlinkTicket,
  getTasks
} from '../services/projectService'
import { ticketService } from '../services/api'
import { confirmDelete } from '../utils/alerts'

/**
 * TicketAssociation - Component for managing ticket associations with projects
 * Features:
 * - List of associated tickets
 * - Modal for associating tickets
 * - Option to associate to specific task
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
const TicketAssociation = ({ projectId, onTicketsChange }) => {
  const [linkedTickets, setLinkedTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [availableTickets, setAvailableTickets] = useState([])
  const [projectTasks, setProjectTasks] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadLinkedTickets()
    }
  }, [projectId])

  const loadLinkedTickets = async () => {
    setLoading(true)
    try {
      const response = await getLinkedTickets(projectId)
      const ticketsData = response.tickets || response.data || response || []
      setLinkedTickets(Array.isArray(ticketsData) ? ticketsData : [])
    } catch (error) {
      console.error('Erro ao carregar tickets associados:', error)
      toast.error('Erro ao carregar tickets do projeto')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTickets = async () => {
    setLoadingTickets(true)
    try {
      const params = { limit: 100 }
      if (statusFilter) params.status = statusFilter
      if (searchTerm) params.search = searchTerm
      
      const response = await ticketService.getTickets(params)
      const ticketsData = response.tickets || response.data || response || []
      
      // Filter out already linked tickets
      const linkedIds = linkedTickets.map(lt => lt.ticketId || lt.ticket?.id || lt.id)
      const available = (Array.isArray(ticketsData) ? ticketsData : [])
        .filter(t => !linkedIds.includes(t.id))
      
      setAvailableTickets(available)
    } catch (error) {
      console.error('Erro ao carregar tickets disponíveis:', error)
      toast.error('Erro ao carregar tickets')
    } finally {
      setLoadingTickets(false)
    }
  }

  const loadProjectTasks = async () => {
    setLoadingTasks(true)
    try {
      const response = await getTasks(projectId)
      const tasksData = response.tasks || response.data || response || []
      setProjectTasks(Array.isArray(tasksData) ? tasksData : [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  // Open modal for associating ticket
  const handleOpenModal = () => {
    setSelectedTicket(null)
    setSelectedTaskId('')
    setSearchTerm('')
    setStatusFilter('')
    setIsModalOpen(true)
    loadAvailableTickets()
    loadProjectTasks()
  }

  // Handle search
  useEffect(() => {
    if (isModalOpen) {
      const debounce = setTimeout(() => {
        loadAvailableTickets()
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [searchTerm, statusFilter, isModalOpen])

  // Handle ticket selection
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket)
  }

  // Handle link ticket
  const handleLinkTicket = async () => {
    if (!selectedTicket) {
      toast.error('Selecione um ticket para associar')
      return
    }

    setSaving(true)
    try {
      await linkTicket(projectId, selectedTicket.id, selectedTaskId || null)
      toast.success('Ticket associado com sucesso')
      setIsModalOpen(false)
      loadLinkedTickets()
      if (onTicketsChange) onTicketsChange()
    } catch (error) {
      console.error('Erro ao associar ticket:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao associar ticket'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Handle unlink ticket
  const handleUnlinkTicket = async (ticketAssociation) => {
    const ticketId = ticketAssociation.ticketId || ticketAssociation.ticket?.id || ticketAssociation.id
    const ticketCode = ticketAssociation.ticket?.code || ticketAssociation.code || `#${ticketId.slice(0, 8)}`
    
    const confirmed = await confirmDelete(
      'Desassociar Ticket?',
      `Tem certeza que deseja remover a associação do ticket "${ticketCode}" deste projeto?`
    )

    if (!confirmed) return

    try {
      await unlinkTicket(projectId, ticketId)
      toast.success('Ticket desassociado com sucesso')
      const updatedTickets = linkedTickets.filter(t => 
        (t.ticketId || t.ticket?.id || t.id) !== ticketId
      )
      setLinkedTickets(updatedTickets)
      if (onTicketsChange) onTicketsChange()
    } catch (error) {
      console.error('Erro ao desassociar ticket:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao desassociar ticket'
      toast.error(errorMessage)
    }
  }

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { label: 'Aberto', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: AlertCircle },
      in_progress: { label: 'Em Progresso', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
      pending: { label: 'Pendente', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: Clock },
      resolved: { label: 'Resolvido', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
      closed: { label: 'Fechado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: CheckCircle2 }
    }
    
    const config = statusConfig[status] || statusConfig.open
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      medium: { label: 'Média', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
      critical: { label: 'Crítica', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
    }
    
    const config = priorityConfig[priority] || priorityConfig.medium
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
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
          <h3 className="text-lg font-semibold">Tickets Associados</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerir tickets associados ao projeto
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Associar Ticket
        </button>
      </div>

      {/* Linked Tickets List */}
      {linkedTickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum ticket associado</p>
          <button
            onClick={handleOpenModal}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Associar primeiro ticket
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assunto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tarefa
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {linkedTickets.map((association) => {
                  const ticket = association.ticket || association
                  const task = association.task
                  
                  return (
                    <tr key={association.id || ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-primary-500" />
                          <span className="font-medium text-primary-600 dark:text-primary-400">
                            {ticket.code || `#${(ticket.id || '').slice(0, 8)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium truncate max-w-xs" title={ticket.subject || ticket.title}>
                          {ticket.subject || ticket.title || 'Sem assunto'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-4 py-4">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="px-4 py-4">
                        {task ? (
                          <div className="flex items-center gap-2 text-sm">
                            <ListTodo className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[150px]" title={task.title}>
                              {task.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/tickets/${ticket.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Ver ticket"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleUnlinkTicket(association)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Desassociar ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Associate Ticket Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Link2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold">Associar Ticket ao Projeto</h2>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar tickets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white appearance-none"
                >
                  <option value="">Todos os status</option>
                  <option value="open">Aberto</option>
                  <option value="in_progress">Em Progresso</option>
                  <option value="pending">Pendente</option>
                  <option value="resolved">Resolvido</option>
                  <option value="closed">Fechado</option>
                </select>
              </div>
            </div>

            {/* Selected Ticket */}
            {selectedTicket && (
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <div>
                      <p className="font-medium text-primary-700 dark:text-primary-300">
                        {selectedTicket.code || `#${selectedTicket.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-primary-600 dark:text-primary-400">
                        {selectedTicket.subject || selectedTicket.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Available Tickets List */}
            {!selectedTicket && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {loadingTickets ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">A carregar tickets...</p>
                    </div>
                  ) : availableTickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum ticket disponível</p>
                      <p className="text-sm mt-1">Todos os tickets já estão associados ou não há tickets que correspondam à pesquisa</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {availableTickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => handleSelectTicket(ticket)}
                          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Ticket className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-primary-600 dark:text-primary-400">
                                    {ticket.code || `#${ticket.id.slice(0, 8)}`}
                                  </span>
                                  {getStatusBadge(ticket.status)}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
                                  {ticket.subject || ticket.title || 'Sem assunto'}
                                </p>
                              </div>
                            </div>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task Selection (Optional) */}
            {selectedTicket && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Associar a uma tarefa específica (opcional)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  disabled={loadingTasks}
                >
                  <option value="">Apenas ao projeto (sem tarefa específica)</option>
                  {projectTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} {task.phase?.name ? `(${task.phase.name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Pode associar o ticket diretamente ao projeto ou a uma tarefa específica
                </p>
              </div>
            )}
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
              onClick={handleLinkTicket}
              disabled={saving || !selectedTicket}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  A associar...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Associar Ticket
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

TicketAssociation.propTypes = {
  projectId: PropTypes.string.isRequired,
  onTicketsChange: PropTypes.func
}

export default TicketAssociation
