import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Save,
  Users,
  Mail,
  Phone,
  User,
  Building,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'
import Modal from './Modal'
import { 
  getStakeholders, 
  addStakeholder, 
  updateStakeholder, 
  removeStakeholder,
  STAKEHOLDER_ROLES,
  STAKEHOLDER_TYPES 
} from '../services/projectService'
import { getUsers } from '../services/userService'
import { confirmDelete } from '../utils/alerts'

/**
 * StakeholderManager - Component for managing project stakeholders
 * Features:
 * - List stakeholders with role and type
 * - Modal for adding/editing stakeholders
 * - Selection of internal users from organization
 * - Form for external stakeholders
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
const StakeholderManager = ({ projectId, onStakeholdersChange }) => {
  const [stakeholders, setStakeholders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState(null)
  const [internalUsers, setInternalUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    type: 'internal',
    userId: '',
    name: '',
    email: '',
    phone: '',
    role: 'team_member',
    notes: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadStakeholders()
    }
  }, [projectId])

  const loadStakeholders = async () => {
    setLoading(true)
    try {
      const response = await getStakeholders(projectId)
      const stakeholdersData = response.stakeholders || response.data || response || []
      setStakeholders(Array.isArray(stakeholdersData) ? stakeholdersData : [])
    } catch (error) {
      console.error('Erro ao carregar stakeholders:', error)
      toast.error('Erro ao carregar stakeholders do projeto')
    } finally {
      setLoading(false)
    }
  }

  const loadInternalUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await getUsers({ limit: 100 })
      const usersData = response.users || response.data || response || []
      setInternalUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error)
      toast.error('Erro ao carregar utilizadores internos')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Open modal for adding new stakeholder
  const handleAddStakeholder = () => {
    setEditingStakeholder(null)
    setFormData({
      type: 'internal',
      userId: '',
      name: '',
      email: '',
      phone: '',
      role: 'team_member',
      notes: ''
    })
    setFormErrors({})
    setUserSearchTerm('')
    setIsModalOpen(true)
    loadInternalUsers()
  }

  // Open modal for editing existing stakeholder
  const handleEditStakeholder = (stakeholder) => {
    setEditingStakeholder(stakeholder)
    setFormData({
      type: stakeholder.type || 'external',
      userId: stakeholder.userId || '',
      name: stakeholder.name || '',
      email: stakeholder.email || '',
      phone: stakeholder.phone || '',
      role: stakeholder.role || 'team_member',
      notes: stakeholder.notes || ''
    })
    setFormErrors({})
    setUserSearchTerm('')
    setIsModalOpen(true)
    if (stakeholder.type === 'internal') {
      loadInternalUsers()
    }
  }

  // Handle delete stakeholder
  const handleDeleteStakeholder = async (stakeholder) => {
    const confirmed = await confirmDelete(
      'Remover Stakeholder?',
      `Tem certeza que deseja remover "${stakeholder.name}" do projeto?`
    )

    if (!confirmed) return

    try {
      await removeStakeholder(projectId, stakeholder.id)
      toast.success('Stakeholder removido com sucesso')
      const updatedStakeholders = stakeholders.filter(s => s.id !== stakeholder.id)
      setStakeholders(updatedStakeholders)
      if (onStakeholdersChange) onStakeholdersChange(updatedStakeholders)
    } catch (error) {
      console.error('Erro ao remover stakeholder:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao remover stakeholder'
      toast.error(errorMessage)
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    
    if (formData.type === 'internal') {
      if (!formData.userId) {
        errors.userId = 'Selecione um utilizador'
      }
    } else {
      if (!formData.name.trim()) {
        errors.name = 'O nome é obrigatório'
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido'
    }

    if (!formData.role) {
      errors.role = 'Selecione um papel'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      let payload = {
        type: formData.type,
        role: formData.role,
        notes: formData.notes.trim() || null
      }

      if (formData.type === 'internal') {
        const selectedUser = internalUsers.find(u => u.id === formData.userId)
        payload.userId = formData.userId
        payload.name = selectedUser?.name || formData.name
        payload.email = selectedUser?.email || formData.email
      } else {
        payload.name = formData.name.trim()
        payload.email = formData.email.trim() || null
        payload.phone = formData.phone.trim() || null
      }

      if (editingStakeholder) {
        // Update existing stakeholder
        await updateStakeholder(projectId, editingStakeholder.id, payload)
        toast.success('Stakeholder atualizado com sucesso')
      } else {
        // Add new stakeholder
        await addStakeholder(projectId, payload)
        toast.success('Stakeholder adicionado com sucesso')
      }

      setIsModalOpen(false)
      loadStakeholders()
    } catch (error) {
      console.error('Erro ao guardar stakeholder:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao guardar stakeholder'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Handle type change
  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      userId: '',
      name: '',
      email: '',
      phone: ''
    }))
    setFormErrors({})
    if (type === 'internal') {
      loadInternalUsers()
    }
  }

  // Handle user selection
  const handleUserSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      userId: user.id,
      name: user.name,
      email: user.email
    }))
    setUserSearchTerm('')
    if (formErrors.userId) {
      setFormErrors(prev => ({ ...prev, userId: null }))
    }
  }

  // Filter users based on search term
  const filteredUsers = internalUsers.filter(user => 
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  // Get role badge styling
  const getRoleBadge = (role) => {
    const roleConfig = STAKEHOLDER_ROLES.find(r => r.value === role)
    const colorMap = {
      sponsor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      team_member: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      observer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      client: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[role] || colorMap.observer}`}>
        {roleConfig?.label || role}
      </span>
    )
  }

  // Get type badge styling
  const getTypeBadge = (type) => {
    const typeConfig = STAKEHOLDER_TYPES.find(t => t.value === type)
    const isInternal = type === 'internal'
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        isInternal 
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      }`}>
        {typeConfig?.label || type}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stakeholders do Projeto</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerir pessoas interessadas no projeto
          </p>
        </div>
        <button
          onClick={handleAddStakeholder}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Stakeholder
        </button>
      </div>

      {/* Stakeholders List */}
      {stakeholders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum stakeholder adicionado</p>
          <button
            onClick={handleAddStakeholder}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Adicionar primeiro stakeholder
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Papel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stakeholders.map((stakeholder) => (
                  <tr key={stakeholder.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {stakeholder.type === 'internal' ? (
                            <User className="w-5 h-5 text-gray-500" />
                          ) : (
                            <Building className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{stakeholder.name}</p>
                          {stakeholder.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {stakeholder.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {stakeholder.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${stakeholder.email}`} className="hover:text-primary-600">
                              {stakeholder.email}
                            </a>
                          </div>
                        )}
                        {stakeholder.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${stakeholder.phone}`} className="hover:text-primary-600">
                              {stakeholder.phone}
                            </a>
                          </div>
                        )}
                        {!stakeholder.email && !stakeholder.phone && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getRoleBadge(stakeholder.role)}
                    </td>
                    <td className="px-4 py-4">
                      {getTypeBadge(stakeholder.type)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditStakeholder(stakeholder)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar stakeholder"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStakeholder(stakeholder)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remover stakeholder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Stakeholder Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">
              {editingStakeholder ? 'Editar Stakeholder' : 'Adicionar Stakeholder'}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Stakeholder
                </label>
                <div className="flex gap-2">
                  {STAKEHOLDER_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeChange(type.value)}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        formData.type === type.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {type.value === 'internal' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Building className="w-4 h-4" />
                        )}
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal User Selection */}
              {formData.type === 'internal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selecionar Utilizador *
                  </label>
                  {formData.userId ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{formData.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formData.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, userId: '', name: '', email: '' }))}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="Pesquisar utilizador..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                        {loadingUsers ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Nenhum utilizador encontrado
                          </div>
                        ) : (
                          filteredUsers.map(user => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  {formErrors.userId && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.userId}</p>
                  )}
                </div>
              )}

              {/* External Stakeholder Form */}
              {formData.type === 'external' && (
                <>
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nome do stakeholder"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="email@exemplo.com"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Papel no Projeto *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {STAKEHOLDER_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {formErrors.role && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.role}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                  placeholder="Notas adicionais sobre o stakeholder..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    A guardar...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingStakeholder ? 'Guardar Alterações' : 'Adicionar Stakeholder'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}

StakeholderManager.propTypes = {
  projectId: PropTypes.string.isRequired,
  onStakeholdersChange: PropTypes.func
}

export default StakeholderManager
