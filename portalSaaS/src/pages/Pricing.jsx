import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { saasAPI } from '../services/api';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await saasAPI.getPlans();
      // A API retorna { success: true, plans: [...] }
      const plansData = response?.plans || [];
      setPlans(plansData);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mapear símbolo de moeda
  const getCurrencySymbol = (currency) => {
    const symbols = { EUR: '€', USD: '$', BRL: 'R$', AOA: 'Kz', GBP: '£', CHF: 'CHF' };
    return symbols[currency] || currency || '€';
  };

  // Formatar preço - usar o price já formatado da API ou formatar manualmente
  const formatPrice = (plan) => {
    // Se a API já retorna price formatado, usar
    if (plan.price) return plan.price;
    // Senão, formatar manualmente
    if (!plan.priceValue && plan.priceValue !== 0) return 'Contacte-nos';
    const symbol = getCurrencySymbol(plan.currency);
    return `${symbol}${parseFloat(plan.priceValue).toFixed(0)}`;
  };

  // Parsear features do plano - a API já retorna array de features
  const parseFeatures = (plan) => {
    // A API retorna features como array de strings
    if (plan.features && Array.isArray(plan.features)) {
      return plan.features.map(f => ({ text: f, included: true }));
    }
    return [{ text: 'Suporte incluído', included: true }];
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Planos Transparentes
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Escolha o plano perfeito para o seu negócio. Sem taxas ocultas.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">A carregar planos...</span>
            </div>
          ) : (
            <div className={`grid gap-8 max-w-6xl mx-auto ${
              plans.length === 1 ? 'md:grid-cols-1 max-w-md' :
              plans.length === 2 ? 'md:grid-cols-2 max-w-3xl' :
              'md:grid-cols-3'
            }`}>
              {plans.map((plan, index) => (
                <PricingCard
                  key={plan.id || index}
                  name={plan.name}
                  price={formatPrice(plan)}
                  period={plan.priceValue ? '/mês' : ''}
                  description={plan.description || ''}
                  features={parseFeatures(plan)}
                  cta={plan.priceValue ? 'Começar Agora' : 'Contactar Vendas'}
                  highlighted={plan.highlighted || plan.planId === 'professional' || index === 1}
                  planId={plan.planId || plan.id}
                  trialDays={plan.trialDays || 0}
                />
              ))}
            </div>
          )}

          {/* FAQ */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
            <div className="space-y-6">
              <FAQItem
                question="Posso mudar de plano a qualquer momento?"
                answer="Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas no próximo ciclo de cobrança."
              />
              <FAQItem
                question="Existe período de fidelização?"
                answer="Não. Todos os nossos planos são mensais ou anuais sem compromisso. Você pode cancelar quando quiser."
              />
              <FAQItem
                question="O que acontece se eu exceder o limite de tickets?"
                answer="Não se preocupe! Você nunca perderá tickets. Entraremos em contato para ajustar o plano conforme seu uso."
              />
              <FAQItem
                question="Existe desconto para pagamento anual?"
                answer="Sim! Pagando anualmente você ganha 2 meses grátis (cerca de 17% de desconto)."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ainda tem dúvidas?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {plans.length > 0 && plans.some(p => p.trialDays > 0) 
              ? `Experimente gratuitamente por ${Math.max(...plans.map(p => p.trialDays || 0))} dias. Sem cartão de crédito.`
              : 'Experimente gratuitamente. Sem cartão de crédito.'
            }
          </p>
          <Link
            to="/trial"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            Iniciar Trial Gratuito
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2025 TatuTicket. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, cta, highlighted, planId, trialDays }) {
  return (
    <div className={`rounded-2xl p-8 ${
      highlighted 
        ? 'bg-blue-600 text-white shadow-2xl transform scale-105 ring-4 ring-blue-300' 
        : 'bg-white text-gray-900 shadow-lg'
    }`}>
      {highlighted && (
        <div className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full mb-4">
          MAIS POPULAR
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="mb-4">
        <span className={`text-5xl font-bold ${highlighted ? 'text-white' : 'text-blue-600'}`}>
          {price}
        </span>
        <span className={`text-lg ${highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
          {period}
        </span>
      </div>
      {trialDays > 0 && (
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
          highlighted 
            ? 'bg-green-400 text-green-900' 
            : 'bg-green-100 text-green-700'
        }`}>
          {trialDays} dias grátis
        </div>
      )}
      {description && (
        <p className={`mb-6 ${highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
          {description}
        </p>
      )}
      
      <Link
        to={planId ? `/onboarding?plan=${planId}` : '/trial'}
        className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors mb-8 ${
          highlighted
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {cta}
      </Link>

      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            {feature.included ? (
              <Check className={`w-5 h-5 flex-shrink-0 ${highlighted ? 'text-green-300' : 'text-green-500'}`} />
            ) : (
              <X className={`w-5 h-5 flex-shrink-0 ${highlighted ? 'text-blue-300' : 'text-gray-300'}`} />
            )}
            <span className={feature.included ? '' : 'opacity-50'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}
