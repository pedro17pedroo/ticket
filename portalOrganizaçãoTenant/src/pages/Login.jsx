import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { LogIn, Mail, Lock } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { setAuth, token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  
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

          <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sessão</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email', { 
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
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  {...register('password', { required: 'Senha é obrigatória' })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
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

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Credenciais de teste:
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              <strong>Admin:</strong> admin@empresademo.com / Admin@123<br />
              <strong>Agente:</strong> agente@empresademo.com / Agente@123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
