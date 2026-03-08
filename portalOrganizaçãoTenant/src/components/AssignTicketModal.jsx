import { useState, useEffect } from 'react';
import { UserPlus, Search, X, Building2, Briefcase, Users as UsersIcon, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const AssignTicketModal = ({ isOpen, onClose, ticket, onAssigned }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [canAssign, setCanAssign] = useState(true);
  const [permissionError, setPermissionError] = useState(null);

  useEffect(() => {
    if (isOpen && ticket?.id) {
      loadEligibleAssignees();
    }
  }, [isOpen, ticket?.id]);

  const loadEligibleAssignees = async () => {
    setLoadingUsers(true);
    setPermissionError(null);
    try {
      const response = await api.get(`/tickets/${ticket.id}/eligible-assignees`);
      
      if (response.data.success) {
        setAvailableUsers(response.data.assignees || []);
        setCanAssign(true);
      } else {
        setAvailableUsers([]);
        setCanAssign(false);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários elegíveis:', error);
      
      if (error.response?.status === 403) {
        setCanAssign(false);
        setPermissionError(error.response?.data?.message || 'Não tem permissão para atribuir este ticket.');
        setAvailableUsers([]);
      } else {
        toast.error('Erro ao carregar lista de usuários');
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!canAssign) {
      toast.error('Não tem permissão para atribuir este ticket');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        assigneeId: user.id
      });

      toast.success('Ticket atribuído a você com sucesso');
      onAssigned();
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir ticket:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao atribuir ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToUser = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuário');
      return;
    }

    if (!canAssign) {
      toast.error('Não tem permissão para atribuir este ticket');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        assigneeId: selectedUser.id
      });

      toast.success(`Ticket atribuído a ${selectedUser.name} com sucesso`);
      onAssigned();
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir ticket:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao atribuir ticket');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserHierarchyLabel = (user) => {
    if (user.section) return user.section.name;
    if (user.department) return user.department.name;
    if (user.direction) return user.direction.name;
    return 'Sem estrutura';
  };

  const getUserHierarchyIcon = (user) => {
    if (user.section) return UsersIcon;
    if (user.department) return Briefcase;
    if (user.direction) return Building2;
    return Building2;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6 flex-shrink-0" />
                <span className="truncate">Atribuir Ticket</span>
              </h2>
              <p className="text-blue-100 text-sm mt-1 truncate">
                {ticket?.subject || `Ticket #${ticket?.id}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {!canAssign && permissionError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">Sem permissão</p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{permissionError}</p>
                </div>
              </div>
            )}

            {canAssign && (
              <div>
                <button
                  onClick={handleAssignToMe}
                  disabled={loading || ticket?.assigneeId === user.id || !canAssign}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-5 h-5" />
                  {ticket?.assigneeId === user.id ? 'Já atribuído a você' : 'Atribuir a mim'}
                </button>
              </div>
            )}

            {canAssign && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 font-medium">ou</span>
                </div>
              </div>
            )}

            {canAssign && (
              <div>
                <label className="block text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Atribuir a outro agente
                </label>

                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>

                {loadingUsers ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-3"></div>
                    <p className="text-base font-medium">Carregando usuários...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 px-4">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? 'Tente outro termo de busca' : 'Não há usuários disponíveis na estrutura deste ticket'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredUsers.map((u) => {
                      const HierarchyIcon = getUserHierarchyIcon(u);
                      const isSelected = selectedUser?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-[1.02]'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`font-semibold text-base truncate ${
                                  isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {u.name}
                                </p>
                                {isSelected && (
                                  <span className="flex-shrink-0 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                                    Selecionado
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                                {u.email}
                              </p>
                              <div className="flex items-center gap-2">
                                <HierarchyIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                                  {getUserHierarchyLabel(u)}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            {canAssign ? 'Cancelar' : 'Fechar'}
          </button>
          {canAssign && (
            <button
              onClick={handleAssignToUser}
              disabled={!selectedUser || loading}
              className="px-6 py-2.5 text-base bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {loading ? 'Atribuindo...' : 'Atribuir'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AssignTicketModal;
