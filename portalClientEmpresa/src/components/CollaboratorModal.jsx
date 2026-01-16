import { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, Check, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import todoService from '../services/todoService'

export default function CollaboratorModal({ todo, onClose }) {
  const [availableUsers, setAvailableUsers] = useState([])
  const [collaborators, setCollaborators] = useState(todo.collaborators || [])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    loadAvailableUsers()
  }, [])

  const loadAvailableUsers = async () => {
    try {
      setLoading(true)
      const data = await todoService.getAvailableUsers()
      // Filtrar usuários que já são colaboradores
      const collabIds = collaborators.map(c => c.userId || c.user?.id)
      const filtered = (data.users || []).filter(u => !collabIds.includes(u.id))
      setAvailableUsers(filtered)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCollaborator = async () => {
    if (!selectedUser) return

    try {
      setAdding(true)
      const result = await todoService.addCollaborator(todo.id, selectedUser, canEdit)
      setCollaborators([...collaborators, result.collaborator])
      setAvailableUsers(availableUsers.filter(u => u.id !== selectedUser))
      setSelectedUser('')
      setCanEdit(false)
      toast.success('Colaborador adicionado')
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error)
      toast.error(error.response?.data?.error || 'Erro ao adicionar colaborador')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorUserId) => {
    try {
      await todoService.removeCollaborator(todo.id, collaboratorUserId)
      const removed = collaborators.find(c => (c.userId || c.user?.id) === collaboratorUserId)
      setCollaborators(collaborators.filter(c => (c.userId || c.user?.id) !== collaboratorUserId))
      if (removed?.user) {
        setAvailableUsers([...availableUsers, removed.user])
      }
      toast.success('Colaborador removido')
    } catch (error) {
      console.error('Erro ao remover colaborador:', error)
      toast.error('Erro ao remover colaborador')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Colaboradores
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Tarefa */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">{todo.title}</p>
            {todo.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {todo.description}
              </p>
            )}
          </div>

          {/* Adicionar colaborador */}
          {todo.isOwner && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adicionar Colaborador
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  disabled={loading || availableUsers.length === 0}
                >
                  <option value="">
                    {loading ? 'Carregando...' : availableUsers.length === 0 ? 'Nenhum usuário disponível' : 'Selecione um usuário'}
                  </option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddCollaborator}
                  disabled={!selectedUser || adding}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>

              {selectedUser && (
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={canEdit}
                    onChange={(e) => setCanEdit(e.target.checked)}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  Permitir edição
                </label>
              )}
            </div>
          )}

          {/* Lista de colaboradores */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Colaboradores ({collaborators.length})
            </h3>

            {collaborators.length === 0 ? (
              <p className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Nenhum colaborador adicionado
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                        {collab.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {collab.user?.name || 'Usuário'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {collab.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {collab.canEdit && (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Shield className="w-3 h-3" />
                          Pode editar
                        </span>
                      )}
                      {todo.isOwner && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab.userId || collab.user?.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
