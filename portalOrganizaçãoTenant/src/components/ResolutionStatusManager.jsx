import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ResolutionStatusManager = ({ ticketId, currentStatus, onUpdate }) => {
  const [status, setStatus] = useState(currentStatus || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const statusOptions = [
    { value: '', label: 'Não definido', color: 'gray', icon: '⚪' },
    { value: 'pendente', label: 'Pendente', color: 'gray', icon: '⏳' },
    { value: 'em_analise', label: 'Em Análise', color: 'blue', icon: '🔍' },
    { value: 'aguardando_terceiro', label: 'Aguardando Terceiro', color: 'yellow', icon: '⏰' },
    { value: 'solucao_proposta', label: 'Solução Proposta', color: 'purple', icon: '💡' },
    { value: 'resolvido', label: 'Resolvido', color: 'green', icon: '✅' },
    { value: 'nao_resolvido', label: 'Não Resolvido', color: 'red', icon: '❌' },
    { value: 'workaround', label: 'Workaround', color: 'orange', icon: '🔧' }
  ];

  const currentOption = statusOptions.find(opt => opt.value === status) || statusOptions[0];

  const getStatusColor = (color) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700',
      red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300 dark:border-orange-700'
    };
    return colors[color] || colors.gray;
  };

  const handleUpdate = async () => {
    if (status === currentStatus && !notes.trim()) {
      toast.error('Nenhuma alteração detectada');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/tickets/${ticketId}/resolution-status`, {
        resolutionStatus: status || null,
        notes: notes.trim()
      });
      
      toast.success('Estado de resolução atualizado');
      onUpdate?.();
      setNotes('');
      setShowNotes(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold">Estado de Resolução</h3>
      </div>

      {/* Current Status Display */}
      <div className={`p-3 rounded-lg border-2 mb-3 ${getStatusColor(currentOption.color)}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentOption.icon}</span>
          <div>
            <p className="font-medium">{currentOption.label}</p>
            <p className="text-xs opacity-75">Estado atual da resolução</p>
          </div>
        </div>
      </div>

      {/* Status Selector */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">Alterar Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Notes */}
        {!showNotes && (
          <button
            onClick={() => setShowNotes(true)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            Adicionar observações
          </button>
        )}

        {/* Notes Input */}
        {showNotes && (
          <div>
            <label className="block text-sm font-medium mb-2">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Adicione detalhes sobre a resolução..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          </div>
        )}

        {/* Update Button */}
        <button
          onClick={handleUpdate}
          disabled={loading || (status === currentStatus && !notes.trim())}
          className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            'Atualizando...'
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Atualizar Estado
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
        💡 O estado de resolução é independente do status do ticket e ajuda a rastrear o progresso da solução.
      </div>
    </div>
  );
};

export default ResolutionStatusManager;
