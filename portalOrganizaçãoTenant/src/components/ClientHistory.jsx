import { useState, useEffect } from 'react';
import { Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const ClientHistory = ({ userId, currentTicketId }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get(`/users/${userId}/tickets/history`, {
        params: {
          limit: 5,
          excludeTicketId: currentTicketId
        }
      });
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'aberto': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'em-progresso': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'resolvido': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'fechado': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'cancelado': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || colors['aberto'];
  };

  const getStatusLabel = (status) => {
    const labels = {
      'aberto': 'Aberto',
      'em-progresso': 'Em Progresso',
      'resolvido': 'Resolvido',
      'fechado': 'Fechado',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'baixa': 'text-gray-500',
      'media': 'text-blue-500',
      'alta': 'text-orange-500',
      'critica': 'text-red-500'
    };
    return colors[priority] || colors['media'];
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Histórico
        </h3>
        <p className="text-sm text-gray-500 text-center py-4">Carregando...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Histórico
        </h3>
        <p className="text-sm text-gray-500 text-center py-4">
          Sem tickets anteriores
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Histórico ({tickets.length})
      </h3>
      
      <div className="space-y-2">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                {ticket.ticketNumber}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
              {ticket.subject}
            </p>
            
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
              
              <AlertCircle className={`w-3 h-3 ${getPriorityColor(ticket.priority)}`} />
              
              <span className="text-gray-500">
                {format(new Date(ticket.createdAt), 'dd/MM/yy', { locale: pt })}
              </span>
            </div>

            {ticket.category && (
              <p className="text-xs text-gray-500 mt-1">
                {ticket.category.name}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClientHistory;
