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
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const loadRequestDetails = async (requestId) => {
    try {
      const response = await api.get(`/catalog/requests/${requestId}`);
      setSelectedRequest(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Erro ao carregar detalhes da solicitação');
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
                        <div className="text-2xl">{request.catalogItem?.icon}</div>
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
                    <button
                      onClick={() => loadRequestDetails(request.id)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalhes
                    </button>

                    {request.ticketId && (
                      <button
                        onClick={() => navigate(`/tickets/${request.ticketId}`)}
                        className="px-4 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/30 rounded-lg flex items-center gap-2 transition-colors"
                      >
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

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedRequest.catalogItem?.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedRequest.catalogItem?.name}</h2>
                    <p className="text-sm text-gray-500">SR #{selectedRequest.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="font-semibold mb-2">Status Atual</h3>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  statusConfig[selectedRequest.status].color
                }`}>
                  {React.createElement(statusConfig[selectedRequest.status].icon, {
                    className: 'w-5 h-5'
                  })}
                  <span className="font-medium">
                    {statusConfig[selectedRequest.status].label}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Linha do Tempo</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                    <div>
                      <div className="font-medium">Solicitação Criada</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(selectedRequest.createdAt)}
                      </div>
                    </div>
                  </div>

                  {selectedRequest.approvalDate && (
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 mt-2 rounded-full ${
                        selectedRequest.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="font-medium">
                          {selectedRequest.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(selectedRequest.approvalDate)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados preenchidos */}
              {selectedRequest.formDataDisplay && (
                <div>
                  <h3 className="font-semibold mb-3">Informações Fornecidas</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    {Object.entries(selectedRequest.formDataDisplay).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="font-medium">
                          {Array.isArray(value) ? value.join(', ') : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
