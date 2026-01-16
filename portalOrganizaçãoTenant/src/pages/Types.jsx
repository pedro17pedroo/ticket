import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, FileType, X, Save, FileText, Palette, Hash, AlignLeft } from 'lucide-react'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'
import PermissionGate from '../components/PermissionGate'

const Types = () => {
  const { t } = useTranslation()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    order: 0
  })

  useEffect(() => {
    fetchTypes()
  }, [])

  const fetchTypes = async () => {
    try {
      const response = await api.get('/types')
      setTypes(response.data.types || [])
    } catch (error) {
      console.error('Erro ao carregar tipos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingType) {
        await api.put(`/types/${editingType.id}`, formData)
        showSuccess('Atualizado!', 'Tipo atualizado com sucesso')
      } else {
        await api.post('/types', formData)
        showSuccess('Criado!', 'Tipo criado com sucesso')
      }
      
      setShowModal(false)
      resetForm()
      fetchTypes()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
      console.error('Erro ao salvar tipo:', error)
    }
  }

  const handleEdit = (type) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      icon: type.icon || '',
      color: type.color,
      order: type.order || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Tem certeza que deseja eliminar este tipo?',
      'Esta ação não pode ser revertida!'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/types/${id}`)
      showSuccess('Eliminado!', 'Tipo eliminado com sucesso')
      fetchTypes()
    } catch (error) {
      showError('Erro ao eliminar', error.response?.data?.error || error.message)
      console.error(error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      order: 0
    })
    setEditingType(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tipos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Criar e gerir tipos personalizados de tickets
          </p>
        </div>
        <PermissionGate permission="settings.manage_sla">
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Novo Tipo
          </button>
        </PermissionGate>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ordem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {types.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum tipo cadastrado
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.order}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {type.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {type.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <PermissionGate permission="settings.manage_sla">
                        <button
                          onClick={() => handleEdit(type)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        >
                          <Edit2 size={18} />
                        </button>
                      </PermissionGate>
                      <PermissionGate permission="settings.manage_sla">
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileType className="w-6 h-6" />
                  {editingType ? 'Editar Tipo' : 'Novo Tipo'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingType 
                    ? 'Atualize as informações do tipo de ticket'
                    : 'Crie um novo tipo para classificar tickets'
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
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="typeForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nome do Tipo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      placeholder="Ex: Solicitação, Incidente, Mudança"
                      required
                    />
                  </div>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                      <AlignLeft className="w-4 h-4 text-gray-400" />
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none text-base"
                      rows="4"
                      placeholder="Descreva brevemente este tipo de ticket..."
                    />
                  </div>

                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                      <Hash className="w-4 h-4 text-gray-400" />
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full min-w-[500px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Ordem de apresentação nas listas (menor número aparece primeiro)</p>
                  </div>
                </div>

                {/* Card: Aparência */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary-500" />
                    Aparência Visual
                  </h3>
                  
                  <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Cor do Tipo *</label>
                    <div className="flex items-center gap-6">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-24 h-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                        required
                      />
                      <div className="flex-1">
                        <div 
                          className="px-6 py-3 rounded-lg font-medium text-center text-white shadow-sm text-base"
                          style={{ backgroundColor: formData.color }}
                        >
                          Prévia da Cor
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cor para identificação visual deste tipo</p>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>
          
          {/* Footer fixo com botões */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="typeForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingType ? 'Atualizar' : 'Criar'} Tipo
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Types
