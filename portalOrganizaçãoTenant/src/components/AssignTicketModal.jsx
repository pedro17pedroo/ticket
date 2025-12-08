import { useState, useEffect } from 'react';
import { UserPlus, Search, X, Building2, Briefcase, Users as UsersIcon } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/users');
      const allUsers = response.data.users || [];

      // Filtrar usuários baseado na hierarquia
      const filtered = filterUsersByHierarchy(allUsers);

      setAvailableUsers(filtered);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoadingUsers(false);
    }
  };

  const filterUsersByHierarchy = (users) => {
    // Apenas agentes e admins podem ser atribuídos
    let agentsAndAdmins = users.filter(u =>
      u.role === 'agent' || u.role === 'org-admin' || u.role === 'super-admin'
    );

    // Admin pode atribuir para qualquer um
    if (user.role === 'super-admin' || user.role === 'org-admin') {
      return agentsAndAdmins;
    }

    // Responsável de Direção
    if (user.role === 'resp-direcao' && user.directionId) {
      return agentsAndAdmins.filter(u => {
        // Mesma direção
        if (u.directionId === user.directionId) return true;
        // Departamento da sua direção
        if (u.department?.directionId === user.directionId) return true;
        // Seção de departamento da sua direção
        if (u.section?.department?.directionId === user.directionId) return true;
        return false;
      });
    }

    // Responsável de Departamento
    if (user.role === 'resp-departamento' && user.departmentId) {
      return agentsAndAdmins.filter(u => {
        // Mesmo departamento
        if (u.departmentId === user.departmentId) return true;
        // Seção do seu departamento
        if (u.section?.departmentId === user.departmentId) return true;
        return false;
      });
    }

    // Responsável de Seção
    if (user.role === 'resp-secao' && user.sectionId) {
      return agentsAndAdmins.filter(u => u.sectionId === user.sectionId);
    }

    // Agente só pode atribuir para si mesmo
    if (user.role === 'agente') {
      return agentsAndAdmins.filter(u => u.id === user.id);
    }

    return [];
  };

  const handleAssignToMe = async () => {
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
      toast.error(error.response?.data?.error || 'Erro ao atribuir ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToUser = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuário');
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
      toast.error(error.response?.data?.error || 'Erro ao atribuir ticket');
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6" />
                Atribuir Ticket
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {ticket?.subject || `Ticket #${ticket?.id}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Atribuir a mim */}
            <div>
              <button
                onClick={handleAssignToMe}
                disabled={loading || ticket?.assigneeId === user.id}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-5 h-5" />
                {ticket?.assigneeId === user.id ? 'Já atribuído a você' : 'Atribuir a mim'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">ou</span>
              </div>
            </div>

            {/* Atribuir a outro usuário */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Atribuir a outro agente
              </label>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Users List */}
              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">
                  Carregando usuários...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredUsers.map((u) => {
                    const HierarchyIcon = getUserHierarchyIcon(u);
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedUser?.id === u.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {u.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {u.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <HierarchyIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {getUserHierarchyLabel(u)}
                              </span>
                            </div>
                          </div>
                          {selectedUser?.id === u.id && (
                            <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssignToUser}
            disabled={!selectedUser || loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Atribuindo...' : 'Atribuir'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignTicketModal;
