import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check, Zap, Shield, Globe, Star, Heart, Clock, Users, Lock, Rocket } from 'lucide-react';
import { getLandingPageConfig } from '../services/api';

// Mapeamento de ícones
const iconMap = {
  Zap, Shield, Globe, Star, Heart, Check, Clock, Users, Lock, Rocket
};

export default function Home() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const data = await getLandingPageConfig();
    if (data) {
      setConfig(data);
    }
    setLoading(false);
  };

  // Valores padrão enquanto carrega
  const defaultConfig = {
    heroBadge: '#1 em Funcionalidades do Mercado',
    heroTitle: 'Gestão de Tickets',
    heroSubtitle: 'Multi-Tenant B2B2C',
    heroDescription: 'Plataforma completa de Help Desk com arquitetura multi-tenant, gestão de clientes B2B e funcionalidades enterprise.',
    heroCta1Text: 'Começar Agora',
    heroCta1Link: '/trial',
    heroCta2Text: 'Ver Funcionalidades',
    heroCta2Link: '/features',
    stats: [
      { value: '32+', label: 'Funcionalidades' },
      { value: '99.9%', label: 'Uptime' },
      { value: '24/7', label: 'Suporte' }
    ],
    featuresTitle: 'Por que escolher TatuTicket?',
    featuresSubtitle: 'A solução mais completa do mercado para gestão de tickets',
    features: [
      { icon: 'Zap', title: 'Ultra Rápido', description: 'Performance otimizada para milhões de usuários simultâneos' },
      { icon: 'Shield', title: 'Seguro', description: 'Criptografia end-to-end e conformidade com GDPR' },
      { icon: 'Globe', title: 'Multi-Tenant', description: 'Arquitetura B2B2C com segregação completa de dados' }
    ],
    pricingTitle: 'Planos Flexíveis',
    pricingSubtitle: 'Escolha o melhor plano para sua empresa',
    pricingPlans: [
      { name: 'Starter', price: '€49', features: ['Até 10 usuários', '1000 tickets/mês', 'Suporte por email'], highlighted: false },
      { name: 'Professional', price: '€149', features: ['Até 50 usuários', '10000 tickets/mês', 'Suporte 24/7', 'API access'], highlighted: true },
      { name: 'Enterprise', price: 'Contacte-nos', features: ['Usuários ilimitados', 'Tickets ilimitados', 'Suporte dedicado', 'White-label'], highlighted: false }
    ],
    ctaTitle: 'Pronto para começar?',
    ctaDescription: 'Experimente gratuitamente por 14 dias. Sem cartão de crédito.',
    ctaButtonText: 'Iniciar Trial Gratuito',
    ctaButtonLink: '/trial'
  };

  const c = config || defaultConfig;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-sm font-medium">
                {c.heroBadge}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              {c.heroTitle}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                {c.heroSubtitle}
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto">
              {c.heroDescription}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={c.heroCta1Link}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                {c.heroCta1Text}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to={c.heroCta2Link}
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                {c.heroCta2Text}
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {c.stats.map((stat, index) => (
                <div key={index}>
                  <p className="text-4xl font-bold text-white">{stat.value}</p>
                  <p className="text-blue-200 mt-2">{stat.label}</p>
                </div>
              ))}
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
              {c.featuresTitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {c.featuresSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {c.features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || Zap;
              return (
                <FeatureCard
                  key={index}
                  icon={<IconComponent className="w-8 h-8" />}
                  title={feature.title}
                  description={feature.description}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing-section" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {c.pricingTitle}
            </h2>
            <p className="text-xl text-gray-600">
              {c.pricingSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {c.pricingPlans.map((plan, index) => (
              <PricingCard
                key={index}
                planId={plan.name.toLowerCase()}
                name={plan.name}
                price={plan.price}
                features={plan.features}
                highlighted={plan.highlighted}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Clients Logos Carousel */}
      {c.clientsLogos && c.clientsLogos.length > 0 && (
        <ClientsCarousel clients={c.clientsLogos} title={c.clientsTitle} />
      )}

      {/* Testimonials */}
      {c.testimonials && c.testimonials.length > 0 && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {c.testimonialsTitle || 'O que nossos clientes dizem'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {c.testimonialsSubtitle || 'Veja como o TatuTicket transformou o atendimento dessas empresas'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {c.testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {c.ctaTitle}
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            {c.ctaDescription}
          </p>
          <Link
            to={c.ctaButtonLink}
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            {c.ctaButtonText}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ClientsCarousel({ clients, title }) {
  // Duplicar os clientes para criar efeito infinito
  const duplicatedClients = [...clients, ...clients, ...clients];

  return (
    <section className="py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-600">
            {title || 'Empresas que confiam em nós'}
          </h2>
        </div>
      </div>
      
      {/* Carousel Container */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10"></div>
        
        {/* Scrolling Container */}
        <div className="flex animate-scroll">
          {duplicatedClients.map((client, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 mx-8 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              {client.logoUrl ? (
                <img 
                  src={client.logoUrl} 
                  alt={client.name} 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="h-12 px-8 bg-gray-200 rounded-lg items-center justify-center text-gray-500 font-medium whitespace-nowrap" 
                style={{ display: client.logoUrl ? 'none' : 'flex' }}
              >
                {client.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(testimonial.rating || 5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      
      {/* Quote */}
      <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
      
      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
          {testimonial.avatar ? (
            <img 
              src={testimonial.avatar} 
              alt={testimonial.name} 
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = testimonial.name?.charAt(0) || 'U';
              }}
            />
          ) : (
            testimonial.name?.charAt(0) || 'U'
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{testimonial.name}</p>
          <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
        </div>
      </div>
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

function PricingCard({ planId, name, price, features, highlighted }) {
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
        to={`/onboarding?plan=${planId}`}
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
