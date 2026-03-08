import React, { useState, useEffect } from 'react';
import { X, Check, TrendingUp, Loader } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import paymentService from '../../services/paymentService';
import PaymentMethodSelector from '../../../portalSaaS/src/components/payments/PaymentMethodSelector';
import PaymentInstructions from '../../../portalSaaS/src/components/payments/PaymentInstructions';

const UpgradeModal = ({ currentPlan, onClose, onUpgradeComplete }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('select'); // select, payment, instructions

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      calculateUpgrade();
    }
  }, [selectedPlan]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getAvailablePlans();
      if (response.success) {
        // Filtrar apenas planos superiores ao atual
        const availablePlans = response.data.filter(
          plan => plan.monthlyPrice > currentPlan.monthlyPrice
        );
        setPlans(availablePlans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setError('Erro ao carregar planos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const calculateUpgrade = async () => {
    try {
      const response = await paymentService.calculateUpgrade(selectedPlan.id);
      if (response.success) {
        setCalculation(response.data);
      }
    } catch (error) {
      console.error('Error calculating upgrade:', error);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      setError('Por favor, selecione um método de pagamento');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const paymentData = {
        amount: calculation?.amountToPay || selectedPlan.monthlyPrice,
        paymentMethod: selectedMethod,
        customerName: 'Admin', // TODO: Pegar do contexto
        customerEmail: 'admin@example.com', // TODO: Pegar do contexto
        customerPhone: '900000000', // TODO: Pegar do contexto
        description: `Upgrade para ${selectedPlan.displayName}`
      };

      const response = await paymentService.createPayment(paymentData);

      if (response.success) {
        setTransaction(response.data);
        setStep('instructions');
      } else {
        setError(response.error || 'Erro ao criar pagamento');
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err.response?.data?.error || 'Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentComplete = () => {
    onUpgradeComplete?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade de Plano</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Selecionar Plano */}
          {step === 'select' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Você já está no plano mais alto disponível</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {plan.displayName}
                      </h3>
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      
                      <div className="text-3xl font-bold text-blue-600 mb-4">
                        Kz {plan.monthlyPrice.toLocaleString('pt-AO')}
                        <span className="text-sm text-gray-500 font-normal">/mês</span>
                      </div>

                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          {plan.limits.maxUsers} usuários
                        </li>
                        <li className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          {plan.limits.maxClients} clientes
                        </li>
                        <li className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          {plan.limits.maxStorageGB} GB armazenamento
                        </li>
                      </ul>

                      <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Selecionar Plano
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2: Pagamento */}
          {step === 'payment' && selectedPlan && (
            <div className="space-y-6">
              {/* Resumo do Upgrade */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4">Resumo do Upgrade</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-800">Plano Atual:</span>
                    <span className="font-semibold text-blue-900">{currentPlan.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">Novo Plano:</span>
                    <span className="font-semibold text-blue-900">{selectedPlan.displayName}</span>
                  </div>
                  {calculation && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Dias Restantes:</span>
                        <span className="font-semibold text-blue-900">{calculation.remainingDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Crédito do Plano Atual:</span>
                        <span className="font-semibold text-blue-900">Kz {calculation.credit}</span>
                      </div>
                      <div className="border-t border-blue-300 my-2 pt-2 flex justify-between">
                        <span className="text-blue-900 font-semibold">Valor a Pagar:</span>
                        <span className="text-xl font-bold text-blue-900">
                          Kz {calculation.amountToPay}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <PaymentMethodSelector
                selectedMethod={selectedMethod}
                onSelectMethod={setSelectedMethod}
              />

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedPlan(null);
                    setSelectedMethod(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>

                <button
                  onClick={handleCreatePayment}
                  disabled={!selectedMethod || processing}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      <span>Processar Upgrade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Instruções de Pagamento */}
          {step === 'instructions' && transaction && (
            <PaymentInstructions
              transaction={transaction}
              onPaymentComplete={handlePaymentComplete}
              onPaymentFailed={() => {
                setStep('payment');
                setTransaction(null);
                setSelectedMethod(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
