import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';
import PaymentMethodSelector from '../payments/PaymentMethodSelector';
import PaymentInstructions from '../payments/PaymentInstructions';
import paymentService from '../../services/paymentService';

const PaymentStep = ({ 
  formData, 
  selectedPlan, 
  onNext, 
  onBack,
  onSkip 
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSkipPayment = selectedPlan?.trialDays > 0;

  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      setError('Por favor, selecione um método de pagamento');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        amount: selectedPlan.monthlyPrice,
        paymentMethod: selectedMethod,
        customerName: formData.adminName,
        customerEmail: formData.adminEmail,
        customerPhone: formData.adminPhone,
        description: `Pagamento Plano ${selectedPlan.displayName} - ${formData.companyName}`
      };

      const response = await paymentService.createPayment(paymentData);

      if (response.success) {
        setTransaction(response.data);
      } else {
        setError(response.error || 'Erro ao criar pagamento');
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err.response?.data?.error || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (paymentData) => {
    console.log('Payment completed:', paymentData);
    // Passar dados do pagamento para o próximo passo
    onNext({ 
      paymentCompleted: true,
      transactionId: paymentData.transactionId,
      paidAt: paymentData.paidAt
    });
  };

  const handlePaymentFailed = (paymentData) => {
    console.log('Payment failed:', paymentData);
    setError('Pagamento falhou. Por favor, tente novamente.');
    setTransaction(null);
    setSelectedMethod(null);
  };

  const handleSkipPayment = () => {
    onSkip?.({ 
      paymentSkipped: true,
      reason: 'trial'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento
        </h2>
        <p className="text-gray-600">
          Complete o pagamento para ativar sua subscrição
        </p>
      </div>

      {/* Informações do Plano */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedPlan?.displayName}
            </h3>
            <p className="text-sm text-gray-600">{selectedPlan?.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              Kz {selectedPlan?.monthlyPrice?.toLocaleString('pt-AO')}
            </div>
            <div className="text-sm text-gray-500">por mês</div>
          </div>
        </div>

        {canSkipPayment && (
          <div className="bg-white rounded-lg p-4 border border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-blue-900">
                  🎉 {selectedPlan.trialDays} dias de teste grátis
                </div>
                <div className="text-sm text-blue-700">
                  Experimente todos os recursos sem compromisso
                </div>
              </div>
              <button
                onClick={handleSkipPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Iniciar Teste Grátis
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Seleção de Método ou Instruções */}
      {!transaction ? (
        <>
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
          />

          {/* Botões */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            <button
              onClick={handleCreatePayment}
              disabled={!selectedMethod || loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Processar Pagamento</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <PaymentInstructions
            transaction={transaction}
            onPaymentComplete={handlePaymentComplete}
            onPaymentFailed={handlePaymentFailed}
          />

          {/* Botão Voltar */}
          <div className="flex justify-start pt-6">
            <button
              onClick={() => {
                setTransaction(null);
                setSelectedMethod(null);
              }}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Escolher Outro Método</span>
            </button>
          </div>
        </>
      )}

      {/* Informação de Segurança */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          🔒 Pagamento seguro processado por TPagamento
        </p>
      </div>
    </div>
  );
};

export default PaymentStep;
