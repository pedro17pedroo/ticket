import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, BookOpen, Eye, Search } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'

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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingArticle ? 'Editar' : 'Novo'} Artigo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo *</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={8} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="rounded" />
                <label className="text-sm">Publicar artigo</label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingArticle(null); }} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg">{editingArticle ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Knowledge
