import { useState, useEffect } from 'react';
import { X, Plus, Eye, Mail, Users } from 'lucide-react';
import { getUsers } from '../services/userService';

const TicketWatchers = ({ ticket, onUpdate }) => {
  const [orgUsers, setOrgUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  // Carregar usuários da organização
  useEffect(() => {
    const loadOrgUsers = async () => {
      try {
        const response = await getUsers();
        const users = response.users || response;
        setOrgUsers(users.filter(u => u.isActive && u.id !== ticket.assigneeId));
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    loadOrgUsers();
  }, [ticket.assigneeId]);

  // Adicionar observador
  const addWatcher = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      const newWatchers = [...(ticket.orgWatchers || []), selectedUserId];
      
      // Chamar API para atualizar watchers
      const response = await fetch(`/api/tickets/${ticket.id}/watchers`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ orgWatchers: newWatchers })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar watchers');
      }

      const data = await response.json();
      await onUpdate(); // Recarregar ticket completo
      setSelectedUserId('');
    } catch (error) {
      console.error('Erro ao adicionar observador:', error);
      alert('Erro ao adicionar observador');
    } finally {
      setLoading(false);
    }
  };

  // Remover observador
  const removeWatcher = async (watcherId) => {
    setLoading(true);
    try {
      const newWatchers = (ticket.orgWatchers || []).filter(id => id !== watcherId);
      
      // Chamar API para atualizar watchers
      const response = await fetch(`/api/tickets/${ticket.id}/watchers`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ orgWatchers: newWatchers })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar watchers');
      }

      await onUpdate(); // Recarregar ticket completo
    } catch (error) {
      console.error('Erro ao remover observador:', error);
      alert('Erro ao remover observador');
    } finally {
      setLoading(false);
    }
  };

  // Obter dados do usuário pelo ID
  const getWatcherUser = (userId) => {
    return orgUsers.find(u => u.id === userId);
  };

  // Usuários disponíveis (não são observadores ainda)
  const availableUsers = orgUsers.filter(u => 
    !(ticket.orgWatchers || []).includes(u.id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Observadores
          </h3>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {(ticket.orgWatchers?.length || 0) + (ticket.clientWatchers?.length || 0)} total
        </div>
      </div>

      {/* Lista de observadores atuais */}
      {ticket.orgWatchers && ticket.orgWatchers.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {ticket.orgWatchers.length} {ticket.orgWatchers.length === 1 ? 'observador' : 'observadores'}:
          </p>
          <div className="space-y-2">
            {ticket.orgWatchers.map((watcherId) => {
              const user = getWatcherUser(watcherId);
              return (
                <div
                  key={watcherId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg
                           hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user?.name || 'Usuário não encontrado'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || 'Email não disponível'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeWatcher(watcherId)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-600 disabled:opacity-50 p-1 rounded-md
                             hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150
                             focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex-shrink-0 ml-2"
                    title="Remover observador"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Adicionar novo observador */}
      {availableUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                       transition-colors duration-200"
            >
              <option value="">Selecionar usuário...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <button
              onClick={addWatcher}
              disabled={!selectedUserId || loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 
                       disabled:bg-gray-300 disabled:cursor-not-allowed
                       flex items-center justify-center space-x-2 text-sm font-medium
                       transition-all duration-200 min-w-[100px] sm:min-w-[120px]
                       focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                  <span className="sm:hidden">Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Watchers do lado cliente (somente leitura) */}
      {ticket.clientWatchers && ticket.clientWatchers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-3">
            <Mail className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Observadores do Cliente:
            </p>
          </div>
          <div className="space-y-2">
            {ticket.clientWatchers.map((email) => (
              <div key={email} className="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                </div>
                <span className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">{email}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center space-x-1">
          <span>💡</span>
          <span>
            Observadores recebem notificações por email e no sistema sobre todas as atividades do ticket: 
            comentários, mudanças de status, atribuições e cronômetros.
          </span>
        </p>
      </div>
    </div>
  );
};

export default TicketWatchers;
