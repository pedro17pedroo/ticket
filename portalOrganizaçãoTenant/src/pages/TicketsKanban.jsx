import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  User,
  Calendar,
  Tag,
  MessageSquare,
  Paperclip,
  MoreVertical,
  Filter,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ticketService } from '../services/api';
import clientService from '../services/clientService';
import { getUsers } from '../services/userService';
import { useAuthStore } from '../store/authStore';

const TicketsKanban = () => {
  const { user: currentUser } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState({
    novo: [],
    aguardando_aprovacao: [],
    em_progresso: [],
    aguardando_cliente: [],
    resolvido: [],
    fechado: []
  });

  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    clientId: '',
    assigneeId: '',
    myTickets: false
  });
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  const statusConfig = {
    novo: {
      label: 'Novo',
      color: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-800 dark:text-blue-200',
      borderColor: 'border-blue-300 dark:border-blue-700',
      icon: AlertCircle
    },
    aguardando_aprovacao: {
      label: 'Aguardando Aprovação',
      color: 'bg-orange-100 dark:bg-orange-900',
      textColor: 'text-orange-800 dark:text-orange-200',
      borderColor: 'border-orange-300 dark:border-orange-700',
      icon: Clock
    },
    em_progresso: {
      label: 'Em Progresso',
      color: 'bg-yellow-100 dark:bg-yellow-900',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      icon: Clock
    },
    aguardando_cliente: {
      label: 'Aguardando Cliente',
      color: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-800 dark:text-purple-200',
      borderColor: 'border-purple-300 dark:border-purple-700',
      icon: User
    },
    resolvido: {
      label: 'Resolvido',
      color: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-300 dark:border-green-700',
      icon: CheckCircle2
    },
    fechado: {
      label: 'Fechado',
      color: 'bg-gray-100 dark:bg-gray-900',
      textColor: 'text-gray-800 dark:text-gray-200',
      borderColor: 'border-gray-300 dark:border-gray-700',
      icon: XCircle
    }
  };

  useEffect(() => {
    loadTickets();
    loadClients();
    loadUsers();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      
      // Aplicar filtros
      if (filters.clientId) {
        params.clientId = filters.clientId;
      }
      if (filters.assigneeId) {
        params.assigneeId = filters.assigneeId;
      }
      if (filters.myTickets && currentUser) {
        params.assigneeId = currentUser.id;
      }

      const response = await ticketService.getTickets(params);
      const ticketsData = response.tickets || [];
      
      // Garantir que todos os tickets têm ID válido
      const validTickets = ticketsData.filter(t => t && t.id);
      setTickets(validTickets);
      
      // Organizar tickets por status
      const organized = {
        novo: validTickets.filter(t => t.status === 'novo'),
        aguardando_aprovacao: validTickets.filter(t => t.status === 'aguardando_aprovacao'),
        em_progresso: validTickets.filter(t => t.status === 'em_progresso'),
        aguardando_cliente: validTickets.filter(t => t.status === 'aguardando_cliente'),
        resolvido: validTickets.filter(t => t.status === 'resolvido'),
        fechado: validTickets.filter(t => t.status === 'fechado')
      };
      
      setColumns(organized);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientService.getAll();
      setClients(response.clients || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Se selecionar "Meus Tickets", limpar assigneeId
      ...(key === 'myTickets' && value ? { assigneeId: '' } : {}),
      // Se selecionar assigneeId, desmarcar "Meus Tickets"
      ...(key === 'assigneeId' && value ? { myTickets: false } : {})
    }));
  };

  const clearFilters = () => {
    setFilters({
      clientId: '',
      assigneeId: '',
      myTickets: false
    });
  };

  const hasActiveFilters = filters.clientId || filters.assigneeId || filters.myTickets;

  const onDragEnd = async (result) => {
    console.log('🎯 onDragEnd chamado:', result.draggableId, '->', result.destination?.droppableId);
    
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Criar cópias dos arrays
    const sourceColumn = Array.from(columns[source.droppableId] || []);
    const destColumn = source.droppableId === destination.droppableId 
      ? sourceColumn 
      : Array.from(columns[destination.droppableId] || []);

    // Encontrar o ticket movido
    const movedTicket = sourceColumn[source.index];
    if (!movedTicket) return;

    // ✅ VALIDAÇÃO: Verificar se pode mover para "aguardando_aprovacao"
    if (destination.droppableId === 'aguardando_aprovacao') {
      // Apenas tickets de solicitação de serviço (com catalogItemId) podem ir para aguardando aprovação
      if (!movedTicket.catalogItemId) {
        toast.error('Apenas solicitações de serviço podem ter status "Aguardando Aprovação"');
        return;
      }
      
      // Verificar se a solicitação requer aprovação
      if (movedTicket.requestStatus && movedTicket.requestStatus !== 'pending') {
        toast.error('Esta solicitação não requer aprovação');
        return;
      }
    }

    // Remover da coluna de origem
    sourceColumn.splice(source.index, 1);

    // Atualizar status do ticket
    const updatedTicket = { ...movedTicket, status: destination.droppableId };
    
    if (source.droppableId === destination.droppableId) {
      // Mesma coluna: apenas reordenar
      sourceColumn.splice(destination.index, 0, updatedTicket);
      setColumns({
        ...columns,
        [source.droppableId]: sourceColumn
      });
    } else {
      // Colunas diferentes: mover entre colunas
      destColumn.splice(destination.index, 0, updatedTicket);
      setColumns({
        ...columns,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      });
    }

    // Atualizar no backend
    try {
      await ticketService.updateTicket(draggableId, { status: destination.droppableId });
      toast.success(`Ticket movido para ${statusConfig[destination.droppableId].label}`);
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      console.log('📋 Error details:', {
        error: error.response?.data?.error,
        message: error.response?.data?.message,
        reason: error.response?.data?.reason
      });
      
      // Mostrar mensagem de erro específica
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao atualizar status do ticket';
      const errorReason = error.response?.data?.reason;
      
      if (errorReason === 'ticket_closed') {
        toast.error('Não é possível mover tickets concluídos (resolvido/fechado)');
      } else if (errorReason === 'ticket_not_assigned') {
        toast.error('Ticket deve ser atribuído antes de mudar o status');
      } else if (errorMessage.includes('aprovação') || errorMessage.includes('approval')) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
      
      // Reverter mudança em caso de erro
      loadTickets();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'text-red-600 dark:text-red-400';
      case 'alta': return 'text-orange-600 dark:text-orange-400';
      case 'media': return 'text-yellow-600 dark:text-yellow-400';
      case 'baixa': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      urgente: 'Urgente',
      alta: 'Alta',
      media: 'Média',
      baixa: 'Baixa'
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kanban de Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Arraste e solte para alterar o status dos tickets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              hasActiveFilters
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                {[filters.clientId, filters.assigneeId, filters.myTickets].filter(Boolean).length}
              </span>
            )}
          </button>
          <Link
            to="/tickets"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Ver Tabela
          </Link>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente
              </label>
              <select
                value={filters.clientId}
                onChange={(e) => handleFilterChange('clientId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Usuário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Atribuído a
              </label>
              <select
                value={filters.assigneeId}
                onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
                disabled={filters.myTickets}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Todos os usuários</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Meus Tickets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visualização
              </label>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="checkbox"
                  checked={filters.myTickets}
                  onChange={(e) => handleFilterChange('myTickets', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  Apenas meus tickets
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollBehavior: 'smooth' }}>
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const columnTickets = columns[status] || [];

            return (
              <div key={status} className="flex flex-col min-w-[280px] md:min-w-[320px] flex-shrink-0">
                {/* Column Header */}
                <div className={`${config.color} ${config.textColor} rounded-t-lg p-4 border-b-2 ${config.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <h3 className="font-semibold">{config.label}</h3>
                    </div>
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium">
                      {columnTickets.length}
                    </span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 rounded-b-lg min-h-[500px] transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : 'bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="space-y-3">
                        {columnTickets.map((ticket, index) => (
                          <Draggable
                            key={String(ticket.id)}
                            draggableId={String(ticket.id)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-move h-[200px] flex flex-col ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''
                                }`}
                              >
                                {/* Ticket Card */}
                                <div className="flex flex-col h-full">
                                  {/* Header - Fixo no topo */}
                                  <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex-1 min-w-0">
                                      <Link
                                        to={`/tickets/${ticket.id}`}
                                        className="font-medium text-sm hover:text-primary-600 dark:hover:text-primary-400 block"
                                        title={ticket.subject}
                                      >
                                        <span className="line-clamp-2">
                                          {ticket.subject}
                                        </span>
                                      </Link>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        #{ticket.ticketNumber}
                                      </p>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Conteúdo do meio - Flexível */}
                                  <div className="flex-1 space-y-2 min-h-0">
                                    {/* Priority */}
                                    <div className="flex items-center gap-2">
                                      <Tag className={`w-3 h-3 flex-shrink-0 ${getPriorityColor(ticket.priority)}`} />
                                      <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                        {getPriorityLabel(ticket.priority)}
                                      </span>
                                    </div>

                                    {/* Requester */}
                                    {ticket.requester && (
                                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                                        <User className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate" title={ticket.requester.name}>
                                          {ticket.requester.name}
                                        </span>
                                      </div>
                                    )}

                                    {/* Assignee */}
                                    {ticket.assignee && (
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                                          <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                            {ticket.assignee.name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate" title={ticket.assignee.name}>
                                          {ticket.assignee.name}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Footer - Fixo no fundo */}
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                      {ticket._count?.comments > 0 && (
                                        <div className="flex items-center gap-1">
                                          <MessageSquare className="w-3 h-3" />
                                          <span>{ticket._count.comments}</span>
                                        </div>
                                      )}
                                      {ticket._count?.attachments > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Paperclip className="w-3 h-3" />
                                          <span>{ticket._count.attachments}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {new Date(ticket.createdAt).toLocaleDateString('pt-PT', { 
                                          day: '2-digit', 
                                          month: 'short' 
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}

                      {columnTickets.length === 0 && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                          Nenhum ticket
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TicketsKanban;
