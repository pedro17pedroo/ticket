import { useState, useEffect } from 'react'
import { BookOpen, Search, Eye, Calendar, User, Tag, X } from 'lucide-react'
import api from '../services/api'
import { showError } from '../utils/alerts'

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [showArticleModal, setShowArticleModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        api.get('/knowledge?isPublished=true'),
        api.get('/categories')
      ])
      setArticles(articlesRes.data.articles || [])
      setCategories(categoriesRes.data.categories || [])
    } catch (error) {
      console.error('Erro ao carregar:', error)
      showError('Erro', 'Não foi possível carregar a base de conhecimento')
    } finally {
      setLoading(false)
    }
  }

  const handleViewArticle = async (article) => {
    try {
      const response = await api.get(`/knowledge/${article.id}`)
      setSelectedArticle(response.data.article)
      setShowArticleModal(true)
    } catch (error) {
      showError('Erro', 'Não foi possível carregar o artigo')
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || article.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Encontre respostas para dúvidas comuns
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 lg:w-64"
          >
            <option value="">Todas as categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Categories Overview */}
      {!searchTerm && !selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => {
            const categoryArticles = articles.filter(a => a.categoryId === category.id)
            if (categoryArticles.length === 0) return null
            
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl`} style={{ backgroundColor: category.color + '20', color: category.color }}>
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-500">{categoryArticles.length} artigo(s)</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Articles List */}
      {(searchTerm || selectedCategory) && (
        <div className="space-y-4">
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtrando por:</span>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('')} className="hover:bg-primary-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          {filteredArticles.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum artigo encontrado</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredArticles.map(article => (
                <div
                  key={article.id}
                  onClick={() => handleViewArticle(article)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold flex-1 hover:text-primary-600">
                      {article.title}
                    </h3>
                    {article.category && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium ml-4" style={{ backgroundColor: article.category.color + '20', color: article.category.color }}>
                        {article.category.icon} {article.category.name}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {article.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{article.author?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(article.createdAt).toLocaleDateString('pt-PT')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{article.views} visualizações</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && selectedArticle && (
        <div className="flex items-center justify-center bg-black/50 p-4 overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-2xl font-bold">{selectedArticle.title}</h3>
              <button
                onClick={() => setShowArticleModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b">
                {selectedArticle.category && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: selectedArticle.category.color + '20', color: selectedArticle.category.color }}>
                    {selectedArticle.category.icon} {selectedArticle.category.name}
                  </span>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{selectedArticle.author?.name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedArticle.createdAt).toLocaleDateString('pt-PT')}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>{selectedArticle.views} visualizações</span>
                </div>
              </div>

              {/* Article Content */}
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
              />

              {/* Tags */}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-gray-500" />
                    {selectedArticle.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBase
