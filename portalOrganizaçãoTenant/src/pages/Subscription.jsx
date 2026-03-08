import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Building2, 
  Ticket, 
  HardDrive,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import subscriptionService from '../services/subscriptionService';
import paymentService from '../services/paymentService';
import PaymentHistory from '../components/subscription/PaymentHistory';
import UpgradeModal from '../components/subscription/UpgradeModal';

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getCurrentSubscription();
      if (response.success) {
        setSubscription(response.data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'green', text: 'Ativo', icon: CheckCircle },
      trial: { color: 'blue', text: 'Período de Teste', icon: AlertCircle },
      past_due: { color: 'orange', text: 'Pagamento Pendente', icon: AlertCircle },
      cancelled: { color: 'red', text: 'Cancelado', icon: AlertCircle }
    };

    const badge = badges[status] || badges.active;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        <Icon className="w-4 h-4 mr-2" />
        {badge.text}
      </span>
    );
  };

  const getUsagePercentage = (current, limit) => {
    if (!limit) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'orange';
    return 'blue';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro ao carregar informações da subscrição</p>
      </div>
    );
  }

  const { subscription: sub, plan, usage } = subscription;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Subscrição</h1>
          <p className="text-gray-600">Gerencie seu plano e pagamentos</p>
        </div>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <TrendingUp className="w-5 h-5" />
          <span>Upgrade de Plano</span>
        </button>
      </div>

      {/* Plano Atual */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {plan.displayName}
            </h2>
            <p className="text-gray-600">{plan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              Kz {sub.amount?.toLocaleString('pt-AO')}
            </div>
            <div className="text-sm text-gray-500">por mês</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div>{getStatusBadge(sub.status)}</div>
            </div>
          </div>

          {sub.isInTrial && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Dias de Teste Restantes</div>
                <div className="font-semibold text-gray-900">{sub.trialDaysRemaining} dias</div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Ciclo de Cobrança</div>
              <div className="font-semibold text-gray-900 capitalize">{sub.billingCycle}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Uso Atual */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Uso Atual</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Usuários */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Usuários</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {usage.current.users} / {plan.limits.maxUsers}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${getUsageColor(usage.percentages.users)}-600 h-2 rounded-full transition-all`}
                style={{ width: `${usage.percentages.users}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{usage.percentages.users}% usado</div>
          </div>

          {/* Clientes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Clientes</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {usage.current.clients} / {plan.limits.maxClients}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${getUsageColor(usage.percentages.clients)}-600 h-2 rounded-full transition-all`}
                style={{ width: `${usage.percentages.clients}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{usage.percentages.clients}% usado</div>
          </div>

          {/* Tickets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Tickets/Mês</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {usage.current.ticketsThisMonth} / {plan.limits.maxTicketsPerMonth || '∞'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${getUsageColor(usage.percentages.tickets)}-600 h-2 rounded-full transition-all`}
                style={{ width: `${usage.percentages.tickets}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{usage.percentages.tickets}% usado</div>
          </div>

          {/* Armazenamento */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Armazenamento</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {usage.current.storageUsedGB} GB / {plan.limits.maxStorageGB} GB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${Math.min((usage.current.storageUsedGB / plan.limits.maxStorageGB) * 100, 100)}%` 
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((usage.current.storageUsedGB / plan.limits.maxStorageGB) * 100)}% usado
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Pagamentos */}
      <PaymentHistory />

      {/* Modal de Upgrade */}
      {showUpgradeModal && (
        <UpgradeModal
          currentPlan={plan}
          onClose={() => setShowUpgradeModal(false)}
          onUpgradeComplete={loadSubscription}
        />
      )}
    </div>
  );
};

export default Subscription;
