import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, ShoppingCart, Eye, Settings, TrendingUp, X } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const ServiceCatalog = () => {
  const [activeTab, setActiveTab] = useState('categories') // categories, items, statistics
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  // Forms
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'FolderOpen',
    order: 0
  })

  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    shortDescription: '',
    fullDescription: '',
    icon: 'Box',
    slaId: '',
    defaultTicketCategoryId: '',
    defaultPriority: 'media',
    requiresApproval: false,
    defaultApproverId: '',
    assignedDepartmentId: '',
    estimatedCost: '',
    estimatedDeliveryTime: '',
    customFields: [],
    isPublic: true,
    order: 0
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'categories' || activeTab === 'items') {
        const [catRes, itemsRes] = await Promise.all([
          api.get('/catalog/categories?includeInactive=true'),
          api.get('/catalog/items?includeInactive=true')
        ])
        setCategories(catRes.data.categories || [])
        setItems(itemsRes.data.items || [])
      } else if (activeTab === 'statistics') {
        const statsRes = await api.get('/catalog/statistics')
        setStatistics(statsRes.data.statistics)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // ==================== CATEGORIAS ====================

  const handleCreateCategory = () => {
    setCategoryForm({ name: '', description: '', icon: 'FolderOpen', order: 0 })
    setEditingCategory(null)
    setShowCategoryModal(true)
  }

  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      order: category.order
    })
    setEditingCategory(category)
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await api.put(`/catalog/categories/${editingCategory.id}`, categoryForm)
        toast.success('Categoria atualizada!')
      } else {
        await api.post('/catalog/categories', categoryForm)
        toast.success('Categoria criada!')
      }
      setShowCategoryModal(false)
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar categoria')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Deseja realmente eliminar esta categoria?')) return
    try {
      await api.delete(`/catalog/categories/${id}`)
      toast.success('Categoria eliminada!')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao eliminar categoria')
    }
  }

  // ==================== ITENS ====================

  const handleCreateItem = () => {
    setItemForm({
      categoryId: categories[0]?.id || '',
      name: '',
      shortDescription: '',
      fullDescription: '',
      icon: 'Box',
      slaId: '',
      defaultTicketCategoryId: '',
      defaultPriority: 'media',
      requiresApproval: false,
      defaultApproverId: '',
      assignedDepartmentId: '',
      estimatedCost: '',
      estimatedDeliveryTime: '',
      customFields: [],
      isPublic: true,
      order: 0
    })
    setEditingItem(null)
    setShowItemModal(true)
  }

  const handleEditItem = (item) => {
    setItemForm({
      categoryId: item.categoryId,
      name: item.name,
      shortDescription: item.shortDescription || '',
      fullDescription: item.fullDescription || '',
      icon: item.icon,
      slaId: item.slaId || '',
      defaultTicketCategoryId: item.defaultTicketCategoryId || '',
      defaultPriority: item.defaultPriority,
      requiresApproval: item.requiresApproval,
      defaultApproverId: item.defaultApproverId || '',
      assignedDepartmentId: item.assignedDepartmentId || '',
      estimatedCost: item.estimatedCost || '',
      estimatedDeliveryTime: item.estimatedDeliveryTime || '',
      customFields: item.customFields || [],
      isPublic: item.isPublic,
      order: item.order
    })
    setEditingItem(item)
    setShowItemModal(true)
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    try {
      const data = { ...itemForm }
      if (data.estimatedCost) data.estimatedCost = parseFloat(data.estimatedCost)
      if (data.estimatedDeliveryTime) data.estimatedDeliveryTime = parseInt(data.estimatedDeliveryTime)

      if (editingItem) {
        await api.put(`/catalog/items/${editingItem.id}`, data)
        toast.success('Item atualizado!')
      } else {
        await api.post('/catalog/items', data)
        toast.success('Item criado!')
      }
      setShowItemModal(false)
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar item')
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Deseja realmente eliminar este item?')) return
    try {
      await api.delete(`/catalog/items/${id}`)
      toast.success('Item eliminado!')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao eliminar item')
    }
  }

  // ==================== RENDER ====================

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catálogo de Serviços</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir categorias e itens do catálogo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderOpen className="w-5 h-5 inline mr-2" />
            Categorias
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShoppingCart className="w-5 h-5 inline mr-2" />
            Itens do Catálogo
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistics'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Estatísticas
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleCreateCategory}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Nova Categoria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <FolderOpen className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {items.filter(i => i.categoryId === category.id).length} itens
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleCreateItem}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Novo Item
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingCart className="w-5 h-5 text-primary-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.shortDescription}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {item.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {item.requestCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'statistics' && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Serviços</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {statistics.totalItems}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Solicitações</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {statistics.totalRequests}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aguardando Aprovação</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {statistics.pendingApprovals}
                </p>
              </div>
              <Settings className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          {/* Mais solicitados */}
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Mais Solicitados</h3>
            <div className="space-y-3">
              {statistics.mostRequested?.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <ShoppingCart className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.requestCount} solicitações
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Categoria */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ordem</label>
              <input
                type="number"
                value={categoryForm.order}
                onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                {editingCategory ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Modal Item - Simplificado */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingItem ? 'Editar Item' : 'Novo Item'}</h2>
              <button onClick={() => setShowItemModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria *</label>
              <select
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição Curta</label>
              <input
                type="text"
                value={itemForm.shortDescription}
                onChange={(e) => setItemForm({ ...itemForm, shortDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição Completa</label>
              <textarea
                value={itemForm.fullDescription}
                onChange={(e) => setItemForm({ ...itemForm, fullDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prioridade Padrão</label>
                <select
                  value={itemForm.defaultPriority}
                  onChange={(e) => setItemForm({ ...itemForm, defaultPriority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tempo Estimado (h)</label>
                <input
                  type="number"
                  value={itemForm.estimatedDeliveryTime}
                  onChange={(e) => setItemForm({ ...itemForm, estimatedDeliveryTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.requiresApproval}
                  onChange={(e) => setItemForm({ ...itemForm, requiresApproval: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Requer Aprovação</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.isPublic}
                  onChange={(e) => setItemForm({ ...itemForm, isPublic: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Público</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                {editingItem ? 'Atualizar' : 'Criar'}
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
