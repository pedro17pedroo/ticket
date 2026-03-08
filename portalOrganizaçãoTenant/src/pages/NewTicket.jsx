import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Clock, ArrowRight, Home, ChevronRight, FolderOpen, Lock, AlertTriangle, AlertCircle, Settings, FileText, Paperclip, Upload, X, Mail, Calendar, Euro } from 'lucide-react'
import catalogService from '../services/catalogService'
import Swal from 'sweetalert2'
import DynamicIcon from '../components/DynamicIcon'
import RichTextEditor from '../components/RichTextEditor'
import WatchersField from '../components/WatchersField'

/**
 * NewTicket Component - Navegação no Catálogo
 * 
 * Substitui o formulário direto por navegação hierárquica no catálogo.
 * Usuários navegam: Categorias → Subcategorias → Itens → Criar Ticket
 */
const NewTicket = () => {
  const navigate = useNavigate()
  
  // Estado
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [currentCategory, setCurrentCategory] = useState(null)
  const [breadcrumb, setBreadcrumb] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [formData, setFormData] = useState({})
  
  // Campos adicionais do formulário
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [attachments, setAttachments] = useState([])
  const [userPriority, setUserPriority] = useState('')
  const [expectedResolutionTime, setExpectedResolutionTime] = useState('')
  const [watchers, setWatchers] = useState([])
  
  // Access control
  const [effectiveAccess, setEffectiveAccess] = useState(null)
  const [hasNoAccess, setHasNoAccess] = useState(false)
  
  // Store full category tree
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
        const current = findCategoryById(categoryTree, currentCategory.id)
        setCategories(current?.subcategories || [])
        loadItems(currentCategory.id)
      } else {
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
   * Find category by ID in tree
   */
  const findCategoryById = (cats, id) => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.subcategories?.length > 0) {
        const found = findCategoryById(cat.subcategories, id)
        if (found) return found
      }
    }
    return null
  }

  /**
   * Build breadcrumb path
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
   * Load effective access permissions
   */
  const loadEffectiveAccess = async () => {
    try {
      const response = await catalogService.getEffectiveAccess()
      const accessData = response.data || response
      setEffectiveAccess(accessData)
      
      if (accessData?.accessMode === 'none') {
        setHasNoAccess(true)
        setLoading(false)
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
      setEffectiveAccess({})
    }
  }

  /**
   * Load catalog categories
   */
  const loadCatalog = async () => {
    if (hasNoAccess) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      catalogService.clearCache()
      const categoriesRes = await catalogService.getCategories(false)
      const cats = categoriesRes.categories || []
      
      setCategoryTree(cats)
      setCategories(cats)
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error)
      if (error.response?.status === 403) {
        handleAccessDenied(error.response?.data)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Erro ao carregar catálogo',
          confirmButtonColor: '#6366f1'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load catalog items
   */
  const loadItems = async (categoryId = null) => {
    if (hasNoAccess) return
    
    try {
      const params = {}
      if (categoryId) params.categoryId = categoryId
      if (searchTerm) params.search = searchTerm

      const response = await catalogService.getItems(params, false)
      setItems(response.items || [])
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      if (error.response?.status === 403) {
        handleAccessDenied(error.response?.data)
      }
    }
  }

  /**
   * Navigate to category
   */
  const navigateToCategory = (category) => {
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
   * Handle access denied
   */
  const handleAccessDenied = (errorData) => {
    const message = errorData?.message || 'Não tem permissão para aceder a este recurso'
    Swal.fire({
      icon: 'error',
      title: 'Acesso Negado',
      text: message,
      confirmButtonColor: '#6366f1'
    })
  }

  /**
   * Handle request service
   */
  const handleRequestService = async (item) => {
    try {
      const hasAccess = await catalogService.hasAccessToItem(item.id)
      if (!hasAccess) {
        handleAccessDenied({ message: 'Não tem permissão para solicitar este serviço' })
        return
      }
    } catch (error) {
      console.warn('Não foi possível verificar acesso ao item:', error)
    }
    
    setSelectedItem(item)
    setFormData({})
    setAdditionalDetails('')
    setAttachments([])
    setUserPriority('')
    setExpectedResolutionTime('')
    setWatchers([])
    setShowRequestModal(true)
  }

  /**
   * Handle submit request
   */
  const handleSubmitRequest = async (e) => {
    e.preventDefault()

    try {
      // Preparar dados completos
      const requestData = {
        ...formData,
        additionalDetails,
        userPriority,
        expectedResolutionTime,
        watchers: watchers.map(w => w.email)
      }

      const response = await catalogService.createTicketFromItem(selectedItem.id, requestData, attachments)

      await Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: response.requiresApproval 
          ? 'Solicitação enviada para aprovação!' 
          : 'Ticket criado com sucesso!',
        timer: 2000,
        showConfirmButton: false
      })

      setShowRequestModal(false)
      setSelectedItem(null)
      setFormData({})
      setAdditionalDetails('')
      setAttachments([])
      setUserPriority('')
      setExpectedResolutionTime('')
      setWatchers([])
      
      // Redirecionar para o ticket criado
      if (response.ticket?.id) {
        setTimeout(() => navigate(`/tickets/${response.ticket.id}`), 500)
      }
    } catch (error) {
      if (error.response?.status === 403) {
        handleAccessDenied(error.response?.data)
        setShowRequestModal(false)
        setSelectedItem(null)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: error.response?.data?.error || 'Erro ao criar ticket',
          confirmButtonColor: '#6366f1'
        })
      }
    }
  }

  /**
   * Handle file upload
   */
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'warning',
          title: 'Ficheiro muito grande',
          text: `${file.name} excede o tamanho máximo de 10MB`,
          confirmButtonColor: '#6366f1'
        })
        return false
      }
      return true
    })
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  /**
   * Remove attachment
   */
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * Render form field
   */
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

  /**
   * Render no access message
   */
  const renderNoAccessMessage = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-full p-6 mb-6">
        <Lock className="w-16 h-16 text-yellow-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Acesso ao Catálogo Restrito
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        Não tem acesso ao catálogo de serviços neste momento.
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
   * Render breadcrumb
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
          <span>Novo Ticket</span>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Novo Ticket</h1>
        </div>
        {renderNoAccessMessage()}
      </div>
    )
  }

  const hasSubcategories = categories.length > 0
  const hasItems = items.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Novo Ticket</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Selecione um serviço do catálogo para criar um ticket
        </p>
      </div>

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
            Não existem categorias de serviços disponíveis.
          </p>
        </div>
      )}

      {/* Items Grid */}
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
                      {item.requiresApproval && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                          <AlertTriangle className="w-4 h-4" />
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-primary-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DynamicIcon 
                    icon={selectedItem.category?.icon || 'ShoppingCart'} 
                    className="w-6 h-6 text-white"
                    fallback="ShoppingCart"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedItem.name}</h2>
                  {selectedItem.shortDescription && (
                    <p className="text-sm text-blue-100 mt-0.5">
                      {selectedItem.shortDescription}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setSelectedItem(null)
                  setFormData({})
                  setAdditionalDetails('')
                  setAttachments([])
                  setUserPriority('')
                  setExpectedResolutionTime('')
                  setWatchers([])
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
                {/* Sobre este serviço */}
                {selectedItem.fullDescription && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                      <AlertCircle className="w-5 h-5" />
                      <h3 className="font-semibold">Sobre este serviço</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-7">
                      {selectedItem.fullDescription}
                    </p>
                  </div>
                )}

                {/* Prazo e Custo */}
                {(selectedItem.estimatedDeliveryTime || selectedItem.estimatedCost) && (
                  <div className="grid grid-cols-2 gap-4 pl-7">
                    {selectedItem.estimatedDeliveryTime && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">Prazo de Entrega</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {selectedItem.estimatedDeliveryTime}h
                        </div>
                      </div>
                    )}

                    {selectedItem.estimatedCost && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <Euro className="w-4 h-4" />
                          <span className="text-xs font-medium">Custo Estimado</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          €{selectedItem.estimatedCost}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Informações da Solicitação (Custom Fields) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-3">
                    <Settings className="w-5 h-5" />
                    <h3 className="font-semibold">Informações da Solicitação</h3>
                  </div>

                  {selectedItem.customFields && selectedItem.customFields.length > 0 ? (
                    <div className="space-y-4 pl-7">
                      {selectedItem.customFields.map(field => (
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
                      ))}
                    </div>
                  ) : (
                    <div className="ml-7 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ✓ Este serviço não requer informações adicionais
                      </p>
                    </div>
                  )}
                </div>

                {/* Detalhes Adicionais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-semibold">Detalhes Adicionais</h3>
                  </div>
                  <div className="pl-7">
                    <RichTextEditor
                      value={additionalDetails}
                      onChange={setAdditionalDetails}
                      placeholder="Descreva detalhadamente a sua necessidade, problemas encontrados, ou qualquer informação adicional relevante..."
                      minHeight="200px"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Quanto mais detalhes fornecer, melhor poderemos atendê-lo
                    </p>
                  </div>
                </div>

                {/* Upload de Ficheiros */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <Paperclip className="w-5 h-5" />
                    <h3 className="font-semibold">Anexos</h3>
                  </div>
                  <div className="pl-7 space-y-3">
                    <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Clique para selecionar ficheiros ou arraste aqui
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                    </label>

                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Máximo 10MB por ficheiro. Formatos aceites: imagens, PDF, Word, Excel, texto
                    </p>
                  </div>
                </div>

                {/* Urgência da Solicitação */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-semibold">Urgência da Solicitação</h3>
                  </div>
                  <div className="pl-7">
                    <select
                      value={userPriority}
                      onChange={(e) => setUserPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Selecione a urgência...</option>
                      <option value="baixa">🟢 Baixa - Pode aguardar alguns dias</option>
                      <option value="media">🟡 Média - Necessário em breve</option>
                      <option value="alta">🟠 Alta - Necessário urgentemente</option>
                      <option value="critica">🔴 Crítica - Bloqueando trabalho</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Esta informação ajuda-nos a priorizar o atendimento
                    </p>
                  </div>
                </div>

                {/* Prazo Esperado */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <Calendar className="w-5 h-5" />
                    <h3 className="font-semibold">Prazo Esperado</h3>
                  </div>
                  <div className="pl-7">
                    <input
                      type="date"
                      value={expectedResolutionTime}
                      onChange={(e) => setExpectedResolutionTime(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Quando necessita que esta solicitação seja resolvida?
                    </p>
                  </div>
                </div>

                {/* Notificar Outras Pessoas */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 bg-primary-50 dark:bg-primary-900/10 p-4 rounded-lg">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      📧 Notificar Outras Pessoas
                    </h3>
                    <p className="text-sm text-primary-600 dark:text-primary-300">
                      Adicione emails de pessoas que devem receber notificações sobre este ticket
                    </p>
                  </div>
                  <WatchersField
                    watchers={watchers}
                    onChange={setWatchers}
                    placeholder="Digite emails de pessoas que devem ser notificadas..."
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
              {selectedItem.requiresApproval && (
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Esta solicitação será enviada para aprovação antes de ser processada
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false)
                    setSelectedItem(null)
                    setFormData({})
                    setAdditionalDetails('')
                    setAttachments([])
                    setUserPriority('')
                    setExpectedResolutionTime('')
                    setWatchers([])
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSubmitRequest}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  {selectedItem.requiresApproval ? 'Enviar para Aprovação' : 'Criar Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewTicket
