/**
 * InheritanceModeSelector Component
 * 
 * Selector for inheritance mode (inherit/override/extend) for client user
 * catalog access. Shows inherited permissions from the parent client.
 * 
 * Feature: catalog-access-control
 * Requirements: 2.1, 2.4
 */

import { useState, useEffect } from 'react'
import { Users, Shield, Plus, ArrowDown, Info, CheckCircle, FolderOpen, Box } from 'lucide-react'

const INHERITANCE_MODES = [
  {
    value: 'inherit',
    label: 'Herdar do Cliente',
    description: 'Utiliza as mesmas permissões definidas para a empresa cliente',
    icon: ArrowDown,
    color: 'blue',
    details: 'O utilizador terá exatamente as mesmas permissões de catálogo que a empresa cliente.'
  },
  {
    value: 'override',
    label: 'Substituir',
    description: 'Define permissões específicas que substituem as do cliente',
    icon: Shield,
    color: 'orange',
    details: 'As permissões do cliente serão ignoradas. Apenas as permissões definidas aqui serão aplicadas.'
  },
  {
    value: 'extend',
    label: 'Estender',
    description: 'Adiciona permissões extras às permissões do cliente',
    icon: Plus,
    color: 'green',
    details: 'O utilizador terá as permissões do cliente MAIS as permissões adicionais definidas aqui.'
  }
]

const InheritanceModeSelector = ({
  value,
  onChange,
  clientAccess,
  categories = [],
  items = []
}) => {
  const [showClientPermissions, setShowClientPermissions] = useState(false)

  // Get category and item names for display
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || categoryId
  }

  const getItemName = (itemId) => {
    const item = items.find(i => i.id === itemId)
    return item?.name || itemId
  }

  // Calculate client permission summary
  const clientPermissionSummary = () => {
    if (!clientAccess) return null

    const { accessMode, allowedCategories = [], allowedItems = [] } = clientAccess

    if (accessMode === 'all') {
      return {
        type: 'all',
        label: 'Acesso Total',
        description: 'Acesso a todos os itens públicos do catálogo'
      }
    }

    if (accessMode === 'none') {
      return {
        type: 'none',
        label: 'Sem Acesso',
        description: 'Nenhum acesso ao catálogo'
      }
    }

    return {
      type: 'selected',
      label: 'Acesso Selecionado',
      description: `${allowedCategories.length} categorias e ${allowedItems.length} itens`,
      categories: allowedCategories,
      items: allowedItems
    }
  }

  const summary = clientPermissionSummary()

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-600" />
          Modo de Herança de Permissões
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INHERITANCE_MODES.map((mode) => {
            const Icon = mode.icon
            const isSelected = value === mode.value

            return (
              <button
                key={mode.value}
                onClick={() => onChange(mode.value)}
                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? mode.color === 'blue'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : mode.color === 'orange'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {isSelected && (
                  <CheckCircle className={`absolute top-3 right-3 w-5 h-5 ${
                    mode.color === 'blue' ? 'text-blue-500' :
                    mode.color === 'orange' ? 'text-orange-500' : 'text-green-500'
                  }`} />
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${
                    mode.color === 'blue' ? 'text-blue-500' :
                    mode.color === 'orange' ? 'text-orange-500' : 'text-green-500'
                  }`} />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {mode.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mode.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Mode Details */}
        {value && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {INHERITANCE_MODES.find(m => m.value === value)?.details}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Client Permissions Display */}
      {clientAccess && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-600" />
              Permissões Herdadas do Cliente
            </h4>
            {summary?.type === 'selected' && (
              <button
                onClick={() => setShowClientPermissions(!showClientPermissions)}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {showClientPermissions ? 'Ocultar detalhes' : 'Ver detalhes'}
              </button>
            )}
          </div>

          {/* Summary Badge */}
          {summary && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              summary.type === 'all' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : summary.type === 'none'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            }`}>
              {summary.type === 'all' && '✅'}
              {summary.type === 'none' && '🚫'}
              {summary.type === 'selected' && '📋'}
              <span>{summary.label}</span>
              <span className="text-xs opacity-75">- {summary.description}</span>
            </div>
          )}

          {/* Detailed Permissions */}
          {showClientPermissions && summary?.type === 'selected' && (
            <div className="mt-4 space-y-3">
              {/* Categories */}
              {summary.categories.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Categorias Permitidas ({summary.categories.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {summary.categories.map(catId => (
                      <span 
                        key={catId}
                        className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded"
                      >
                        {getCategoryName(catId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              {summary.items.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5" />
                    Itens Permitidos ({summary.items.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {summary.items.map(itemId => (
                      <span 
                        key={itemId}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                      >
                        {getItemName(itemId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inheritance Mode Explanation */}
          {value === 'inherit' && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Modo Herdar:</strong> Este utilizador terá exatamente as mesmas permissões mostradas acima.
              </p>
            </div>
          )}

          {value === 'override' && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Modo Substituir:</strong> As permissões acima serão ignoradas. Configure as permissões específicas abaixo.
              </p>
            </div>
          )}

          {value === 'extend' && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Modo Estender:</strong> As permissões acima serão mantidas. Adicione permissões extras abaixo.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InheritanceModeSelector
