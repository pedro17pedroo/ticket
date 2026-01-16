import { useState, useEffect } from 'react';
import { Monitor, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const RemoteAccessButton = ({ ticket }) => {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Verificar se já existe solicitação ativa ao carregar
  useEffect(() => {
    checkActiveRequest();
  }, [ticket?.id]);

  const checkActiveRequest = async () => {
    if (!ticket?.id) return;

    try {
      const response = await api.get(`/remote-access/ticket/${ticket.id}`);
      const activeReq = response.data.remoteAccesses?.find(
        r => ['pending', 'accepted', 'active'].includes(r.status)
      );
      setActiveRequest(activeReq || null);
    } catch (error) {
      console.error('Erro ao verificar solicitação ativa:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleRequestAccess = async () => {
    setRequesting(true);
    try {
      const response = await api.post('/remote-access/request', {
        ticketId: ticket.id
      });

      toast.success('Solicitação enviada! Aguardando aprovação do cliente...');
      setShowModal(false);

      // Atualizar estado com a nova solicitação
      setActiveRequest(response.data.remoteAccess);

      // Escutar resposta via WebSocket
      // (já configurado no SocketContext)
    } catch (error) {
      console.error('❌ Erro ao solicitar acesso remoto:', error);
      console.error('📋 Detalhes do erro:', error.response?.data);

      const errorMessage = error.response?.data?.error || 'Erro ao solicitar acesso remoto';

      // Se já existe solicitação ativa, mostrar mensagem específica
      if (errorMessage.includes('Já existe uma solicitação')) {
        toast.error('Já existe uma solicitação pendente para este ticket. Aguarde a resposta do cliente ou cancele a anterior.', {
          duration: 5000
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequest) return;

    try {
      await api.post(`/remote-access/${activeRequest.id}/end`);
      toast.success('Solicitação cancelada');
      setActiveRequest(null);
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast.error('Erro ao cancelar solicitação');
    }
  };

  // O botão só aparece para técnicos/admins atendendo tickets de clientes
  const isTechnician = user?.role === 'agent' || user?.role === 'org-admin' || user?.role === 'super-admin';
  const isClientRequester = ticket?.requester?.role === 'cliente-org';

  if (!isTechnician || !isClientRequester) {
    return null;
  }

  if (loadingStatus) {
    return null; // Ou um skeleton loader
  }

  // Se já existe solicitação ativa, mostrar status
  if (activeRequest) {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        text: 'Aguardando Aprovação'
      },
      accepted: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-50 border-green-200',
        text: 'Aprovado - Aguardando Conexão'
      },
      active: {
        icon: Monitor,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        text: 'Sessão Ativa'
      }
    };

    const status = statusConfig[activeRequest.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${status.color}`}>
        <StatusIcon className="w-5 h-5" />
        <span className="font-medium text-sm">{status.text}</span>
        <button
          onClick={handleCancelRequest}
          className="ml-2 text-gray-500 hover:text-gray-700"
          title="Cancelar/Encerrar"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        title="Solicitar Acesso Remoto"
      >
        <Monitor className="w-5 h-5" />
        Acesso Remoto
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Monitor className="w-6 h-6" />
                Solicitar Acesso Remoto
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>Cliente:</strong> {ticket.requester.name}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Uma notificação será enviada para o cliente através do Desktop Agent.
                  O acesso só será concedido após aprovação.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  ⚠️ <strong>Importante:</strong> O cliente precisa ter o Desktop Agent instalado e em execução para receber a solicitação.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestAccess}
                  disabled={requesting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {requesting ? 'Solicitando...' : 'Solicitar Acesso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RemoteAccessButton;
