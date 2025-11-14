import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Eye, EyeOff, Shield, Check, X } from 'lucide-react';

const AdminUserStep = ({ data, onUpdate, onValidationChange }) => {
  const { register, watch, formState: { errors } } = useForm({
    defaultValues: data
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const watchedFields = watch();
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Atualizar store quando campos mudarem
  useEffect(() => {
    onUpdate(watchedFields);
  }, [watchedFields, onUpdate]);

  // Validar step
  useEffect(() => {
    const isValid = !!(
      watchedFields.fullName &&
      watchedFields.email &&
      watchedFields.password &&
      watchedFields.confirmPassword &&
      password === confirmPassword &&
      isValidPassword(password)
    );
    onValidationChange(isValid);
  }, [watchedFields, password, confirmPassword, onValidationChange]);

  // Validação de senha
  const isValidPassword = (pwd) => {
    if (!pwd) return false;
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[^A-Za-z0-9]/.test(pwd)
    );
  };

  const passwordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    
    let score = 0;
    const checks = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[a-z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd)
    ];
    
    score = checks.filter(Boolean).length;
    
    if (score < 3) return { score, label: 'Fraca', color: 'text-red-600' };
    if (score < 4) return { score, label: 'Média', color: 'text-yellow-600' };
    if (score < 5) return { score, label: 'Boa', color: 'text-blue-600' };
    return { score, label: 'Forte', color: 'text-green-600' };
  };

  const strength = passwordStrength(password);

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Conta de Administrador</h4>
            <p className="text-sm text-blue-800">
              Esta será sua conta principal para gerenciar toda a organização. 
              Você terá acesso total a todas as funcionalidades.
            </p>
          </div>
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline h-4 w-4 mr-1" />
          Nome Completo *
        </label>
        <input
          {...register('fullName', {
            required: 'Nome completo é obrigatório',
            minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
          })}
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Digite seu nome completo"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="inline h-4 w-4 mr-1" />
          E-mail *
        </label>
        <input
          {...register('email', {
            required: 'E-mail é obrigatório',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'E-mail inválido'
            }
          })}
          type="email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="admin@empresa.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Este será seu e-mail de login e onde enviaremos notificações importantes
        </p>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Lock className="inline h-4 w-4 mr-1" />
          Senha *
        </label>
        <div className="relative">
          <input
            {...register('password', {
              required: 'Senha é obrigatória',
              validate: {
                strength: (value) => isValidPassword(value) || 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo'
              }
            })}
            type={showPassword ? 'text' : 'password'}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Digite uma senha segura"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Password Strength */}
        {password && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Força da senha:</span>
              <span className={strength.color}>{strength.label}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  strength.score < 3 ? 'bg-red-500' :
                  strength.score < 4 ? 'bg-yellow-500' :
                  strength.score < 5 ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Lock className="inline h-4 w-4 mr-1" />
          Confirmar Senha *
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword', {
              required: 'Confirmação de senha é obrigatória',
              validate: (value) => value === password || 'Senhas não coincidem'
            })}
            type={showConfirmPassword ? 'text' : 'password'}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Confirme sua senha"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Password Match Indicator */}
        {confirmPassword && (
          <div className="mt-2 flex items-center">
            {password === confirmPassword ? (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm">Senhas coincidem</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <X className="h-4 w-4 mr-1" />
                <span className="text-sm">Senhas não coincidem</span>
              </div>
            )}
          </div>
        )}

        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Password Requirements */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Requisitos da senha:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { check: password?.length >= 8, text: 'Pelo menos 8 caracteres' },
            { check: /[A-Z]/.test(password), text: 'Uma letra maiúscula' },
            { check: /[a-z]/.test(password), text: 'Uma letra minúscula' },
            { check: /[0-9]/.test(password), text: 'Um número' },
            { check: /[^A-Za-z0-9]/.test(password), text: 'Um símbolo especial' }
          ].map((req, index) => (
            <div key={index} className="flex items-center">
              {req.check ? (
                <Check className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <div className="h-4 w-4 border border-gray-300 rounded mr-2" />
              )}
              <span className={`text-sm ${req.check ? 'text-green-600' : 'text-gray-600'}`}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">Dica de Segurança</h4>
            <p className="text-sm text-yellow-800">
              Recomendamos usar um gerenciador de senhas para criar e armazenar uma senha única e segura.
              Nunca compartilhe suas credenciais de administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserStep;
