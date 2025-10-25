import { useState, useEffect } from 'react';
import { History, User as UserIcon, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const TicketHistoryPanel = ({ ticketId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [ticketId]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/history`);
      setHistory(data.history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      created: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      transferred: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      priority_updated: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      resolution_updated: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'
    };
    return colors[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const getActionLabel = (action) => {
    const labels = {
      created: 'Criado',
      updated: 'Atualizado',
      transferred: 'Transferido',
      priority_updated: 'Prioridade',
      resolution_updated: 'Resolução'
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico
        </h3>
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  const visibleHistory = expanded ? history : history.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico ({history.length})
        </h3>
        {history.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            {expanded ? (
              <>
                Mostrar menos <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Mostrar todos <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhum histórico disponível
        </p>
      ) : (
        <div className="space-y-3">
          {visibleHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {entry.user?.avatar ? (
                  <img
                    src={entry.user.avatar}
                    alt={entry.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {entry.user?.name || 'Sistema'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getActionColor(entry.action)}`}>
                    {getActionLabel(entry.action)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {entry.description}
                </p>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(entry.createdAt), { 
                    addSuffix: true, 
                    locale: pt 
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketHistoryPanel;
