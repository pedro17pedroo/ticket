import { useEffect, useState } from 'react'
import { Plus, Edit2, UserX, UserCheck, Mail, Phone, Shield, Building2, Search, X, Key } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Swal from 'sweetalert2'

const Users = () => {
  const [users, setUsers] = useState([])
  const [directions, setDirections] = useState([])
  const [departments, setDepartments] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [formData, setFormData] = useState({
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

  const roles = [
    { value: 'admin-org', label: 'Administrador', color: 'red' },
    { value: 'agente', label: 'Agente', color: 'blue' },
    { value: 'user-org', label: 'Utilizador', color: 'green' }
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
    const { value: password } = await Swal.fire({
      title: `Redefinir senha de ${user.name}`,
      input: 'password',
      inputLabel: 'Nova senha (mínimo 6 caracteres)',
      inputPlaceholder: 'Digite a nova senha',
      inputAttributes: {
        minlength: 6,
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Redefinir',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return 'A senha deve ter no mínimo 6 caracteres'
        }
      }
    })

    if (password) {
      try {
        await api.put(`/users/${user.id}/reset-password`, { newPassword: password })
        showSuccess('Senha redefinida!', 'A senha foi redefinida com sucesso')
      } catch (error) {
        showError('Erro', error.response?.data?.error || error.message)
      }
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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Utilizador
        </button>
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
                      {user.role === 'admin-org' && (
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
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-orange-600"
                      title="Redefinir senha"
                    >
                      <Key className="w-4 h-4" />
                    </button>
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
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+351 xxx xxx xxx"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Função *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
              )}

              {/* Direção */}
              <div>
                <label className="block text-sm font-medium mb-2">Direção</label>
                <select
                  value={formData.directionId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    directionId: e.target.value,
                    departmentId: '', // Limpar departamento ao mudar direção
                    sectionId: '' // Limpar secção ao mudar direção
                  })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                >
                  <option value="">Sem direção</option>
                  {directions.map((dir) => (
                    <option key={dir.id} value={dir.id}>{dir.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Departamento</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      departmentId: e.target.value,
                      sectionId: '' // Limpar secção ao mudar departamento
                    })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                    disabled={!formData.directionId}
                  >
                    <option value="">Sem departamento</option>
                    {departments
                      .filter(dept => !formData.directionId || dept.directionId === formData.directionId)
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Secção</label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                    disabled={!formData.departmentId}
                  >
                    <option value="">Sem secção</option>
                    {sections
                      .filter(s => formData.departmentId && s.departmentId === formData.departmentId)
                      .map((sect) => (
                        <option key={sect.id} value={sect.id}>{sect.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {editingUser && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm">Ativo</label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
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

export default Users
