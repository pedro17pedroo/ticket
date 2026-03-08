import { useState } from 'react';
import { Smartphone, CreditCard, FileText } from 'lucide-react';

const PaymentMethodSelector = ({ onSelect, selected }) => {
  const methods = [
    {
      id: 'ekwanza',
      name: 'E-Kwanza',
      description: 'Pagamento via código E-Kwanza',
      icon: Smartphone,
      color: 'blue'
    },
    {
      id: 'gpo',
      name: 'Multicaixa Express',
      description: 'Pagamento instantâneo via GPO',
      icon: CreditCard,
      color: 'green'
    },
    {
      id: 'ref',
      name: 'Referência Multicaixa',
      description: 'Pagamento por referência EMIS',
      icon: FileText,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Escolha o método de pagamento
      </h3>
      
      <div className="grid gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;
          
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`
                w-full p-4 rounded-lg border-2 transition-all text-left
                ${isSelected 
                  ? `border-${method.color}-500 bg-${method.color}-50` 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <div className={`
                  p-3 rounded-lg mr-4
                  ${isSelected 
                    ? `bg-${method.color}-100` 
                    : 'bg-gray-100'
                  }
                `}>
                  <Icon className={`
                    w-6 h-6
                    ${isSelected 
                      ? `text-${method.color}-600` 
                      : 'text-gray-600'
                    }
                  `} />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{method.name}</h4>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                
                {isSelected && (
                  <div className={`w-6 h-6 rounded-full bg-${method.color}-500 flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
