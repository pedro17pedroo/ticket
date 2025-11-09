import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  FileText,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const CatalogApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending_approval');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve');
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = { status: filterStatus };
      const response = await api.get('/catalog/requests', { params });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
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
      toast.error('Erro ao carregar detalhes');
    }
  };

  const handleApprovalClick = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setApprovalComments('');
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!approvalComments.trim() && approvalAction === 'reject') {
      toast.error('Por favor, forneça um motivo para a rejeição');
      return;
    }

    try {
      const endpoint = `/catalog/requests/${selectedRequest.id}/${approvalAction}`;
      await api.post(endpoint, {
        comments: approvalComments
      });

      toast.success(
        approvalAction === 'approve' 
          ? 'Solicitação aprovada com sucesso!' 
          : 'Solicitação rejeitada'
      );

      setShowApprovalModal(false);
      setApprovalComments('');
      loadRequests();
    } catch (error) {
      console.error('Erro ao processar aprovação:', error);
      toast.error(error.response?.data?.error || 'Erro ao processar aprovação');
    }
  };

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
      <div>
        <h1 className="text-3xl font-bold">Aprovações de Solicitações</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gerencie as aprovações de solicitações de serviço
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold mt-1">{requests.length}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-700 dark:text-yellow-400">Pendentes</div>
          <div className="text-2xl font-bold mt-1 text-yellow-700 dark:text-yellow-400">
            {requests.filter(r => r.status === 'pending_approval').length}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-400">Aprovados</div>
          <div className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">
            {requests.filter(r => r.status === 'approved').length}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-400">Rejeitados</div>
          <div className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">
            {requests.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              filterStatus === status
                ? config.color
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <config.icon className="w-4 h-4" />
            {config.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Clock className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma solicitação encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Não há solicitações {statusConfig[filterStatus]?.label.toLowerCase()}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const config = statusConfig[request.status] || statusConfig.pending_approval;
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

                      {/* Requester */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {request.requester?.name || 'Desconhecido'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(request.createdAt)}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="font-medium text-sm">{config.label}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => loadRequestDetails(request.id)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes
                      </button>

                      {request.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApprovalClick(request, 'approve')}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleApprovalClick(request, 'reject')}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Approval/Rejection info */}
                  {request.status === 'approved' && request.approvalComments && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-green-800 dark:text-green-300">
                          Aprovado por {request.approvedBy?.name}
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                          {request.approvalComments}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-red-800 dark:text-red-300">
                          Rejeitado por {request.rejectedBy?.name}
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                          {request.rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Modal */}
      <Modal isOpen={showApprovalModal} onClose={() => { setShowApprovalModal(false); setSelectedRequest(null); setApprovalAction(null); setApprovalComment(''); }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold">
                {approvalAction === 'approve' ? 'Aprovar' : 'Rejeitar'} Solicitação
              </h2>
            </div>

            {selectedRequest && (
              <>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-2xl">{selectedRequest.catalogItem?.icon}</div>
                    <div>
                      <div className="font-semibold">{selectedRequest.catalogItem?.name}</div>
                      <div className="text-sm text-gray-500">
                        Solicitado por {selectedRequest.requester?.name}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {approvalAction === 'approve' ? 'Comentários (opcional)' : 'Motivo da Rejeição *'}
                    </label>
                    <textarea
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      required={approvalAction === 'reject'}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                      placeholder={
                        approvalAction === 'approve'
                          ? 'Adicione comentários sobre a aprovação...'
                          : 'Por favor, explique o motivo da rejeição...'
                      }
                    />
                  </div>

                  {approvalAction === 'approve' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Ao aprovar, um ticket será criado automaticamente e roteado conforme configurado.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitApproval}
                  className={`flex-1 px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 ${
                    approvalAction === 'approve'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {approvalAction === 'approve' ? (
                    <>
                      <ThumbsUp className="w-5 h-5" />
                      Aprovar
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="w-5 h-5" />
                      Rejeitar
                    </>
                  )}
                </button>
                </div>
              </>
            )}
          </div>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedRequest(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {selectedRequest && (
              <>
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
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status */}
                  <div>
                    <h3 className="font-semibold mb-2">Status</h3>
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

              {/* Solicitante */}
              <div>
                <h3 className="font-semibold mb-2">Solicitante</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <User className="w-10 h-10 p-2 bg-gray-200 dark:bg-gray-600 rounded-full" />
                  <div>
                    <div className="font-medium">{selectedRequest.requester?.name}</div>
                    <div className="text-sm text-gray-500">{selectedRequest.requester?.email}</div>
                  </div>
                </div>
              </div>

              {/* Dados Preenchidos */}
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
              </>
            )}
          </div>
      </Modal>
    </div>
  );
};

export default CatalogApprovals;
