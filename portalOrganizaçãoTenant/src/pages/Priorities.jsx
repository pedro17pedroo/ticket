import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle, X, Save, FileText, Palette, Hash } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'

const Priorities = () => {
  const { t } = useTranslation()
  const [priorities, setPriorities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPriority, setEditingPriority] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    order: 0
  })

  useEffect(() => {
    fetchPriorities()
  }, [])

  const fetchPriorities = async () => {
    try {
      const response = await api.get('/priorities')
      setPriorities(response.data.priorities || [])
    } catch (error) {
      toast.error('Erro ao carregar prioridades')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingPriority) {
        await api.put(`/priorities/${editingPriority.id}`, formData)
        showSuccess('Atualizado!', 'Prioridade atualizada com sucesso')
      } else {
        await api.post('/priorities', formData)
        showSuccess('Criado!', 'Prioridade criada com sucesso')
      }
      
      setShowModal(false)
      resetForm()
      fetchPriorities()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
      console.error('Erro ao salvar prioridade:', error)
    }
  }

  const handleEdit = (priority) => {
    setEditingPriority(priority)
    setFormData({
      name: priority.name,
      color: priority.color,
      order: priority.order || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Tem certeza que deseja eliminar esta prioridade?',
      'Esta ação não pode ser revertida!'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/priorities/${id}`)
      showSuccess('Eliminado!', 'Prioridade eliminada com sucesso')
      fetchPriorities()
    } catch (error) {
      showError('Erro ao eliminar', error.response?.data?.error || error.message)
      console.error(error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3B82F6',
      order: 0
    })
    setEditingPriority(null)
  }

  const colorOptions = [
    { label: 'Verde', color: '#10B981' },
    { label: 'Azul', color: '#3B82F6' },
    { label: 'Laranja', color: '#F59E0B' },
    { label: 'Vermelho', color: '#EF4444' },
    { label: 'Roxo', color: '#8B5CF6' },
    { label: 'Rosa', color: '#EC4899' },
    { label: 'Cinza', color: '#6B7280' }
  ]

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prioridades</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Criar e gerir prioridades personalizadas para os tickets
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Prioridade
        </button>
      </div>

      {/* Lista de Prioridades */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {priorities.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma prioridade cadastrada
                  </td>
                </tr>
              ) : (
                priorities.map((priority) => (
                  <tr key={priority.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {priority.order}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: priority.color }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {priority.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(priority)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(priority.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  {editingPriority ? 'Editar Prioridade' : 'Nova Prioridade'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingPriority 
                    ? 'Atualize as informações da prioridade'
                    : 'Defina uma nova prioridade para classificação de tickets'
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
              <form id="priorityForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Informações Básicas
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Prioridade *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Ex: Alta, Média, Baixa"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Hash className="w-4 h-4 text-gray-400" />
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="1"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quanto menor o número, maior a prioridade na ordenação</p>
                  </div>
                </div>

                {/* Card: Aparência */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary-500" />
                    Aparência Visual
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor da Prioridade *</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-20 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                        required
                      />
                      <div className="flex-1">
                        <div 
                          className="px-4 py-2 rounded-lg font-medium text-center text-white shadow-sm"
                          style={{ backgroundColor: formData.color }}
                        >
                          Prévia da Cor
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clique no seletor para escolher uma cor</p>
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
                form="priorityForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingPriority ? 'Atualizar' : 'Criar'} Prioridade
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Priorities
