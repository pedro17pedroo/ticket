import { useState, useEffect } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const InternalPriorityManager = ({ ticketId, clientPriority, internalPriority, catalogItemPriority, onUpdate }) => {
  const [priority, setPriority] = useState(internalPriority || '');
  const [priorities, setPriorities] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReason, setShowReason] = useState(false);

  useEffect(() => {
    loadPriorities();
  }, []);

  const loadPriorities = async () => {
    try {
      const { data } = await api.get('/priorities');
      setPriorities(data.priorities || []);
    } catch (error) {
      console.error('Erro ao carregar prioridades:', error);
    }
  };

  const getPriorityColor = (priorityName) => {
    const colors = {
      'baixa': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'media': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'média': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'alta': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      'critica': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'crítica': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    };
    return colors[priorityName?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const handleUpdate = async () => {
    if (priority === internalPriority && !reason.trim()) {
      toast.error('Nenhuma alteração detectada');
      return;
    }

    if (priority !== internalPriority && !reason.trim()) {
      toast.error('Por favor, informe o motivo da alteração');
      setShowReason(true);
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/tickets/${ticketId}/internal-priority`, {
        internalPriority: priority,
        reason: reason.trim()
      });
      
      toast.success('Prioridade interna atualizada');
      onUpdate?.();
      setReason('');
      setShowReason(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar prioridade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flag className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold">Prioridades</h3>
      </div>

      {/* Catalog Item Priority */}
      {catalogItemPriority && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
            📦 Prioridade do Item/Serviço
          </label>
          <div className={`px-3 py-2 rounded-lg ${getPriorityColor(catalogItemPriority)}`}>
            <span className="font-medium">{catalogItemPriority}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Prioridade definida no catálogo para este serviço
          </p>
        </div>
      )}

      {/* Client Priority */}
      <div className="mb-3">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
          👤 Prioridade do Cliente
        </label>
        <div className={`px-3 py-2 rounded-lg ${getPriorityColor(clientPriority)}`}>
          <span className="font-medium">{clientPriority || 'Não definida'}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Prioridade selecionada pelo cliente ao criar o ticket
        </p>
      </div>

      {/* Internal Priority */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Prioridade Interna da Organização
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          >
            <option value="">Usar prioridade do cliente</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Warning if different */}
        {priority && priority !== clientPriority && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              A prioridade interna está diferente da prioridade do cliente. 
              Certifique-se de documentar o motivo.
            </span>
          </div>
        )}

        {/* Toggle Reason */}
        {!showReason && priority !== internalPriority && (
          <button
            onClick={() => setShowReason(true)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <AlertTriangle className="w-4 h-4" />
            {priority ? 'Adicionar motivo (obrigatório)' : 'Adicionar observação'}
          </button>
        )}

        {/* Reason Input */}
        {showReason && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Motivo da Alteração {priority !== internalPriority && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              required={priority !== internalPriority}
              placeholder="Explique por que a prioridade interna é diferente..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          </div>
        )}

        {/* Update Button */}
        <button
          onClick={handleUpdate}
          disabled={loading || (priority === internalPriority && !reason.trim())}
          className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            'Atualizando...'
          ) : (
            <>
              <Flag className="w-4 h-4" />
              Atualizar Prioridade
            </>
          )}
        </button>
      </div>

      {/* Current Internal Priority Display */}
      {internalPriority && internalPriority !== clientPriority && (
        <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
          <p className="text-purple-700 dark:text-purple-300 font-medium mb-1">
            ⚡ Prioridade Interna Ativa:
          </p>
          <div className={`inline-block px-2 py-1 rounded ${getPriorityColor(internalPriority)}`}>
            {internalPriority}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
        💡 A prioridade interna permite que a organização ajuste a urgência do ticket sem alterar a prioridade definida pelo cliente.
      </div>
    </div>
  );
};

export default InternalPriorityManager;
