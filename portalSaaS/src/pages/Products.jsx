import { Link } from 'react-router-dom';
import { 
  Ticket, 
  Monitor, 
  Users, 
  Webhook, 
  Check,
  Zap,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react';

const Products = () => {
  const products = [
    {
      id: 'core',
      name: 'TatuTicket Core',
      description: 'Sistema principal de gestão de tickets com funcionalidades completas',
      icon: Ticket,
      color: 'from-blue-500 to-indigo-600',
      features: [
        'Gestão completa de tickets',
        'Multi-tenant B2B2C',
        'Catálogo de serviços',
        'SLA e automações',
        'Relatórios avançados',
        'Base de conhecimento'
      ],
      highlights: [
        'Arquitetura multi-tenant',
        'Escalabilidade enterprise',
        'API REST completa',
        'Customizações avançadas'
      ]
    },
    {
      id: 'agent',
      name: 'Desktop Agent',
      description: 'Coleta automática de inventário e monitoramento de dispositivos',
      icon: Monitor,
      color: 'from-green-500 to-emerald-600',
      features: [
        'Inventário automático',
        'Monitoramento em tempo real',
        'Detecção de hardware/software',
        'Alertas proativos',
        'Políticas de segurança',
        'Atualizações remotas'
      ],
      highlights: [
        'Coleta automatizada',
        'Baixo impacto no sistema',
        'Multiplataforma',
        'Instalação silenciosa'
      ]
    },
    {
      id: 'portal',
      name: 'Portal Cliente',
      description: 'Portal de autoatendimento para clientes finais',
      icon: Users,
      color: 'from-purple-500 to-violet-600',
      features: [
        'Abertura de tickets',
        'Catálogo de serviços',
        'Acompanhamento em tempo real',
        'Base de conhecimento',
        'Avaliações e feedback',
        'Chat integrado'
      ],
      highlights: [
        'Interface intuitiva',
        'Totalmente responsivo',
        'Personalizável',
        'SSO integrado'
      ]
    },
    {
      id: 'integrations',
      name: 'Integrações',
      description: 'Conecte com suas ferramentas e sistemas existentes',
      icon: Webhook,
      color: 'from-orange-500 to-red-600',
      features: [
        'API REST completa',
        'Webhooks configuráveis',
        'SSO/LDAP/Active Directory',
        'Microsoft 365',
        'Slack, Teams, Discord',
        'ITSM populares'
      ],
      highlights: [
        '+50 integrações nativas',
        'Webhooks personalizados',
        'Documentação completa',
        'SDKs disponíveis'
      ]
    }
  ];

  const stats = [
    { label: 'Organizações Ativas', value: '500+' },
    { label: 'Tickets Processados', value: '1M+' },
    { label: 'Uptime Garantido', value: '99.9%' },
    { label: 'Países Atendidos', value: '25+' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Ecossistema Completo
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Soluções integradas para gestão de tickets, inventário, autoatendimento 
              e integrações que transformam o atendimento da sua empresa.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossos Produtos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cada produto foi desenvolvido para atender necessidades específicas, 
              mas funcionam melhor quando integrados.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {products.map((product, index) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${product.color} p-6 text-white`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl mr-4">
                      <product.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{product.name}</h3>
                      <p className="text-white/90">{product.description}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Funcionalidades Principais</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {product.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Destaques</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.highlights.map((highlight, hIndex) => (
                        <span 
                          key={hIndex}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="pt-4 border-t border-gray-200 text-center">
                    <span className="text-sm text-gray-500">
                      Incluso em todos os planos
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Melhor Quando Integrados
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nossos produtos funcionam de forma independente, mas oferecem valor máximo 
              quando utilizados em conjunto, criando um ecossistema completo de atendimento.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Performance Otimizada
              </h3>
              <p className="text-gray-600">
                Integração nativa entre produtos garante máxima performance e sincronização de dados em tempo real.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Segurança Unificada
              </h3>
              <p className="text-gray-600">
                Políticas de segurança centralizadas, SSO integrado e controle de acesso unificado em todos os produtos.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Relatórios Consolidados
              </h3>
              <p className="text-gray-600">
                Dashboards e relatórios que consolidam dados de todos os produtos para uma visão 360° do seu negócio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para Transformar seu Atendimento?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experimente nosso ecossistema completo com trial gratuito de 14 dias. 
            Sem compromisso, sem cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/onboarding"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Começar Trial Gratuito
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Falar com Especialista
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Products;
