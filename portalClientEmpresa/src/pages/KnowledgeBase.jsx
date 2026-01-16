import { useState, useEffect } from 'react'
import { BookOpen, Search, Eye, Calendar, User, Tag, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import api from '../services/api'
import { showError } from '../utils/alerts'
import DynamicIcon from '../components/DynamicIcon'

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

  // Effect para controlar modal
  useEffect(() => {
    if (showArticleModal) {
      // Prevenir scroll quando modal está aberto
      document.body.style.overflow = 'hidden'
      
      // Handler para ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowArticleModal(false)
          setSelectedArticle(null)
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showArticleModal])

  const loadData = async () => {
    setLoading(true)
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        api.get('/knowledge?isPublished=true'),
        api.get('/catalog/categories')
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
    const matchesCategory = !selectedCategory || article.catalogCategoryId === selectedCategory
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all lg:w-64"
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
        <>
          {/* Cards de categorias com artigos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => {
              const categoryArticles = articles.filter(a => a.catalogCategoryId === category.id)
              if (categoryArticles.length === 0) return null
              
              return (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" 
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      <DynamicIcon icon={category.icon} className="w-7 h-7" style={{ color: category.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {categoryArticles.length} artigo{categoryArticles.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Preview dos primeiros artigos */}
                  <div className="space-y-2">
                    {categoryArticles.slice(0, 2).map(article => (
                      <div key={article.id} className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        • {article.title}
                      </div>
                    ))}
                    {categoryArticles.length > 2 && (
                      <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                        +{categoryArticles.length - 2} mais artigos
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mensagem quando não há artigos */}
          {articles.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nenhum artigo disponível
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Ainda não há artigos publicados na base de conhecimento
              </p>
            </div>
          )}

          {/* Mostrar todos os artigos se não houver categorias com artigos */}
          {articles.length > 0 && categories.every(c => articles.filter(a => a.catalogCategoryId === c.id).length === 0) && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Todos os Artigos</h2>
              </div>
              <div className="grid gap-6">
                {articles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => handleViewArticle(article)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 group"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-3">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {article.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{article.author?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(article.createdAt).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Articles List */}
      {(searchTerm || selectedCategory) && (
        <div className="space-y-6">
          {selectedCategory && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrando por:</span>
              <span className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-medium flex items-center gap-2 shadow-sm">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button 
                  onClick={() => setSelectedCategory('')} 
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                  title="Remover filtro"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          {filteredArticles.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nenhum artigo encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Tente ajustar os termos de pesquisa ou filtros
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {searchTerm ? 'Resultados da Pesquisa' : 'Artigos da Categoria'}
                  </h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredArticles.length} artigo{filteredArticles.length !== 1 ? 's' : ''} encontrado{filteredArticles.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid gap-6">
                {filteredArticles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => handleViewArticle(article)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold flex-1 text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {article.title}
                      </h3>
                      {article.category && (
                        <span 
                          className="px-3 py-1.5 rounded-full text-sm font-medium ml-4 flex items-center gap-1.5 flex-shrink-0" 
                          style={{ backgroundColor: article.category.color + '20', color: article.category.color }}
                        >
                          <DynamicIcon icon={article.category.icon} className="w-4 h-4" />
                          {article.category.name}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                      {article.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{article.author?.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(article.createdAt).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>{article.viewCount || 0} visualizações</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && selectedArticle && createPortal(
        <div 
          className="fixed bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" 
          style={{ 
            zIndex: 999999,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '16px'
          }}
          onClick={() => {
            setShowArticleModal(false)
            setSelectedArticle(null)
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-h-[calc(100vh-32px)] overflow-hidden"
            style={{ maxWidth: '1024px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    {selectedArticle.title}
                  </h3>
                  <p className="text-primary-100 text-sm mt-1">
                    Base de Conhecimento
                  </p>
                </div>
                <button
                  onClick={() => setShowArticleModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                {/* Article Meta */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                  <div className="flex flex-wrap items-center gap-4">
                    {selectedArticle.category && (
                      <span 
                        className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5" 
                        style={{ backgroundColor: selectedArticle.category.color + '20', color: selectedArticle.category.color }}
                      >
                        <DynamicIcon icon={selectedArticle.category.icon} className="w-4 h-4" />
                        {selectedArticle.category.name}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{selectedArticle.author?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedArticle.createdAt).toLocaleDateString('pt-PT')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>{selectedArticle.viewCount || 0} visualizações</span>
                    </div>
                  </div>
                </div>

                {/* Article Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div
                    className="prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-primary-600 hover:prose-a:text-primary-700 prose-strong:text-gray-900 dark:prose-strong:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                </div>

                {/* Tags */}
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="mt-6">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Tag className="w-4 h-4" />
                          <span>Tags:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedArticle.tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  )
}

export default KnowledgeBase
