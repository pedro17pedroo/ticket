import { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TemplateSelector = ({ onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await api.get('/templates');
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (template) => {
    onSelect(template.content);
    
    // Incrementar contador de uso
    try {
      await api.put(`/templates/${template.id}`, {
        ...template,
        usageCount: (template.usageCount || 0) + 1
      });
    } catch (error) {
      console.error('Erro ao atualizar contador:', error);
    }
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-primary-600" />
        <span className="text-sm font-medium">Respostas Rápidas</span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
        />
      </div>

      {/* Templates List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-4">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {search ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
          </p>
        ) : (
          filtered.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className="w-full text-left p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-sm">{template.name}</span>
                {template.usageCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {template.usageCount}x
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {template.content}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
