import { useState } from 'react';
import { ChevronLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import PaymentMethodSelector from './PaymentMethodSelector';
import PaymentInstructions from './PaymentInstructions';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PaymentStep = ({ 
  planData, 
  organizationData,
  onBack, 
  onSuccess,
  onSkip 
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const hasTrial = planData?.trialDays > 0;
  const amount = planData?.monthlyPrice || 0;

  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      toast.error('Selecione um método de pagamento');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await paymentAPI.createPayment({
        amount,
        paymentMethod: selectedMethod,
        customerName: organizationData?.adminName || '',
        customerEmail: organizationData?.adminEmail || '',
        customerPhone: organizationData?.adminPhone || '',
        description: `Pagamento ${planData?.displayName || planData?.name}`,
        subscriptionId: organizationData?.subscriptionId
      });

      if (result.success) {
        setPaymentData(result.data);
        toast.success('Pagamento criado com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao criar pagamento');
      }
    } catch (err) {
      console.error('Erro ao criar pagamento:', err);
      setError(err.message || 'Erro ao processar pagamento');
      toast.error('Erro ao criar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (data) => {
    toast.success('Pagamento confirmado!');
    onSuccess?.(data);
  };

  const handlePaymentExpired = () => {
    toast.error('Pagamento expirado');
    setPaymentData(null);
    setSelectedMethod(null);
  };

  const handlePaymentFailed = () => {
    toast.error('Pagamento falhou');
    setPaymentData(null);
    setSelectedMethod(null);
  };

  // Se já tem dados de pagamento, mostrar instruções
  if (paymentData) {
    return (
      <div className="space-y-6">
        <PaymentInstructions
          paymentData={paymentData}
          onSuccess={handlePaymentSuccess}
          onExpired={handlePaymentExpired}
          onFailed={handlePaymentFailed}
        />

        <div className="flex justify-between">
          <button
            onClick={() => {
              setPaymentData(null);
              setSelectedMethod(null);
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do plano */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {planData?.displayName || planData?.name}
        </h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-blue-600">
            Kz {amount.toFixed(2)}
          </span>
          <span className="text-gray-600 ml-2">/mês</span>
        </div>
        
        {hasTrial && (
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              ✓ {planData.trialDays} dias de teste grátis incluídos
            </p>
          </div>
        )}
      </div>

      {/* Opção de pular pagamento se tiver trial */}
      {hasTrial && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-2">
                Período de teste disponível
              </p>
              <p className="text-sm text-amber-800 mb-3">
                Você pode pular o pagamento e começar com {planData.trialDays} dias de teste grátis. 
                Será necessário adicionar um método de pagamento antes do fim do período de teste.
              </p>
              <button
                onClick={onSkip}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                Pular e iniciar período de teste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seletor de método de pagamento */}
      <PaymentMethodSelector
        selected={selectedMethod}
        onSelect={setSelectedMethod}
      />

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </button>

        <button
          onClick={handleCreatePayment}
          disabled={!selectedMethod || isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Continuar
              <Check className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;
