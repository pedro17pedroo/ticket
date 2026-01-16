import { useState, useEffect } from 'react'
import { Plus, Edit, Building, Search, X, Power } from 'lucide-react'
import { createPortal } from 'react-dom'
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
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {editingDirection ? <Edit className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                    {editingDirection ? 'Editar Direção' : 'Nova Direção'}
                  </h2>
                  <p className="text-primary-100 text-sm mt-1">
                    {editingDirection
                      ? 'Atualize as informações da direção'
                      : 'Adicione uma nova direção à organização'
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

            {/* Content */}
            <div className="p-6">
              <form id="directionForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary-500" />
                    Informações da Direção
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
                      placeholder="Nome da direção"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Código da direção"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Descrição da direção"
                      rows={3}
                    />
                  </div>
                </div>
              </form>
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
                  form="directionForm"
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Building className="w-5 h-5" />
                  {editingDirection ? 'Atualizar' : 'Criar'} Direção
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

export default DirectionsTab
