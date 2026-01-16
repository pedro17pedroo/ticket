/**
 * CategoryTreeSelect Component
 * 
 * A tree-based category selector that displays categories in a hierarchical structure.
 * Allows users to easily navigate and select categories from a tree view.
 */

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronDown, FolderOpen, Search, X, Check } from 'lucide-react'
import DynamicIcon from './DynamicIcon'

const CategoryTreeSelect = ({ 
  categories = [], 
  value, 
  onChange, 
  placeholder = 'Selecione uma categoria...',
  required = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Build tree structure from flat list
  const buildTree = (cats) => {
    const map = new Map()
    const roots = []

    // First pass: create map
    cats.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree
    cats.forEach(cat => {
      const node = map.get(cat.id)
      if (cat.parentCategoryId && map.has(cat.parentCategoryId)) {
        map.get(cat.parentCategoryId).children.push(node)
      } else if (!cat.parentCategoryId) {
        roots.push(node)
      }
    })

    // Sort children
    const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
        if (a.order !== b.order) return (a.order || 0) - (b.order || 0)
        return a.name.localeCompare(b.name)
      })
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortNodes(node.children)
        }
      })
    }
    sortNodes(roots)

    return roots
  }

  const categoryTree = buildTree(categories)

  // Find selected category
  const findCategory = (cats, id) => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.children?.length > 0) {
        const found = findCategory(cat.children, id)
        if (found) return found
      }
    }
    return null
  }

  const selectedCategory = value ? findCategory(categoryTree, value) : null

  // Build path to category
  const getCategoryPath = (cats, targetId, path = []) => {
    for (const cat of cats) {
      if (cat.id === targetId) {
        return [...path, cat.name]
      }
      if (cat.children?.length > 0) {
        const found = getCategoryPath(cat.children, targetId, [...path, cat.name])
        if (found) return found
      }
    }
    return null
  }

  const selectedPath = value ? getCategoryPath(categoryTree, value) : null

  // Filter categories by search term
  const filterCategories = (cats, term) => {
    if (!term) return cats
    
    const lowerTerm = term.toLowerCase()
    const matchingIds = new Set()
    
    // Find all matching categories and their ancestors
    const findMatches = (cats, ancestors = []) => {
      cats.forEach(cat => {
        if (cat.name.toLowerCase().includes(lowerTerm)) {
          matchingIds.add(cat.id)
          ancestors.forEach(id => matchingIds.add(id))
        }
        if (cat.children?.length > 0) {
          findMatches(cat.children, [...ancestors, cat.id])
        }
      })
    }
    findMatches(cats)

    // Filter tree to only include matching branches
    const filterTree = (cats) => {
      return cats
        .filter(cat => matchingIds.has(cat.id))
        .map(cat => ({
          ...cat,
          children: cat.children?.length > 0 ? filterTree(cat.children) : []
        }))
    }

    return filterTree(cats)
  }

  const filteredTree = filterCategories(categoryTree, searchTerm)

  // Expand all when searching
  useEffect(() => {
    if (searchTerm) {
      const allIds = new Set()
      const collectIds = (cats) => {
        cats.forEach(cat => {
          allIds.add(cat.id)
          if (cat.children?.length > 0) {
            collectIds(cat.children)
          }
        })
      }
      collectIds(filteredTree)
      setExpandedIds(allIds)
    }
  }, [searchTerm])

  // Expand to show selected category
  useEffect(() => {
    if (value && categoryTree.length > 0) {
      const expandPath = (cats, targetId, path = []) => {
        for (const cat of cats) {
          if (cat.id === targetId) {
            return path
          }
          if (cat.children?.length > 0) {
            const found = expandPath(cat.children, targetId, [...path, cat.id])
            if (found) return found
          }
        }
        return null
      }
      const path = expandPath(categoryTree, value)
      if (path) {
        setExpandedIds(prev => new Set([...prev, ...path]))
      }
    }
  }, [value, categories])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const toggleExpand = (id, e) => {
    e.stopPropagation()
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelect = (category) => {
    onChange(category.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children?.length > 0
    const isExpanded = expandedIds.has(node.id)
    const isSelected = value === node.id

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            isSelected ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : ''
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => handleSelect(node)}
        >
          {/* Expand/Collapse button */}
          <button
            type="button"
            onClick={(e) => toggleExpand(node.id, e)}
            className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
              hasChildren ? 'visible' : 'invisible'
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Icon */}
          <div 
            className="p-1 rounded"
            style={{ backgroundColor: node.color ? `${node.color}20` : '#3B82F620' }}
          >
            <DynamicIcon 
              icon={node.icon} 
              className="w-4 h-4"
              style={{ color: node.color || '#3B82F6' }}
              fallback="FolderOpen"
            />
          </div>

          {/* Name */}
          <span className="flex-1 text-sm font-medium truncate">
            {node.name}
          </span>

          {/* Selected indicator */}
          {isSelected && (
            <Check className="w-4 h-4 text-primary-600" />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected value display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg text-left flex items-center gap-2 transition-all ${
          disabled 
            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' 
            : 'bg-white dark:bg-gray-700 hover:border-primary-400 cursor-pointer'
        } ${
          isOpen 
            ? 'border-primary-500 ring-2 ring-primary-500/20' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        {selectedCategory ? (
          <>
            <div 
              className="p-1 rounded flex-shrink-0"
              style={{ backgroundColor: selectedCategory.color ? `${selectedCategory.color}20` : '#3B82F620' }}
            >
              <DynamicIcon 
                icon={selectedCategory.icon} 
                className="w-4 h-4"
                style={{ color: selectedCategory.color || '#3B82F6' }}
                fallback="FolderOpen"
              />
            </div>
            <span className="flex-1 truncate text-gray-900 dark:text-white">
              {selectedPath ? selectedPath.join(' > ') : selectedCategory.name}
            </span>
            {!required && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Limpar seleção"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </>
        ) : (
          <span className="flex-1 text-gray-500 dark:text-gray-400">
            {placeholder}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar categorias..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Tree */}
          <div className="overflow-y-auto max-h-60">
            {!required && !searchTerm && (
              <div
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  !value ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : ''
                }`}
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
              >
                <div className="w-4 h-4 ml-5" />
                <div className="p-1 rounded bg-gray-200 dark:bg-gray-600">
                  <X className="w-4 h-4 text-gray-500" />
                </div>
                <span className="flex-1 text-sm font-medium">
                  Todas
                </span>
                {!value && (
                  <Check className="w-4 h-4 text-primary-600" />
                )}
              </div>
            )}
            {filteredTree.length > 0 ? (
              filteredTree.map(node => renderNode(node))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria disponível'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryTreeSelect
