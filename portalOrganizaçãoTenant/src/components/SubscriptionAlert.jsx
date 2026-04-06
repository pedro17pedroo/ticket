import { useState, useEffect } from 'react';
import { AlertCircle, X, CreditCard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import subscriptionService from '../services/subscriptionService';

const SubscriptionAlert = () => {
  const [subscription, setSubscription] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadSubscription();
  }, []);

  // Recarregar quando a rota muda (ex: volta da página de subscription)
  useEffect(() => {
    if (location.pathname !== '/subscription') {
      loadSubscription();
    }
  }, [location.pathname]);

  const loadSubscription = async () => {
    try {
      const response = await subscriptionService.getCurrentSubscription();
      console.log('[SubscriptionAlert] Loaded subscription:', response);
      if (response.success) {
        setSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error('Erro ao carregar subscrição:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Salvar no localStorage para não mostrar novamente hoje
    const today = new Date().toDateString();
    localStorage.setItem('subscriptionAlertDismissed', today);
  };

  useEffect(() => {
    // Verificar se foi dispensado hoje
    const dismissedDate = localStorage.getItem('subscriptionAlertDismissed');
    const today = new Date().toDateString();
    if (dismissedDate === today) {
      setDismissed(true);
    }
  }, []);

  if (loading || !subscription || dismissed) return null;

  const isInTrial = subscription.status === 'trial';
  const isExpired = subscription.status === 'suspended' || subscription.status === 'past_due';
  const daysRemaining = subscription.trialDaysRemaining || 0;

  console.log('[SubscriptionAlert] Status check:', {
    status: subscription.status,
    isInTrial,
    isExpired,
    daysRemaining,
    trialEndsAt: subscription.trialEndsAt
  });

  // Mostrar alerta apenas se:
  // 1. Está em trial e faltam 7 dias ou menos
  // 2. Subscrição expirada
  const shouldShowAlert = (isInTrial && daysRemaining <= 7) || isExpired;

  if (!shouldShowAlert) return null;

  // Determinar cor e mensagem baseado no status
  let bgColor, borderColor, textColor, iconColor, title, message, buttonText;

  if (isExpired) {
    bgColor = 'bg-red-50 dark:bg-red-900/20';
    borderColor = 'border-red-200 dark:border-red-800';
    textColor = 'text-red-900 dark:text-red-100';
    iconColor = 'text-red-600 dark:text-red-400';
    title = 'Subscrição expirada';
    message = 'Sua subscrição expirou. Renove para continuar usando o sistema.';
    buttonText = 'Renovar Agora';
  } else if (daysRemaining === 0) {
    bgColor = 'bg-red-50 dark:bg-red-900/20';
    borderColor = 'border-red-200 dark:border-red-800';
    textColor = 'text-red-900 dark:text-red-100';
    iconColor = 'text-red-600 dark:text-red-400';
    title = 'Seu trial expira hoje!';
    message = 'Escolha um plano para continuar usando o sistema sem interrupções.';
    buttonText = 'Ver Planos';
  } else if (daysRemaining <= 3) {
    bgColor = 'bg-red-50 dark:bg-red-900/20';
    borderColor = 'border-red-200 dark:border-red-800';
    textColor = 'text-red-900 dark:text-red-100';
    iconColor = 'text-red-600 dark:text-red-400';
    title = `Seu trial expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
    message = 'Escolha um plano para continuar usando o sistema.';
    buttonText = 'Ver Planos';
  } else {
    bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
    borderColor = 'border-yellow-200 dark:border-yellow-800';
    textColor = 'text-yellow-900 dark:text-yellow-100';
    iconColor = 'text-yellow-600 dark:text-yellow-400';
    title = `Seu trial expira em ${daysRemaining} dias`;
    message = 'Não perca acesso ao sistema. Escolha um plano agora.';
    buttonText = 'Ver Planos';
  }

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6 relative`}>
      <button
        onClick={handleDismiss}
        className={`absolute top-4 right-4 ${iconColor} hover:opacity-70 transition-opacity`}
        title="Dispensar por hoje"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <AlertCircle className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor} mb-1`}>
            {title}
          </h3>
          <p className={`text-sm ${textColor} opacity-90 mb-3`}>
            {message}
          </p>
          <Link
            to="/subscription"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isExpired || daysRemaining <= 3
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAlert;
