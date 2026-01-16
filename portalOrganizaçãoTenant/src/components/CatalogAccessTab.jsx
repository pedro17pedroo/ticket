/**
 * CatalogAccessTab Component
 * 
 * Tab component for managing catalog access permissions for clients.
 * Displays access mode selector and tree view for selecting categories/items.
 * 
 * Feature: catalog-access-control
 * Requirements: 1.1, 3.1
 */

import { useState, useEffect } from 'react'
import { FolderOpen, Save, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react'
import catalogAccessService from '../services/catalogAccessService'
import CatalogTreeSelector from './CatalogTreeSelector'
import SelectedItemsSummary from './SelectedItemsSummary'
import { showSuccess, showError } from '../utils/alerts'

const ACCESS_MODES = [
  {
    value: 'all',
    label: 'Acesso Total',
    description: 'Cliente tem acesso a todos os itens públicos do catálogo',
    icon: '✅',
    color: 'green'
  },
  {
    value: 'selected',
    label: 'Acesso Selecionado',
    description: 'Cliente tem acesso apenas aos itens selecionados',
    icon: '📋',
    color: 'blue'
  },
  {
    value: 'none',
    label: 'Sem Acesso',
    description: 'Cliente não tem acesso ao catálogo de serviços',
    icon: '🚫',
    color: 'red'
  }
]

const CatalogAccessTab = ({ clientId, onSave }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accessMode, setAccessMode] = useState('all')
  const [allowedCategories, setAllowedCategories] = useState([])
  const [allowedItems, setAllowedItems] = useState([])
  const [deniedCategories, setDeniedCategories] = useState([])
  const [deniedItems, setDeniedItems] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  const [originalState, setOriginalState] = useState(null)

  useEffect(() => {
    if (clientId) {
      loadData()
    }
  }, [clientId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load catalog data and access rules in parallel
      const [accessResponse, categoriesResponse, itemsResponse] = await Promise.all([
        catalogAccessService.getClientAccess(clientId),
        catalogAccessService.getCategories(),
        catalogAccessService.getItems()
      ])

      const accessData = accessResponse.data || {}
      
      setAccessMode(accessData.accessMode || 'all')
      setAllowedCategories(accessData.allowedCategories || [])
      setAllowedItems(accessData.allowedItems || [])
      setDeniedCategories(accessData.deniedCategories || [])
      setDeniedItems(accessData.deniedItems || [])
      
      setCategories(categoriesResponse.categories || [])
      setItems(itemsResponse.items || [])

      // Store original state for change detection
      setOriginalState({
        accessMode: accessData.accessMode || 'all',
        allowedCategories: accessData.allowedCategories || [],
        allowedItems: accessData.allowedItems || [],
        deniedCategories: accessData.deniedCategories || [],
        deniedItems: accessData.deniedItems || []
      })

      setHasChanges(false)
    } catch (error) {
      console.error('Error loading catalog access data:', error)
      showError('Erro', 'Não foi possível carregar as permissões do catálogo')
    } finally {
      setLoading(false)
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
      await catalogAccessService.updateClientAccess(clientId, {
        accessMode,
        allowedCategories,
        allowedItems,
        deniedCategories,
        deniedItems
      })

      showSuccess('Guardado!', 'Permissões de catálogo atualizadas com sucesso')
      setHasChanges(false)
      
      // Update original state
      setOriginalState({
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
      console.error('Error saving catalog access:', error)
      showError('Erro', error.response?.data?.message || 'Não foi possível guardar as permissões')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (originalState) {
      setAccessMode(originalState.accessMode)
      setAllowedCategories(originalState.allowedCategories)
      setAllowedItems(originalState.allowedItems)
      setDeniedCategories(originalState.deniedCategories)
      setDeniedItems(originalState.deniedItems)
      setHasChanges(false)
    }
  }

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
            <p className="font-medium">Controlo de Acesso ao Catálogo</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              Defina quais categorias e itens do catálogo de serviços este cliente pode visualizar e solicitar.
              As permissões definidas aqui serão herdadas por todos os utilizadores do cliente, a menos que sejam
              configuradas permissões específicas por utilizador.
            </p>
          </div>
        </div>
      </div>

      {/* Access Mode Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Modo de Acesso
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
              {accessMode === mode.value && (
                <CheckCircle className={`absolute top-3 right-3 w-5 h-5 ${
                  mode.color === 'green' ? 'text-green-500' :
                  mode.color === 'blue' ? 'text-blue-500' : 'text-red-500'
                }`} />
              )}
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

      {/* Tree Selector - Only show when mode is 'selected' */}
      {accessMode === 'selected' && (
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

      {/* Warning for 'none' mode */}
      {accessMode === 'none' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">Atenção</p>
              <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                Com o modo "Sem Acesso" ativo, este cliente e todos os seus utilizadores não poderão
                visualizar nem solicitar serviços do catálogo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogAccessTab
