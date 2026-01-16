import { useState, useEffect, useCallback } from 'react';
import { Search, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import subscriptionService from '../../services/subscriptionService';
import planService from '../../services/planService';
import { showSuccess, showError } from '../../utils/alerts';

const statusConfig = {
  active: { label: 'Ativo', variant: 'success', icon: CheckCircle },
  trial: { label: 'Trial', variant: 'warning', icon: Clock },
  past_due: { label: 'Pagamento em Atraso', variant: 'warning', icon: AlertTriangle },
  suspended: { label: 'Suspenso', variant: 'info', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', variant: 'danger', icon: XCircle }
};

const SubscriptionsList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [newPlanId, setNewPlanId] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const [subsData, plansData, statsData] = await Promise.all([
        subscriptionService.getAll(params),
        planService.getAll(),
        subscriptionService.getStats()
      ]);
      setSubscriptions(subsData.subscriptions || []);
      setPlans(plansData.plans || []);
      setStats(statsData.stats);
    } catch {
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChangePlan = async () => {
    if (!newPlanId) return showError('Selecione um plano');
    try {
      await subscriptionService.changePlan(selectedSub.id, newPlanId, changeReason);
      showSuccess('Plano alterado com sucesso');
      closeModal();
      loadData();
    } catch {
      showError('Erro ao alterar plano');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSub(null);
    setNewPlanId('');
    setChangeReason('');
  };

  const handleCancel = async (id) => {
    if (!confirm('Deseja cancelar esta subscrição?')) return;
    try {
      await subscriptionService.cancel(id, 'Cancelamento manual', false);
      showSuccess('Subscrição será cancelada no fim do período');
      loadData();
    } catch {
      showError('Erro ao cancelar');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await subscriptionService.reactivate(id);
      showSuccess('Subscrição reativada');
      loadData();
    } catch {
      showError('Erro ao reativar');
    }
  };

  const handleExtendTrial = async (id) => {
    const days = prompt('Quantos dias estender o trial?', '7');
    if (!days) return;
    try {
      await subscriptionService.extendTrial(id, parseInt(days));
      showSuccess(`Trial estendido por ${days} dias`);
      loadData();
    } catch {
      showError('Erro ao estender trial');
    }
  };

  const columns = [
    {
      header: 'Organização',
      render: (sub) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{sub.organization?.name}</div>
          <div className="text-sm text-gray-500">{sub.organization?.email}</div>
        </div>
      )
    },
    {
      header: 'Plano',
      render: (sub) => (
        <div>
          <div className="font-medium">{sub.planFormatted || sub.plan?.displayName}</div>
          <div className="text-sm text-gray-500">{sub.priceFormatted}/mês</div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (sub) => {
        const cfg = statusConfig[sub.status] || statusConfig.active;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      }
    },
    {
      header: 'Período',
      render: (sub) => (
        <div className="text-sm">
          {sub.status === 'trial' && sub.trialEndsAt ? (
            <><div className="text-amber-600">Trial até</div><div>{new Date(sub.trialEndsAt).toLocaleDateString('pt-PT')}</div></>
          ) : sub.currentPeriodEnd ? (
            <><div className="text-gray-500">Renova em</div><div>{new Date(sub.currentPeriodEnd).toLocaleDateString('pt-PT')}</div></>
          ) : <span className="text-gray-400">-</span>}
        </div>
      )
    },
    {
      header: 'Ações',
      render: (sub) => (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="ghost" onClick={() => { setSelectedSub(sub); setNewPlanId(sub.planId); setShowModal(true); }}>Alterar Plano</Button>
          {sub.status === 'trial' && <Button size="sm" variant="ghost" onClick={() => handleExtendTrial(sub.id)}>+Trial</Button>}
          {sub.status === 'active' && <Button size="sm" variant="danger" onClick={() => handleCancel(sub.id)}>Cancelar</Button>}
          {sub.status === 'cancelled' && <Button size="sm" variant="success" onClick={() => handleReactivate(sub.id)}>Reativar</Button>}
        </div>
      )
    }
  ];

  const filtered = subscriptions.filter(s =>
    s.organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.organization?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscrições</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie as subscrições das organizações</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-gray-500">Total</div></Card>
          <Card className="p-4"><div className="text-2xl font-bold text-green-600">{stats.byStatus?.active || 0}</div><div className="text-sm text-gray-500">Ativos</div></Card>
          <Card className="p-4"><div className="text-2xl font-bold text-amber-600">{stats.byStatus?.trial || 0}</div><div className="text-sm text-gray-500">Trial</div></Card>
          <Card className="p-4"><div className="text-2xl font-bold text-blue-600">{stats.byStatus?.past_due || 0}</div><div className="text-sm text-gray-500">Em Atraso</div></Card>
          <Card className="p-4"><div className="text-2xl font-bold text-red-600">{stats.byStatus?.cancelled || 0}</div><div className="text-sm text-gray-500">Cancelados</div></Card>
          <Card className="p-4"><div className="text-2xl font-bold text-orange-600">{stats.trialsEndingSoon || 0}</div><div className="text-sm text-gray-500">Trials Expirando</div></Card>
        </div>
      )}

      <Card>
        <div className="mb-4 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="trial">Trial</option>
            <option value="past_due">Em Atraso</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        {loading ? <Loading /> : <Table columns={columns} data={filtered} emptyMessage="Nenhuma subscrição encontrada" />}
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Alterar Plano</h3>
            <p className="text-sm text-gray-500 mb-4">Organização: {selectedSub?.organization?.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Novo Plano</label>
                <select value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  {plans.map(p => <option key={p.id} value={p.id}>{p.displayName} - {p.priceFormatted}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Motivo (opcional)</label>
                <input type="text" value={changeReason} onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Ex: Upgrade solicitado" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={closeModal}>Cancelar</Button>
              <Button className="flex-1" onClick={handleChangePlan}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
