import { useState, useEffect } from 'react'
import { Clock, User } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const TimeHistory = ({ ticketId }) => {
  const [timers, setTimers] = useState([])
  const [totalHours, setTotalHours] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimers()
  }, [ticketId])

  const loadTimers = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/tickets/${ticketId}/timers`)
      setTimers(response.data.timers || [])
      setTotalHours(response.data.totalHours || 0)
    } catch (error) {
      console.error('Erro ao carregar histórico de tempo:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hrs}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  if (timers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum tempo registrado ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tempo Total Registrado
          </span>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {totalHours}h
          </span>
        </div>
      </div>

      {/* Lista de timers */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Histórico</h4>
        {timers.map((timer) => (
          <div
            key={timer.id}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {timer.user?.name || 'Usuário'}
                  </span>
                  {timer.status === 'stopped' && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      Concluído
                    </span>
                  )}
                  {timer.status === 'running' && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      Em execução
                    </span>
                  )}
                  {timer.status === 'paused' && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                      Pausado
                    </span>
                  )}
                  {timer.autoConsumed && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                      Auto-consumido
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    Início: {format(new Date(timer.startTime), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                  </div>
                  {timer.endTime && (
                    <div>
                      Fim: {format(new Date(timer.endTime), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                    </div>
                  )}
                  {timer.description && (
                    <div className="mt-1 italic">{timer.description}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatDuration(timer.totalSeconds)}
                </div>
                {timer.totalPausedTime > 0 && (
                  <div className="text-xs text-gray-500">
                    {formatDuration(timer.totalPausedTime)} pausado
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TimeHistory
