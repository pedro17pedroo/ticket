import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, UserX, UserCheck, Mail, Phone, Key, Shield, X, Eye, EyeOff, User, Lock, Save, Settings, UserPlus, FolderOpen } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'
import CatalogAccessTab from '../components/CatalogAccessTab'
import UserCatalogAccessTab from '../components/UserCatalogAccessTab'

const ClientDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userModalTab, setUserModalTab] = useState('info') // 'info' or 'catalog'
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isAdmin: false,
    isActive: true
  })
  // Estado para modal de reset de senha
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

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
    setResetPasswordUser(user)
    setNewPassword('')
    setShowPassword(false)
    setShowResetPasswordModal(true)
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      showError('Erro', 'A senha deve ter no mínimo 6 caracteres')
      return
    }

    setResettingPassword(true)
    try {
      await api.put(`/clients/${id}/users/${resetPasswordUser.id}/reset-password`, { newPassword })
      showSuccess('Senha redefinida!', 'A senha foi redefinida com sucesso')
      setShowResetPasswordModal(false)
      setResetPasswordUser(null)
      setNewPassword('')
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    } finally {
      setResettingPassword(false)
    }
  }

  const resetUserForm = () => {
    setUserForm({ name: '', email: '', phone: '', password: '', isAdmin: false, isActive: true })
    setEditingUser(null)
    setUserModalTab('info')
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
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-6 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Catálogo de Serviços
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

          {activeTab === 'catalog' && (
            <CatalogAccessTab clientId={id} />
          )}
        </div>
      </div>

      {/* User Modal */}
      <Modal isOpen={showUserModal} onClose={() => { setShowUserModal(false); resetUserForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {editingUser ? <User className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                  {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingUser
                    ? 'Atualize as informações do utilizador'
                    : 'Adicione um novo utilizador ao cliente'
                  }
                </p>
              </div>
              <button
                onClick={() => { setShowUserModal(false); resetUserForm(); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs - Only show when editing */}
            {editingUser && (
              <div className="flex gap-4 mt-4 -mb-5 px-1">
                <button
                  onClick={() => setUserModalTab('info')}
                  className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                    userModalTab === 'info'
                      ? 'bg-gray-50 dark:bg-gray-900 text-primary-600'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Informações
                  </span>
                </button>
                <button
                  onClick={() => setUserModalTab('catalog')}
                  className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                    userModalTab === 'catalog'
                      ? 'bg-gray-50 dark:bg-gray-900 text-primary-600'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Catálogo de Serviços
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Info Tab Content */}
            {(!editingUser || userModalTab === 'info') && (
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="userForm" onSubmit={handleUserSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-500" />
                    Informações Básicas
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="joao@empresa.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="+244 9XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Card: Credenciais (apenas ao criar) */}
                {!editingUser && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary-500" />
                      Credenciais de Acesso
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use uma password forte com letras, números e caracteres especiais</p>
                    </div>
                  </div>
                )}

                {/* Card: Permissões e Configurações */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-500" />
                    Permissões e Configurações
                  </h3>

                  <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={userForm.isAdmin}
                      onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                      className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-500" />
                        Admin do Cliente
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pode gerir utilizadores e configurações do cliente</p>
                    </div>
                  </label>

                  {editingUser && (
                    <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={userForm.isActive}
                        onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Utilizador Ativo</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {userForm.isActive ? 'Pode aceder ao sistema' : 'Acesso ao sistema bloqueado'}
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </form>
            </div>
            )}

            {/* Catalog Tab Content - Only show when editing */}
            {editingUser && userModalTab === 'catalog' && (
              <div className="bg-gray-50 dark:bg-gray-900 p-6">
                <UserCatalogAccessTab clientUserId={editingUser.id} />
              </div>
            )}
          </div>

          {/* Footer fixo com botões - Only show for info tab or when creating */}
          {(!editingUser || userModalTab === 'info') && (
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowUserModal(false); resetUserForm(); }}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="userForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingUser ? 'Atualizar' : 'Criar'} Utilizador
              </button>
            </div>
          </div>
          )}
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetPasswordModal && resetPasswordUser !== null} onClose={() => { setShowResetPasswordModal(false); setResetPasswordUser(null); setNewPassword(''); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Key className="w-6 h-6" />
                  Redefinir Senha
                </h2>
                <p className="text-orange-100 text-sm mt-1">
                  Defina uma nova senha para o utilizador
                </p>
              </div>
              <button
                onClick={() => { setShowResetPasswordModal(false); setResetPasswordUser(null); setNewPassword(''); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6">
            <form id="resetPasswordForm" onSubmit={handleResetPasswordSubmit} className="space-y-5">
              {/* Info do utilizador */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" />
                  Utilizador
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{resetPasswordUser?.name}</p>
                    <p className="text-gray-500 text-base">{resetPasswordUser?.email}</p>
                  </div>
                </div>
              </div>

              {/* Card: Nova Senha */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-orange-500" />
                  Nova Senha
                </h3>

                <div className="max-w-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Senha *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full min-w-[400px] px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-base"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                    {showPassword ? (
                      <><Eye className="w-3 h-3" /> Senha visível</>
                    ) : (
                      <><EyeOff className="w-3 h-3" /> Clique no ícone para ver a senha</>
                    )}
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Footer fixo com botões */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowResetPasswordModal(false); setResetPasswordUser(null); setNewPassword(''); }}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
                disabled={resettingPassword}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="resetPasswordForm"
                disabled={resettingPassword || newPassword.length < 6}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Key className="w-5 h-5" />
                {resettingPassword ? 'A redefinir...' : 'Redefinir Senha'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ClientDetails
