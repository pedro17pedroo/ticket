import { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown, History, Eye, Calendar, AlertCircle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const HoursBank = () => {
  const [hoursBanks, setHoursBanks] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBank, setSelectedBank] = useState(null)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/client/hours-banks')
      setHoursBanks(response.data.hoursBanks || [])
      setSummary(response.data.summary || null)
    } catch (error) {
      console.error('Erro ao carregar bolsas de horas:', error)
      toast.error('Erro ao carregar bolsas de horas')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (bankId) => {
    try {
      const response = await api.get(`/client/hours-banks/${bankId}/transactions`)
      setTransactions(response.data.transactions || [])
      setShowTransactionsModal(true)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      toast.error('Erro ao carregar histórico')
    }
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'adicao':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'consumo':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'ajuste':
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  const getTransactionLabel = (type) => {
    const labels = {
      adicao: 'Adição',
      consumo: 'Consumo',
      ajuste: 'Ajuste'
    }
    return labels[type] || type
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bolsa de Horas</h1>
        <p className="text-gray-600 dark:text-gray-400">Acompanhe suas horas de suporte</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Disponível</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{parseFloat(summary.totalAvailable).toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Consumido</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{parseFloat(summary.totalUsed).toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Contratado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{parseFloat(summary.totalHours).toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pacotes Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banks List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pacotes de Horas</h2>
        
        {hoursBanks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Nenhuma bolsa de horas ativa no momento</p>
          </div>
        ) : (
          hoursBanks.map((bank) => {
            const available = parseFloat(bank.totalHours) - parseFloat(bank.usedHours)
            const percentage = (parseFloat(bank.usedHours) / parseFloat(bank.totalHours)) * 100

            return (
              <div
                key={bank.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {bank.packageType || 'Pacote de Horas'}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                        Ativa
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      {bank.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Início: {format(new Date(bank.startDate), 'dd/MM/yyyy', { locale: pt })}
                        </span>
                      )}
                      {bank.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Fim: {format(new Date(bank.endDate), 'dd/MM/yyyy', { locale: pt })}
                        </span>
                      )}
                      {bank.allowNegativeBalance && (
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          💳 Permite crédito
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBank(bank)
                      loadTransactions(bank.id)
                    }}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                    title="Ver histórico"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{available.toFixed(1)}h</span> disponíveis
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {bank.usedHours}h / {bank.totalHours}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {bank.notes && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                    {bank.notes}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Transactions Modal */}
      {showTransactionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Histórico de Transações
              </h2>
              <button
                onClick={() => setShowTransactionsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {selectedBank && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">{selectedBank.packageType || 'Pacote de Horas'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {parseFloat(selectedBank.totalHours) - parseFloat(selectedBank.usedHours)}h disponíveis de {selectedBank.totalHours}h
                </p>
              </div>
            )}

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                  Nenhuma transação registrada
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getTransactionIcon(transaction.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${
                              transaction.type === 'adicao' ? 'text-green-600' :
                              transaction.type === 'consumo' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {getTransactionLabel(transaction.type)}
                            </span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {transaction.type === 'adicao' ? '+' : '-'}{transaction.hours}h
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                            {transaction.performedBy && ` • por ${transaction.performedBy.name}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HoursBank
