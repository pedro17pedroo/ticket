import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Users, Building2, X } from 'lucide-react'
import api from '../services/api'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'

const Departments = () => {
  const [departments, setDepartments] = useState([])
  const [directions, setDirections] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    email: '',
    directionId: '',
    managerId: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [deptRes, dirRes, usersRes] = await Promise.all([
        api.get('/departments'),
        api.get('/directions'),
        api.get('/auth/users')
      ])
      setDepartments(deptRes.data.departments || [])
      setDirections(dirRes.data.directions || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error('Erro:', error)
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
        managerId: formData.managerId || null
      }

      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}`, payload)
        showSuccess('Atualizado!', 'Departamento atualizado com sucesso')
      } else {
        await api.post('/departments', payload)
        showSuccess('Criado!', 'Departamento criado com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description || '',
      code: department.code || '',
      email: department.email || '',
      directionId: department.directionId || '',
      managerId: department.managerId || '',
      isActive: department.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Eliminar departamento?',
      'Esta ação não pode ser revertida.'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/departments/${id}`)
      showSuccess('Eliminado!', 'Departamento eliminado com sucesso')
      loadData()
    } catch (error) {
      showError('Erro', error.response?.data?.error || error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      email: '',
      directionId: '',
      managerId: '',
      isActive: true
    })
    setEditingDepartment(null)
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departamentos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir departamentos e equipas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Departamento
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white dark:bg-gray-800 rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{dept.name}</h3>
                  {dept.code && <span className="text-xs text-gray-500">#{dept.code}</span>}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {dept.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {dept.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{dept.description}</p>
            )}

            <div className="space-y-2 mb-4 text-sm">
              {dept.direction && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{dept.direction.name}</span>
                </div>
              )}
              {dept.manager && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{dept.manager.name}</span>
                </div>
              )}
              {dept.sectionsCount > 0 && (
                <div className="text-primary-600 font-medium">
                  {dept.sectionsCount} secç{dept.sectionsCount === 1 ? 'ão' : 'ões'}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(dept)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(dept.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum departamento encontrado. Crie o primeiro!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
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
                  <label className="block text-sm font-medium mb-2">Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    maxLength={20}
                    placeholder="Ex: DEP-TI"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="departamento@empresa.com"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Direção</label>
                  <select
                    value={formData.directionId}
                    onChange={(e) => setFormData({ ...formData, directionId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  >
                    <option value="">Sem direção</option>
                    {directions.map((dir) => (
                      <option key={dir.id} value={dir.id}>{dir.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Responsável</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  >
                    <option value="">Sem responsável</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editingDepartment && (
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
                  {editingDepartment ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Departments
