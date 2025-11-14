import { Building2, User, Settings, Globe, CreditCard, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';

const SummaryStep = ({ data, onUpdate, onValidationChange }) => {
  const formatPlanName = (planId) => {
    const plans = {
      starter: 'Starter (R$ 49/mês)',
      business: 'Business (R$ 99/mês)',
      enterprise: 'Enterprise (R$ 199/mês)'
    };
    return plans[planId] || planId;
  };

  const formatTheme = (theme) => {
    const themes = {
      light: 'Claro',
      dark: 'Escuro',
      auto: 'Automático'
    };
    return themes[theme] || theme;
  };

  const formatLanguage = (lang) => {
    const languages = {
      pt: 'Português (Brasil)',
      en: 'English',
      es: 'Español'
    };
    return languages[lang] || lang;
  };

  const summaryCards = [
    {
      title: 'Informações da Empresa',
      icon: Building2,
      color: 'bg-blue-500',
      items: [
        { label: 'Nome da Organização', value: data.organizationName },
        { label: 'Domínio', value: `${data.slug}.tatuticket.com` },
        { label: 'Setor', value: data.industry },
        { label: 'Tamanho', value: data.companySize },
        { label: 'Telefone', value: data.phone || 'Não informado' },
        { label: 'País', value: data.country || 'Não informado' },
        { label: 'Cidade', value: data.city || 'Não informado' }
      ]
    },
    {
      title: 'Administrador',
      icon: User,
      color: 'bg-green-500',
      items: [
        { label: 'Nome Completo', value: data.fullName },
        { label: 'E-mail', value: data.email },
        { label: 'Role', value: 'Administrador da Organização' },
        { label: 'Acesso', value: 'Permissões completas' }
      ]
    },
    {
      title: 'Configurações',
      icon: Settings,
      color: 'bg-purple-500',
      items: [
        { label: 'Plano', value: formatPlanName(data.plan) },
        { label: 'Idioma', value: formatLanguage(data.language) },
        { label: 'Tema', value: formatTheme(data.theme) },
        { label: 'Fuso Horário', value: data.timezone },
        { label: 'Notificações', value: data.notifications ? 'Ativadas' : 'Desativadas' },
        { label: 'E-mail', value: data.emailNotifications ? 'Ativado' : 'Desativado' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Revise suas Informações
        </h3>
        <p className="text-gray-600">
          Verifique se todas as informações estão corretas antes de criar sua organização
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-6">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Card Header */}
            <div className={`${card.color} px-6 py-4`}>
              <div className="flex items-center text-white">
                <card.icon className="h-6 w-6 mr-3" />
                <h4 className="text-lg font-semibold">{card.title}</h4>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {card.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-700">{item.label}:</span>
                    <span className="text-sm text-gray-900 font-medium text-right ml-4 max-w-xs">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          O que acontece a seguir?
        </h4>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              1
            </div>
            <div>
              <h5 className="font-medium text-blue-900">Criação da Organização</h5>
              <p className="text-sm text-blue-800">
                Sua organização será criada instantaneamente com todas as configurações
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              2
            </div>
            <div>
              <h5 className="font-medium text-blue-900">Configuração Inicial</h5>
              <p className="text-sm text-blue-800">
                Dados básicos serão configurados automaticamente (SLAs, prioridades, etc.)
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              3
            </div>
            <div>
              <h5 className="font-medium text-blue-900">Acesso ao Portal</h5>
              <p className="text-sm text-blue-800">
                Você receberá as credenciais e poderá acessar <strong>{data.slug}.tatuticket.com</strong>
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              4
            </div>
            <div>
              <h5 className="font-medium text-blue-900">Trial de 14 Dias</h5>
              <p className="text-sm text-blue-800">
                Período gratuito para testar todas as funcionalidades do plano {formatPlanName(data.plan)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="mb-2">
              Ao criar sua organização, você concorda com nossos{' '}
              <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                Política de Privacidade
              </a>.
            </p>
            <p>
              <strong>Nota sobre pagamento:</strong> Você não será cobrado durante os primeiros 14 dias. 
              Após o período de trial, será cobrado automaticamente conforme o plano selecionado, 
              a menos que cancele antes.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Tem dúvidas sobre a configuração? {' '}
          <a href="/contact" className="text-blue-600 hover:underline">
            Entre em contato conosco
          </a>
        </p>
      </div>
    </div>
  );
};

export default SummaryStep;
