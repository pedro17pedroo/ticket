import { useState, useEffect } from 'react'
import { Plus, Edit, Building, Search, X, Power } from 'lucide-react'
import { confirmAction, showSuccess, showError } from '../../utils/alerts'
import organizationService from '../../services/organizationService'
import toast from 'react-hot-toast'

const DirectionsTab = () => {
  const [directions, setDirections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingDirection, setEditingDirection] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  })

  useEffect(() => {
    loadDirections()
  }, [])

  const loadDirections = async () => {
    setLoading(true)
    try {
      const response = await organizationService.getDirections()
      setDirections(response.data.directions || [])
    } catch (error) {
      console.error('Erro ao carregar direções:', error)
      toast.error('Erro ao carregar direções')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (direction = null) => {
    if (direction) {
      setEditingDirection(direction)
      setFormData({
        name: direction.name || '',
        code: direction.code || '',
        description: direction.description || ''
      })
    } else {
      setEditingDirection(null)
      setFormData({ name: '', code: '', description: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingDirection(null)
    setFormData({ name: '', code: '', description: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      if (editingDirection) {
        await organizationService.updateDirection(editingDirection.id, formData)
        toast.success('Direção atualizada com sucesso')
      } else {
        await organizationService.createDirection(formData)
        toast.success('Direção criada com sucesso')
      }
      handleCloseModal()
      loadDirections()
    } catch (error) {
      console.error('Erro ao salvar direção:', error)
      toast.error(error.response?.data?.message || 'Erro ao salvar direção')
    }
  }

  const handleToggleActive = async (direction) => {
    const isActive = direction.isActive;
    const action = isActive ? 'desativar' : 'reativar';

    const confirmed = await confirmAction(
      `${isActive ? 'Desativar' : 'Reativar'} direção?`,
      `Tem certeza que deseja ${action} a direção "${direction.name}"?`
    );

    if (!confirmed) return;

    try {
      if (isActive) {
        await organizationService.deleteDirection(direction.id);
        toast.success('Direção desativada com sucesso');
      } else {
        await organizationService.reactivateDirection(direction.id);
        toast.success('Direção reativada com sucesso');
      }
      loadDirections();
    } catch (error) {
      console.error(`Erro ao ${action} direção:`, error);
      toast.error(error.response?.data?.message || `Erro ao ${action} direção`);
    }
  };

  const filteredDirections = directions.filter(dir =>
    dir.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dir.code?.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Pesquisar direções..."
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
          Nova Direção
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDirections.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhuma direção encontrada
          </div>
        ) : (
          filteredDirections.map((direction) => (
            <div key={direction.id} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow ${!direction.isActive ? 'opacity-50' : ''
              }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{direction.name}</h3>
                    {!direction.isActive && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Inativo</span>
                    )}
                  </div>
                  {direction.code && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Código: {direction.code}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(direction)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(direction)}
                    className={`p-1 rounded ${direction.isActive
                        ? 'hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'hover:bg-green-100 dark:hover:bg-green-900/30'
                      }`}
                    title={direction.isActive ? 'Desativar' : 'Reativar'}
                  >
                    <Power className={`w-4 h-4 ${direction.isActive ? 'text-red-600' : 'text-green-600'
                      }`} />
                  </button>
                </div>
              </div>
              {direction.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{direction.description}</p>
              )}
              {direction.manager && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Gestor: {direction.manager.name}
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
                {editingDirection ? 'Editar Direção' : 'Nova Direção'}
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
                  placeholder="Nome da direção"
                  required
                />
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
                  placeholder="Código da direção"
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
                  placeholder="Descrição da direção"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium"
                >
                  {editingDirection ? 'Atualizar' : 'Criar'}
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

export default DirectionsTab
