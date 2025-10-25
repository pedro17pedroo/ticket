import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag as TagIcon, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

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
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingTag ? 'Editar Tag' : 'Nova Tag'}
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cor *</label>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${color.class} ${
                        formData.color === color.value ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
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
                  {editingTag ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tags;
