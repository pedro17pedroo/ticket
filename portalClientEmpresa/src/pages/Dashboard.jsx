import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ticketService } from '../services/api'
import { Ticket, Clock, CheckCircle, Plus, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const Dashboard = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      const data = await ticketService.getMyTickets({ limit: 5 })
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: tickets.length,
    abertos: tickets.filter(t => ['novo', 'em_progresso'].includes(t.status)).length,
    resolvidos: tickets.filter(t => t.status === 'resolvido').length,
    aguardando: tickets.filter(t => t.status === 'aguardando_cliente').length,
  }

  const statCards = [
    {
      title: 'Total de Tickets',
      value: stats.total,
      icon: Ticket,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Em Aberto',
      value: stats.abertos,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Resolvidos',
      value: stats.resolvidos,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Aguardando Resposta',
      value: stats.aguardando,
      icon: AlertCircle,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visão geral dos seus tickets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {card.title}
                </p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/tickets/new')}
            className="p-6 text-left border-2 border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors group"
          >
            <Plus className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-lg">Novo Ticket</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Abrir uma nova solicitação de suporte
            </p>
          </button>
          
          <button
            onClick={() => navigate('/knowledge')}
            className="p-6 text-left border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <CheckCircle className="w-8 h-8 text-gray-400 mb-3" />
            <p className="font-semibold text-lg">Base de Conhecimento</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Encontre respostas para dúvidas comuns
            </p>
          </button>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">Tickets Recentes</h2>
          <button
            onClick={() => navigate('/tickets')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Ver todos
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Você ainda não tem nenhum ticket
            </p>
            <button
              onClick={() => navigate('/tickets/new')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Criar Primeiro Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.slice(0, 5).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {ticket.ticketNumber}
                      </span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <h3 className="font-semibold mb-1 truncate">{ticket.subject}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Criado em {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-right">
                      {ticket.assignee && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Atribuído a: {ticket.assignee.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
