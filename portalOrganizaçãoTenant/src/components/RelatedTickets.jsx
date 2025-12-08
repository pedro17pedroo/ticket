import { useState, useEffect } from 'react';
import { Link2, Plus, X, Search, ExternalLink, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { confirmDelete } from '../utils/alerts';

const RelatedTickets = ({ ticketId }) => {
  const [relatedTickets, setRelatedTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRelatedTickets();
  }, [ticketId]);

  const loadRelatedTickets = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/relationships`);
      setRelatedTickets(data.tickets || []);
    } catch (error) {
      console.error('Erro ao carregar tickets relacionados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data } = await api.get('/tickets', {
        params: { search: searchQuery, limit: 10 }
      });
      // Filtrar ticket atual e já relacionados
      const filtered = data.tickets.filter(
        t => t.id !== ticketId && !relatedTickets.some(rt => rt.id === t.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      toast.error('Erro ao buscar tickets');
    } finally {
      setSearching(false);
    }
  };

  const handleAddRelationship = async (relatedTicketId) => {
    try {
      await api.post(`/tickets/${ticketId}/relationships`, {
        relatedTicketId,
        relationshipType: 'related'
      });
      toast.success('Ticket relacionado adicionado');
      await loadRelatedTickets();
      setShowModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar relacionamento');
    }
  };

  const handleRemoveRelationship = async (relationshipId) => {
    const confirmed = await confirmDelete(
      'Remover relacionamento?',
      'Deseja remover este relacionamento?'
    )
    if (!confirmed) return;

    try {
      await api.delete(`/relationships/${relationshipId}`);
      toast.success('Relacionamento removido');
      await loadRelatedTickets();
    } catch (error) {
      toast.error('Erro ao remover relacionamento');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'aberto': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'em-progresso': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'resolvido': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'fechado': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || colors['aberto'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'baixa': 'text-gray-500',
      'media': 'text-blue-500',
      'alta': 'text-orange-500',
      'critica': 'text-red-500'
    };
    return colors[priority] || colors['media'];
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold mb-3">Tickets Relacionados</h3>
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Tickets Relacionados ({relatedTickets.length})
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Adicionar relacionamento"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {relatedTickets.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum ticket relacionado
          </p>
        ) : (
          relatedTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-start justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="text-sm font-medium text-primary-600 hover:underline flex items-center gap-1"
                  >
                    {ticket.ticketNumber}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-1">
                  {ticket.subject}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertCircle className={`w-3 h-3 ${getPriorityColor(ticket.priority)}`} />
                  {ticket.category && <span>{ticket.category.name}</span>}
                </div>
              </div>
              <button
                onClick={() => handleRemoveRelationship(ticket.relationshipId)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Adicionar Ticket Relacionado</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Pesquisar por número ou assunto..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Buscar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {searching ? (
                <p className="text-center py-8 text-gray-500">Buscando...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  {searchQuery ? 'Nenhum ticket encontrado' : 'Pesquise por um ticket para relacionar'}
                </p>
              ) : (
                searchResults.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleAddRelationship(ticket.id)}
                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-primary-600">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <AlertCircle className={`w-3 h-3 ${getPriorityColor(ticket.priority)}`} />
                      {ticket.category && <span>{ticket.category.name}</span>}
                    </div>
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

export default RelatedTickets;
