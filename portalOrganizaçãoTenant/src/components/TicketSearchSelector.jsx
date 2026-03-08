import { useState, useEffect, useRef } from 'react';
import { Search, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TicketSearchSelector = ({ bankId, onSelect, selectedTicket }) => {
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar tickets com debounce
  useEffect(() => {
    if (search.length >= 2 && isOpen) {
      const timer = setTimeout(() => {
        searchTickets();
      }, 500);

      return () => clearTimeout(timer);
    } else if (search.length < 2) {
      setTickets([]);
    }
  }, [search, isOpen]);

  const searchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/hours-banks/${bankId}/available-tickets`, {
        params: { search }
      });
      
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast.error('Erro ao buscar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = (ticket) => {
    onSelect(ticket);
    setIsOpen(false);
    setSearch('');
  };

  const handleClearSelection = () => {
    onSelect(null);
    setSearch('');
    setTickets([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Buscar Ticket *
      </label>
      
      {/* Select-style button */}
      {!selectedTicket ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all text-base text-left flex items-center justify-between"
          >
            <span className="text-gray-500 dark:text-gray-400">
              Selecione um ticket...
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              {/* Search input inside dropdown */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Digite o número ou assunto..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all text-sm"
                    autoFocus
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {search.length < 2 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Digite pelo menos 2 caracteres para buscar
                  </div>
                ) : tickets.length === 0 && !loading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nenhum ticket encontrado
                  </div>
                ) : (
                  <div className="py-1">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => handleSelectTicket(ticket)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                #{ticket.ticketNumber}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                ticket.status === 'fechado'
                                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {ticket.subject}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {ticket.totalHours}h trabalhadas
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Selected Ticket Display */
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  #{selectedTicket.ticketNumber}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {selectedTicket.subject}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Tempo trabalhado: {selectedTicket.totalHours}h
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Alterar
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Apenas tickets fechados ou resolvidos com tempo trabalhado
      </p>
    </div>
  );
};

export default TicketSearchSelector;
