import { useState, useEffect } from 'react';
import { GitMerge, X, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MergeTicketsModal = ({ ticketId, onClose, onSuccess }) => {
  const [duplicates, setDuplicates] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadDuplicates();
  }, [ticketId]);

  const loadDuplicates = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/duplicates`);
      setDuplicates(data.possibleDuplicates || []);
    } catch (error) {
      console.error('Erro ao carregar duplicatas:', error);
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
      // Filtrar ticket atual e selecionados
      const filtered = data.tickets.filter(
        t => t.id !== ticketId && !selectedTickets.includes(t.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      toast.error('Erro ao buscar tickets');
    } finally {
      setSearching(false);
    }
  };

  const toggleTicket = (id) => {
    setSelectedTickets(prev =>
      prev.includes(id)
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const handleMerge = async () => {
    if (selectedTickets.length === 0) {
      toast.error('Selecione pelo menos um ticket para mesclar');
      return;
    }

    if (!confirm(`Tem certeza que deseja mesclar ${selectedTickets.length} ticket(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setMerging(true);
    try {
      const { data } = await api.post('/tickets/merge', {
        targetTicketId: ticketId,
        sourceTicketIds: selectedTickets
      });

      toast.success(data.message);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao mesclar tickets');
    } finally {
      setMerging(false);
    }
  };

  const allTickets = [...duplicates, ...searchResults].reduce((acc, ticket) => {
    if (!acc.find(t => t.id === ticket.id)) {
      acc.push(ticket);
    }
    return acc;
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <GitMerge className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Mesclar Tickets</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selecione os tickets que deseja mesclar neste ticket
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                Atenção! Ação Irreversível
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Os tickets selecionados serão fechados e todo seu conteúdo (comentários, anexos, tags, tempo rastreado) 
                será movido para este ticket. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Buscar Tickets</label>
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

        {/* Duplicates Section */}
        {duplicates.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Possíveis Duplicatas ({duplicates.length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Tickets similares do mesmo cliente criados em período próximo
            </p>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-2 mb-6">
          {loading ? (
            <p className="text-center py-8 text-gray-500">Carregando...</p>
          ) : allTickets.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              {searchQuery ? 'Nenhum ticket encontrado' : 'Busque tickets para mesclar'}
            </p>
          ) : (
            allTickets.map((ticket) => (
              <label
                key={ticket.id}
                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTickets.includes(ticket.id)}
                  onChange={() => toggleTicket(ticket.id)}
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-primary-600">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      ticket.status === 'aberto' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : ticket.status === 'em-progresso'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.requester?.name} • {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        {/* Selected Count */}
        {selectedTickets.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-200">
                {selectedTickets.length} ticket(s) selecionado(s) para mesclar
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleMerge}
            disabled={merging || selectedTickets.length === 0}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {merging ? (
              <>Mesclando...</>
            ) : (
              <>
                <GitMerge className="w-4 h-4" />
                Mesclar {selectedTickets.length > 0 && `(${selectedTickets.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeTicketsModal;
