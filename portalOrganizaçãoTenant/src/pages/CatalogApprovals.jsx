import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  X,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  FileText,
  MessageSquare,
  AlertTriangle,
  List,
  Package
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const CatalogApprovals = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Helper para renderizar ícone
  const renderIcon = (iconValue, className = "w-6 h-6") => {
    // Se for emoji (unicode), renderiza o emoji
    if (iconValue && /\p{Emoji}/u.test(iconValue) && iconValue.length <= 4) {
      return <span className="text-2xl">{iconValue}</span>;
    }
    // Se não for emoji ou for texto como "Box", usa ícone Package
    return <Package className={className} />;
  };
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve');
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);
  
  // Filtrar solicitações baseado no filtro selecionado
  const requests = allRequests.filter(r => r.status === filterStatus);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Carregar TODAS as solicitações sem filtro
      const response = await api.get('/catalog/requests');
      setAllRequests(response.data.data || []);
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
      const endpoint = `/catalog/requests/${selectedRequest.id}/approve`;
      await api.post(endpoint, {
        approved: approvalAction === 'approve',
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
    pending: {
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
          <div className="text-2xl font-bold mt-1">{allRequests.length}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-700 dark:text-yellow-400">Pendentes</div>
          <div className="text-2xl font-bold mt-1 text-yellow-700 dark:text-yellow-400">
            {allRequests.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-400">Aprovados</div>
          <div className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">
            {allRequests.filter(r => r.status === 'approved').length}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-400">Rejeitados</div>
          <div className="text-2xl font-bold mt-1 text-red-700 dark:text-red-400">
            {allRequests.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = allRequests.filter(r => r.status === status).length;
          return (
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
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                filterStatus === status
                  ? 'bg-white/20'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
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
            const config = statusConfig[request.status] || statusConfig.pending;
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
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          {renderIcon(request.catalogItem?.icon)}
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

                      {request.status === 'pending' && (
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-xl w-full overflow-hidden">
            {selectedRequest && (
              <>
                {/* Header Azul */}
                <div className={`${approvalAction === 'approve' ? 'bg-green-600 dark:bg-green-700' : 'bg-red-600 dark:bg-red-700'} px-6 py-4`}>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      {approvalAction === 'approve' ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <XCircle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {approvalAction === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                      </h2>
                      <p className="text-sm opacity-90">
                        {selectedRequest.catalogItem?.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      {renderIcon(selectedRequest.catalogItem?.icon)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{selectedRequest.catalogItem?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
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
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-2 border border-blue-200 dark:border-blue-800">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Ao aprovar, o ticket associado será atualizado e movido para o estado apropriado conforme o fluxo configurado.
                      </p>
                    </div>
                  )}
                  
                  {approvalAction === 'reject' && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex gap-2 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Ao rejeitar, o ticket será cancelado e o solicitante será notificado.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitApproval}
                    className={`px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2 transition-colors ${
                      approvalAction === 'approve'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {approvalAction === 'approve' ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Aprovar
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {selectedRequest && (
              <>
                {/* Header Azul */}
                <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      {renderIcon(selectedRequest.catalogItem?.icon, "w-6 h-6 text-white")}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedRequest.catalogItem?.name}</h2>
                      <p className="text-sm text-blue-100">SR #{selectedRequest.id?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Conteúdo Scrollável */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status e Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Status</label>
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

                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Data da Solicitação</label>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar className="w-5 h-5" />
                        <span>
                          {new Date(selectedRequest.createdAt || selectedRequest.created_at).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Serviço */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">Informações do Serviço</h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo</div>
                          <div className="font-medium capitalize">
                            {selectedRequest.catalogItem?.itemType === 'incident' && '🚨 Incidente'}
                            {selectedRequest.catalogItem?.itemType === 'service' && '⚙️ Serviço'}
                            {selectedRequest.catalogItem?.itemType === 'support' && '🤝 Suporte'}
                            {selectedRequest.catalogItem?.itemType === 'request' && '📝 Requisição'}
                          </div>
                        </div>
                        {selectedRequest.catalogItem?.estimatedDeliveryTime && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tempo Estimado</div>
                            <div className="font-medium">⏱️ {selectedRequest.catalogItem.estimatedDeliveryTime}h</div>
                          </div>
                        )}
                        {selectedRequest.catalogItem?.estimatedCost && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Custo Estimado</div>
                            <div className="font-medium">💰 €{selectedRequest.catalogItem.estimatedCost}</div>
                          </div>
                        )}
                        {selectedRequest.catalogItem?.requiresApproval && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aprovação</div>
                            <div className="font-medium text-orange-600 dark:text-orange-400">✓ Requerida</div>
                          </div>
                        )}
                      </div>
                      {selectedRequest.catalogItem?.shortDescription && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Descrição</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedRequest.catalogItem.shortDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Solicitante */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">Solicitante</h3>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <User className="w-12 h-12 p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{selectedRequest.requester?.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{selectedRequest.requester?.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Prioridade */}
                  {selectedRequest.finalPriority && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">Prioridade</h3>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                        selectedRequest.finalPriority === 'urgente' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        selectedRequest.finalPriority === 'alta' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                        selectedRequest.finalPriority === 'media' || selectedRequest.finalPriority === 'média' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {selectedRequest.finalPriority.charAt(0).toUpperCase() + selectedRequest.finalPriority.slice(1)}
                      </div>
                    </div>
                  )}

                  {/* Dados Preenchidos */}
                  {selectedRequest.formData && Object.keys(selectedRequest.formData).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <List className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">Informações Adicionais</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-3">
                        {Object.entries(selectedRequest.formData).map(([key, value]) => {
                          // Mapeamento de nomes de campos para português
                          const fieldLabels = {
                            'additionalDetails': 'Detalhes Adicionais',
                            'userPriority': 'Prioridade do Utilizador',
                            'expectedResolutionTime': 'Data de Resolução Esperada',
                            'attachments': 'Anexos'
                          };

                          // Processar valor
                          let displayValue = value;
                          
                          // Remover tags HTML se for string
                          if (typeof displayValue === 'string') {
                            displayValue = displayValue.replace(/<[^>]*>/g, '');
                          }
                          
                          // Formatar data se for expectedResolutionTime
                          if (key === 'expectedResolutionTime' && displayValue) {
                            try {
                              const date = new Date(displayValue);
                              displayValue = date.toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              });
                            } catch (e) {
                              // Manter valor original se não conseguir parsear
                            }
                          }
                          
                          // Não mostrar attachments se estiver vazio
                          if (key === 'attachments' && (Array.isArray(value) && value.length === 0 || !value)) {
                            return null;
                          }
                          
                          // Formatar arrays
                          if (Array.isArray(displayValue)) {
                            displayValue = displayValue.length > 0 ? displayValue.join(', ') : 'N/A';
                          }
                          
                          // Formatar objetos
                          if (typeof displayValue === 'object' && displayValue !== null) {
                            displayValue = JSON.stringify(displayValue);
                          }

                          return (
                            <div key={key} className="pb-3 border-b border-gray-200 dark:border-gray-600 last:border-0 last:pb-0">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                {fieldLabels[key] || key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {displayValue || 'N/A'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Informações de Aprovação/Rejeição */}
                  {selectedRequest.status === 'approved' && selectedRequest.approvedBy && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border-2 border-green-300 dark:border-green-700">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-green-900 dark:text-green-200 mb-2 text-lg">Aprovado</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm text-green-800 dark:text-green-300">
                              Aprovado por <strong className="font-semibold">{selectedRequest.approvedBy.name}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm text-green-800 dark:text-green-300">
                              {new Date(selectedRequest.approvedAt).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {selectedRequest.approvalComments && (
                            <div className="mt-3 p-4 bg-white dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Comentários</div>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{selectedRequest.approvalComments}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'rejected' && selectedRequest.rejectedBy && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-5 border-2 border-red-300 dark:border-red-700">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-red-900 dark:text-red-200 mb-2 text-lg">Rejeitado</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-red-800 dark:text-red-300">
                              Rejeitado por <strong className="font-semibold">{selectedRequest.rejectedBy.name}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-red-800 dark:text-red-300">
                              {new Date(selectedRequest.rejectedAt).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {selectedRequest.rejectionReason && (
                            <div className="mt-3 p-4 bg-white dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <div className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Motivo da Rejeição</div>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{selectedRequest.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações (Aprovar/Rejeitar) */}
                {selectedRequest.status === 'pending' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleApprovalClick(selectedRequest, 'reject');
                        }}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        Rejeitar
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleApprovalClick(selectedRequest, 'approve');
                        }}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Aprovar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
      </Modal>
    </div>
  );
};

export default CatalogApprovals;
