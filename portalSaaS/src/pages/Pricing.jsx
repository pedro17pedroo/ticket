import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
              <span className="text-xl font-bold">TatuTicket</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-gray-600 hover:text-gray-900">Funcionalidades</Link>
              <Link to="/pricing" className="text-blue-600 font-medium">Preços</Link>
              <Link to="/trial" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Trial Gratuito
              </Link>
            </nav>
          </div>
        </div>
      </header>

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
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <PricingCard
              name="Starter"
              price="€49"
              period="/mês"
              description="Ideal para pequenas equipas"
              features={[
                { text: 'Até 10 utilizadores', included: true },
                { text: '1.000 tickets/mês', included: true },
                { text: 'Email + Portal', included: true },
                { text: 'Knowledge Base', included: true },
                { text: 'Suporte por email', included: true },
                { text: 'SLA básico', included: true },
                { text: 'API REST', included: false },
                { text: 'Webhooks', included: false },
                { text: 'Suporte 24/7', included: false },
                { text: 'White-label', included: false },
              ]}
              cta="Começar Agora"
            />

            {/* Professional */}
            <PricingCard
              name="Professional"
              price="€149"
              period="/mês"
              description="Para equipas em crescimento"
              features={[
                { text: 'Até 50 utilizadores', included: true },
                { text: '10.000 tickets/mês', included: true },
                { text: 'Todos os canais', included: true },
                { text: 'Knowledge Base avançada', included: true },
                { text: 'Suporte 24/7', included: true },
                { text: 'SLA avançado', included: true },
                { text: 'API REST ilimitada', included: true },
                { text: 'Webhooks', included: true },
                { text: 'Integrações', included: true },
                { text: 'Analytics avançado', included: true },
              ]}
              cta="Começar Agora"
              highlighted
            />

            {/* Enterprise */}
            <PricingCard
              name="Enterprise"
              price="Contacte-nos"
              period=""
              description="Solução personalizada"
              features={[
                { text: 'Utilizadores ilimitados', included: true },
                { text: 'Tickets ilimitados', included: true },
                { text: 'Todos os recursos', included: true },
                { text: 'Suporte dedicado', included: true },
                { text: 'SLA personalizado', included: true },
                { text: 'White-label completo', included: true },
                { text: 'On-Premise', included: true },
                { text: 'Treinamento', included: true },
                { text: 'Account Manager', included: true },
                { text: 'Custom development', included: true },
              ]}
              cta="Contactar Vendas"
            />
          </div>

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
            Experimente gratuitamente por 14 dias. Sem cartão de crédito.
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

function PricingCard({ name, price, period, description, features, cta, highlighted }) {
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
      <p className={`mb-6 ${highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
        {description}
      </p>
      
      <Link
        to="/trial"
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
