import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  Loader2,
  Filter
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MyRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await api.get('/catalog/requests', { params });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar suas solicitações');
    } finally {
      setLoading(false);
    }
  };


  // Status configs
  const statusConfig = {
    pending_approval: {
      label: 'Aguardando Aprovação',
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600'
    },
    approved: {
      label: 'Aprovado',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600'
    },
    rejected: {
      label: 'Rejeitado',
      icon: XCircle,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600'
    },
    in_progress: {
      label: 'Em Andamento',
      icon: Clock,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600'
    },
    completed: {
      label: 'Concluído',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600'
    },
    cancelled: {
      label: 'Cancelado',
      icon: XCircle,
      color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
      iconColor: 'text-gray-600'
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Acompanhe o status de suas solicitações de serviço
          </p>
        </div>

        <button
          onClick={() => navigate('/service-catalog')}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          Nova Solicitação
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            filterStatus === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todas ({requests.length})
        </button>

        {Object.entries(statusConfig).map(([status, config]) => {
          const count = requests.filter(r => r.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                filterStatus === status
                  ? config.color
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <config.icon className="w-4 h-4" />
              {config.label}
              {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma solicitação encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filterStatus !== 'all' 
              ? 'Não há solicitações com este status'
              : 'Você ainda não fez nenhuma solicitação de serviço'
            }
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => navigate('/service-catalog')}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Fazer Primeira Solicitação
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const config = statusConfig[request.status] || statusConfig.in_progress;
            const StatusIcon = config.icon;

            return (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl">
                          {request.catalogItem?.icon || '📋'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {request.catalogItem?.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            SR #{request.id?.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      {/* Metadados */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(request.createdAt)}
                        </div>

                        {request.ticketId && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Ticket #{request.ticketId.slice(0, 8)}
                            {request.ticket?.status && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                {request.ticket.status}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${config.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium text-sm">{config.label}</span>
                    </div>
                  </div>

                  {/* Approval info */}
                  {request.status === 'approved' && request.approvalComments && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                        ✓ Aprovado
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {request.approvalComments}
                      </p>
                    </div>
                  )}

                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                        ✗ Rejeitado
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {request.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {request.ticketId && (
                      <button
                        onClick={() => navigate(`/tickets/${request.ticketId}`)}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default MyRequests;
