import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X, Save, UserPlus, Mail, Phone, Shield } from 'lucide-react'
import { confirmDelete, showSuccess, showError } from '../../utils/alerts'
import organizationService from '../../services/organizationService'
import toast from 'react-hot-toast'

const UsersTab = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'client-user',
    directionId: '',
    departmentId: '',
    sectionId: ''
  })
  const [saving, setSaving] = useState(false)

  // Organizational data
  const [directions, setDirections] = useState([])
  const [departments, setDepartments] = useState([])
  const [sections, setSections] = useState([])
  const [allDepartments, setAllDepartments] = useState([])
  const [allSections, setAllSections] = useState([])

  useEffect(() => {
    loadUsers()
    loadOrganizationalData()
  }, [])

  const loadOrganizationalData = async () => {
    try {
      const [directionsRes, departmentsRes, sectionsRes] = await Promise.all([
        organizationService.getDirections(),
        organizationService.getDepartments(),
        organizationService.getSections()
      ])
      setDirections(directionsRes.data.directions || [])
      setAllDepartments(departmentsRes.data.departments || [])
      setAllSections(sectionsRes.data.sections || [])
    } catch (error) {
      console.error('Erro ao carregar dados organizacionais:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await organizationService.getClientUsers()
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error)
      toast.error('Erro ao carregar utilizadores')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      const userData = {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        directionId: user.directionId || '',
        departmentId: user.departmentId || '',
        sectionId: user.sectionId || ''
      }
      setFormData(userData)

      // Load dependent dropdowns
      if (userData.directionId) {
        filterDepartmentsByDirection(userData.directionId)
      }
      if (userData.departmentId) {
        filterSectionsByDepartment(userData.departmentId)
      }
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'client-user',
        directionId: '',
        departmentId: '',
        sectionId: ''
      })
      setDepartments([])
      setSections([])
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', phone: '', role: 'client-user', directionId: '', departmentId: '', sectionId: '' })
    setDepartments([])
    setSections([])
  }

  const filterDepartmentsByDirection = (directionId) => {
    if (directionId) {
      console.log('Filtrando departamentos por directionId:', directionId)
      console.log('Todos os departamentos:', allDepartments)
      const filtered = allDepartments.filter(d => {
        const match = String(d.directionId) === String(directionId)
        console.log(`Dept ${d.name} (directionId: ${d.directionId}) matches: ${match}`)
        return match
      })
      console.log('Departamentos filtrados:', filtered)
      setDepartments(filtered)
    } else {
      setDepartments([])
    }
  }

  const filterSectionsByDepartment = (departmentId) => {
    if (departmentId) {
      console.log('Filtrando secções por departmentId:', departmentId)
      console.log('Todas as secções:', allSections)
      const filtered = allSections.filter(s => {
        const match = String(s.departmentId) === String(departmentId)
        console.log(`Section ${s.name} (departmentId: ${s.departmentId}) matches: ${match}`)
        return match
      })
      console.log('Secções filtradas:', filtered)
      setSections(filtered)
    } else {
      setSections([])
    }
  }

  const handleDirectionChange = (directionId) => {
    setFormData({
      ...formData,
      directionId,
      departmentId: '',
      sectionId: ''
    })
    filterDepartmentsByDirection(directionId)
    setSections([])
  }

  const handleDepartmentChange = (departmentId) => {
    setFormData({
      ...formData,
      departmentId,
      sectionId: ''
    })
    filterSectionsByDepartment(departmentId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingUser) {
        await organizationService.updateClientUser(editingUser.id, formData)
        toast.success('Utilizador atualizado com sucesso!')
      } else {
        const response = await organizationService.createClientUser(formData)
        if (response.data.user.tempPassword) {
          toast.success(`Utilizador criado! Senha temporária: ${response.data.user.tempPassword}`, {
            duration: 10000
          })
        } else {
          toast.success('Utilizador criado com sucesso!')
        }
      }
      handleCloseModal()
      loadUsers()
    } catch (error) {
      console.error('Erro ao salvar utilizador:', error)
      toast.error(error.response?.data?.error || 'Erro ao salvar utilizador')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = await confirmDelete(
      'Desativar utilizador?',
      `Tem certeza que deseja desativar o utilizador ${user.name}?`
    )

    if (!confirmed) return

    try {
      await organizationService.deleteClientUser(user.id)
      toast.success('Utilizador desativado com sucesso!')
      loadUsers()
    } catch (error) {
      console.error('Erro ao desativar utilizador:', error)
      toast.error(error.response?.data?.error || 'Erro ao desativar utilizador')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">A carregar...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar utilizadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="ml-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Utilizador
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Organização</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  Nenhum utilizador encontrado
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.phone || '-'}</td>
                  <td className="px-6 py-4 text-xs">
                    {user.direction && (
                      <div className="text-blue-600 dark:text-blue-400">📍 {user.direction.name}</div>
                    )}
                    {user.department && (
                      <div className="text-orange-600 dark:text-orange-400">🏢 {user.department.name}</div>
                    )}
                    {user.section && (
                      <div className="text-green-600 dark:text-green-400">📁 {user.section.name}</div>
                    )}
                    {!user.direction && !user.department && !user.section && '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'client-admin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                      {user.role === 'client-admin' ? 'Administrador' : 'Utilizador'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        title="Desativar"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+351 912 345 678"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Perfil *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  required
                >
                  <option value="client-user">Utilizador</option>
                  <option value="client-admin">Administrador</option>
                </select>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3">Organização</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Direção</label>
                    <select
                      value={formData.directionId}
                      onChange={(e) => handleDirectionChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    >
                      <option value="">Selecione uma direção</option>
                      {directions.map(dir => (
                        <option key={dir.id} value={dir.id}>{dir.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Departamento</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      disabled={!formData.directionId || departments.length === 0}
                    >
                      <option value="">Selecione um departamento</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    {formData.directionId && departments.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Nenhum departamento disponível nesta direção</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Secção</label>
                    <select
                      value={formData.sectionId}
                      onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      disabled={!formData.departmentId || sections.length === 0}
                    >
                      <option value="">Selecione uma secção</option>
                      {sections.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                      ))}
                    </select>
                    {formData.departmentId && sections.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Nenhuma secção disponível neste departamento</p>
                    )}
                  </div>
                </div>
              </div>

              {!editingUser && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Uma senha temporária será gerada e exibida após a criação.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersTab
