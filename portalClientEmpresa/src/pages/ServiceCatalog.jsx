import { useState, useEffect, useCallback } from 'react'
import { Search, ShoppingCart, Clock, Euro, ArrowRight, CheckCircle, AlertTriangle, Lock, ChevronRight, Home, FolderOpen } from 'lucide-react'
import api from '../services/api'
import catalogAccessService from '../services/catalogAccessService'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import DynamicIcon from '../components/DynamicIcon'

/**
 * ServiceCatalog Component
 * 
 * Displays the service catalog filtered by user's effective permissions.
 * Supports hierarchical category navigation.
 * 
 * Feature: catalog-access-control
 * Requirements: 4.1, 4.2, 4.3
 */
const ServiceCatalog = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [currentCategory, setCurrentCategory] = useState(null)
  const [breadcrumb, setBreadcrumb] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [formData, setFormData] = useState({})
  
  // Access control state
  const [effectiveAccess, setEffectiveAccess] = useState(null)
  const [accessError, setAccessError] = useState(null)
  const [hasNoAccess, setHasNoAccess] = useState(false)

  // Store full category tree for navigation
  const [categoryTree, setCategoryTree] = useState([])

  /**
   * Load effective permissions on mount
   */
  useEffect(() => {
    loadEffectiveAccess()
  }, [])

  /**
   * Load catalog when permissions are loaded
   */
  useEffect(() => {
    if (effectiveAccess !== null) {
      loadCatalog()
    }
  }, [effectiveAccess])

  /**
   * Update displayed categories when navigation changes
   */
  useEffect(() => {
    if (categoryTree.length > 0) {
      if (currentCategory) {
        // Find current category in tree and show its subcategories
        const current = findCategoryById(categoryTree, currentCategory.id)
        console.log('🔍 Finding category:', currentCategory.id, currentCategory.name)
        console.log('🔍 Found category:', current?.name, 'with', current?.subcategories?.length || 0, 'subcategories')
        if (current?.subcategories) {
          console.log('🔍 Subcategories:', current.subcategories.map(s => `${s.name} (${s.id})`))
        }
        setCategories(current?.subcategories || [])
        loadItems(currentCategory.id)
      } else {
        // Show root categories
        setCategories(categoryTree)
        setItems([])
      }
    }
  }, [currentCategory, categoryTree])

  /**
   * Reload items when search changes
   */
  useEffect(() => {
    if (effectiveAccess !== null && !hasNoAccess && searchTerm) {
      loadItems(currentCategory?.id)
    }
  }, [searchTerm])

  /**
   * Find category by ID in tree structure
   */
  const findCategoryById = (cats, id, path = '') => {
    for (const cat of cats) {
      const currentPath = path ? `${path} > ${cat.name}` : cat.name
      if (cat.id === id) {
        console.log(`🔍 findCategoryById: Found ${cat.name} at path: ${currentPath}`)
        console.log(`🔍 findCategoryById: Category has ${cat.subcategories?.length || 0} subcategories:`, cat.subcategories?.map(s => s.name))
        return cat
      }
      if (cat.subcategories?.length > 0) {
        const found = findCategoryById(cat.subcategories, id, currentPath)
        if (found) return found
      }
    }
    return null
  }

  /**
   * Build breadcrumb path to category
   */
  const buildBreadcrumb = (cats, targetId, path = []) => {
    for (const cat of cats) {
      if (cat.id === targetId) {
        return [...path, cat]
      }
      if (cat.subcategories?.length > 0) {
        const found = buildBreadcrumb(cat.subcategories, targetId, [...path, cat])
        if (found) return found
      }
    }
    return null
  }

  /**
   * Load user's effective catalog access permissions
   */
  const loadEffectiveAccess = async () => {
    try {
      const response = await catalogAccessService.getEffectiveAccess()
      console.log('🔐 Permissões efetivas carregadas:', response)
      
      const accessData = response.data || response
      setEffectiveAccess(accessData)
      
      if (accessData?.accessMode === 'none') {
        setHasNoAccess(true)
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar permissões:', error)
      setEffectiveAccess({})
      setAccessError('Não foi possível verificar as permissões de acesso')
    }
  }

  /**
   * Load catalog categories filtered by permissions
   */
  const loadCatalog = async () => {
    if (hasNoAccess) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Limpar cache para garantir dados frescos
      catalogAccessService.clearCache()
      
      const categoriesRes = await catalogAccessService.getCategories(false) // false = não usar cache
      console.log('📁 API Response (raw):', categoriesRes)
      console.log('📁 API Response (stringified):', JSON.stringify(categoriesRes, null, 2))
      
      const cats = categoriesRes.categories || []
      console.log('📁 Categories array length:', cats.length)
      
      // Log da hierarquia para debug
      const logHierarchy = (categories, level = 0) => {
        categories.forEach(cat => {
          const subcatCount = cat.subcategories?.length || 0
          const subcatNames = cat.subcategories?.map(s => s.name) || []
          console.log(`${'  '.repeat(level)}📂 ${cat.name} (ID: ${cat.id}, Subcats: ${subcatCount}, Names: [${subcatNames.join(', ')}])`)
          if (subcatCount > 0) {
            logHierarchy(cat.subcategories, level + 1)
          }
        })
      }
      console.log('📁 Hierarquia de categorias recebida:')
      logHierarchy(cats)
      
      // Verificar especificamente Hardware e Computadores
      const findCategory = (categories, name) => {
        for (const cat of categories) {
          if (cat.name === name) return cat
          if (cat.subcategories?.length > 0) {
            const found = findCategory(cat.subcategories, name)
            if (found) return found
          }
        }
        return null
      }
      
      const hardware = findCategory(cats, 'Hardware')
      console.log('🔧 Hardware category:', hardware ? {
        id: hardware.id,
        name: hardware.name,
        subcategoriesCount: hardware.subcategories?.length || 0,
        subcategories: hardware.subcategories?.map(s => ({ id: s.id, name: s.name })) || []
      } : 'NOT FOUND')
      
      const computadores = findCategory(cats, 'Computadores')
      console.log('💻 Computadores category:', computadores ? {
        id: computadores.id,
        name: computadores.name,
        parentCategoryId: computadores.parentCategoryId
      } : 'NOT FOUND')
      
      setCategoryTree(cats)
      setCategories(cats)
    } catch (error) {
      console.error('❌ Erro ao carregar catálogo:', error)
      if (error.response?.status === 403) {
        handleAccessDenied(error.response?.data)
      } else {
        toast.error('Erro ao carregar catálogo')
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load catalog items filtered by permissions
   */
  const loadItems = async (categoryId = null) => {
    if (hasNoAccess) return
    
    try {
      const params = {}
      if (categoryId) params.categoryId = categoryId
      if (searchTerm) params.search = searchTerm

      const response = await catalogAccessService.getItems(params, false)
      console.log('📦 Itens carregados:', response)
      setItems(response.items || [])
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error)
      if (error.response?.status === 403) {
        handleAccessDenied(error.response?.data)
      }
    }
  }

  /**
   * Handle category navigation
   */
  const navigateToCategory = (category) => {
    console.log('🚀 navigateToCategory called with:', category.name, category.id)
    console.log('🚀 Category subcategories:', category.subcategories?.map(s => ({ id: s.id, name: s.name })))
    setCurrentCategory(category)
    if (category) {
      const path = buildBreadcrumb(categoryTree, category.id) || []
      setBreadcrumb(path)
    } else {
      setBreadcrumb([])
    }
    setSearchTerm('')
  }

  /**
   * Navigate to root
   */
  const navigateToRoot = () => {
    setCurrentCategory(null)
    setBreadcrumb([])
    setCategories(categoryTree)
    setItems([])
    setSearchTerm('')
  }

  /**
   * Handle access denied errors
   */
  const handleAccessDenied = useCallback((errorData) => {
    const message = errorData?.message || 'Não tem permissão para aceder a este recurso'
    setAccessError(message)
    toast.error(message, { icon: '🔒', duration: 4000 })
  }, [])

  const handleRequestService = async (item) => {
    try {
      const hasAccess = await catalogAccessService.hasAccessToItem(item.id)
      if (!hasAccess) {
        handleAccessDenied({ message: 'Não tem permissão para solicitar este serviço' })
        return
      }
    } catch (error) {
      console.warn('Não foi possível verificar acesso ao item:', error)
    }
    
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
      setTimeout(() => navigate('/tickets'), 1500)
    } catch (error) {
      if (error.response?.status === 403) {
        handleAccessDenied(error.response?.data)
        setShowRequestModal(false)
        setSelectedItem(null)
      } else {
        toast.error(error.response?.data?.error || 'Erro ao solicitar serviço')
      }
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
              <option key={option.value} value={option.value}>{option.label}</option>
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

  const renderNoAccessMessage = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-full p-6 mb-6">
        <Lock className="w-16 h-16 text-yellow-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Acesso ao Catálogo Restrito
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        A sua empresa não tem acesso ao catálogo de serviços neste momento.
      </p>
      <button
        onClick={() => navigate('/tickets')}
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <span>Ver Meus Tickets</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )

  /**
   * Render breadcrumb navigation
   */
  const renderBreadcrumb = () => {
    if (breadcrumb.length === 0 && !currentCategory) return null

    return (
      <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
        <button
          onClick={navigateToRoot}
          className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
        >
          <Home className="w-4 h-4" />
          <span>Catálogo</span>
        </button>
        {breadcrumb.map((cat, index) => (
          <div key={cat.id} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {index === breadcrumb.length - 1 ? (
              <span className="text-gray-900 dark:text-white font-medium">{cat.name}</span>
            ) : (
              <button
                onClick={() => navigateToCategory(cat)}
                className="text-primary-600 hover:text-primary-700"
              >
                {cat.name}
              </button>
            )}
          </div>
        ))}
      </nav>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (hasNoAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catálogo de Serviços</h1>
        </div>
        {renderNoAccessMessage()}
      </div>
    )
  }

  // Check if current category has subcategories or items
  const hasSubcategories = categories.length > 0
  const hasItems = items.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catálogo de Serviços</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Solicite serviços e recursos de forma rápida e fácil
        </p>
      </div>

      {/* Access Warning Banner */}
      {accessError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{accessError}</p>
        </div>
      )}

      {/* Breadcrumb */}
      {renderBreadcrumb()}

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

      {/* Categories Grid */}
      {hasSubcategories && !searchTerm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => {
            const hasChildren = category.subcategories?.length > 0
            return (
              <div
                key={category.id}
                onClick={() => navigateToCategory(category)}
                style={{
                  borderRadius: '16px',
                  minHeight: '200px',
                  padding: '24px',
                  background: 'linear-gradient(to bottom right, #3B82F6, #2563EB)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: 'white',
                  transition: 'all 0.2s ease'
                }}
                className="hover:shadow-lg hover:scale-105 group"
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div 
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}
                    className="group-hover:bg-white/30 transition-colors"
                  >
                    <DynamicIcon 
                      icon={category.icon} 
                      className="w-8 h-8 text-white" 
                      fallback="FolderOpen"
                    />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {category.name}
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.5', opacity: '0.9' }}>
                    {category.description || `Serviços de ${category.name.toLowerCase()}`}
                  </p>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  textAlign: 'center', 
                  marginTop: '16px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  opacity: '0.9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {hasChildren ? (
                    <>
                      <FolderOpen className="w-4 h-4" />
                      <span>{category.subcategories.length} subcategoria{category.subcategories.length !== 1 ? 's' : ''}</span>
                    </>
                  ) : (
                    <span>Ver serviços</span>
                  )}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State - No categories */}
      {!hasSubcategories && !hasItems && !searchTerm && !currentCategory && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nenhuma categoria disponível
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Não existem categorias de serviços disponíveis para a sua empresa.
          </p>
        </div>
      )}

      {/* Items Grid - Show when in a category or searching */}
      {(currentCategory || searchTerm) && (
        <>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? 'Tente ajustar a sua pesquisa'
                  : hasSubcategories 
                    ? 'Navegue pelas subcategorias para encontrar serviços'
                    : 'Não existem serviços disponíveis nesta categoria'}
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
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: item.category?.color ? `${item.category.color}20` : '#3B82F620' }}
                        >
                          <DynamicIcon 
                            icon={item.category?.icon || 'ShoppingCart'} 
                            className="w-6 h-6"
                            style={{ color: item.category?.color || '#3B82F6' }}
                            fallback="ShoppingCart"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          {item.category && (
                            <span className="text-xs text-gray-500">{item.category.name}</span>
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
        </>
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
