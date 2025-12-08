import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, X, Save, Mail, FolderOpen, Settings } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { confirmDelete } from '../utils/alerts';

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
    const confirmed = await confirmDelete(
      'Eliminar template?',
      'Deseja realmente eliminar este template?'
    )
    if (!confirmed) return;
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

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      categoryId: '',
      isPublic: true
    });
    setEditingTemplate(null);
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
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">

          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingTemplate
                    ? 'Atualize o template de resposta rápida'
                    : 'Crie um novo template para agilizar o atendimento'
                  }
                </p>
              </div>
              <button
                onClick={handleCloseModal}
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
              <form id="templateForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Conteúdo do Template */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary-500" />
                    Conteúdo do Template
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome do Template *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Ex: Resposta padrão de boas-vindas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assunto <span className="text-xs text-gray-500">(opcional)</span></label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Ex: Bem-vindo ao suporte"
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
                      placeholder="Escreva o conteúdo do template...\n\nDica: Você pode usar variáveis como {nome}, {email}, {ticket}"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use variáveis para personalizar automaticamente as respostas</p>
                  </div>
                </div>

                {/* Card: Organização */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary-500" />
                    Organização
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria <span className="text-xs text-gray-500">(opcional)</span></label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Nenhuma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Organize templates por categoria para fácil localização</p>
                  </div>
                </div>

                {/* Card: Configurações de Visibilidade */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-500" />
                    Configurações de Visibilidade
                  </h3>

                  <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Público</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.isPublic
                          ? 'Visível para todos os membros da organização'
                          : 'Apenas visível para você'
                        }
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
                onClick={handleCloseModal}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="templateForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingTemplate ? 'Atualizar' : 'Criar'} Template
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Templates;
