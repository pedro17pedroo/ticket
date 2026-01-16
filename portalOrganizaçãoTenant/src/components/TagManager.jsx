import { useState, useEffect } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TagManager = ({ ticketId }) => {
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTicketTags();
    loadAvailableTags();
  }, [ticketId]);

  const loadTicketTags = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/tags`);
      setTags(data.tags || []);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const { data } = await api.get('/tags');
      setAvailableTags(data.tags || []);
    } catch (error) {
      console.error('Erro ao carregar tags disponíveis:', error);
    }
  };

  const handleAddTag = async (tagId) => {
    if (loading) return;
    setLoading(true);
    try {
      await api.post(`/tickets/${ticketId}/tags`, { tagId });
      await loadTicketTags();
      toast.success('Tag adicionada');
      setShowAddModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar tag');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    if (loading) return;
    setLoading(true);
    try {
      await api.delete(`/tickets/${ticketId}/tags/${tagId}`);
      await loadTicketTags();
      toast.success('Tag removida');
    } catch (error) {
      toast.error('Erro ao remover tag');
    } finally {
      setLoading(false);
    }
  };

  const getTagColor = (color) => {
    const colors = {
      red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[color] || colors.gray;
  };

  const availableToAdd = availableTags.filter(
    at => !tags.some(t => t.id === at.id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold">Tags</h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Adicionar tag"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma tag</p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTagColor(tag.color)}`}
            >
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:opacity-70"
                disabled={loading}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Tag Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Adicionar Tag</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {availableToAdd.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Todas as tags já foram adicionadas
                </p>
              ) : (
                availableToAdd.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTagColor(tag.color)}`}>
                      {tag.name}
                    </span>
                    {tag.description && (
                      <span className="text-sm text-gray-500 flex-1 text-left">
                        {tag.description}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;
