import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Building2, User, Settings, Rocket } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useSaasStore from '../store/saasStore';
import { saasAPI } from '../services/api';

// Componentes dos steps
import StepProgress from '../components/onboarding/StepProgress';
import CompanyInfoStep from '../components/onboarding/CompanyInfoStep';
import AdminUserStep from '../components/onboarding/AdminUserStep';
import ConfigurationStep from '../components/onboarding/ConfigurationStep';
import SummaryStep from '../components/onboarding/SummaryStep';
import SuccessStep from '../components/onboarding/SuccessStep';

const Onboarding = () => {
  const {
    onboardingStep,
    onboardingData,
    setOnboardingStep,
    updateOnboardingData,
    nextOnboardingStep,
    previousOnboardingStep,
    resetOnboarding,
    loading,
    setLoading
  } = useSaasStore();

  const [currentStep, setCurrentStep] = useState(onboardingStep);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    {
      id: 0,
      title: 'Informações da Empresa',
      description: 'Conte-nos sobre sua organização',
      icon: Building2,
      component: CompanyInfoStep
    },
    {
      id: 1,
      title: 'Administrador',
      description: 'Configure sua conta de administrador',
      icon: User,
      component: AdminUserStep
    },
    {
      id: 2,
      title: 'Configurações',
      description: 'Personalize seu ambiente',
      icon: Settings,
      component: ConfigurationStep
    },
    {
      id: 3,
      title: 'Revisão',
      description: 'Confirme suas informações',
      icon: Check,
      component: SummaryStep
    },
    {
      id: 4,
      title: 'Sucesso',
      description: 'Bem-vindo ao TatuTicket!',
      icon: Rocket,
      component: SuccessStep
    }
  ];

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData.component;

  // Sincronizar com store
  useEffect(() => {
    setCurrentStep(onboardingStep);
  }, [onboardingStep]);

  // Validar step atual
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Company Info
        return !!(
          onboardingData.organizationName &&
          onboardingData.slug &&
          onboardingData.industry &&
          onboardingData.companySize
        );
      case 1: // Admin User
        return !!(
          onboardingData.fullName &&
          onboardingData.email &&
          onboardingData.password &&
          onboardingData.password === onboardingData.confirmPassword
        );
      case 2: // Configuration
        return !!(
          onboardingData.plan &&
          onboardingData.country
        );
      case 3: // Summary
        return true;
      default:
        return true;
    }
  };

  // Atualizar validação quando dados mudarem
  useEffect(() => {
    setIsValid(validateCurrentStep());
  }, [currentStep, onboardingData]);

  // Handlers
  const handleNext = () => {
    if (!isValid) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (currentStep === 3) {
      // Step de summary - criar organização
      handleCreateOrganization();
    } else {
      nextOnboardingStep();
    }
  };

  const handlePrevious = () => {
    previousOnboardingStep();
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex <= currentStep) {
      setOnboardingStep(stepIndex);
    }
  };

  const handleCreateOrganization = async () => {
    setIsSubmitting(true);
    setLoading(true);

    try {
      const result = await saasAPI.createOrganization(onboardingData);
      
      // Salvar dados de sucesso
      updateOnboardingData({
        organizationId: result.organization.id,
        adminUserId: result.user.id,
        loginUrl: `https://${onboardingData.slug}.tatuticket.com`,
        createdAt: new Date().toISOString()
      });

      nextOnboardingStep(); // Ir para step de sucesso
      
    } catch (error) {
      console.error('Erro ao criar organização:', error);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleRestart = () => {
    resetOnboarding();
    setCurrentStep(0);
  };

  // Animation variants
  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao TatuTicket
          </h1>
          <p className="text-gray-600">
            Vamos configurar sua organização em poucos passos
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="p-8">
            {/* Step Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                <currentStepData.icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Component */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent
                  data={onboardingData}
                  onUpdate={updateOnboardingData}
                  onValidationChange={setIsValid}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {currentStep < 4 && (
            <div className="px-8 py-6 bg-gray-50 rounded-b-2xl border-t border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </button>

                <div className="text-sm text-gray-500">
                  Passo {currentStep + 1} de {steps.length - 1}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!isValid || isSubmitting}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Criando...
                    </>
                  ) : currentStep === 3 ? (
                    <>
                      Criar Organização
                      <Rocket className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Restart button para step de sucesso */}
          {currentStep === 4 && (
            <div className="px-8 py-6 bg-gray-50 rounded-b-2xl border-t border-gray-200">
              <div className="flex justify-center">
                <button
                  onClick={handleRestart}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Criar outra organização
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Precisa de ajuda? {' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              Entre em contato conosco
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
