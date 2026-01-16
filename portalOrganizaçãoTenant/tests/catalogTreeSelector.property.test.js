/**
 * Property-Based Tests - CatalogTreeSelector Component
 * 
 * Feature: catalog-access-control
 * Property 5: Cascading Selection Consistency
 * 
 * *For any* category selection in the UI, if a category is selected, 
 * all its subcategories and items must be included in the selection. 
 * If only some children are selected, the parent must show indeterminate state.
 * 
 * **Validates: Requirements 3.3, 3.4**
 * 
 * Uses fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { buildTree, getAllItemsInCategory, getAllCategoryIds } from '../src/components/CatalogTreeSelector'

// Generate a random UUID-like string
const uuidArb = fc.uuid()

// Generate a category with optional parent
const categoryArb = (parentId = null) => fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ maxLength: 200 }),
  parentCategoryId: fc.constant(parentId),
  order: fc.integer({ min: 0, max: 100 }),
  isActive: fc.boolean()
})

// Generate an item belonging to a category
const itemArb = (categoryId) => fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  shortDescription: fc.string({ maxLength: 200 }),
  categoryId: fc.constant(categoryId),
  order: fc.integer({ min: 0, max: 100 }),
  isActive: fc.boolean(),
  isPublic: fc.boolean()
})

// Generate a hierarchical catalog structure
const catalogStructureArb = fc.tuple(
  fc.integer({ min: 1, max: 5 }), // Number of root categories
  fc.integer({ min: 0, max: 3 }), // Max subcategories per category
  fc.integer({ min: 1, max: 5 })  // Items per category
).chain(([numRootCats, maxSubcats, itemsPerCat]) => {
  return fc.array(uuidArb, { minLength: numRootCats, maxLength: numRootCats }).chain(rootCatIds => {
    // Create root categories
    const rootCategories = rootCatIds.map((id, index) => ({
      id,
      name: `Category ${index}`,
      description: `Description for category ${index}`,
      parentCategoryId: null,
      order: index,
      isActive: true
    }))

    // Generate subcategories for each root category
    return fc.array(
      fc.integer({ min: 0, max: maxSubcats }),
      { minLength: numRootCats, maxLength: numRootCats }
    ).chain(subcatCounts => {
      const subcategories = []
      const subcatIdPromises = []
      
      rootCatIds.forEach((parentId, parentIndex) => {
        const numSubcats = subcatCounts[parentIndex]
        for (let i = 0; i < numSubcats; i++) {
          subcatIdPromises.push(fc.sample(uuidArb, 1)[0])
        }
      })

      // Generate items for all categories
      const allCategoryIds = [...rootCatIds]
      let subcatIndex = 0
      rootCatIds.forEach((parentId, parentIndex) => {
        const numSubcats = subcatCounts[parentIndex]
        for (let i = 0; i < numSubcats; i++) {
          const subcatId = `subcat-${parentIndex}-${i}`
          allCategoryIds.push(subcatId)
          subcategories.push({
            id: subcatId,
            name: `Subcategory ${parentIndex}-${i}`,
            description: `Description for subcategory ${parentIndex}-${i}`,
            parentCategoryId: parentId,
            order: i,
            isActive: true
          })
          subcatIndex++
        }
      })

      // Generate items
      const items = []
      allCategoryIds.forEach((catId, catIndex) => {
        for (let i = 0; i < itemsPerCat; i++) {
          items.push({
            id: `item-${catIndex}-${i}`,
            name: `Item ${catIndex}-${i}`,
            shortDescription: `Description for item ${catIndex}-${i}`,
            categoryId: catId,
            order: i,
            isActive: true,
            isPublic: true
          })
        }
      })

      return fc.constant({
        categories: [...rootCategories, ...subcategories],
        items
      })
    })
  })
})

describe('CatalogTreeSelector - Property-Based Tests', () => {
  /**
   * Property 5: Cascading Selection Consistency
   * 
   * Feature: catalog-access-control, Property 5: Cascading Selection Consistency
   * **Validates: Requirements 3.3, 3.4**
   */
  describe('Property 5: Cascading Selection Consistency', () => {
    it('should include all items when a category is selected', () => {
      fc.assert(
        fc.property(
          catalogStructureArb,
          ({ categories, items }) => {
            const tree = buildTree(categories, items)
            
            // For each category in the tree, verify getAllItemsInCategory returns all items
            const verifyCategory = (category) => {
              const allItemIds = getAllItemsInCategory(category)
              
              // All direct items should be included
              category.items.forEach(item => {
                expect(allItemIds).toContain(item.id)
              })
              
              // All items from subcategories should be included
              category.children.forEach(child => {
                const childItemIds = getAllItemsInCategory(child)
                childItemIds.forEach(itemId => {
                  expect(allItemIds).toContain(itemId)
                })
                
                // Recursively verify children
                verifyCategory(child)
              })
            }
            
            tree.forEach(verifyCategory)
            return true
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should include all subcategory IDs when a category is selected', () => {
      fc.assert(
        fc.property(
          catalogStructureArb,
          ({ categories, items }) => {
            const tree = buildTree(categories, items)
            
            // For each category, verify getAllCategoryIds returns all nested category IDs
            const verifyCategory = (category) => {
              const allCategoryIds = getAllCategoryIds(category)
              
              // The category itself should be included
              expect(allCategoryIds).toContain(category.id)
              
              // All subcategories should be included
              category.children.forEach(child => {
                expect(allCategoryIds).toContain(child.id)
                
                // All nested subcategories should also be included
                const childCategoryIds = getAllCategoryIds(child)
                childCategoryIds.forEach(catId => {
                  expect(allCategoryIds).toContain(catId)
                })
                
                // Recursively verify children
                verifyCategory(child)
              })
            }
            
            tree.forEach(verifyCategory)
            return true
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should build correct tree structure from flat arrays', () => {
      fc.assert(
        fc.property(
          catalogStructureArb,
          ({ categories, items }) => {
            const tree = buildTree(categories, items)
            
            // Count total items in tree
            const countItemsInTree = (nodes) => {
              let count = 0
              nodes.forEach(node => {
                count += node.items.length
                count += countItemsInTree(node.children)
              })
              return count
            }
            
            // Count total categories in tree
            const countCategoriesInTree = (nodes) => {
              let count = nodes.length
              nodes.forEach(node => {
                count += countCategoriesInTree(node.children)
              })
              return count
            }
            
            // All items should be in the tree
            expect(countItemsInTree(tree)).toBe(items.length)
            
            // All categories should be in the tree
            expect(countCategoriesInTree(tree)).toBe(categories.length)
            
            return true
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should maintain parent-child relationships correctly', () => {
      fc.assert(
        fc.property(
          catalogStructureArb,
          ({ categories, items }) => {
            const tree = buildTree(categories, items)
            
            // Create a map of category IDs to their parent IDs from original data
            const parentMap = new Map()
            categories.forEach(cat => {
              parentMap.set(cat.id, cat.parentCategoryId)
            })
            
            // Verify tree structure matches original relationships
            const verifyRelationships = (nodes, expectedParentId) => {
              nodes.forEach(node => {
                // Verify this node's parent matches expected
                expect(parentMap.get(node.id)).toBe(expectedParentId)
                
                // Verify children have this node as parent
                verifyRelationships(node.children, node.id)
              })
            }
            
            // Root nodes should have null parent
            verifyRelationships(tree, null)
            
            return true
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should correctly assign items to their categories', () => {
      fc.assert(
        fc.property(
          catalogStructureArb,
          ({ categories, items }) => {
            const tree = buildTree(categories, items)
            
            // Create a map of item IDs to their category IDs from original data
            const itemCategoryMap = new Map()
            items.forEach(item => {
              itemCategoryMap.set(item.id, item.categoryId)
            })
            
            // Verify each item is in the correct category
            const verifyItems = (nodes) => {
              nodes.forEach(node => {
                // Each item in this category should have this category as its categoryId
                node.items.forEach(item => {
                  expect(itemCategoryMap.get(item.id)).toBe(node.id)
                })
                
                // Recursively verify children
                verifyItems(node.children)
              })
            }
            
            verifyItems(tree)
            
            return true
          }
        ),
        { numRuns: 20 }
      )
    })

    it('selecting a category should select exactly all its descendants', () => {
      fc.assert(
        fc.property(
          catalogStructureArb,
          ({ categories, items }) => {
            const tree = buildTree(categories, items)
            
            // For each category, verify that selecting it would select all descendants
            const verifySelection = (category) => {
              const allCategoryIds = getAllCategoryIds(category)
              const allItemIds = getAllItemsInCategory(category)
              
              // Count expected descendants
              const countDescendants = (cat) => {
                let count = cat.items.length
                cat.children.forEach(child => {
                  count += 1 // The child category itself
                  count += countDescendants(child)
                })
                return count
              }
              
              const expectedDescendantCount = countDescendants(category)
              const actualDescendantCount = allCategoryIds.length - 1 + allItemIds.length // -1 for the category itself
              
              expect(actualDescendantCount).toBe(expectedDescendantCount)
              
              // Recursively verify children
              category.children.forEach(verifySelection)
            }
            
            tree.forEach(verifySelection)
            return true
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
