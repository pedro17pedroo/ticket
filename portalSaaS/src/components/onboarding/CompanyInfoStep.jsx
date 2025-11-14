import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Globe, Users, Factory, MapPin, Phone, Check, X, Loader2 } from 'lucide-react';
import { saasAPI } from '../../services/api';
import { useTempStore } from '../../store/saasStore';

const CompanyInfoStep = ({ data, onUpdate, onValidationChange }) => {
  const { register, watch, setValue, formState: { errors } } = useForm({
    defaultValues: data
  });

  const [slugAvailability, setSlugAvailability] = useState(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const { setSlugValidation, getSlugValidation } = useTempStore();

  const watchedFields = watch();
  const slug = watch('slug');
  const organizationName = watch('organizationName');

  // Atualizar store quando campos mudarem
  useEffect(() => {
    onUpdate(watchedFields);
  }, [watchedFields, onUpdate]);

  // Validar step
  useEffect(() => {
    const isValid = !!(
      watchedFields.organizationName &&
      watchedFields.slug &&
      watchedFields.industry &&
      watchedFields.companySize &&
      slugAvailability?.available
    );
    onValidationChange(isValid);
  }, [watchedFields, slugAvailability, onValidationChange]);

  // Auto-gerar slug baseado no nome da organização
  useEffect(() => {
    if (organizationName && !data.slug) {
      const generatedSlug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30);
      
      setValue('slug', generatedSlug);
    }
  }, [organizationName, setValue, data.slug]);

  // Verificar disponibilidade do slug
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailability(null);
      return;
    }

    // Verificar cache primeiro
    const cached = getSlugValidation(slug);
    if (cached) {
      setSlugAvailability(cached);
      return;
    }

    // Debounce da verificação
    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const result = await saasAPI.checkSlugAvailability(slug);
        setSlugAvailability(result);
        setSlugValidation(slug, result);
      } catch (error) {
        setSlugAvailability({ available: false, message: 'Erro ao verificar disponibilidade' });
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, getSlugValidation, setSlugValidation]);

  const industries = [
    'Tecnologia',
    'Saúde',
    'Educação',
    'Financeiro',
    'Varejo',
    'Manufatura',
    'Consultoria',
    'Governo',
    'Sem fins lucrativos',
    'Outro'
  ];

  const companySizes = [
    '1-10 funcionários',
    '11-50 funcionários',
    '51-200 funcionários',
    '201-500 funcionários',
    '501-1000 funcionários',
    '1000+ funcionários'
  ];

  const countries = [
    'Brasil',
    'Portugal',
    'Estados Unidos',
    'Canadá',
    'Reino Unido',
    'Alemanha',
    'França',
    'Espanha',
    'Argentina',
    'Chile',
    'Outro'
  ];

  return (
    <div className="space-y-6">
      {/* Organization Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Building2 className="inline h-4 w-4 mr-1" />
          Nome da Organização *
        </label>
        <input
          {...register('organizationName', {
            required: 'Nome da organização é obrigatório',
            minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
          })}
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Digite o nome da sua empresa"
        />
        {errors.organizationName && (
          <p className="mt-1 text-sm text-red-600">{errors.organizationName.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Globe className="inline h-4 w-4 mr-1" />
          Domínio Personalizado *
        </label>
        <div className="flex items-center">
          <input
            {...register('slug', {
              required: 'Domínio é obrigatório',
              minLength: { value: 3, message: 'Domínio deve ter pelo menos 3 caracteres' },
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: 'Use apenas letras minúsculas, números e hífens'
              }
            })}
            type="text"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="minha-empresa"
          />
          <div className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
            .tatuticket.com
          </div>
        </div>
        
        {/* Slug Status */}
        {slug && slug.length >= 3 && (
          <div className="mt-2 flex items-center">
            {isCheckingSlug ? (
              <div className="flex items-center text-blue-600">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                <span className="text-sm">Verificando disponibilidade...</span>
              </div>
            ) : slugAvailability ? (
              <div className={`flex items-center ${
                slugAvailability.available ? 'text-green-600' : 'text-red-600'
              }`}>
                {slugAvailability.available ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                <span className="text-sm">{slugAvailability.message}</span>
              </div>
            ) : null}
          </div>
        )}
        
        {errors.slug && (
          <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Seus usuários acessarão: <strong>{slug || 'seu-dominio'}.tatuticket.com</strong>
        </p>
      </div>

      {/* Industry & Company Size */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Factory className="inline h-4 w-4 mr-1" />
            Setor/Indústria *
          </label>
          <select
            {...register('industry', { required: 'Setor é obrigatório' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Selecione seu setor</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline h-4 w-4 mr-1" />
            Tamanho da Empresa *
          </label>
          <select
            {...register('companySize', { required: 'Tamanho da empresa é obrigatório' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Selecione o tamanho</option>
            {companySizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          {errors.companySize && (
            <p className="mt-1 text-sm text-red-600">{errors.companySize.message}</p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline h-4 w-4 mr-1" />
            Telefone
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="+55 (11) 99999-9999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            País
          </label>
          <select
            {...register('country')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Selecione o país</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cidade
        </label>
        <input
          {...register('city')}
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="São Paulo"
        />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Por que precisamos dessas informações?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Nome e domínio:</strong> Para criar seu ambiente personalizado</li>
          <li>• <strong>Setor:</strong> Para personalizar funcionalidades específicas</li>
          <li>• <strong>Tamanho:</strong> Para otimizar performance e recursos</li>
          <li>• <strong>Localização:</strong> Para compliance e configuração regional</li>
        </ul>
      </div>
    </div>
  );
};

export default CompanyInfoStep;
