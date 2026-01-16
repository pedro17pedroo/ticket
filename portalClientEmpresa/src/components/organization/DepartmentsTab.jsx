
import { useState, useEffect } from 'react'
import { Plus, Edit, Building2, Users, Search, X, Power, Mail } from 'lucide-react'
import { createPortal } from 'react-dom'
import { confirmAction, showSuccess, showError } from '../../utils/alerts'
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

  // Effect para controlar modal
  useEffect(() => {
    if (showModal) {
      // Prevenir scroll quando modal está aberto
      document.body.style.overflow = 'hidden'
      
      // Handler para ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCloseModal()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showModal])

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

  const handleToggleActive = async (department) => {
    const isActive = department.isActive;
    const action = isActive ? 'desativar' : 'reativar';

    const confirmed = await confirmAction(
      `${isActive ? 'Desativar' : 'Reativar'} departamento?`,
      `Tem certeza que deseja ${action} o departments "${department.name}"?`
    );

    if (!confirmed) return;

    try {
      if (isActive) {
        await organizationService.deleteDepartment(department.id);
        toast.success('Departamento desativado com sucesso');
      } else {
        await organizationService.reactivateDepartment(department.id);
        toast.success('Departamento reativado com sucesso');
      }
      loadDepartments();
    } catch (error) {
      console.error(`Erro ao ${action} departamento:`, error);
      toast.error(error.response?.data?.message || `Erro ao ${action} departamento`);
    }
  };

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
            <div key={department.id} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow ${!department.isActive ? 'opacity-50' : ''
              }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{department.name}</h3>
                    {!department.isActive && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Inativo</span>
                    )}
                  </div>
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
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(department)}
                    className={`p-1 rounded ${department.isActive
                        ? 'hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'hover:bg-green-100 dark:hover:bg-green-900/30'
                      }`}
                    title={department.isActive ? 'Desativar' : 'Reativar'}
                  >
                    <Power className={`w-4 h-4 ${department.isActive ? 'text-red-600' : 'text-green-600'
                      }`} />
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
      {showModal && createPortal(
        <div 
          className="fixed bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 animate-in fade-in duration-200" 
          style={{ 
            zIndex: 999999,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '8px'
          }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-h-[calc(100vh-16px)] overflow-hidden"
            style={{ maxWidth: '700px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {editingDepartment ? <Edit className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                    {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
                  </h2>
                  <p className="text-primary-100 text-sm mt-1">
                    {editingDepartment
                      ? 'Atualize as informações do departamento'
                      : 'Adicione um novo departamento à organização'
                    }
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="p-6">
                <form id="departmentForm" onSubmit={handleSubmit} className="space-y-5">
                  {/* Card: Informações Básicas */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary-500" />
                      Informações do Departamento
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Nome do departamento"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Direção
                      </label>
                      <select
                        value={formData.directionId}
                        onChange={(e) => setFormData({ ...formData, directionId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="">Selecione uma direção</option>
                        {directions.map(dir => (
                          <option key={dir.id} value={dir.id}>{dir.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Código
                        </label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="Código do departamento"
                        />
                      </div>

                      <div>
                        <label className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                        placeholder="Descrição do departamento"
                        rows={3}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer fixo com botões */}
            <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="departmentForm"
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Building2 className="w-5 h-5" />
                  {editingDepartment ? 'Atualizar' : 'Criar'} Departamento
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  )
}

export default DepartmentsTab
