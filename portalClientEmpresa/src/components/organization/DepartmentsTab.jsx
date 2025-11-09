import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'
import organizationService from '../../services/organizationService'
import toast from 'react-hot-toast'

const DepartmentsTab = () => {
  const [departments, setDepartments] = useState([])
  const [directions, setDirections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    directionId: '',
    email: ''
  })

  useEffect(() => {
    loadDepartments()
    loadDirections()
  }, [])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const response = await organizationService.getDepartments()
      setDepartments(response.data.departments || [])
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
      toast.error('Erro ao carregar departamentos')
    } finally {
      setLoading(false)
    }
  }

  const loadDirections = async () => {
    try {
      const response = await organizationService.getDirections()
      setDirections(response.data.directions || [])
    } catch (error) {
      console.error('Erro ao carregar direções:', error)
    }
  }

  const handleOpenModal = (department = null) => {
    if (department) {
      setEditingDepartment(department)
      setFormData({
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        directionId: department.directionId || '',
        email: department.email || ''
      })
    } else {
      setEditingDepartment(null)
      setFormData({ name: '', code: '', description: '', directionId: '', email: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingDepartment(null)
    setFormData({ name: '', code: '', description: '', directionId: '', email: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      if (editingDepartment) {
        await organizationService.updateDepartment(editingDepartment.id, formData)
        toast.success('Departamento atualizado com sucesso')
      } else {
        await organizationService.createDepartment(formData)
        toast.success('Departamento criado com sucesso')
      }
      handleCloseModal()
      loadDepartments()
    } catch (error) {
      console.error('Erro ao salvar departamento:', error)
      toast.error(error.response?.data?.message || 'Erro ao salvar departamento')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar este departamento?')) {
      return
    }

    try {
      await organizationService.deleteDepartment(id)
      toast.success('Departamento eliminado com sucesso')
      loadDepartments()
    } catch (error) {
      console.error('Erro ao eliminar departamento:', error)
      toast.error(error.response?.data?.message || 'Erro ao eliminar departamento')
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">A carregar...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar departamentos..."
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
          Novo Departamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDepartments.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhum departamento encontrado
          </div>
        ) : (
          filteredDepartments.map((department) => (
            <div key={department.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{department.name}</h3>
                  {department.code && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Código: {department.code}</p>
                  )}
                  {department.direction && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">📍 {department.direction.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenModal(department)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(department.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              {department.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{department.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                {department.manager && <span>Gestor: {department.manager.name}</span>}
                {department.email && <span>✉️ {department.email}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Nome do departamento"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Direção
                </label>
                <select
                  value={formData.directionId}
                  onChange={(e) => setFormData({ ...formData, directionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                >
                  <option value="">Selecione uma direção</option>
                  {directions.map(dir => (
                    <option key={dir.id} value={dir.id}>{dir.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Código do departamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Descrição do departamento"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium"
                >
                  {editingDepartment ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 py-2 rounded-lg font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentsTab
