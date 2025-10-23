import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'

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
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                {editingPriority ? 'Editar Prioridade' : 'Nova Prioridade'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingPriority ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Priorities
