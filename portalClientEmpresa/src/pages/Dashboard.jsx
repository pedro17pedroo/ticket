import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ShoppingBag, Clock, CheckCircle, Plus, AlertCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const Dashboard = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const response = await api.get('/catalog/requests', { params: { limit: 5 } })
      setRequests(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: requests.length,
    pendentes: requests.filter(r => r.status === 'pending_approval').length,
    aprovadas: requests.filter(r => ['approved', 'in_progress', 'completed'].includes(r.status)).length,
    rejeitadas: requests.filter(r => r.status === 'rejected').length,
  }

  const statCards = [
    {
      title: 'Total de Solicitações',
      value: stats.total,
      icon: ShoppingBag,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Aguardando Aprovação',
      value: stats.pendentes,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Aprovadas',
      value: stats.aprovadas,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Rejeitadas',
      value: stats.rejeitadas,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ]

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
          Visão geral das suas solicitações
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
            onClick={() => navigate('/service-catalog')}
            className="p-6 text-left border-2 border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors group"
          >
            <Plus className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-lg">Nova Solicitação</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Fazer uma solicitação através do catálogo de serviços
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

      {/* Recent Requests */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">Solicitações Recentes</h2>
          <button
            onClick={() => navigate('/my-requests')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Ver todas
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Você ainda não fez nenhuma solicitação
            </p>
            <button
              onClick={() => navigate('/service-catalog')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Fazer Primeira Solicitação
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.slice(0, 5).map((request) => {
              const statusConfig = {
                pending_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
                approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
                rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
                in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
                completed: { label: 'Concluído', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
                cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
              };
              const status = statusConfig[request.status] || statusConfig.in_progress;
              
              return (
              <button
                key={request.id}
                onClick={() => navigate('/my-requests')}
                className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1 truncate">{request.catalogItem?.name || 'Solicitação'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.createdAt 
                        ? `Criado em ${format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}`
                        : 'Data não disponível'
                      }
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{request.catalogItem?.icon || '📋'}</span>
                  </div>
                </div>
              </button>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
