import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    categoryId: '',
    isPublic: true
  });

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await api.get('/templates');
      setTemplates(data.templates || []);
    } catch (error) {
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Erro ao carregar categorias');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, formData);
        toast.success('Template atualizado');
      } else {
        await api.post('/templates', formData);
        toast.success('Template criado');
      }
      await loadTemplates();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar template');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente eliminar este template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      toast.success('Template eliminado');
      await loadTemplates();
    } catch (error) {
      toast.error('Erro ao eliminar template');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject || '',
      content: template.content,
      categoryId: template.categoryId || '',
      isPublic: template.isPublic
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      content: '',
      categoryId: '',
      isPublic: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Resposta</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir respostas rápidas para agilizar atendimento
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Template
        </button>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    {template.isPublic ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
                        Público
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
                        Privado
                      </span>
                    )}
                    {template.usageCount > 0 && (
                      <span className="text-sm text-gray-500">
                        {template.usageCount}x usado
                      </span>
                    )}
                  </div>
                  {template.subject && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Assunto:</strong> {template.subject}
                    </p>
                  )}
                  {template.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-xs rounded-full mb-2">
                      {template.category.name}
                    </span>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap line-clamp-3">
                    {template.content}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum template criado. Crie o primeiro!
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  placeholder="Ex: Resposta padrão de boas-vindas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assunto (opcional)</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  placeholder="Ex: Bem-vindo ao suporte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  placeholder="Escreva o conteúdo do template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoria (opcional)</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="">Nenhuma</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Público (visível para todos da organização)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                >
                  {editingTemplate ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
