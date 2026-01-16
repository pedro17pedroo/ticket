import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, BookOpen, Eye, Search, X, Save, FileText, FolderOpen, Settings, Tag } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { confirmDelete, showSuccess, showError } from '../utils/alerts'
import Modal from '../components/Modal'
import RichTextEditor from '../components/RichTextEditor'
import PermissionGate from '../components/PermissionGate'
import CategoryTreeSelect from '../components/CategoryTreeSelect'

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
    excerpt: '',
    catalogCategoryId: '',
    tags: [],
    isPublished: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        api.get('/knowledge'),
        api.get('/catalog/categories')
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
      setFormData({ title: '', content: '', excerpt: '', catalogCategoryId: '', tags: [], isPublished: false })
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
    setFormData({ title: '', content: '', excerpt: '', catalogCategoryId: '', tags: [], isPublished: false })
    setEditingArticle(null)
  }

  // Função para extrair texto limpo do HTML
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Função para obter excerpt do artigo
  const getExcerpt = (article) => {
    if (article.excerpt) return article.excerpt;
    const plainText = stripHtml(article.content);
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

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
        <PermissionGate permission="knowledge.create">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Novo Artigo
          </button>
        </PermissionGate>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhum artigo encontrado</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Criar Primeiro Artigo
            </button>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div key={article.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header do Card */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-lg line-clamp-2 flex-1">{article.title}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <PermissionGate permission="knowledge.update">
                      <button 
                        onClick={() => { 
                          setEditingArticle(article); 
                          setFormData({
                            title: article.title,
                            content: article.content,
                            excerpt: article.excerpt || '',
                            catalogCategoryId: article.catalogCategoryId || '',
                            tags: article.tags || [],
                            isPublished: article.isPublished
                          }); 
                          setShowModal(true); 
                        }} 
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="knowledge.delete">
                      <button 
                        onClick={() => handleDelete(article.id)} 
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    </PermissionGate>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {article.isPublished ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                      Publicado
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                      Rascunho
                    </span>
                  )}
                  {article.catalogCategory && (
                    <span 
                      className="px-2 py-1 text-xs rounded-full font-medium"
                      style={{ 
                        backgroundColor: (article.catalogCategory.color || '#6b7280') + '20', 
                        color: article.catalogCategory.color || '#6b7280' 
                      }}
                    >
                      {article.catalogCategory.name}
                    </span>
                  )}
                </div>

                {/* Excerpt */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  {getExcerpt(article)}
                </p>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-0.5 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-500">
                        +{article.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer do Card */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {article.viewCount || 0} visualizações
                    </span>
                  </div>
                  <span>{article.author?.name || article.authorOrgUser?.name || 'Anónimo'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
          
          {/* Header com gradiente */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
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
          <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
            <div className="p-6">
              <form id="knowledgeForm" onSubmit={handleSubmit} className="space-y-6">
                {/* Grid de 2 colunas para desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coluna Principal - Conteúdo */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Título */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título do Artigo *
                      </label>
                      <input 
                        type="text" 
                        value={formData.title} 
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                        required 
                        className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                        placeholder="Ex: Como criar um ticket de suporte"
                      />
                    </div>

                    {/* Editor de Conteúdo */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Conteúdo do Artigo *
                      </label>
                      <RichTextEditor
                        value={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        placeholder="Escreva o conteúdo completo do artigo. Use a barra de ferramentas para formatar texto, adicionar imagens, links e muito mais..."
                        minHeight="400px"
                      />
                    </div>

                    {/* Resumo/Excerpt */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Resumo (opcional)
                      </label>
                      <textarea 
                        value={formData.excerpt} 
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
                        rows={3} 
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none" 
                        placeholder="Breve descrição do artigo que aparecerá nas listagens..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Se não preenchido, será usado o início do conteúdo
                      </p>
                    </div>
                  </div>

                  {/* Coluna Lateral - Configurações */}
                  <div className="space-y-6">
                    {/* Publicação */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary-500" />
                        Publicação
                      </h3>
                      
                      <label className="flex items-center gap-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={formData.isPublished} 
                          onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} 
                          className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500" 
                        />
                        <div className="flex-1">
                          <span className="font-medium text-sm">Publicar Artigo</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formData.isPublished ? 'Visível para clientes' : 'Apenas rascunho'}
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Categoria */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-primary-500" />
                        Categoria
                      </h3>
                      
                      <CategoryTreeSelect
                        categories={categories}
                        value={formData.catalogCategoryId}
                        onChange={(categoryId) => setFormData({ ...formData, catalogCategoryId: categoryId })}
                        placeholder="Selecione uma categoria..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Organize o artigo por categoria
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary-500" />
                        Tags
                      </h3>
                      
                      <input 
                        type="text" 
                        placeholder="Adicione tags separadas por vírgula"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const value = e.target.value.trim().replace(',', '');
                            if (value && !formData.tags.includes(value)) {
                              setFormData({ ...formData, tags: [...formData.tags, value] });
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs"
                            >
                              {tag}
                              <button 
                                type="button"
                                onClick={() => setFormData({ 
                                  ...formData, 
                                  tags: formData.tags.filter((_, i) => i !== index) 
                                })}
                                className="hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dicas */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">💡 Dicas</h4>
                      <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                        <li>• Use títulos (H1, H2, H3) para organizar o conteúdo</li>
                        <li>• Adicione imagens para ilustrar procedimentos</li>
                        <li>• Use listas para passos sequenciais</li>
                        <li>• Blocos de código para comandos técnicos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          {/* Footer fixo com botões */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="knowledgeForm"
                className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
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
