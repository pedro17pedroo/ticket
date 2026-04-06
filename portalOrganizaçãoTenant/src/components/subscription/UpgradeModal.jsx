import React, { useState, useEffect } from 'react';
import { X, Check, TrendingUp, Loader, ArrowRight, CreditCard, Building2 } from 'lucide-react';
import Modal from '../Modal';
import subscriptionService from '../../services/subscriptionService';
import paymentService from '../../services/paymentService';
import toast from 'react-hot-toast';

const UpgradeModal = ({ isOpen, currentPlan, subscription, onClose, onUpgradeComplete }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('select'); // select, payment, instructions
  
  // Campos dinâmicos por método
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPlan) {
      calculateUpgrade();
    }
  }, [selectedPlan]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getAvailablePlans();
      console.log('Plans response:', response);
      
      if (response.success) {
        const allPlans = response.plans || [];
        const availablePlans = allPlans.filter(
          plan => plan.priceValue > (currentPlan.monthlyPrice || 0)
        );
        
        console.log('Available plans:', availablePlans);
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
      toast.error('Por favor, selecione um método de pagamento');
      return;
    }

    // Validações específicas por método
    if (selectedMethod === 'ekwanza' && !phoneNumber) {
      toast.error('Por favor, insira o número de telefone');
      return;
    }

    if ((selectedMethod === 'gpo' || selectedMethod === 'ref') && (!customerName || !customerEmail || !customerPhone)) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const paymentData = {
        subscriptionId: subscription?.id,
        amount: calculation?.amountToPay || selectedPlan.priceValue,
        paymentMethod: selectedMethod,
        customerName: selectedMethod === 'ekwanza' ? 'Cliente' : customerName,
        customerEmail: selectedMethod === 'ekwanza' ? 'cliente@example.com' : customerEmail,
        customerPhone: selectedMethod === 'ekwanza' ? phoneNumber : customerPhone,
        description: `Upgrade para ${selectedPlan.name}`
      };

      const response = await paymentService.createPayment(paymentData);

      if (response.success) {
        setTransaction(response.data);
        
        // Para métodos real-time (GPO e E-Kwanza), mostrar sucesso direto
        // Para REF, mostrar instruções de pagamento
        if (selectedMethod === 'gpo' || selectedMethod === 'ekwanza') {
          toast.success('Pagamento processado com sucesso!');
          console.log('[UpgradeModal] Payment successful, calling onUpgradeComplete');
          // Aguardar um pouco e recarregar os dados da subscrição
          setTimeout(() => {
            if (onUpgradeComplete) {
              console.log('[UpgradeModal] Calling onUpgradeComplete callback');
              onUpgradeComplete();
            } else {
              console.warn('[UpgradeModal] onUpgradeComplete callback not provided');
            }
            handleClose();
          }, 2000);
        } else {
          setStep('instructions');
          toast.success('Referência gerada com sucesso!');
        }
      } else {
        setError(response.error || 'Erro ao criar pagamento');
        toast.error(response.error || 'Erro ao criar pagamento');
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao processar pagamento';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentComplete = () => {
    toast.success('Processo de upgrade iniciado!');
    onUpgradeComplete?.();
    handleClose();
  };

  const handleClose = () => {
    setStep('select');
    setSelectedPlan(null);
    setSelectedMethod(null);
    setTransaction(null);
    setError(null);
    setPhoneNumber('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 flex-shrink-0" />
                <span className="truncate">Upgrade de Plano</span>
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {step === 'select' && 'Escolha o plano ideal para sua organização'}
                {step === 'payment' && 'Selecione o método de pagamento'}
                {step === 'instructions' && 'Instruções de pagamento'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Step 1: Selecionar Plano */}
            {step === 'select' && (
              <>
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Carregando planos...</p>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Plano Premium Ativo
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Você já está no plano mais alto disponível
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="relative border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg group"
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {plan.highlighted && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                              RECOMENDADO
                            </span>
                          </div>
                        )}
                        
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {plan.name}
                          </h3>
                          
                          <div className="flex items-baseline justify-center gap-1 mb-4">
                            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                              {plan.price}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">/mês</span>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-6">
                          <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{plan.maxUsers === -1 ? 'Usuários ilimitados' : `${plan.maxUsers} usuários`}</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{plan.maxClients === -1 ? 'Clientes ilimitados' : `${plan.maxClients} clientes`}</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{plan.maxStorageGB} GB armazenamento</span>
                          </li>
                          {plan.features && plan.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 group-hover:shadow-md">
                          Selecionar Plano
                          <ArrowRight className="w-4 h-4" />
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
                {/* Instrução para métodos real-time */}
                {(selectedMethod === 'gpo' || selectedMethod === 'ekwanza') && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg">ℹ️</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          {selectedMethod === 'gpo' ? 'Multicaixa Express' : 'E-Kwanza'}
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Ao clicar em "Processar Upgrade", você receberá um popup no seu telemóvel para confirmar o pagamento com o seu PIN. 
                          O pagamento será processado imediatamente após a confirmação.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 text-lg">Resumo do Upgrade</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 dark:text-blue-200">Plano Atual:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-100">{currentPlan.displayName || currentPlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 dark:text-blue-200">Novo Plano:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-100">{selectedPlan.name}</span>
                    </div>
                    {calculation && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-800 dark:text-blue-200">Dias Restantes:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">{calculation.remainingDays}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-800 dark:text-blue-200">Crédito do Plano Atual:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">Kz {calculation.credit}</span>
                        </div>
                        <div className="border-t border-blue-300 dark:border-blue-700 my-2 pt-3 flex justify-between items-center">
                          <span className="text-blue-900 dark:text-blue-100 font-semibold text-lg">Valor a Pagar:</span>
                          <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            Kz {calculation.amountToPay}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Método de Pagamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setSelectedMethod('ekwanza')}
                      className={`p-5 border-2 rounded-xl transition-all ${
                        selectedMethod === 'ekwanza'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <div className="font-semibold text-gray-900 dark:text-white">E-Kwanza</div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pagamento via E-Kwanza</div>
                    </button>

                    <button
                      onClick={() => setSelectedMethod('gpo')}
                      className={`p-5 border-2 rounded-xl transition-all ${
                        selectedMethod === 'gpo'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <div className="font-semibold text-gray-900 dark:text-white">Multicaixa Express</div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pagamento via Multicaixa</div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedMethod('ref')}
                      className={`p-5 border-2 rounded-xl transition-all ${
                        selectedMethod === 'ref'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <div className="font-semibold text-gray-900 dark:text-white">Referência Multicaixa</div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pagamento por referência</div>
                    </button>
                  </div>
                </div>

                {/* Campos dinâmicos baseados no método selecionado */}
                {selectedMethod === 'ekwanza' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Dados do Pagamento</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número de Telefone *
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9XX XXX XXX"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Número de telefone associado à conta E-Kwanza
                      </p>
                    </div>
                  </div>
                )}

                {(selectedMethod === 'gpo' || selectedMethod === 'ref') && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Dados do Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Nome completo"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Telefone *
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="9XX XXX XXX"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Instruções */}
            {step === 'instructions' && transaction && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100 text-lg">Pagamento Criado com Sucesso!</h3>
                      <p className="text-green-800 dark:text-green-200 mt-1">
                        Referência: <span className="font-mono font-bold text-lg">{transaction.reference}</span>
                      </p>
                    </div>
                  </div>


                  {selectedMethod === 'ekwanza' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                      <p className="font-medium text-gray-900 dark:text-white mb-3">Para completar o pagamento:</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300 ml-2">
                        <li>Abra o app E-Kwanza</li>
                        <li>Selecione "Pagamentos"</li>
                        <li>Insira a referência: <span className="font-mono font-bold">{transaction.reference}</span></li>
                        <li>Confirme o pagamento</li>
                      </ol>
                    </div>
                  )}
                  
                  {selectedMethod === 'gpo' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <p className="font-medium text-gray-900 dark:text-white mb-2">Pagamento em Processamento</p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          Você receberá um popup no seu telemóvel para confirmar o pagamento com o seu PIN Multicaixa Express.
                        </p>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p><strong>Referência:</strong> <span className="font-mono">{transaction.reference}</span></p>
                        <p><strong>Valor:</strong> Kz {transaction.amount}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Após confirmar com o PIN, o pagamento será processado imediatamente e sua subscrição será ativada.
                      </p>
                    </div>
                  )}
                  
                  {selectedMethod === 'ref' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <p className="font-medium text-gray-900 dark:text-white mb-3">Dados para transferência:</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Banco:</span>
                          <span className="text-gray-900 dark:text-white">BAI</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">IBAN:</span>
                          <span className="text-gray-900 dark:text-white font-mono">AO06.0000.0000.0000.0000.0000.0</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Referência:</span>
                          <span className="text-gray-900 dark:text-white font-mono font-bold">{transaction.reference}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Valor:</span>
                          <span className="text-gray-900 dark:text-white font-bold text-lg">Kz {transaction.amount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between gap-3">
          {step === 'payment' && (
            <button
              onClick={() => {
                setStep('select');
                setSelectedPlan(null);
                setSelectedMethod(null);
              }}
              className="px-6 py-2.5 text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Voltar
            </button>
          )}
          
          {step === 'instructions' && (
            <button
              onClick={() => {
                setStep('payment');
                setTransaction(null);
                setSelectedMethod(null);
              }}
              className="px-6 py-2.5 text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Voltar
            </button>
          )}

          <div className="flex gap-3 ml-auto">
            {step !== 'instructions' && (
              <button
                onClick={handleClose}
                className="px-6 py-2.5 text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Cancelar
              </button>
            )}

            {step === 'payment' && (
              <button
                onClick={handleCreatePayment}
                disabled={!selectedMethod || processing}
                className="flex items-center gap-2 px-6 py-2.5 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>
                      {selectedMethod === 'gpo' && 'Aguardando confirmação no telemóvel...'}
                      {selectedMethod === 'ekwanza' && 'Aguardando confirmação no telemóvel...'}
                      {selectedMethod === 'ref' && 'Processando...'}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    <span>Processar Upgrade</span>
                  </>
                )}
              </button>
            )}

            {step === 'instructions' && (
              <button
                onClick={handlePaymentComplete}
                className="px-6 py-2.5 text-base bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeModal;
