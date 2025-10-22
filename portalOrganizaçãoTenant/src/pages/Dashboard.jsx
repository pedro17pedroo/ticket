import { useEffect, useState } from 'react'
import { ticketService } from '../services/api'
import { Ticket, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const data = await ticketService.getStatistics()
      setStats(data.statistics)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total de Tickets',
      value: stats?.total || 0,
      icon: Ticket,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Em Progresso',
      value: stats?.byStatus?.emProgresso || 0,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Resolvidos',
      value: stats?.byStatus?.resolvido || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Novos',
      value: stats?.byStatus?.novo || 0,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  const chartData = stats ? [
    { name: 'Novo', valor: stats.byStatus.novo },
    { name: 'Em Progresso', valor: stats.byStatus.emProgresso },
    { name: 'Aguardando', valor: stats.byStatus.aguardandoCliente },
    { name: 'Resolvido', valor: stats.byStatus.resolvido },
    { name: 'Fechado', valor: stats.byStatus.fechado },
  ] : []

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
          Visão geral do sistema de tickets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-6">Tickets por Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis 
              dataKey="name" 
              className="text-sm"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis tick={{ fill: 'currentColor' }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--tw-bg-opacity)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
            <Ticket className="w-6 h-6 text-primary-600 dark:text-primary-400 mb-2" />
            <p className="font-medium">Novo Ticket</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Criar um novo ticket</p>
          </button>
          <button className="p-4 text-left border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
            <CheckCircle className="w-6 h-6 text-primary-600 dark:text-primary-400 mb-2" />
            <p className="font-medium">Tickets Pendentes</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ver tickets não atribuídos</p>
          </button>
          <button className="p-4 text-left border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
            <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400 mb-2" />
            <p className="font-medium">Relatórios</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ver relatórios detalhados</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
