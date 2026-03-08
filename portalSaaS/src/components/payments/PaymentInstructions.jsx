import { useState, useEffect } from 'react';
import { Copy, Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PaymentInstructions = ({ 
  paymentData, 
  onSuccess, 
  onExpired,
  onFailed 
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [checking, setChecking] = useState(false);

  // Calcular tempo restante
  useEffect(() => {
    if (!paymentData?.expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const expires = new Date(paymentData.expiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft(null);
        onExpired?.();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [paymentData?.expiresAt, onExpired]);

  // Polling de status
  useEffect(() => {
    if (!paymentData?.transactionId) return;

    const checkStatus = async () => {
      try {
        setChecking(true);
        const result = await paymentAPI.checkPaymentStatus(paymentData.transactionId);
        
        if (result.data.status === 'completed') {
          onSuccess?.(result.data);
        } else if (result.data.status === 'failed') {
          onFailed?.(result.data);
        } else if (result.data.status === 'expired') {
          onExpired?.(result.data);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      } finally {
        setChecking(false);
      }
    };

    // Verificar a cada 10 segundos
    const interval = setInterval(checkStatus, 10000);
    
    // Verificar imediatamente
    checkStatus();

    return () => clearInterval(interval);
  }, [paymentData?.transactionId, onSuccess, onFailed, onExpired]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodName = () => {
    const names = {
      ekwanza: 'E-Kwanza',
      gpo: 'Multicaixa Express',
      ref: 'Referência Multicaixa'
    };
    return names[paymentData?.paymentMethod] || 'Pagamento';
  };

  const getInstructions = () => {
    switch (paymentData?.paymentMethod) {
      case 'ekwanza':
        return (
          <div className="space-y-4">
            <p className="text-gray-700">
              1. Abra o aplicativo E-Kwanza no seu telemóvel
            </p>
            <p className="text-gray-700">
              2. Selecione "Pagar com Código"
            </p>
            <p className="text-gray-700">
              3. Digite o código abaixo:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-gray-900">
                  {paymentData?.referenceCode}
                </span>
                <button
                  onClick={() => copyToClipboard(paymentData?.referenceCode)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-gray-700">
              4. Confirme o pagamento de <strong>Kz {paymentData?.amount?.toFixed(2)}</strong>
            </p>
          </div>
        );

      case 'gpo':
        return (
          <div className="space-y-4">
            <p className="text-gray-700">
              1. Acesse o Multicaixa Express
            </p>
            <p className="text-gray-700">
              2. Selecione "Pagamentos"
            </p>
            <p className="text-gray-700">
              3. Use a referência:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-gray-900">
                  {paymentData?.referenceCode}
                </span>
                <button
                  onClick={() => copyToClipboard(paymentData?.referenceCode)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-gray-700">
              4. Confirme o pagamento de <strong>Kz {paymentData?.amount?.toFixed(2)}</strong>
            </p>
          </div>
        );

      case 'ref':
        return (
          <div className="space-y-4">
            <p className="text-gray-700">
              1. Dirija-se a qualquer caixa Multicaixa
            </p>
            <p className="text-gray-700">
              2. Selecione "Pagamentos" → "Referência"
            </p>
            <p className="text-gray-700">
              3. Digite a referência:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-gray-900">
                  {paymentData?.referenceCode}
                </span>
                <button
                  onClick={() => copyToClipboard(paymentData?.referenceCode)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-gray-700">
              4. Confirme o pagamento de <strong>Kz {paymentData?.amount?.toFixed(2)}</strong>
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Instruções de Pagamento
        </h3>
        <p className="text-gray-600">
          Método: {getMethodName()}
        </p>
      </div>

      {/* Tempo restante */}
      {timeLeft && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-amber-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Tempo restante para pagamento
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {getInstructions()}
      </div>

      {/* Status de verificação */}
      {checking && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
            <p className="text-sm text-blue-800">
              Verificando pagamento...
            </p>
          </div>
        </div>
      )}

      {/* Aviso */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-gray-600 mr-2 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>O pagamento será confirmado automaticamente</li>
              <li>Você receberá um email de confirmação</li>
              <li>Não feche esta página até a confirmação</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInstructions;
