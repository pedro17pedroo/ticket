import { useState, useEffect } from 'react'
import { X, Users, UserPlus, Trash2, Building2, User } from 'lucide-react'
import Swal from 'sweetalert2'
import todoService from '../services/todoService'

export default function CollaboratorModal({ todo, onClose }) {
  const [collaborators, setCollaborators] = useState(todo.collaborators || [])
  const [organizationUsers, setOrganizationUsers] = useState([])
  const [clients, setClients] = useState([])
  const [selectedUserType, setSelectedUserType] = useState('organization') // 'organization' ou 'client'
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAvailableUsers()
  }, [])

  const loadAvailableUsers = async () => {
    try {
      const data = await todoService.getAvailableUsers()
      setOrganizationUsers(data.organizationUsers || [])
      setClients(data.clients || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao carregar usuários disponíveis',
        confirmButtonColor: '#6366f1'
      })
    }
  }

  const handleAddCollaborator = async () => {
    if (!selectedUserId) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Selecione um usuário',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (selectedUserType === 'client' && !selectedClientId) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Selecione um cliente',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    // Verificar se já é colaborador
    const alreadyCollaborator = collaborators.some(
      c => c.userId === selectedUserId && c.userType === selectedUserType
    )

    if (alreadyCollaborator) {
      Swal.fire({
        icon: 'info',
        title: 'Informação',
        text: 'Este usuário já é colaborador',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    try {
      setLoading(true)
      const result = await todoService.addCollaborator(
        todo.id,
        selectedUserId,
        selectedUserType,
        selectedUserType === 'client' ? selectedClientId : null,
        canEdit
      )

      setCollaborators([...collaborators, result.collaborator])
      setSelectedUserId('')
      setSelectedClientId('')
      setCanEdit(false)
      
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Colaborador adicionado! Notificação enviada.',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error.response?.data?.error || 'Erro ao adicionar colaborador',
        confirmButtonColor: '#6366f1'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId, userType) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Deseja realmente remover este colaborador?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      await todoService.removeCollaborator(todo.id, collaboratorId, userType)
      setCollaborators(collaborators.filter(c => !(c.userId === collaboratorId && c.userType === userType)))
      Swal.fire({
        icon: 'success',
        title: 'Removido!',
        text: 'Colaborador removido com sucesso',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Erro ao remover colaborador:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao remover colaborador',
        confirmButtonColor: '#6366f1'
      })
    }
  }

  // Filtrar usuários disponíveis baseado no tipo selecionado
  const getAvailableUsersForSelection = () => {
    if (selectedUserType === 'organization') {
      return organizationUsers
    } else if (selectedUserType === 'client' && selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId)
      return client?.users || []
    }
    return []
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Colaboradores
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {todo.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Adicionar Colaborador */}
          {todo.isOwner && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Adicionar Colaborador
              </h3>

              {/* Tipo de Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Usuário
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedUserType('organization')
                      setSelectedClientId('')
                      setSelectedUserId('')
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedUserType === 'organization'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">Organização</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUserType('client')
                      setSelectedUserId('')
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedUserType === 'client'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Cliente</span>
                  </button>
                </div>
              </div>

              {/* Selecionar Cliente (se tipo = client) */}
              {selectedUserType === 'client' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cliente
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value)
                      setSelectedUserId('')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.users?.length || 0} usuários)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selecionar Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuário
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={selectedUserType === 'client' && !selectedClientId}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione um usuário</option>
                  {getAvailableUsersForSelection().map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Permissão */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="canEdit"
                  checked={canEdit}
                  onChange={(e) => setCanEdit(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="canEdit" className="text-sm text-gray-700 dark:text-gray-300">
                  Pode editar a tarefa
                </label>
              </div>

              <button
                onClick={handleAddCollaborator}
                disabled={loading || !selectedUserId}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Adicionando...' : 'Adicionar Colaborador'}
              </button>
            </div>
          )}

          {/* Lista de Colaboradores */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Colaboradores Atuais ({collaborators.length})
            </h3>

            {collaborators.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhum colaborador adicionado
              </p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div
                    key={`${collab.userId}-${collab.userType}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                        {collab.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {collab.user?.name}
                          {collab.userType === 'organization' ? (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              Organização
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                              Cliente: {collab.user?.clientName}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {collab.user?.email} • {collab.canEdit ? 'Pode editar' : 'Apenas visualizar'}
                        </p>
                      </div>
                    </div>

                    {todo.isOwner && (
                      <button
                        onClick={() => handleRemoveCollaborator(collab.userId, collab.userType)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remover colaborador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
