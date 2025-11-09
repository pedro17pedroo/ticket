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
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ticketService } from '../services/api';

const TicketsKanban = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState({
    novo: [],
    em_progresso: [],
    aguardando_cliente: [],
    resolvido: [],
    fechado: []
  });

  const statusConfig = {
    novo: {
      label: 'Novo',
      color: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-800 dark:text-blue-200',
      borderColor: 'border-blue-300 dark:border-blue-700',
      icon: AlertCircle
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
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketService.getTickets({ limit: 100 });
      const ticketsData = response.tickets || [];
      
      // Garantir que todos os tickets têm ID válido
      const validTickets = ticketsData.filter(t => t && t.id);
      setTickets(validTickets);
      
      // Organizar tickets por status
      const organized = {
        novo: validTickets.filter(t => t.status === 'novo'),
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

  const onDragEnd = async (result) => {
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
      toast.error('Erro ao atualizar status do ticket');
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
        <Link
          to="/tickets"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Ver Tabela
        </Link>
      </div>

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
                                className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-move ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''
                                }`}
                              >
                                {/* Ticket Card */}
                                <div className="space-y-3">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <Link
                                        to={`/tickets/${ticket.id}`}
                                        className="font-medium text-sm hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                                      >
                                        {ticket.subject}
                                      </Link>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        #{ticket.ticketNumber}
                                      </p>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Priority */}
                                  <div className="flex items-center gap-2">
                                    <Tag className={`w-3 h-3 ${getPriorityColor(ticket.priority)}`} />
                                    <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                      {getPriorityLabel(ticket.priority)}
                                    </span>
                                  </div>

                                  {/* Requester */}
                                  {ticket.requester && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                      <User className="w-3 h-3" />
                                      <span className="truncate">{ticket.requester.name}</span>
                                    </div>
                                  )}

                                  {/* Assignee */}
                                  {ticket.assignee && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                          {ticket.assignee.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {ticket.assignee.name}
                                      </span>
                                    </div>
                                  )}

                                  {/* Footer */}
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
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
