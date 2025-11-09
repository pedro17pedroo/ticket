import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'
import organizationService from '../../services/organizationService'
import toast from 'react-hot-toast'

const SectionsTab = () => {
  const [sections, setSections] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: ''
  })

  useEffect(() => {
    loadSections()
    loadDepartments()
  }, [])

  const loadSections = async () => {
    setLoading(true)
    try {
      const response = await organizationService.getSections()
      setSections(response.data.sections || [])
    } catch (error) {
      console.error('Erro ao carregar secções:', error)
      toast.error('Erro ao carregar secções')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await organizationService.getDepartments()
      setDepartments(response.data.departments || [])
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }

  const handleOpenModal = (section = null) => {
    if (section) {
      setEditingSection(section)
      setFormData({
        name: section.name || '',
        code: section.code || '',
        description: section.description || '',
        departmentId: section.departmentId || ''
      })
    } else {
      setEditingSection(null)
      setFormData({ name: '', code: '', description: '', departmentId: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSection(null)
    setFormData({ name: '', code: '', description: '', departmentId: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      if (editingSection) {
        await organizationService.updateSection(editingSection.id, formData)
        toast.success('Secção atualizada com sucesso')
      } else {
        await organizationService.createSection(formData)
        toast.success('Secção criada com sucesso')
      }
      handleCloseModal()
      loadSections()
    } catch (error) {
      console.error('Erro ao salvar secção:', error)
      toast.error(error.response?.data?.message || 'Erro ao salvar secção')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar esta secção?')) {
      return
    }

    try {
      await organizationService.deleteSection(id)
      toast.success('Secção eliminada com sucesso')
      loadSections()
    } catch (error) {
      console.error('Erro ao eliminar secção:', error)
      toast.error(error.response?.data?.message || 'Erro ao eliminar secção')
    }
  }

  const filteredSections = sections.filter(sec =>
    sec.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sec.code?.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Pesquisar secções..."
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
          Nova Secção
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhuma secção encontrada
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{section.name}</h3>
                  {section.code && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Código: {section.code}</p>
                  )}
                  {section.department && (
                    <div className="text-xs mt-1 space-y-0.5">
                      <p className="text-orange-600 dark:text-orange-400">🏢 {section.department.name}</p>
                      {section.department.direction && (
                        <p className="text-blue-600 dark:text-blue-400">📍 {section.department.direction.name}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenModal(section)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(section.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              {section.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{section.description}</p>
              )}
              {section.manager && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Gestor: {section.manager.name}
                </div>
              )}
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
                {editingSection ? 'Editar Secção' : 'Nova Secção'}
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
                  placeholder="Nome da secção"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Departamento
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                >
                  <option value="">Selecione um departamento</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
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
                  placeholder="Código da secção"
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
                  placeholder="Descrição da secção"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium"
                >
                  {editingSection ? 'Atualizar' : 'Criar'}
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

export default SectionsTab
