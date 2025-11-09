import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, BookOpen, Eye, Search, X, Save, FileText, FolderOpen, Settings } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'

const Knowledge = () => {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    isPublished: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        api.get('/knowledge'),
        api.get('/categories')
      ])
      setArticles(articlesRes.data.articles || [])
      setCategories(categoriesRes.data.categories || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingArticle) {
        await api.put(`/knowledge/${editingArticle.id}`, formData)
        showSuccess('Atualizado!', 'Artigo atualizado com sucesso')
      } else {
        await api.post('/knowledge', formData)
        showSuccess('Criado!', 'Artigo criado com sucesso')
      }
      setShowModal(false)
      setFormData({ title: '', content: '', categoryId: '', isPublished: false })
      setEditingArticle(null)
      loadData()
    } catch (error) {
      showError('Erro ao criar/atualizar', error.response?.data?.error || error.message)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Eliminar artigo?',
      'Esta ação não pode ser revertida!'
    )
    
    if (!confirmed) return
    
    try {
      await api.delete(`/knowledge/${id}`)
      showSuccess('Eliminado!', 'Artigo eliminado com sucesso')
      loadData()
    } catch (error) {
      showError('Erro ao eliminar', error.response?.data?.error || error.message)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', content: '', categoryId: '', isPublished: false })
    setEditingArticle(null)
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerir artigos e documentação</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Artigo
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar artigos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhum artigo encontrado</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div key={article.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{article.title}</h3>
                    {article.isPublished && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Publicado</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{article.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views}</span>
                    <span>{article.author?.name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingArticle(article); setFormData(article); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(article.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingArticle 
                    ? 'Atualize o conteúdo do artigo da base de conhecimento'
                    : 'Crie um novo artigo para a base de conhecimento'
                  }
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="knowledgeForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Conteúdo do Artigo */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Conteúdo do Artigo
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título do Artigo *</label>
                    <input 
                      type="text" 
                      value={formData.title} 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                      required 
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                      placeholder="Ex: Como criar um ticket"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conteúdo *</label>
                    <textarea 
                      value={formData.content} 
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                      required 
                      rows={10} 
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none" 
                      placeholder="Escreva o conteúdo completo do artigo..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Markdown é suportado para formatação</p>
                  </div>
                </div>

                {/* Card: Organização */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary-500" />
                    Organização
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
                    <select 
                      value={formData.categoryId} 
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Organize o artigo por categoria para facilitar a navegação</p>
                  </div>
                </div>

                {/* Card: Configurações de Publicação */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-500" />
                    Configurações de Publicação
                  </h3>
                  
                  <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.isPublished} 
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} 
                      className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500" 
                    />
                    <div className="flex-1">
                      <span className="font-medium">Publicar Artigo</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.isPublished ? 'Visível para todos os utilizadores' : 'Apenas visível para administradores'}
                      </p>
                    </div>
                  </label>
                </div>
              </form>
            </div>
          </div>
          
          {/* Footer fixo com botões */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="knowledgeForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingArticle ? 'Atualizar' : 'Criar'} Artigo
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Knowledge
