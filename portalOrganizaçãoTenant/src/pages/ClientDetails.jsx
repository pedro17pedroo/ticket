import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, UserX, UserCheck, Mail, Phone, Key, Shield, X } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Swal from 'sweetalert2'

const ClientDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isAdmin: false,
    isActive: true
  })

  useEffect(() => {
    loadClient()
  }, [id])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab])

  const loadClient = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/clients/${id}`)
      setClient(response.data.client)
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      showError('Erro', 'Cliente não encontrado')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get(`/clients/${id}/users`)
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error)
    }
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await api.put(`/clients/${id}/users/${editingUser.id}`, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          isActive: userForm.isActive,
          isAdmin: userForm.isAdmin
        })
        showSuccess('Atualizado!', 'Utilizador atualizado com sucesso')
      } else {
        await api.post(`/clients/${id}/users`, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          password: userForm.password,
          isAdmin: userForm.isAdmin
        })
        showSuccess('Criado!', 'Utilizador criado com sucesso')
      }
      setShowUserModal(false)
      resetUserForm()
      loadUsers()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      isAdmin: user.settings?.clientAdmin || false,
      isActive: user.isActive
    })
    setShowUserModal(true)
  }

  const handleDeactivateUser = async (userId) => {
    const confirmed = await confirmDelete('Desativar utilizador?', 'O utilizador não poderá mais fazer login.')
    if (!confirmed) return
    try {
      await api.delete(`/clients/${id}/users/${userId}`)
      showSuccess('Desativado!', 'Utilizador desativado com sucesso')
      loadUsers()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const handleActivateUser = async (userId) => {
    try {
      await api.put(`/clients/${id}/users/${userId}/activate`)
      showSuccess('Ativado!', 'Utilizador reativado com sucesso')
      loadUsers()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const handleResetPassword = async (user) => {
    const { value: password } = await Swal.fire({
      title: `Redefinir senha de ${user.name}`,
      input: 'password',
      inputLabel: 'Nova senha (mínimo 6 caracteres)',
      inputPlaceholder: 'Digite a nova senha',
      inputAttributes: { minlength: 6, autocapitalize: 'off', autocorrect: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Redefinir',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.length < 6) return 'A senha deve ter no mínimo 6 caracteres'
      }
    })

    if (password) {
      try {
        await api.put(`/clients/${id}/users/${user.id}/reset-password`, { newPassword: password })
        showSuccess('Senha redefinida!', 'A senha foi redefinida com sucesso')
      } catch (error) {
        showError('Erro', error.response?.data?.error || error.message)
      }
    }
  }

  const resetUserForm = () => {
    setUserForm({ name: '', email: '', phone: '', password: '', isAdmin: false, isActive: true })
    setEditingUser(null)
  }

  if (loading || !client) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{client.email}</p>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {client.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Utilizadores
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                  <p className="text-lg font-medium">{client.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <p className="text-lg">{client.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                  <p className="text-lg">{client.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Total de Tickets</label>
                  <p className="text-lg font-semibold text-primary-600">{client.ticketCount || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Data de Criação</label>
                  <p className="text-lg">{new Date(client.createdAt).toLocaleDateString('pt-PT')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Último Login</label>
                  <p className="text-lg">{client.lastLogin ? new Date(client.lastLogin).toLocaleDateString('pt-PT') : 'Nunca'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Utilizadores da Empresa</h3>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Novo Utilizador
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Utilizador</th>
                      <th className="text-center px-4 py-3 text-sm font-medium">Estado</th>
                      <th className="text-right px-4 py-3 text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {user.name}
                                {user.settings?.clientAdmin && (
                                  <Shield className="w-4 h-4 text-orange-500" title="Admin do Cliente" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {user.email}
                              </div>
                              {user.phone && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditUser(user)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleResetPassword(user)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-orange-600" title="Redefinir senha">
                              <Key className="w-4 h-4" />
                            </button>
                            {user.isActive ? (
                              <button onClick={() => handleDeactivateUser(user.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg" title="Desativar">
                                <UserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => handleActivateUser(user.id)} className="p-2 hover:bg-green-50 text-green-600 rounded-lg" title="Reativar">
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Nenhum utilizador encontrado. Crie o primeiro!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="flex items-center justify-center bg-black/50 p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">{editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h3>
              <button onClick={() => { setShowUserModal(false); resetUserForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Password *</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={userForm.isAdmin}
                    onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Admin do Cliente (pode gerir utilizadores)</span>
                </label>

                {editingUser && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={userForm.isActive}
                      onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Ativo</span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowUserModal(false); resetUserForm(); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientDetails
