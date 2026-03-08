import { useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo', color: 'blue', icon: '🆕' },
  { value: 'em_progresso', label: 'Em Progresso', color: 'yellow', icon: '⏳' },
  { value: 'aguardando_cliente', label: 'Aguardando Cliente', color: 'purple', icon: '⏸️' },
  { value: 'resolvido', label: 'Resolvido', color: 'green', icon: '✅' },
  { value: 'fechado', label: 'Fechado', color: 'gray', icon: '🔒' }
]

const StatusManager = ({ ticketId, currentStatus, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || 'novo')
  const [updating, setUpdating] = useState(false)

  const handleStartService = async () => {
    setUpdating(true)
    try {
      await api.patch(`/tickets/${ticketId}`, {
        status: 'em_progresso'
      })

      toast.success('Atendimento iniciado com sucesso')
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error)
      toast.error(error.response?.data?.error || 'Erro ao iniciar atendimento')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus) {
      toast.error('Selecione um status diferente')
      return
    }

    setUpdating(true)
    try {
      await api.patch(`/tickets/${ticketId}`, {
        status: selectedStatus
      })

      toast.success('Status atualizado com sucesso')
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error(error.response?.data?.error || 'Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.color || 'gray'
  }

  const getCurrentStatusLabel = () => {
    const option = STATUS_OPTIONS.find(opt => opt.value === currentStatus)
    return option ? `${option.icon} ${option.label}` : currentStatus
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg bg-${getStatusColor(currentStatus)}-100 dark:bg-${getStatusColor(currentStatus)}-900/20 flex items-center justify-center`}>
          <AlertCircle className={`w-5 h-5 text-${getStatusColor(currentStatus)}-600 dark:text-${getStatusColor(currentStatus)}-400`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Status do Ticket
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Status atual: <span className="font-medium">{getCurrentStatusLabel()}</span>
          </p>
        </div>
      </div>

      {currentStatus === 'novo' && (
        <button
          onClick={handleStartService}
          disabled={updating}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-4 font-semibold text-base"
        >
          {updating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              🚀 Iniciar Atendimento
            </>
          )}
        </button>
      )}

      <div className="space-y-3 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Alterar Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.icon} {status.label}
            </option>
          ))}
        </select>
      </div>

      {selectedStatus !== currentStatus && (
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Atualizar Status
            </>
          )}
        </button>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          ℹ️ <strong>Nota:</strong> Alterar o status do ticket irá notificar o cliente e o responsável.
          {selectedStatus === 'fechado' && ' Tickets fechados não podem receber comentários.'}
          {selectedStatus === 'resolvido' && ' Tickets resolvidos aguardam confirmação do cliente.'}
        </p>
      </div>
    </div>
  )
}

export default StatusManager
