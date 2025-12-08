import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, ShoppingCart, Eye, Settings, TrendingUp, X, Box, FileText, Clock, CheckSquare, AlertCircle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { confirmDelete } from '../utils/alerts'

const ServiceCatalog = () => {
  const [activeTab, setActiveTab] = useState('items') // items, statistics
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)

  // Dados configuráveis (SLAs, Prioridades, Tipos)
  const [slas, setSlas] = useState([])
  const [priorities, setPriorities] = useState([])
  const [types, setTypes] = useState([])

  // Estrutura organizacional
  const [directions, setDirections] = useState([])
  const [departments, setDepartments] = useState([])
  const [sections, setSections] = useState([])

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  // Helper: Formatar tempo do SLA
  const formatSLATime = (minutes) => {
    if (minutes < 60) return `${minutes}min`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
    return `${Math.floor(minutes / 1440)}d`
  }

  // Helper: Formatar descrição completa do SLA
  const formatSLALabel = (sla) => {
    const response = formatSLATime(sla.responseTimeMinutes)
    const resolution = formatSLATime(sla.resolutionTimeMinutes)
    return `${sla.name} (${response} resposta / ${resolution} resolução)`
  }

  // Forms
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'FolderOpen',
    color: '#3b82f6',
    imageUrl: '',
    parentCategoryId: '',
    defaultDirectionId: '',
    defaultDepartmentId: '',
    defaultSectionId: '',
    order: 0,
    isActive: true
  })

  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    shortDescription: '',
    fullDescription: '',
    icon: 'Box',
    slaId: '',
    priorityId: '',  // NOVO: Prioridade configurável
    typeId: '',      // NOVO: Tipo configurável
    defaultDirectionId: '',  // OBRIGATÓRIO: Direção responsável
    defaultDepartmentId: '',  // OBRIGATÓRIO: Departamento responsável
    defaultSectionId: '',  // OBRIGATÓRIO: Secção responsável
    defaultTicketCategoryId: '',
    defaultPriority: 'media',  // LEGADO
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
    loadConfigOptions() // Carregar SLAs, Prioridades, Tipos
  }, [activeTab])

  const loadConfigOptions = async () => {
    try {
      const [slasRes, prioritiesRes, typesRes, directionsRes, departmentsRes, sectionsRes] = await Promise.all([
        api.get('/slas'),
        api.get('/priorities'),
        api.get('/types'),
        api.get('/organizational-structure/directions'),
        api.get('/organizational-structure/departments'),
        api.get('/organizational-structure/sections')
      ])
      setSlas(slasRes.data.slas || [])
      setPriorities(prioritiesRes.data.priorities || [])
      setTypes(typesRes.data.types || [])
      setDirections(directionsRes.data.directions || [])
      setDepartments(departmentsRes.data.departments || [])
      setSections(sectionsRes.data.sections || [])
    } catch (error) {
      console.error('Erro ao carregar opções de configuração:', error)
      // Garantir arrays vazios em caso de erro
      setSlas([])
      setPriorities([])
      setTypes([])
      setDirections([])
      setDepartments([])
      setSections([])
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'items') {
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
    setCategoryForm({
      name: '',
      description: '',
      icon: 'FolderOpen',
      color: '#3b82f6',
      imageUrl: '',
      parentCategoryId: '',
      defaultDirectionId: '',
      defaultDepartmentId: '',
      defaultSectionId: '',
      order: 0,
      isActive: true
    })
    setEditingCategory(null)
    setShowCategoryModal(true)
  }

  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'FolderOpen',
      color: category.color || '#3b82f6',
      imageUrl: category.imageUrl || '',
      parentCategoryId: category.parentCategoryId || '',
      defaultDirectionId: category.defaultDirectionId || '',
      defaultDepartmentId: category.defaultDepartmentId || '',
      defaultSectionId: category.defaultSectionId || '',
      order: category.order || 0,
      isActive: category.isActive !== false
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
    const confirmed = await confirmDelete(
      'Eliminar categoria?',
      'Deseja realmente eliminar esta categoria?'
    )
    if (!confirmed) return
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
      priorityId: '',  // NOVO
      typeId: '',      // NOVO
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
      priorityId: item.priorityId || '',  // NOVO
      typeId: item.typeId || '',          // NOVO
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
    const confirmed = await confirmDelete(
      'Eliminar item?',
      'Deseja realmente eliminar este item?'
    )
    if (!confirmed) return
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
            Gerir itens e serviços do catálogo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'items'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <ShoppingCart className="w-5 h-5 inline mr-2" />
            Itens do Catálogo
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'statistics'
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isActive
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

      {/* Modal Item - Profissionalizado */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          {/* Header - Padrão Azul */}
          <div className="sticky top-0 bg-blue-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {editingItem ? 'Editar Item' : 'Novo Item'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-0.5">
                    {editingItem
                      ? 'Atualize as informações do item do catálogo'
                      : 'Crie um novo item/serviço no catálogo'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="itemForm" onSubmit={handleSaveItem} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                    Informações Básicas
                  </h3>

                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon || '📁'} {cat.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Selecione a categoria onde este item será exibido
                    </p>
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Item *
                    </label>
                    <input
                      type="text"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Ex: Solicitar Novo Computador"
                    />
                  </div>

                  {/* Descrição Curta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição Curta
                    </label>
                    <input
                      type="text"
                      value={itemForm.shortDescription}
                      onChange={(e) => setItemForm({ ...itemForm, shortDescription: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Resumo breve do serviço (exibido em cartões)"
                    />
                  </div>

                  {/* Descrição Completa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição Completa
                    </label>
                    <textarea
                      value={itemForm.fullDescription}
                      onChange={(e) => setItemForm({ ...itemForm, fullDescription: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Descrição detalhada do serviço, instruções, requisitos..."
                    />
                  </div>
                </div>

                {/* Card: Configurações */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Settings className="w-5 h-5" />
                    Configurações
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Prioridade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        🎯 Prioridade *
                      </label>
                      <select
                        value={itemForm.priorityId}
                        onChange={(e) => setItemForm({ ...itemForm, priorityId: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Selecione a prioridade...</option>
                        {priorities.map(priority => (
                          <option key={priority.id} value={priority.id}>
                            {priority.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SLA */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ⏱️ SLA *
                      </label>
                      <select
                        value={itemForm.slaId}
                        onChange={(e) => setItemForm({ ...itemForm, slaId: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Selecione o SLA...</option>
                        {slas.map(sla => (
                          <option key={sla.id} value={sla.id}>
                            {formatSLALabel(sla)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📝 Tipo *
                      </label>
                      <select
                        value={itemForm.typeId}
                        onChange={(e) => setItemForm({ ...itemForm, typeId: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Selecione o tipo...</option>
                        {types.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Roteamento Organizacional */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      🏢 Roteamento Organizacional
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Defina a estrutura organizacional responsável por este serviço. A <strong>Direção é obrigatória</strong>, enquanto Departamento e Secção são opcionais.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Direção */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          🎯 Direção <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={itemForm.defaultDirectionId}
                          onChange={(e) => setItemForm({ ...itemForm, defaultDirectionId: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          required
                        >
                          <option value="">Selecione a direção...</option>
                          {directions.map(direction => (
                            <option key={direction.id} value={direction.id}>
                              {direction.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Departamento */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          🏛️ Departamento
                        </label>
                        <select
                          value={itemForm.defaultDepartmentId}
                          onChange={(e) => setItemForm({ ...itemForm, defaultDepartmentId: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                          <option value="">Selecione o departamento...</option>
                          {departments.map(department => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Opcional - deixe vazio se não aplicável
                        </p>
                      </div>

                      {/* Secção */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          📂 Secção
                        </label>
                        <select
                          value={itemForm.defaultSectionId}
                          onChange={(e) => setItemForm({ ...itemForm, defaultSectionId: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                          <option value="">Selecione a secção...</option>
                          {sections.map(section => (
                            <option key={section.id} value={section.id}>
                              {section.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Opcional - deixe vazio se não aplicável
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Tempo Estimado */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Tempo Estimado (opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={itemForm.estimatedDeliveryTime}
                        onChange={(e) => setItemForm({ ...itemForm, estimatedDeliveryTime: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Ex: 2"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        💡 Diferente do SLA: este é o tempo <strong>real de trabalho</strong> para planejamento de capacidade
                      </p>
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={itemForm.requiresApproval}
                        onChange={(e) => setItemForm({ ...itemForm, requiresApproval: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        Requer Aprovação
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={itemForm.isPublic}
                        onChange={(e) => setItemForm({ ...itemForm, isPublic: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        Público
                      </span>
                    </label>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">💡 Dica:</p>
                        <p>• <strong>Requer Aprovação:</strong> Solicitações serão enviadas para aprovação antes de virarem tickets</p>
                        <p>• <strong>Público:</strong> Item visível no portal do cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Footer sticky */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="itemForm"
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingItem ? '💾 Atualizar Item' : '✨ Criar Item'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ServiceCatalog
