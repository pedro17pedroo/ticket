import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import subscriptionService from '../../services/subscriptionService';
import { showSuccess, showError } from '../../utils/alerts';

const PendingApprovals = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getPending();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      showError('Erro ao carregar pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await subscriptionService.approve(selectedSub.id, { paymentReference: paymentRef, notes });
      showSuccess('Subscrição aprovada com sucesso');
      closeModals();
      loadData();
    } catch (error) {
      showError('Erro ao aprovar');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return showError('Informe o motivo da rejeição');
    try {
      await subscriptionService.reject(selectedSub.id, rejectReason);
      showSuccess('Subscrição rejeitada');
      closeModals();
      loadData();
    } catch (error) {
      showError('Erro ao rejeitar');
    }
  };

  const closeModals = () => {
    setShowApproveModal(false);
    setShowRejectModal(false);
    setSelectedSub(null);
    setPaymentRef('');
    setNotes('');
    setRejectReason('');
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aprovações Pendentes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Aprove pagamentos por transferência, boleto ou outros métodos manuais</p>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma aprovação pendente</h3>
          <p className="text-gray-500 mt-2">Todas as subscrições estão em dia!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map(sub => (
            <Card key={sub.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{sub.organization?.name}</h3>
                    <Badge variant={sub.status === 'pending_payment' ? 'warning' : 'info'}>
                      {sub.status === 'pending_payment' ? 'Aguardando Pagamento' : 'Aguardando Aprovação'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium dark:text-white">{sub.organization?.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Plano:</span>
                      <p className="font-medium dark:text-white">{sub.plan?.displayName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor:</span>
                      <p className="font-medium text-green-600">{sub.priceFormatted || `€${sub.plan?.monthlyPrice}`}/mês</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Solicitado em:</span>
                      <p className="font-medium dark:text-white">{new Date(sub.createdAt).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  {sub.paymentProof && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Comprovativo anexado</span>
                        <a href={sub.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver</a>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="success" onClick={() => { setSelectedSub(sub); setShowApproveModal(true); }}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                  <Button variant="danger" onClick={() => { setSelectedSub(sub); setShowRejectModal(true); }}>
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Aprovar */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Aprovar Subscrição</h3>
            <p className="text-sm text-gray-500 mb-4">Organização: <strong>{selectedSub?.organization?.name}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Referência do Pagamento</label>
                <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Ex: TRF-123456" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Notas (opcional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Observações sobre o pagamento..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={closeModals}>Cancelar</Button>
              <Button variant="success" className="flex-1" onClick={handleApprove}>Confirmar Aprovação</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejeitar */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Rejeitar Subscrição</h3>
            <p className="text-sm text-gray-500 mb-4">Organização: <strong>{selectedSub?.organization?.name}</strong></p>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Motivo da Rejeição *</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Ex: Comprovativo inválido, valor incorreto..." />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={closeModals}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={handleReject}>Confirmar Rejeição</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
