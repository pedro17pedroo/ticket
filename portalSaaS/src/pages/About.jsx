import { Award, Users, Target, Zap, Heart, Globe } from 'lucide-react';

const About = () => {
  const stats = [
    { label: 'Organizações Ativas', value: '500+' },
    { label: 'Tickets Processados', value: '1M+' },
    { label: 'Uptime', value: '99.9%' },
    { label: 'Países', value: '25+' }
  ];

  const values = [
    {
      icon: Target,
      title: 'Foco no Cliente',
      description: 'Desenvolvemos cada funcionalidade pensando na experiência do usuário final'
    },
    {
      icon: Zap,
      title: 'Inovação',
      description: 'Sempre buscamos as melhores tecnologias para oferecer soluções modernas'
    },
    {
      icon: Heart,
      title: 'Paixão',
      description: 'Amamos o que fazemos e isso se reflete na qualidade dos nossos produtos'
    },
    {
      icon: Globe,
      title: 'Acessibilidade',
      description: 'Tornamos a gestão de tickets acessível para empresas de todos os tamanhos'
    }
  ];

  const team = [
    {
      name: 'Pedro Divino',
      role: 'CEO & Founder',
      image: '/api/placeholder/150/150',
      description: 'Especialista em arquitetura de software e gestão de produtos'
    },
    {
      name: 'Maria Santos',
      role: 'CTO',
      image: '/api/placeholder/150/150',
      description: 'Líder técnica com mais de 10 anos em desenvolvimento de sistemas enterprise'
    },
    {
      name: 'João Silva',
      role: 'Head of Product',
      image: '/api/placeholder/150/150',
      description: 'Product Manager com foco em UX e experiência do cliente'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Sobre o TatuTicket
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Somos uma empresa focada em simplificar a gestão de atendimento ao cliente 
              através de tecnologia inovadora e soluções inteligentes.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Nossa Missão
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Democratizar o acesso a ferramentas profissionais de gestão de tickets, 
                permitindo que empresas de todos os tamanhos ofereçam um atendimento 
                excepcional aos seus clientes.
              </p>
              <p className="text-lg text-gray-600">
                Acreditamos que toda empresa merece ter acesso às melhores ferramentas 
                para crescer e prosperar, independentemente do seu tamanho ou orçamento.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
              <Award className="h-16 w-16 text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Reconhecimento
              </h3>
              <p className="text-gray-700">
                Eleito como uma das startups mais promissoras do setor de tecnologia 
                em 2024, com crescimento de 300% ao ano.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossos Valores
            </h2>
            <p className="text-lg text-gray-600">
              Os princípios que guiam cada decisão e produto que desenvolvemos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossa Equipe
            </h2>
            <p className="text-lg text-gray-600">
              Profissionais apaixonados por tecnologia e atendimento ao cliente
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium mb-4">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossa História
            </h2>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-right mr-8">
                <span className="text-lg font-bold text-blue-600">2023</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Fundação da TatuTicket
                </h3>
                <p className="text-gray-600">
                  Iniciamos com a missão de criar a melhor plataforma de gestão de tickets do mercado, 
                  focando em usabilidade e funcionalidades avançadas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-right mr-8">
                <span className="text-lg font-bold text-blue-600">2024</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Lançamento da Plataforma SaaS
                </h3>
                <p className="text-gray-600">
                  Lançamos oficialmente a plataforma, rapidamente ganhando tração 
                  com mais de 100 organizações nos primeiros 6 meses.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-right mr-8">
                <span className="text-lg font-bold text-blue-600">2025</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Expansão Internacional
                </h3>
                <p className="text-gray-600">
                  Expansão para mercados internacionais com suporte multi-idioma 
                  e compliance com regulamentações globais.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para transformar seu atendimento?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a centenas de empresas que já escolheram o TatuTicket
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/onboarding"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Começar Agora
            </a>
            <a
              href="/contact"
              className="px-8 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Falar com Vendas
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
