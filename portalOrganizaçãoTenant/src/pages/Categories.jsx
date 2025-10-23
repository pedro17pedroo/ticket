import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'

const Categories = () => {
  const { t } = useTranslation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6'
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData)
        showSuccess('Atualizado!', 'Categoria atualizada com sucesso')
      } else {
        await api.post('/categories', formData)
        showSuccess('Criado!', 'Categoria criada com sucesso')
      }
      setShowModal(false)
      resetForm()
      loadCategories()
    } catch (error) {
      showError('Erro ao salvar', error.response?.data?.error || error.message)
      console.error('Erro ao salvar categoria:', error)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#3B82F6'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Tem certeza que deseja eliminar esta categoria?',
      'Esta ação não pode ser revertida!'
    )
    
    if (!confirmed) return

    try {
      await api.delete(`/categories/${id}`)
      showSuccess('Eliminado!', 'Categoria eliminada com sucesso')
      loadCategories()
    } catch (error) {
      showError('Erro ao eliminar', error.response?.data?.error || error.message)
      console.error('Erro ao eliminar categoria:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6'
    })
    setEditingCategory(null)
  }

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Laranja' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6B7280', label: 'Cinza' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('categories')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir categorias de tickets
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl"
                style={{ backgroundColor: category.color }}
              >
                {category.icon || <Tag className="w-6 h-6" />}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Tag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nenhuma categoria criada ainda
          </p>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Criar Primeira Categoria
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Ex: Suporte Técnico"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Descrição opcional"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium mb-2">Ícone (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Ex: 🔧 💻 📞"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Cor</label>
                <div className="grid grid-cols-7 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories
