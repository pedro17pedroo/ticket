import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, CreditCard, Palette, Globe, Clock, Bell, Shield } from 'lucide-react';

const ConfigurationStep = ({ data, onUpdate, onValidationChange }) => {
  const { register, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      plan: 'starter',
      theme: 'light',
      language: 'pt',
      timezone: 'America/Sao_Paulo',
      notifications: true,
      emailNotifications: true,
      ...data
    }
  });

  const watchedFields = watch();

  // Atualizar store quando campos mudarem
  useEffect(() => {
    onUpdate(watchedFields);
  }, [watchedFields, onUpdate]);

  // Validar step
  useEffect(() => {
    const isValid = !!(
      watchedFields.plan &&
      watchedFields.country
    );
    onValidationChange(isValid);
  }, [watchedFields, onValidationChange]);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'R$ 49',
      period: '/mês',
      description: 'Perfeito para pequenas equipes',
      features: [
        'Até 5 agentes',
        '1.000 tickets/mês',
        'Portal do cliente',
        'Relatórios básicos',
        'Suporte por email'
      ],
      popular: false
    },
    {
      id: 'business',
      name: 'Business',
      price: 'R$ 99',
      period: '/mês',
      description: 'Ideal para empresas em crescimento',
      features: [
        'Até 15 agentes',
        '5.000 tickets/mês',
        'Desktop Agent',
        'Automações',
        'Relatórios avançados',
        'Integrações',
        'Suporte prioritário'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'R$ 199',
      period: '/mês',
      description: 'Para organizações robustas',
      features: [
        'Agentes ilimitados',
        'Tickets ilimitados',
        'SLA personalizado',
        'API completa',
        'SSO e LDAP',
        'Compliance avançado',
        'Suporte 24/7',
        'Success Manager'
      ],
      popular: false
    }
  ];

  const themes = [
    { id: 'light', name: 'Claro', preview: 'bg-white border-gray-300' },
    { id: 'dark', name: 'Escuro', preview: 'bg-gray-900 border-gray-700' },
    { id: 'auto', name: 'Automático', preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-500' }
  ];

  const languages = [
    { id: 'pt', name: 'Português (Brasil)', flag: '🇧🇷' },
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  const timezones = [
    { id: 'America/Sao_Paulo', name: 'Brasília (UTC-3)' },
    { id: 'America/New_York', name: 'Nova York (UTC-5)' },
    { id: 'Europe/London', name: 'Londres (UTC+0)' },
    { id: 'Europe/Madrid', name: 'Madrid (UTC+1)' },
    { id: 'America/Argentina/Buenos_Aires', name: 'Buenos Aires (UTC-3)' }
  ];

  const countries = [
    'Brasil', 'Portugal', 'Estados Unidos', 'Canadá', 'Reino Unido', 
    'Alemanha', 'França', 'Espanha', 'Argentina', 'Chile', 'Outro'
  ];

  return (
    <div className="space-y-8">
      {/* Plan Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Escolha seu Plano
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                watchedFields.plan === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${plan.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              onClick={() => setValue('plan', plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <input
                {...register('plan', { required: 'Selecione um plano' })}
                type="radio"
                value={plan.id}
                className="sr-only"
              />
            </div>
          ))}
        </div>
        
        {errors.plan && (
          <p className="mt-2 text-sm text-red-600">{errors.plan.message}</p>
        )}
      </div>

      {/* Localization Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Configurações Regionais
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              País *
            </label>
            <select
              {...register('country', { required: 'País é obrigatório' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione o país</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idioma
            </label>
            <select
              {...register('language')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Fuso Horário
            </label>
            <select
              {...register('timezone')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timezones.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Aparência
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                watchedFields.theme === theme.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setValue('theme', theme.id)}
            >
              <div className={`w-full h-16 rounded-lg mb-3 ${theme.preview}`} />
              <div className="text-center">
                <span className="text-sm font-medium text-gray-900">{theme.name}</span>
              </div>
              <input
                {...register('theme')}
                type="radio"
                value={theme.id}
                className="sr-only"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notificações
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Notificações no Sistema</h4>
              <p className="text-sm text-gray-600">Receber notificações dentro da plataforma</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                {...register('notifications')}
                type="checkbox"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Notificações por E-mail</h4>
              <p className="text-sm text-gray-600">Receber atualizações importantes por e-mail</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                {...register('emailNotifications')}
                type="checkbox"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-900 mb-1">Trial de 14 dias grátis</h4>
            <p className="text-sm text-green-800">
              Você terá acesso completo ao plano selecionado por 14 dias. 
              Não será cobrado até o final do período de trial. 
              Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStep;
