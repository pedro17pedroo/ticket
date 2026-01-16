/**
 * SelectedItemsSummary Component
 * 
 * Displays a summary of selected catalog items, including:
 * - Total count of selected items
 * - Breakdown by category
 * 
 * Feature: catalog-access-control
 * Requirements: 3.6
 */

import { useMemo } from 'react'
import { CheckSquare, FolderOpen, Box, BarChart3 } from 'lucide-react'

const SelectedItemsSummary = ({
  categories,
  items,
  selectedCategories,
  selectedItems
}) => {
  // Calculate summary statistics
  const summary = useMemo(() => {
    // Create category map for quick lookup
    const categoryMap = new Map()
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        selectedItemCount: 0,
        totalItemCount: 0
      })
    })

    // Count items per category
    items.forEach(item => {
      const category = categoryMap.get(item.categoryId)
      if (category) {
        category.totalItemCount++
        
        // Check if item is selected (either directly or via category)
        const isItemSelected = selectedItems.includes(item.id)
        const isCategorySelected = selectedCategories.includes(item.categoryId)
        
        if (isItemSelected || isCategorySelected) {
          category.selectedItemCount++
        }
      }
    })

    // Calculate totals
    const totalItems = items.length
    const totalSelectedItems = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.selectedItemCount, 
      0
    )
    const totalSelectedCategories = selectedCategories.length

    // Get categories with selections (for breakdown)
    const categoriesWithSelections = Array.from(categoryMap.values())
      .filter(cat => cat.selectedItemCount > 0)
      .sort((a, b) => b.selectedItemCount - a.selectedItemCount)

    return {
      totalItems,
      totalSelectedItems,
      totalSelectedCategories,
      categoriesWithSelections,
      percentageSelected: totalItems > 0 
        ? Math.round((totalSelectedItems / totalItems) * 100) 
        : 0
    }
  }, [categories, items, selectedCategories, selectedItems])

  // Don't show if nothing is selected
  if (summary.totalSelectedItems === 0 && summary.totalSelectedCategories === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary-600" />
        Resumo da Seleção
      </h4>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Total Selected Items */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <Box className="w-4 h-4" />
            <span className="text-xs font-medium">Itens Selecionados</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {summary.totalSelectedItems}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            de {summary.totalItems} total
          </div>
        </div>

        {/* Selected Categories */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
            <FolderOpen className="w-4 h-4" />
            <span className="text-xs font-medium">Categorias</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {summary.totalSelectedCategories}
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">
            de {categories.length} total
          </div>
        </div>

        {/* Percentage */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span className="text-xs font-medium">Cobertura</span>
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {summary.percentageSelected}%
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            do catálogo
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Progresso
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-1">
            <div 
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${summary.percentageSelected}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {summary.totalSelectedItems} / {summary.totalItems}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {summary.categoriesWithSelections.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Itens por Categoria
          </h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {summary.categoriesWithSelections.map(category => (
              <div 
                key={category.id}
                className="flex items-center justify-between py-1.5 px-2 bg-gray-50 dark:bg-gray-700/50 rounded"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    {category.selectedItemCount}
                  </span>
                  <span className="text-xs text-gray-500">
                    / {category.totalItemCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SelectedItemsSummary
