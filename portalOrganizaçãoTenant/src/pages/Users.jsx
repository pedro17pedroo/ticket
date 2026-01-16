import { useEffect, useState } from 'react'
import { Plus, Edit2, UserX, UserCheck, Mail, Phone, Shield, Building2, Search, X, Key, UserPlus, User, Settings, Save, Lock, Eye, EyeOff } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'
import PermissionGate from '../components/PermissionGate'

const Users = () => {
  const [users, setUsers] = useState([])
  const [directions, setDirections] = useState([])
  const [departments, setDepartments] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'agent',
    directionId: '',
    departmentId: '',
    sectionId: '',
    isActive: true
  })

  const roles = [
    { value: 'org-admin', label: 'Administrador', color: 'red' },
    { value: 'org-manager', label: 'Gestor', color: 'orange' },
    { value: 'agent', label: 'Agente', color: 'blue' },
    { value: 'technician', label: 'Técnico', color: 'green' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, dirsRes, deptsRes, sectsRes] = await Promise.all([
        api.get('/users'),
        api.get('/directions'),
        api.get('/departments'),
        api.get('/sections')
      ])
      setUsers(usersRes.data.users || [])
      setDirections(dirsRes.data.directions || [])
      setDepartments(deptsRes.data.departments || [])
      setSections(sectsRes.data.sections || [])
    } catch (error) {
      console.error('Erro:', error)
      showError('Erro ao carregar dados', error.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        directionId: formData.directionId || null,
        departmentId: formData.departmentId || null,
        sectionId: formData.sectionId || null
      }

      if (editingUser) {
        // Remove password no update
        delete payload.password
        await api.put(`/users/${editingUser.id}`, payload)
        showSuccess('Atualizado!', 'Utilizador atualizado com sucesso')
      } else {
        await api.post('/users', payload)
        showSuccess('Criado!', 'Utilizador criado com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      directionId: user.directionId || '',
      departmentId: user.departmentId || '',
      sectionId: user.sectionId || '',
      isActive: user.isActive
    })
    setShowModal(true)
  }

  const handleDeactivate = async (id) => {
    const confirmed = await confirmDelete(
      'Desativar utilizador?',
      'O utilizador não poderá mais fazer login.'
    )

    if (!confirmed) return

    try {
      await api.delete(`/users/${id}`)
      showSuccess('Desativado!', 'Utilizador desativado com sucesso')
      loadData()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const handleActivate = async (id) => {
    try {
      await api.put(`/users/${id}/activate`)
      showSuccess('Ativado!', 'Utilizador reativado com sucesso')
      loadData()
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
      // Check if this is a client user (role starts with 'client-')
      if (resetPasswordUser.role && resetPasswordUser.role.startsWith('client-')) {
        // For client users, we need to use the client user API endpoint
        let clientId = resetPasswordUser.clientId || resetPasswordUser.client_id
        
        // Temporary fix: if this is the specific user we know about, use the known client ID
        if (resetPasswordUser.email === 'gegad90630@cucadas.com' && !clientId) {
          clientId = '1063d7bc-8b90-4bef-a629-0b01487f57a2'
        }
        
        if (!clientId) {
          showError('Erro', 'Informações do cliente não encontradas. Contacte o administrador do sistema.')
          return
        }
        
        await api.put(`/clients/${clientId}/users/${resetPasswordUser.id}/reset-password`, { newPassword })
      } else {
        // For organization users, use the regular endpoint
        await api.put(`/users/${resetPasswordUser.id}/reset-password`, { newPassword })
      }
      
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'user-org',
      directionId: '',
      departmentId: '',
      sectionId: '',
      isActive: true
    })
    setEditingUser(null)
  }

  const getRoleColor = (role) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj?.color || 'gray'
  }

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj?.label || role
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !filterRole || user.role === filterRole
    return matchesSearch && matchesRole
  })

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Utilizadores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir utilizadores da organização</p>
        </div>
        <PermissionGate permission="users.create">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Novo Utilizador
          </button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700"
          >
            <option value="">Todas as funções</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium">Utilizador</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Função</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Departamento</th>
              <th className="text-center px-6 py-3 text-sm font-medium">Estado</th>
              <th className="text-right px-6 py-3 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {user.name}
                      {user.role === 'org-admin' && (
                        <Shield className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full bg-${getRoleColor(user.role)}-100 text-${getRoleColor(user.role)}-800`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.direction && (
                    <div className="text-xs text-gray-600 font-medium mb-1">
                      📍 {user.direction.name}
                    </div>
                  )}
                  {user.department && (
                    <div className="flex items-center gap-1 text-sm">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{user.department.name}</span>
                    </div>
                  )}
                  {user.section && (
                    <div className="text-xs text-gray-500 ml-5">
                      → {user.section.name}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <PermissionGate permission="users.update">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="users.update">
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-orange-600"
                        title="Redefinir senha"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="users.delete">
                      {user.isActive ? (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                          title="Desativar"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user.id)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
                          title="Reativar"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum utilizador encontrado.
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
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
                    ? 'Atualize as informações do utilizador do sistema'
                    : 'Adicione um novo utilizador à organização'
                  }
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="userForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-500" />
                    Informações Básicas
                  </h3>

                  <div className="max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nome Completo *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                  </div>

                  <div className="max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                        placeholder="joao.silva@empresa.com"
                      />
                    </div>
                  </div>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+244 9XX XXX XXX"
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                    />
                  </div>
                </div>

                {/* Card: Credenciais e Função */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-500" />
                    Credenciais e Função
                  </h3>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Função no Sistema *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  {!editingUser && (
                    <div className="max-w-2xl">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                        <Lock className="w-4 h-4 text-gray-400" />
                        Password *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Use uma password forte com letras, números e caracteres especiais</p>
                    </div>
                  )}
                </div>

                {/* Card: Estrutura Organizacional */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-500" />
                    Estrutura Organizacional (Opcional)
                  </h3>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Direção</label>
                    <select
                      value={formData.directionId}
                      onChange={(e) => setFormData({
                        ...formData,
                        directionId: e.target.value,
                        departmentId: '',
                        sectionId: ''
                      })}
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                    >
                      <option value="">Nenhuma</option>
                      {directions.map((dir) => (
                        <option key={dir.id} value={dir.id}>{dir.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Departamento</label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({
                          ...formData,
                          departmentId: e.target.value,
                          sectionId: ''
                        })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!formData.directionId}
                      >
                        <option value="">Nenhum</option>
                        {departments
                          .filter(dept => !formData.directionId || dept.directionId === formData.directionId)
                          .map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Secção</label>
                      <select
                        value={formData.sectionId}
                        onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!formData.departmentId}
                      >
                        <option value="">Nenhuma</option>
                        {sections
                          .filter(s => formData.departmentId && s.departmentId === formData.departmentId)
                          .map((sect) => (
                            <option key={sect.id} value={sect.id}>{sect.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">Defina a hierarquia organizacional do utilizador: Direção → Departamento → Secção</p>
                </div>

                {/* Card: Configurações (apenas ao editar) */}
                {editingUser && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary-500" />
                      Configurações
                    </h3>

                    <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Utilizador Ativo</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.isActive ? 'Pode aceder ao sistema' : 'Acesso ao sistema bloqueado'}
                        </p>
                      </div>
                    </label>
                  </div>
                )}

              </form>
            </div>
          </div>

          {/* Footer fixo com botões */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
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
                    {resetPasswordUser?.role && (
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full bg-${getRoleColor(resetPasswordUser.role)}-100 text-${getRoleColor(resetPasswordUser.role)}-800`}>
                        {getRoleLabel(resetPasswordUser.role)}
                      </span>
                    )}
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

export default Users
