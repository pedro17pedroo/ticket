import { User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const Profile = () => {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerir informações da sua conta
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
            />
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Para alterar suas informações, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
