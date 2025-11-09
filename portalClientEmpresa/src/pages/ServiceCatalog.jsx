import { useState, useEffect } from 'react'
import { Search, ShoppingCart, Clock, Euro, ArrowRight, CheckCircle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const ServiceCatalog = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadCatalog()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      loadItems(selectedCategory)
    } else {
      loadItems()
    }
  }, [selectedCategory, searchTerm])

  const loadCatalog = async () => {
    setLoading(true)
    try {
      const categoriesRes = await api.get('/catalog/categories')
      console.log('📁 Categorias carregadas:', categoriesRes.data)
      setCategories(categoriesRes.data.categories || [])
    } catch (error) {
      console.error('❌ Erro ao carregar catálogo:', error)
      console.error('Detalhes:', error.response?.data)
      toast.error('Erro ao carregar catálogo')
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async (categoryId = null) => {
    try {
      const params = {}
      if (categoryId) params.categoryId = categoryId
      if (searchTerm) params.search = searchTerm

      console.log('🔍 Buscando itens com params:', params)
      const response = await api.get('/catalog/items', { params })
      console.log('📦 Itens carregados:', response.data)
      setItems(response.data.items || [])
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error)
      console.error('Detalhes:', error.response?.data)
    }
  }

  const handleRequestService = (item) => {
    setSelectedItem(item)
    setFormData({})
    setShowRequestModal(true)
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()

    try {
      const response = await api.post('/catalog/requests', {
        catalogItemId: selectedItem.id,
        formData
      })

      if (response.data.requiresApproval) {
        toast.success('Solicitação enviada para aprovação!')
      } else {
        toast.success('Ticket criado automaticamente!')
      }

      setShowRequestModal(false)
      setSelectedItem(null)
      setFormData({})
      
      // Redirecionar para tickets
      setTimeout(() => navigate('/tickets'), 1500)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao solicitar serviço')
    }
  }

  const renderFormField = (field) => {
    const commonClasses = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        )
      case 'textarea':
        return (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            className={commonClasses}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className={commonClasses}
          />
        )
      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className={commonClasses}
          >
            <option value="">Selecione...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
              className="rounded text-primary-600"
            />
            <span className="text-sm">{field.label}</span>
          </div>
        )
      case 'date':
        return (
          <input
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className={commonClasses}
          />
        )
      default:
        return null
    }
  }

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catálogo de Serviços</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Solicite serviços de forma rápida e organizada
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar serviços..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todos
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nenhum serviço encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Tente ajustar os filtros ou fazer uma nova busca'
              : 'Entre em contacto com o suporte para solicitar a configuração do catálogo de serviços'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            💡 Os serviços precisam estar marcados como <strong>públicos</strong> e <strong>ativos</strong> para aparecerem aqui
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      {item.category && (
                        <span className="text-xs text-gray-500">
                          {item.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {item.shortDescription}
                </p>

                <div className="space-y-2 mb-4">
                  {item.estimatedDeliveryTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{item.estimatedDeliveryTime}h estimadas</span>
                    </div>
                  )}
                  {item.estimatedCost && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Euro className="w-4 h-4" />
                      <span>{item.estimatedCost} {item.costCurrency}</span>
                    </div>
                  )}
                  {item.requiresApproval && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Requer aprovação</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRequestService(item)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <span>Solicitar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedItem && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Solicitar: {selectedItem.name}
            </h2>
            {selectedItem.fullDescription && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedItem.fullDescription}
              </p>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {selectedItem.customFields && selectedItem.customFields.length > 0 ? (
                selectedItem.customFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.description && (
                      <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                    )}
                    {renderFormField(field)}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Este serviço não requer informações adicionais
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false)
                    setSelectedItem(null)
                    setFormData({})
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                >
                  {selectedItem.requiresApproval ? 'Enviar para Aprovação' : 'Solicitar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceCatalog
