import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Clock } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const Timer = ({ ticketId, onTimeLogged }) => {
  const [timer, setTimer] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    loadActiveTimer()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [ticketId])

  useEffect(() => {
    if (timer && timer.status === 'running') {
      startInterval()
    } else {
      stopInterval()
    }
    return () => stopInterval()
  }, [timer])

  const loadActiveTimer = async () => {
    try {
      const response = await api.get(`/tickets/${ticketId}/timer/active`)
      if (response.data.timer) {
        setTimer(response.data.timer)
        calculateElapsed(response.data.timer)
      }
    } catch (error) {
      console.error('Erro ao carregar timer:', error)
    }
  }

  const calculateElapsed = (timerData) => {
    const start = new Date(timerData.startTime)
    const now = new Date()
    let elapsed = Math.floor((now - start) / 1000)
    
    // Subtrair tempo pausado
    elapsed -= timerData.totalPausedTime || 0
    
    // Se estiver pausado, subtrair tempo desde a pausa
    if (timerData.status === 'paused' && timerData.pausedAt) {
      const pausedTime = Math.floor((now - new Date(timerData.pausedAt)) / 1000)
      elapsed -= pausedTime
    }
    
    setElapsed(Math.max(0, elapsed))
  }

  const startInterval = () => {
    stopInterval()
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
  }

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const handleStart = async () => {
    setIsLoading(true)
    try {
      const response = await api.post(`/tickets/${ticketId}/timer/start`, {
        description: 'Tempo de trabalho'
      })
      setTimer(response.data.timer)
      setElapsed(0)
      toast.success('Cronômetro iniciado!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao iniciar cronômetro')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = async () => {
    setIsLoading(true)
    try {
      const response = await api.put(`/timers/${timer.id}/pause`)
      setTimer(response.data.timer)
      toast.success('Cronômetro pausado')
    } catch (error) {
      toast.error('Erro ao pausar cronômetro')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResume = async () => {
    setIsLoading(true)
    try {
      const response = await api.put(`/timers/${timer.id}/resume`)
      setTimer(response.data.timer)
      toast.success('Cronômetro retomado')
    } catch (error) {
      toast.error('Erro ao retomar cronômetro')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    setIsLoading(true)
    try {
      const response = await api.put(`/timers/${timer.id}/stop`)
      toast.success(`Tempo registrado: ${response.data.totalHours}h`)
      setTimer(null)
      setElapsed(0)
      if (onTimeLogged) {
        onTimeLogged(response.data.totalHours)
      }
    } catch (error) {
      toast.error('Erro ao parar cronômetro')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary-600" />
          <div>
            <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
              {formatTime(elapsed)}
            </div>
            <div className="text-xs text-gray-500">
              {!timer && 'Timer parado'}
              {timer?.status === 'running' && '⏱️ Em execução'}
              {timer?.status === 'paused' && '⏸️ Pausado'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!timer && (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              title="Iniciar"
            >
              <Play className="w-5 h-5" />
            </button>
          )}

          {timer?.status === 'running' && (
            <>
              <button
                onClick={handlePause}
                disabled={isLoading}
                className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Pausar"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                onClick={handleStop}
                disabled={isLoading}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Parar"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          )}

          {timer?.status === 'paused' && (
            <>
              <button
                onClick={handleResume}
                disabled={isLoading}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Retomar"
              >
                <Play className="w-5 h-5" />
              </button>
              <button
                onClick={handleStop}
                disabled={isLoading}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Parar"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Timer
