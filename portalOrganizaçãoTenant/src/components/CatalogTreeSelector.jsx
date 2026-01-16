/**
 * CatalogTreeSelector Component
 * 
 * Tree view component with checkboxes for selecting catalog categories and items.
 * Implements cascading selection (selecting a category selects all children)
 * and indeterminate state for partial selections.
 * 
 * Feature: catalog-access-control
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronRight, ChevronDown, Search, FolderOpen, Box, X } from 'lucide-react'

/**
 * Build a hierarchical tree structure from flat categories and items
 * @param {Array} categories - Flat array of categories
 * @param {Array} items - Flat array of items
 * @returns {Array} Tree structure with nested children
 */
const buildTree = (categories, items) => {
  // Create a map for quick lookup
  const categoryMap = new Map()
  
  // Initialize categories with empty children arrays
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      ...cat,
      type: 'category',
      children: [],
      items: []
    })
  })

  // Assign items to their categories
  items.forEach(item => {
    const category = categoryMap.get(item.categoryId)
    if (category) {
      category.items.push({
        ...item,
        type: 'item'
      })
    }
  })

  // Build parent-child relationships for categories
  const rootCategories = []
  categoryMap.forEach(cat => {
    if (cat.parentCategoryId && categoryMap.has(cat.parentCategoryId)) {
      const parent = categoryMap.get(cat.parentCategoryId)
      parent.children.push(cat)
    } else {
      rootCategories.push(cat)
    }
  })

  // Sort by order
  const sortByOrder = (a, b) => (a.order || 0) - (b.order || 0)
  rootCategories.sort(sortByOrder)
  categoryMap.forEach(cat => {
    cat.children.sort(sortByOrder)
    cat.items.sort(sortByOrder)
  })

  return rootCategories
}

/**
 * Get all item IDs under a category (including nested subcategories)
 * @param {Object} category - Category node
 * @returns {Array} Array of item IDs
 */
const getAllItemsInCategory = (category) => {
  let itemIds = category.items.map(item => item.id)
  
  category.children.forEach(child => {
    itemIds = [...itemIds, ...getAllItemsInCategory(child)]
  })
  
  return itemIds
}

/**
 * Get all category IDs under a category (including the category itself)
 * @param {Object} category - Category node
 * @returns {Array} Array of category IDs
 */
const getAllCategoryIds = (category) => {
  let categoryIds = [category.id]
  
  category.children.forEach(child => {
    categoryIds = [...categoryIds, ...getAllCategoryIds(child)]
  })
  
  return categoryIds
}

/**
 * TreeNode Component - Renders a single node in the tree
 */
const TreeNode = ({ 
  node, 
  level = 0, 
  selectedCategories, 
  selectedItems, 
  onToggleCategory, 
  onToggleItem,
  expandedNodes,
  onToggleExpand,
  searchTerm
}) => {
  const isCategory = node.type === 'category'
  const isExpanded = expandedNodes.has(node.id)
  const hasChildren = isCategory && (node.children.length > 0 || node.items.length > 0)
  
  // Calculate selection state for categories
  const getSelectionState = useCallback(() => {
    if (!isCategory) {
      return selectedItems.includes(node.id) ? 'checked' : 'unchecked'
    }

    const allItemIds = getAllItemsInCategory(node)
    const allCategoryIds = getAllCategoryIds(node)
    
    // Check if category itself is selected
    const categorySelected = selectedCategories.includes(node.id)
    
    // Check items
    const selectedItemCount = allItemIds.filter(id => selectedItems.includes(id)).length
    const selectedCategoryCount = allCategoryIds.filter(id => selectedCategories.includes(id)).length
    
    if (categorySelected || (selectedItemCount === allItemIds.length && allItemIds.length > 0)) {
      return 'checked'
    }
    
    if (selectedItemCount > 0 || selectedCategoryCount > 1) {
      return 'indeterminate'
    }
    
    return 'unchecked'
  }, [isCategory, node, selectedCategories, selectedItems])

  const selectionState = getSelectionState()

  // Filter visibility based on search
  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    
    if (node.name.toLowerCase().includes(term)) return true
    if (node.description?.toLowerCase().includes(term)) return true
    
    // For categories, check if any children match
    if (isCategory) {
      const checkChildren = (cat) => {
        if (cat.name.toLowerCase().includes(term)) return true
        if (cat.items.some(item => item.name.toLowerCase().includes(term))) return true
        return cat.children.some(checkChildren)
      }
      return checkChildren(node)
    }
    
    return false
  }, [node, searchTerm, isCategory])

  if (!matchesSearch) return null

  const handleCheckboxChange = () => {
    if (isCategory) {
      onToggleCategory(node, selectionState !== 'checked')
    } else {
      onToggleItem(node.id)
    }
  }

  const handleExpandClick = (e) => {
    e.stopPropagation()
    onToggleExpand(node.id)
  }

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={handleExpandClick}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selectionState === 'checked'}
          ref={el => {
            if (el) el.indeterminate = selectionState === 'indeterminate'
          }}
          onChange={handleCheckboxChange}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
        />

        {/* Icon */}
        {isCategory ? (
          <FolderOpen className="w-4 h-4 text-yellow-500" />
        ) : (
          <Box className="w-4 h-4 text-blue-500" />
        )}

        {/* Label */}
        <span 
          className="flex-1 text-sm text-gray-700 dark:text-gray-300"
          onClick={handleCheckboxChange}
        >
          {node.name}
        </span>

        {/* Item count badge for categories */}
        {isCategory && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {node.items.length} {node.items.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {/* Subcategories */}
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedCategories={selectedCategories}
              selectedItems={selectedItems}
              onToggleCategory={onToggleCategory}
              onToggleItem={onToggleItem}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              searchTerm={searchTerm}
            />
          ))}
          
          {/* Items */}
          {node.items.map(item => (
            <TreeNode
              key={item.id}
              node={item}
              level={level + 1}
              selectedCategories={selectedCategories}
              selectedItems={selectedItems}
              onToggleCategory={onToggleCategory}
              onToggleItem={onToggleItem}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Main CatalogTreeSelector Component
 */
const CatalogTreeSelector = ({
  categories,
  items,
  selectedCategories,
  selectedItems,
  onChange
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  // Build tree structure
  const tree = useMemo(() => buildTree(categories, items), [categories, items])

  // Auto-expand nodes when searching
  useEffect(() => {
    if (searchTerm) {
      // Expand all nodes when searching
      const allCategoryIds = categories.map(c => c.id)
      setExpandedNodes(new Set(allCategoryIds))
    }
  }, [searchTerm, categories])

  const handleToggleExpand = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handleToggleCategory = useCallback((category, select) => {
    const categoryIds = getAllCategoryIds(category)
    const itemIds = getAllItemsInCategory(category)

    let newSelectedCategories = [...selectedCategories]
    let newSelectedItems = [...selectedItems]

    if (select) {
      // Add category and all its items
      categoryIds.forEach(id => {
        if (!newSelectedCategories.includes(id)) {
          newSelectedCategories.push(id)
        }
      })
      itemIds.forEach(id => {
        if (!newSelectedItems.includes(id)) {
          newSelectedItems.push(id)
        }
      })
    } else {
      // Remove category and all its items
      newSelectedCategories = newSelectedCategories.filter(id => !categoryIds.includes(id))
      newSelectedItems = newSelectedItems.filter(id => !itemIds.includes(id))
    }

    onChange({
      selectedCategories: newSelectedCategories,
      selectedItems: newSelectedItems
    })
  }, [selectedCategories, selectedItems, onChange])

  const handleToggleItem = useCallback((itemId) => {
    let newSelectedItems = [...selectedItems]
    
    if (newSelectedItems.includes(itemId)) {
      newSelectedItems = newSelectedItems.filter(id => id !== itemId)
    } else {
      newSelectedItems.push(itemId)
    }

    onChange({
      selectedCategories,
      selectedItems: newSelectedItems
    })
  }, [selectedCategories, selectedItems, onChange])

  const handleSelectAll = () => {
    const allCategoryIds = categories.map(c => c.id)
    const allItemIds = items.map(i => i.id)
    
    onChange({
      selectedCategories: allCategoryIds,
      selectedItems: allItemIds
    })
  }

  const handleClearAll = () => {
    onChange({
      selectedCategories: [],
      selectedItems: []
    })
  }

  const handleExpandAll = () => {
    const allCategoryIds = categories.map(c => c.id)
    setExpandedNodes(new Set(allCategoryIds))
  }

  const handleCollapseAll = () => {
    setExpandedNodes(new Set())
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header with search and actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar categorias e itens..."
              className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
          >
            Selecionar Tudo
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded"
          >
            Limpar Seleção
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={handleExpandAll}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded"
          >
            Expandir Tudo
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded"
          >
            Recolher Tudo
          </button>
        </div>
      </div>

      {/* Tree content */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma categoria encontrada</p>
          </div>
        ) : (
          tree.map(category => (
            <TreeNode
              key={category.id}
              node={category}
              level={0}
              selectedCategories={selectedCategories}
              selectedItems={selectedItems}
              onToggleCategory={handleToggleCategory}
              onToggleItem={handleToggleItem}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Export helper functions for testing
export { buildTree, getAllItemsInCategory, getAllCategoryIds }
export default CatalogTreeSelector
