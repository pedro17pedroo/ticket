import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Trash2, Ticket, MessageCircle, UserCheck, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationItem = ({ notification, onClick, onDelete }) => {
  const { markAsRead } = useNotifications();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onClick();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  // Ícone baseado no tipo
  const getIcon = () => {
    const iconClass = "w-5 h-5";
    switch (notification.type) {
      case 'ticket_created':
        return <Ticket className={iconClass} />;
      case 'ticket_assigned':
        return <UserCheck className={iconClass} />;
      case 'ticket_transferred':
        return <ArrowRight className={iconClass} />;
      case 'comment_added':
        return <MessageCircle className={iconClass} />;
      case 'ticket_status_changed':
        return <TrendingUp className={iconClass} />;
      case 'sla_warning':
      case 'sla_breached':
        return <AlertCircle className={iconClass} />;
      default:
        return <Ticket className={iconClass} />;
    }
  };

  // Cor baseada na prioridade
  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'normal':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getPriorityColor()}`}>
          {getIcon()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium text-sm">
                {notification.title}
                {!notification.isRead && (
                  <span className="ml-2 inline-block w-2 h-2 bg-primary-600 rounded-full"></span>
                )}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            
            {/* Botão deletar */}
            <button
              onClick={handleDelete}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Remover"
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: pt
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
