import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { LogIn, Mail, Lock, ArrowLeft } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { setAuth, token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm()
  const { register: registerRecoveryEmail, handleSubmit: handleSubmitRecoveryEmail, formState: { errors: recoveryErrors }, reset: resetRecoveryForm } = useForm()
  const { register: registerResetPassword, handleSubmit: handleSubmitResetPassword, formState: { errors: resetErrors }, reset: resetResetForm } = useForm()
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState(1)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  
  console.log('🔄 Login component renderizado, token:', token ? 'presente' : 'ausente')
  
  // Se já estiver logado, redirecionar (apenas uma vez)
  useEffect(() => {
    console.log('🔍 useEffect verificando token:', token ? 'presente' : 'ausente')
    if (token) {
      console.log('✅ Já está logado, redirecionando para dashboard...')
      navigate('/', { replace: true })
    }
  }, [token, navigate])

  const onSubmit = async (data) => {
    if (loading) {
      console.log('⏸️  Submit bloqueado - já está processando')
      return // Prevenir múltiplos submits
    }
    
    setLoading(true)
    console.log('🔐 Iniciando processo de login com:', data.email)
    
    try {
      console.log('📡 Chamando API de login...')
      const response = await authService.login(data.email, data.password)
      console.log('✅ Resposta da API:', response)
      
      if (!response || !response.user || !response.token) {
        throw new Error('Resposta inválida do servidor')
      }
      
      console.log('💾 Salvando autenticação...')
      setAuth(response.user, response.token)
      console.log('✅ Autenticação salva com sucesso!')
      
      toast.success('Login realizado com sucesso!')
      
      console.log('🚀 Navegando para dashboard...')
      navigate('/', { replace: true })
    } catch (error) {
      console.error('❌ Erro completo no login:', error)
      console.error('❌ Resposta do erro:', error.response?.data)
      console.error('❌ Status do erro:', error.response?.status)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Erro ao fazer login. Verifique suas credenciais.'
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReset = async ({ email }) => {
    try {
      setRecoveryLoading(true)
      await authService.requestPasswordReset(email, 'organization')
      toast.success('Se o email existir, enviámos um token de recuperação')
      setRecoveryEmail(email)
      setRecoveryStep(2)
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Erro ao solicitar recuperação'
      toast.error(message)
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleResetPassword = async ({ token, newPassword, confirmPassword }) => {
    if (!recoveryEmail) {
      toast.error('Solicite o token primeiro')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    try {
      setRecoveryLoading(true)
      await authService.validatePasswordResetToken(recoveryEmail, token, 'organization')
      await authService.resetPasswordWithToken(recoveryEmail, token, newPassword, 'organization')
      toast.success('Senha redefinida com sucesso! Faça login novamente.')
      handleCloseRecovery()
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Erro ao redefinir senha'
      toast.error(message)
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleCloseRecovery = () => {
    setShowRecovery(false)
    setRecoveryStep(1)
    setRecoveryEmail('')
    resetRecoveryForm()
    resetResetForm()
    setRecoveryLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            TatuTicket
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Portal de Gestão Organizacional
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full">
              <LogIn className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          {!showRecovery ? (
            <>
              <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sessão</h2>

              <form onSubmit={handleSubmitLogin(onSubmit)} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      {...registerLogin('email', { 
                        required: 'Email é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
                      placeholder="seu@email.com"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{loginErrors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      {...registerLogin('password', { required: 'Senha é obrigatória' })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
                      placeholder="••••••••"
                    />
                  </div>
                  {loginErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{loginErrors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="text-primary-600 hover:underline font-medium"
                    onClick={() => setShowRecovery(true)}
                  >
                    Esqueceu a sua senha?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'A entrar...' : 'Entrar'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Recuperar Senha</h2>
                <button
                  type="button"
                  onClick={handleCloseRecovery}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar ao login
                </button>
              </div>

              {recoveryStep === 1 ? (
                <form onSubmit={handleSubmitRecoveryEmail(handleRequestReset)} className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Insira o email associado à sua conta. Enviaremos um token para validar a redefinição.
                  </p>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        {...registerRecoveryEmail('email', {
                          required: 'Email é obrigatório',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
                        placeholder="seu@email.com"
                      />
                    </div>
                    {recoveryErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{recoveryErrors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {recoveryLoading ? 'A enviar...' : 'Enviar token'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmitResetPassword(handleResetPassword)} className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Introduza o token recebido em <strong>{recoveryEmail}</strong> e defina uma nova senha.
                  </p>

                  <div>
                    <label className="block text-sm font-medium mb-2">Token</label>
                    <input
                      type="text"
                      {...registerResetPassword('token', {
                        required: 'Token é obrigatório',
                        minLength: { value: 6, message: 'Token deve ter 6 caracteres' },
                        maxLength: { value: 6, message: 'Token deve ter 6 caracteres' }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 uppercase"
                      placeholder="EX1234"
                    />
                    {resetErrors.token && (
                      <p className="text-red-500 text-sm mt-1">{resetErrors.token.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Nova senha</label>
                    <input
                      type="password"
                      {...registerResetPassword('newPassword', { required: 'Senha é obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
                      placeholder="••••••••"
                    />
                    {resetErrors.newPassword && (
                      <p className="text-red-500 text-sm mt-1">{resetErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Confirmar senha</label>
                    <input
                      type="password"
                      {...registerResetPassword('confirmPassword', { required: 'Confirmação obrigatória' })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
                      placeholder="••••••••"
                    />
                    {resetErrors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{resetErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {recoveryLoading ? 'Validando...' : 'Redefinir senha'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
