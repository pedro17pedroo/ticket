import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check, Zap, Shield, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">{/* O Header está no Layout */}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-sm font-medium">
                #1 em Funcionalidades do Mercado
              </span>
            </div>

            {/* Título */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Gestão de Tickets
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                Multi-Tenant B2B2C
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Plataforma completa de Help Desk com arquitetura multi-tenant,
              gestão de clientes B2B e funcionalidades enterprise.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/trial"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                Ver Funcionalidades
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <p className="text-4xl font-bold text-white">32+</p>
                <p className="text-blue-200 mt-2">Funcionalidades</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white">99.9%</p>
                <p className="text-blue-200 mt-2">Uptime</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white">24/7</p>
                <p className="text-blue-200 mt-2">Suporte</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por que escolher TatuTicket?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A solução mais completa do mercado para gestão de tickets
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Ultra Rápido"
              description="Performance otimizada para milhões de usuários simultâneos"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Seguro"
              description="Criptografia end-to-end e conformidade com GDPR"
            />
            <FeatureCard
              icon={<Globe className="w-8 h-8" />}
              title="Multi-Tenant"
              description="Arquitetura B2B2C com segregação completa de dados"
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planos Flexíveis
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o melhor plano para sua empresa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Starter"
              price="€49"
              features={['Até 10 usuários', '1000 tickets/mês', 'Suporte por email']}
            />
            <PricingCard
              name="Professional"
              price="€149"
              features={['Até 50 usuários', '10000 tickets/mês', 'Suporte 24/7', 'API access']}
              highlighted
            />
            <PricingCard
              name="Enterprise"
              price="Contacte-nos"
              features={['Usuários ilimitados', 'Tickets ilimitados', 'Suporte dedicado', 'White-label']}
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Experimente gratuitamente por 14 dias. Sem cartão de crédito.
          </p>
          <Link
            to="/trial"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Iniciar Trial Gratuito
            <ArrowRight className="ml-2 w-5 h-5" />
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

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, features, highlighted }) {
  return (
    <div className={`rounded-xl p-8 ${
      highlighted 
        ? 'bg-blue-600 text-white shadow-2xl transform scale-105' 
        : 'bg-white text-gray-900 shadow-lg'
    }`}>
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className={`text-4xl font-bold mb-6 ${highlighted ? 'text-white' : 'text-blue-600'}`}>
        {price}
        {price !== 'Contacte-nos' && <span className="text-lg">/mês</span>}
      </p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/trial"
        className={`block text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
          highlighted
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Começar
      </Link>
    </div>
  );
}
