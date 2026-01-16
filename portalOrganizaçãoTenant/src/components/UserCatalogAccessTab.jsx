/**
 * UserCatalogAccessTab Component
 * 
 * Tab component for managing catalog access permissions for client users.
 * Includes inheritance mode selector and tree view for selecting categories/items.
 * 
 * Feature: catalog-access-control
 * Requirements: 2.1, 2.4, 3.1
 */

import { useState, useEffect } from 'react'
import { FolderOpen, Save, RefreshCw, Info } from 'lucide-react'
import catalogAccessService from '../services/catalogAccessService'
import CatalogTreeSelector from './CatalogTreeSelector'
import SelectedItemsSummary from './SelectedItemsSummary'
import InheritanceModeSelector from './InheritanceModeSelector'
import { showSuccess, showError } from '../utils/alerts'

const ACCESS_MODES = [
  {
    value: 'all',
    label: 'Acesso Total',
    description: 'Acesso a todos os itens públicos do catálogo',
    icon: '✅',
    color: 'green'
  },
  {
    value: 'selected',
    label: 'Acesso Selecionado',
    description: 'Acesso apenas aos itens selecionados',
    icon: '📋',
    color: 'blue'
  },
  {
    value: 'none',
    label: 'Sem Acesso',
    description: 'Sem acesso ao catálogo de serviços',
    icon: '🚫',
    color: 'red'
  }
]

const UserCatalogAccessTab = ({ clientUserId, onSave }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // User-specific settings
  const [inheritanceMode, setInheritanceMode] = useState('inherit')
  const [accessMode, setAccessMode] = useState('all')
  const [allowedCategories, setAllowedCategories] = useState([])
  const [allowedItems, setAllowedItems] = useState([])
  const [deniedCategories, setDeniedCategories] = useState([])
  const [deniedItems, setDeniedItems] = useState([])
  
  // Client access (for reference)
  const [clientAccess, setClientAccess] = useState(null)
  
  // Catalog data
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  
  // Change tracking
  const [hasChanges, setHasChanges] = useState(false)
  const [originalState, setOriginalState] = useState(null)

  useEffect(() => {
    if (clientUserId) {
      loadData()
    }
  }, [clientUserId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load user access, catalog data in parallel
      const [accessResponse, categoriesResponse, itemsResponse] = await Promise.all([
        catalogAccessService.getUserAccess(clientUserId),
        catalogAccessService.getCategories(),
        catalogAccessService.getItems()
      ])

      const accessData = accessResponse.data || {}
      
      setInheritanceMode(accessData.inheritanceMode || 'inherit')
      setAccessMode(accessData.accessMode || 'all')
      setAllowedCategories(accessData.allowedCategories || [])
      setAllowedItems(accessData.allowedItems || [])
      setDeniedCategories(accessData.deniedCategories || [])
      setDeniedItems(accessData.deniedItems || [])
      
      // Store client access for reference
      setClientAccess(accessData.clientAccess || null)
      
      setCategories(categoriesResponse.categories || [])
      setItems(itemsResponse.items || [])

      // Store original state for change detection
      setOriginalState({
        inheritanceMode: accessData.inheritanceMode || 'inherit',
        accessMode: accessData.accessMode || 'all',
        allowedCategories: accessData.allowedCategories || [],
        allowedItems: accessData.allowedItems || [],
        deniedCategories: accessData.deniedCategories || [],
        deniedItems: accessData.deniedItems || []
      })

      setHasChanges(false)
    } catch (error) {
      console.error('Error loading user catalog access data:', error)
      showError('Erro', 'Não foi possível carregar as permissões do catálogo')
    } finally {
      setLoading(false)
    }
  }

  const handleInheritanceModeChange = (mode) => {
    setInheritanceMode(mode)
    setHasChanges(true)
    
    // Reset selections when switching to inherit mode
    if (mode === 'inherit') {
      setAccessMode('all')
      setAllowedCategories([])
      setAllowedItems([])
    }
  }

  const handleAccessModeChange = (mode) => {
    setAccessMode(mode)
    setHasChanges(true)
    
    // Reset selections when changing mode
    if (mode === 'all' || mode === 'none') {
      setAllowedCategories([])
      setAllowedItems([])
    }
  }

  const handleSelectionChange = ({ selectedCategories, selectedItems }) => {
    setAllowedCategories(selectedCategories)
    setAllowedItems(selectedItems)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await catalogAccessService.updateUserAccess(clientUserId, {
        inheritanceMode,
        accessMode,
        allowedCategories,
        allowedItems,
        deniedCategories,
        deniedItems
      })

      showSuccess('Guardado!', 'Permissões de catálogo do utilizador atualizadas com sucesso')
      setHasChanges(false)
      
      // Update original state
      setOriginalState({
        inheritanceMode,
        accessMode,
        allowedCategories,
        allowedItems,
        deniedCategories,
        deniedItems
      })

      if (onSave) {
        onSave()
      }
    } catch (error) {
      console.error('Error saving user catalog access:', error)
      showError('Erro', error.response?.data?.message || 'Não foi possível guardar as permissões')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (originalState) {
      setInheritanceMode(originalState.inheritanceMode)
      setAccessMode(originalState.accessMode)
      setAllowedCategories(originalState.allowedCategories)
      setAllowedItems(originalState.allowedItems)
      setDeniedCategories(originalState.deniedCategories)
      setDeniedItems(originalState.deniedItems)
      setHasChanges(false)
    }
  }

  // Determine if we should show the tree selector
  const showTreeSelector = inheritanceMode !== 'inherit' && accessMode === 'selected'
  const showAccessModeSelector = inheritanceMode !== 'inherit'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">A carregar permissões...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Acesso ao Catálogo de Serviços
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Repor
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">Permissões de Catálogo do Utilizador</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              Configure como este utilizador acede ao catálogo de serviços. Por defeito, o utilizador
              herda as permissões da empresa cliente, mas pode ter permissões específicas ou estendidas.
            </p>
          </div>
        </div>
      </div>

      {/* Inheritance Mode Selector */}
      <InheritanceModeSelector
        value={inheritanceMode}
        onChange={handleInheritanceModeChange}
        clientAccess={clientAccess}
        categories={categories}
        items={items}
      />

      {/* Access Mode Selector - Only show when not inheriting */}
      {showAccessModeSelector && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Modo de Acesso {inheritanceMode === 'extend' ? '(Permissões Adicionais)' : ''}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACCESS_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleAccessModeChange(mode.value)}
                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                  accessMode === mode.value
                    ? mode.color === 'green'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : mode.color === 'blue'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{mode.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{mode.label}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mode.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tree Selector - Only show when mode is 'selected' and not inheriting */}
      {showTreeSelector && (
        <>
          <CatalogTreeSelector
            categories={categories}
            items={items}
            selectedCategories={allowedCategories}
            selectedItems={allowedItems}
            onChange={handleSelectionChange}
          />
          
          <SelectedItemsSummary
            categories={categories}
            items={items}
            selectedCategories={allowedCategories}
            selectedItems={allowedItems}
          />
        </>
      )}
    </div>
  )
}

export default UserCatalogAccessTab
