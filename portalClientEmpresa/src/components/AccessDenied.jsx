import { Lock, ArrowLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * AccessDenied Component
 * 
 * Displays a user-friendly access denied message with navigation options.
 * Used when a user tries to access a resource they don't have permission for.
 * 
 * Feature: catalog-access-control
 * Requirements: 4.3
 * 
 * @param {Object} props
 * @param {string} props.title - Title message (default: "Acesso Restrito")
 * @param {string} props.message - Detailed message explaining the restriction
 * @param {string} props.redirectPath - Path to redirect to (default: "/")
 * @param {string} props.redirectLabel - Label for redirect button (default: "Voltar ao Início")
 * @param {boolean} props.showBackButton - Whether to show back button (default: true)
 * @param {Function} props.onBack - Custom back handler (optional)
 */
const AccessDenied = ({
  title = 'Acesso Restrito',
  message = 'Não tem permissão para aceder a este recurso. Entre em contacto com o administrador da sua organização.',
  redirectPath = '/',
  redirectLabel = 'Voltar ao Início',
  showBackButton = true,
  onBack
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  const handleRedirect = () => {
    navigate(redirectPath)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-16 px-4">
      {/* Icon */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-full p-6 mb-6">
        <Lock className="w-16 h-16 text-yellow-500" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
        {title}
      </h2>

      {/* Message */}
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        {message}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        )}
        <button
          onClick={handleRedirect}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>{redirectLabel}</span>
        </button>
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-8 text-center">
        Se acredita que deveria ter acesso, entre em contacto com o suporte.
      </p>
    </div>
  )
}

export default AccessDenied
