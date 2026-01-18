import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Building2, 
  User, 
  Mail, 
  Key,
  Rocket,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  CreditCard,
  ArrowLeft,
  Ticket
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { saasAPI } from '../services/api';

// Input memoizado para evitar perda de foco
const MemoizedInput = memo(({ register, type, className, placeholder, errors, fieldName }) => (
  <>
    <input
      {...register}
      type={type}
      className={className}
      placeholder={placeholder}
    />
    {errors[fieldName] && (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName].message}</p>
    )}
  </>
));

// Input simples para código de verificação de 6 dígitos
const VerificationCodeInput = memo(({ value, onChange, disabled }) => {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    let val = e.target.value;
    // Remove tudo que não for número e espaços
    val = val.replace(/[^0-9\s]/g, '');
    // Remove espaços
    val = val.replace(/\s/g, '');
    // Limita a 6 dígitos
    val = val.slice(0, 6);
    
    onChange(val);
  };

  // Auto-foco quando monta
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="flex justify-center">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value || ''}
        onChange={handleChange}
        placeholder="000000"
        disabled={disabled}
        className="w-48 h-14 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-100"
        autoComplete="off"
      />
    </div>
  );
});

// Step 3: Password (fora da função principal para evitar re-criações)
const PasswordStepComponent = memo(({ onSubmit, register, handleSubmit, watchPassword, errors, isLoading, setCurrentStep }) => {

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Key className="h-5 w-5 text-amber-600 mr-2" />
          <p className="text-sm text-amber-800">
            Esta senha será usada para acessar o portal da sua organização.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Senha *
        </label>
        <input
          key="password-input-field"
          {...register('password', { 
            required: 'Senha é obrigatória',
            minLength: { value: 8, message: 'Mínimo 8 caracteres' }
          })}
          type="password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Digite uma senha segura"
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmar Senha *
        </label>
        <input
          key="confirm-password-input-field"
          {...register('confirmPassword', { 
            required: 'Confirmação de senha é obrigatória',
            validate: value => value === watchPassword || 'Senhas não coincidem'
          })}
          type="password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Confirme a senha"
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              Criar Organização
              <Rocket className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
});

// ========== COMPONENTES DE STEPS (FORA DA FUNÇÃO PRINCIPAL) ==========

// Step 0: Company Information (FORA da função principal)
const CompanyStepComponent = memo(({ 
  register, 
  handleSubmit, 
  setValue, 
  clearErrors, 
  setError, 
  errors, 
  onSubmit,
  saasAPI,
  companyForm 
}) => {
  const generateSlug = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const checkSlugAvailability = async (slug) => {
    try {
      const result = await saasAPI.checkSlugAvailability(slug);
      if (!result.available) {
        companyForm.setError('slug', { 
          type: 'manual', 
          message: 'Este domínio já está em uso' 
        });
      } else {
        companyForm.clearErrors('slug');
      }
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="inline h-4 w-4 mr-1" />
            Nome da Empresa *
          </label>
          <input
            {...register('companyName', { 
              required: 'Nome da empresa é obrigatório',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' }
            })}
            onBlur={(e) => {
              const name = e.target.value;
              if (name) {
                const slug = generateSlug(name);
                setValue('slug', slug);
                checkSlugAvailability(slug);
              }
            }}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Minha Empresa Lda"
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Comercial
          </label>
          <input
            {...register('tradingName')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nome fantasia (opcional)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Domínio da Organização *
        </label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <div className="px-3 py-3 bg-gray-50 text-gray-600 text-sm flex items-center">
            https://
          </div>
          <input
            {...register('slug', { 
              required: 'Domínio é obrigatório',
              pattern: { value: /^[a-z0-9-]+$/, message: 'Apenas letras minúsculas, números e hífens' }
            })}
            type="text"
            className="flex-1 px-3 py-3 border-0 focus:ring-2 focus:ring-blue-500"
            placeholder="minha-empresa"
            onChange={(e) => {
              const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
              setValue('slug', slug);
              if (slug) {
                checkSlugAvailability(slug);
              }
            }}
          />
          <div className="px-3 py-3 bg-gray-50 text-gray-600 text-sm flex items-center">
            .tatuticket.com
          </div>
        </div>
        {errors.slug && (
          <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
        )}
        {!errors.slug && (
          <p className="mt-1 text-sm text-green-600">✓ Domínio disponível: mir.tatuticket.com</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email da Empresa
          </label>
          <input
            {...register('companyEmail', { 
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' }
            })}
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contato@empresa.com"
          />
          {errors.companyEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.companyEmail.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+244 9XX XXX XXX"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Setor/Indústria *
          </label>
          <select
            {...register('industry', { required: 'Setor é obrigatório' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            <option value="technology">Tecnologia</option>
            <option value="healthcare">Saúde</option>
            <option value="finance">Financeiro</option>
            <option value="education">Educação</option>
            <option value="retail">Varejo</option>
            <option value="consulting">Consultoria</option>
            <option value="manufacturing">Indústria</option>
            <option value="other">Outro</option>
          </select>
          {errors.industry && (
            <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tamanho da Empresa *
          </label>
          <select
            {...register('size', { required: 'Tamanho é obrigatório' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            <option value="1-10">1-10 funcionários</option>
            <option value="11-50">11-50 funcionários</option>
            <option value="51-200">51-200 funcionários</option>
            <option value="201-1000">201-1000 funcionários</option>
            <option value="1000+">1000+ funcionários</option>
          </select>
          {errors.size && (
            <p className="mt-1 text-sm text-red-600">{errors.size.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          Continuar
          <ChevronRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </form>
  );
});

const OnboardingNew = () => {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const [emailToken, setEmailToken] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  // Obter plano da URL (ex: /onboarding?plan=professional)
  const selectedPlan = searchParams.get('plan') || 'starter';
  
  // Obter parâmetros de verificação da URL (ex: /onboarding?verify=TOKEN&email=EMAIL)
  const verifyToken = searchParams.get('verify');
  const verifyEmail = searchParams.get('email');
  
  // Usar useRef para controlar envio de email globalmente
  const emailSentRef = useRef(false);
  const verifyAttemptedRef = useRef(false);

  // Processar verificação automática se vier do link do email
  useEffect(() => {
    const autoVerify = async () => {
      if (verifyToken && verifyEmail && !verifyAttemptedRef.current) {
        verifyAttemptedRef.current = true;
        setEmailToken(verifyToken);
        
        try {
          await saasAPI.verifyEmail(verifyEmail, verifyToken);
          toast.success('Email verificado com sucesso!');
          // Ir para o step de definir senha
          setCurrentStep(3);
        } catch (error) {
          console.error('Erro na verificação automática:', error);
          toast.error('Código de verificação inválido ou expirado. Por favor, solicite um novo código.');
          // Ir para o step de verificação manual
          setCurrentStep(2);
        }
      }
    };
    
    autoVerify();
  }, [verifyToken, verifyEmail]);

  // Carregar planos da API ao montar
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await saasAPI.getPlans();
        if (response.plans && response.plans.length > 0) {
          setPlans(response.plans);
          // Encontrar o plano selecionado (comparar com planId que vem da URL)
          const planData = response.plans.find(p => 
            p.planId === selectedPlan || 
            p.planId?.toLowerCase() === selectedPlan?.toLowerCase() ||
            p.name?.toLowerCase() === selectedPlan?.toLowerCase()
          );
          if (planData) {
            setSelectedPlanData(planData);
          } else {
            // Se não encontrar, usar o primeiro plano como fallback
            setSelectedPlanData(response.plans[0]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
        // Em caso de erro, usar dados padrão
        const fallbackPlan = {
          planId: selectedPlan || 'starter',
          name: selectedPlan ? selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1) : 'Starter',
          priceValue: 0,
          currencySymbol: '€',
          trialDays: 14
        };
        setSelectedPlanData(fallbackPlan);
      }
    };
    loadPlans();
  }, [selectedPlan]);

  // Controlar mudanças de step para email
  useEffect(() => {
    if (currentStep === 2) {
      // Log removido para produção
    }
  }, [currentStep]);

  const steps = [
    {
      id: 0,
      title: 'Informações da Empresa',
      description: 'Conte-nos sobre sua organização',
      icon: Building2
    },
    {
      id: 1,
      title: 'Utilizador Administrador',
      description: 'Configure sua conta de administrador',
      icon: User
    },
    {
      id: 2,
      title: 'Verificação de Email',
      description: 'Valide seu email para ativar a conta',
      icon: Mail
    },
    {
      id: 3,
      title: 'Senha de Acesso',
      description: 'Defina uma senha segura',
      icon: Key
    },
    {
      id: 4,
      title: 'Sucesso!',
      description: 'Sua organização está pronta',
      icon: Rocket
    }
  ];

  // Forms para cada step
  const companyForm = useForm();
  const adminForm = useForm();
  const passwordForm = useForm();

  // Função para obter nome do plano formatado com preço e moeda
  const getPlanDisplayName = () => {
    if (selectedPlanData) {
      const { name, priceValue, currencySymbol } = selectedPlanData;
      if (priceValue === 0) return `${name} - Grátis`;
      if (priceValue === -1) return `${name} - Contacte-nos`;
      return `${name} - ${currencySymbol}${priceValue}/mês`;
    }
    // Fallback se não tiver dados do plano
    return selectedPlan ? selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1) : 'Starter';
  };

  // Função para alterar o plano selecionado
  const handleChangePlan = (plan) => {
    setSelectedPlanData(plan);
    setShowPlanModal(false);
    // Atualizar URL sem recarregar a página
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('plan', plan.planId);
    window.history.pushState({}, '', newUrl);
  };

  // Modal de seleção de plano
  const PlanSelectionModal = () => {
    if (!showPlanModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Escolha seu Plano</h2>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mt-2">Selecione o plano que melhor se adequa às suas necessidades</p>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPlanData?.id === plan.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleChangePlan(plan)}
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-4">
                      {plan.priceValue === 0 ? 'Grátis' : 
                       plan.priceValue === -1 ? 'Contacte-nos' : 
                       `${plan.currencySymbol}${plan.priceValue}`}
                      {plan.priceValue > 0 && <span className="text-lg">/mês</span>}
                    </div>
                    
                    {plan.trialDays > 0 && (
                      <div className="mb-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {plan.trialDays} dias grátis
                        </span>
                      </div>
                    )}

                    <ul className="text-left space-y-2 mb-4">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedPlanData?.id === plan.id && (
                      <div className="mt-4 flex items-center justify-center text-blue-600 font-semibold">
                        <Check className="w-5 h-5 mr-1" />
                        Selecionado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowPlanModal(false)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Confirmar Plano
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Step 0: Company Information
  const CompanyStep = () => {
    const { register, handleSubmit, setValue, clearErrors, setError, formState: { errors } } = companyForm;

    // Funções de slug removidas - será implementado em fase futura

    const onSubmit = (data) => {
      setCurrentStep(1);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Plano Selecionado - Clicável */}
        {selectedPlan && (
          <div 
            onClick={() => setShowPlanModal(true)}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-2 cursor-pointer hover:border-blue-400 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-blue-800">
                    Plano selecionado: <strong className="text-blue-900">{getPlanDisplayName()}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedPlanData?.trialDays > 0 
                      ? `${selectedPlanData.trialDays} dias de trial grátis incluídos`
                      : 'O plano será associado à sua organização após o cadastro'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedPlanData?.trialDays > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {selectedPlanData.trialDays} dias grátis
                  </span>
                )}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                >
                  Alterar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="inline h-4 w-4 mr-1" />
              Nome da Empresa *
            </label>
            <input
              {...register('companyName', { 
                required: 'Nome da empresa é obrigatório',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: TechSolutions Lda"
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Comercial
            </label>
            <input
              {...register('tradeName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome fantasia (opcional)"
            />
          </div>
        </div>

        {/* Campo de subdomínio removido temporariamente - será implementado em fase futura */}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email da Empresa
            </label>
            <input
              {...register('email', {
                validate: (value) => {
                  if (value && !/\S+@\S+\.\S+/.test(value)) {
                    return 'Email inválido';
                  }
                  return true;
                }
              })}
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contato@minha-empresa.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              {...register('phone')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+244 9XX XXX XXX"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setor/Indústria *
            </label>
            <select
              {...register('industry', { required: 'Setor é obrigatório' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              <option value="Tecnologia">Tecnologia</option>
              <option value="Consultoria">Consultoria</option>
              <option value="Manufatura">Manufatura</option>
              <option value="Saúde">Saúde</option>
              <option value="Educação">Educação</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Outro">Outro</option>
            </select>
            {errors.industry && (
              <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho da Empresa *
            </label>
            <select
              {...register('companySize', { required: 'Tamanho é obrigatório' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              <option value="1-10">1-10 funcionários</option>
              <option value="11-50">11-50 funcionários</option>
              <option value="51-200">51-200 funcionários</option>
              <option value="201-500">201-500 funcionários</option>
              <option value="500+">500+ funcionários</option>
            </select>
            {errors.companySize && (
              <p className="mt-1 text-sm text-red-600">{errors.companySize.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            Continuar
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    );
  };

  // Step 1: Admin User
  const AdminStep = () => {
    const { register, handleSubmit, formState: { errors } } = adminForm;

    const onSubmit = (data) => {
      setCurrentStep(2);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              Esta conta será o administrador principal da sua organização, com acesso total ao sistema.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              {...register('adminName', { 
                required: 'Nome é obrigatório',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="João Silva"
            />
            {errors.adminName && (
              <p className="mt-1 text-sm text-red-600">{errors.adminName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              {...register('adminEmail', { 
                required: 'Email é obrigatório',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Email inválido'
                }
              })}
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="joao@empresa.com"
            />
            {errors.adminEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.adminEmail.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            {...register('adminPhone')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+244 9XX XXX XXX"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(0)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            Continuar
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    );
  };

  // Step 2: Email Verification
  const EmailVerificationStep = () => {
    const [verifying, setVerifying] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    // Enviar email ao entrar neste step (apenas uma vez)
    useEffect(() => {
      if (!emailSentRef.current) {
        const sendEmail = async () => {
          const companyData = companyForm.getValues();
          const adminData = adminForm.getValues();
          
          if (companyData.companyName && adminData.adminName && adminData.adminEmail) {
            emailSentRef.current = true; // Marcar como enviado imediatamente
            setSendingEmail(true);
            
            try {
              const result = await saasAPI.sendVerificationEmail(
                adminData.adminEmail,
                adminData.adminName,
                companyData.companyName
              );
              
              // Email enviado com sucesso
              if (result.data?.emailSent) {
                toast.success('Email de verificação enviado! Verifique sua caixa de entrada.', {
                  duration: 5000
                });
              }
            } catch (error) {
              console.error('Erro ao enviar email:', error);
              emailSentRef.current = false; // Reset se houve erro
            } finally {
              setSendingEmail(false);
            }
          }
        };

        sendEmail();
      }
    }, []); // Dependência vazia - roda apenas uma vez

    const verifyEmail = async () => {
      if (!emailToken) {
        toast.error('Digite o código de verificação');
        return;
      }

      setVerifying(true);
      try {
        const adminData = adminForm.getValues();
        await saasAPI.verifyEmail(adminData.adminEmail, emailToken);
        setCurrentStep(3);
      } catch (error) {
        console.error('Erro na verificação:', error);
      } finally {
        setVerifying(false);
      }
    };

    const resendEmail = async () => {
      const companyData = companyForm.getValues();
      const adminData = adminForm.getValues();
      
      setSendingEmail(true);
      try {
        const result = await saasAPI.sendVerificationEmail(
          adminData.adminEmail,
          adminData.adminName,
          companyData.companyName
        );
        
        if (result.data?.emailSent) {
          toast.success('Novo email de verificação enviado! Verifique sua caixa de entrada.', {
            duration: 5000
          });
        }
      } catch (error) {
        console.error('Erro ao reenviar email:', error);
      } finally {
        setSendingEmail(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verifique seu Email
          </h3>
          <p className="text-gray-600 mb-2">
            Enviamos um código de verificação para <strong>{adminForm.getValues('adminEmail')}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Verifique sua caixa de entrada e também a pasta de spam. O email pode demorar alguns minutos para chegar.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
            Código de Verificação
          </label>
          <VerificationCodeInput 
            value={emailToken}
            onChange={setEmailToken}
            disabled={verifying || sendingEmail}
          />
          <p className="text-xs text-gray-500 text-center mt-2">
            Digite os 6 dígitos ou cole o código completo
          </p>
        </div>

        {sendingEmail && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
              <p className="text-sm text-blue-800">Enviando email de verificação...</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={resendEmail}
            disabled={sendingEmail}
            className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
          >
            Não recebeu o email? Reenviar
          </button>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </button>
          <button
            onClick={verifyEmail}
            disabled={verifying || !emailToken}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Verificar
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Step 3: Password - Versão sem watch para testar
  const PasswordStep = () => {
    const { register, handleSubmit, formState: { errors } } = passwordForm;

    const onSubmit = async (data) => {
      setIsLoading(true);
      
      try {
        const companyData = companyForm.getValues();
        const adminData = adminForm.getValues();
        
        // Usar o planId correto (campo 'name' do modelo Plan, ex: 'starter', 'professional')
        const planToSend = selectedPlanData?.planId || selectedPlan || 'starter';
        
        const payload = {
          ...companyData,
          ...adminData,
          adminPassword: data.password,
          plan: planToSend
        };
        
        console.log('📤 Enviando payload para criação:', { ...payload, adminPassword: '***' });
        
        const result = await saasAPI.createOrganization(payload);
        setOrganizationData(result.data);
        setCurrentStep(4);
        
      } catch (error) {
        console.error('Erro ao criar organização:', error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Plano Selecionado - Clicável */}
        <div 
          onClick={() => setShowPlanModal(true)}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6 cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-800">
                  Plano selecionado: <strong className="text-blue-900">{getPlanDisplayName()}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedPlanData?.trialDays > 0 
                    ? `${selectedPlanData.trialDays} dias de trial grátis incluídos`
                    : 'O plano será associado à sua organização'
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
            >
              Alterar
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Key className="h-5 w-5 text-amber-600 mr-2" />
            <p className="text-sm text-amber-800">
              Esta senha será usada para acessar o portal da sua organização.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha *
          </label>
          <input
            {...register('password', { 
              required: 'Senha é obrigatória',
              minLength: { value: 8, message: 'Mínimo 8 caracteres' }
            })}
            type="password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite uma senha segura"
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Senha *
          </label>
          <input
            {...register('confirmPassword', { 
              required: 'Confirmação de senha é obrigatória'
            })}
            type="password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirme a senha"
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                Criar Organização
                <Rocket className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    );
  };

  // Step 4: Success
  const SuccessStep = () => {
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      toast.success('Copiado!');
    };

    return (
      <div className="text-center space-y-6">
        <div>
          <Rocket className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Organização Criada com Sucesso!
          </h3>
          <p className="text-gray-600">
            Sua organização está pronta e configurada. Aqui estão os detalhes de acesso:
          </p>
        </div>

        {organizationData && organizationData.portalUrl && organizationData.user && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">URL de Acesso:</span>
              <div className="flex items-center">
                <span className="text-sm text-blue-600 mr-2">{organizationData.portalUrl}</span>
                <button
                  onClick={() => copyToClipboard(organizationData.portalUrl)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Email:</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">{organizationData.user.email}</span>
                <button
                  onClick={() => copyToClipboard(organizationData.user.email)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {organizationData.subscription && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Plano Contratado</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-blue-900">
                      {organizationData.subscription.plan.displayName}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {organizationData.subscription.status === 'trial' ? 'Trial' : organizationData.subscription.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-600">Usuários</p>
                      <p className="font-semibold">{organizationData.subscription.limits.maxUsers}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Clientes</p>
                      <p className="font-semibold">{organizationData.subscription.limits.maxClients}</p>
                    </div>
                  </div>

                  {organizationData.subscription.trialEndsAt && (
                    <div className="text-xs text-blue-600 mt-2">
                      <strong>Trial termina:</strong> {new Date(organizationData.subscription.trialEndsAt).toLocaleDateString('pt-PT')}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Próximos Passos:</h4>
          <ul className="text-sm text-green-800 space-y-1 text-left">
            <li>• Verifique seu email para confirmar a conta</li>
            <li>• Acesse o portal da sua organização</li>
            <li>• Configure usuários e departamentos</li>
            <li>• Comece a usar o sistema de tickets</li>
          </ul>
        </div>

        <div className="flex justify-center">
          {organizationData && organizationData.portalUrl && (
            <a
              href={organizationData.portalUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              Acessar Portal
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    );
  };

  const getCurrentStepComponent = () => {
    switch (currentStep) {
      case 0: return <CompanyStep />;
      case 1: return <AdminStep />;
      case 2: return <EmailVerificationStep />;
      case 3: return <PasswordStep />;
      case 4: return <SuccessStep />;
      default: return <CompanyStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Seleção de Plano */}
      <PlanSelectionModal />
      
      {/* Header com link de volta */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TatuTicket
              </span>
            </Link>
            <Link 
              to="/" 
              className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>

      <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-16">
            {steps.map((step, index) => (
              <div key={step.id} className={`text-xs text-center max-w-20 transition-colors duration-300 ${
                index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                <div className="truncate">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          {organizationData && organizationData.organization && organizationData.user && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Informações da Organização
              </h3>
              <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                <p><strong>Nome:</strong> {organizationData.organization.name}</p>
                <p><strong>Email:</strong> {organizationData.user.email}</p>
                {organizationData.organization.slug && (
                  <p><strong>Identificador:</strong> {organizationData.organization.slug}</p>
                )}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {getCurrentStepComponent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      </div>
    </div>
  );
};

export default OnboardingNew;
