import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag as TagIcon, X, Save, FileText, Palette } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  });

  const colors = [
    { value: 'red', label: 'Vermelho', class: 'bg-red-100 text-red-700' },
    { value: 'orange', label: 'Laranja', class: 'bg-orange-100 text-orange-700' },
    { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-100 text-yellow-700' },
    { value: 'green', label: 'Verde', class: 'bg-green-100 text-green-700' },
    { value: 'blue', label: 'Azul', class: 'bg-blue-100 text-blue-700' },
    { value: 'indigo', label: 'Índigo', class: 'bg-indigo-100 text-indigo-700' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-100 text-purple-700' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-100 text-pink-700' },
    { value: 'gray', label: 'Cinza', class: 'bg-gray-100 text-gray-700' }
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const { data } = await api.get('/tags');
      setTags(data.tags || []);
    } catch (error) {
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await api.put(`/tags/${editingTag.id}`, formData);
        toast.success('Tag atualizada');
      } else {
        await api.post('/tags', formData);
        toast.success('Tag criada');
      }
      await loadTags();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar tag');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente eliminar esta tag?')) return;
    try {
      await api.delete(`/tags/${id}`);
      toast.success('Tag eliminada');
      await loadTags();
    } catch (error) {
      toast.error('Erro ao eliminar tag');
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({ name: '', description: '', color: 'blue' });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: 'blue' });
    setEditingTag(null);
  };

  const getColorClass = (color) => {
    return colors.find(c => c.value === color)?.class || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerir etiquetas para organização de tickets
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Tag
        </button>
      </div>

      {/* Tags Grid */}
      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getColorClass(tag.color)}`}>
                  {tag.name}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {tag.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tag.description}
                </p>
              )}
            </div>
          ))}

          {tags.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhuma tag criada. Crie a primeira!
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
                  <TagIcon className="w-6 h-6" />
                  {editingTag ? 'Editar Tag' : 'Nova Tag'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingTag 
                    ? 'Atualize as informações da tag'
                    : 'Crie uma nova etiqueta para organizar tickets'
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
              <form id="tagForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Card: Informações da Tag */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Informações da Tag
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Tag *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Ex: Urgente, Bug, Feature"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Descreva o propósito desta tag..."
                    />
                  </div>
                </div>

                {/* Card: Aparência */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary-500" />
                    Aparência Visual
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor da Tag *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${color.class} ${
                            formData.color === color.value 
                              ? 'ring-2 ring-offset-2 ring-primary-500 scale-105 shadow-md' 
                              : 'hover:scale-105'
                          }`}
                        >
                          {color.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Escolha uma cor para identificar visualmente esta tag</p>
                  </div>
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
                form="tagForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingTag ? 'Atualizar' : 'Criar'} Tag
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tags;
