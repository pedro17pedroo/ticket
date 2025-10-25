import { useState } from 'react';
import { MessageCircle, Paperclip, Edit, UserPlus, CheckCircle, XCircle, Tag as TagIcon, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const ActivityTimeline = ({ ticket }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  // Construir timeline de atividades
  const buildTimeline = () => {
    const activities = [];

    // Comentários
    if (ticket.comments) {
      ticket.comments.forEach(comment => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          timestamp: new Date(comment.createdAt),
          user: comment.user,
          data: comment
        });
      });
    }

    // Mudanças de status (simulado - idealmente viria de um audit log)
    // Por enquanto vamos mostrar apenas os comentários
    // No futuro você pode adicionar: status changes, assignments, priority changes, etc.

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  };

  const getFilteredActivities = () => {
    const timeline = buildTimeline();
    if (activeFilter === 'all') return timeline;
    return timeline.filter(activity => activity.type === activeFilter);
  };

  const getActivityIcon = (type) => {
    const icons = {
      comment: MessageCircle,
      attachment: Paperclip,
      status: Edit,
      assignment: UserPlus,
      resolved: CheckCircle,
      closed: XCircle,
      tag: TagIcon,
      timer: Clock
    };
    const Icon = icons[type] || MessageCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getActivityColor = (type) => {
    const colors = {
      comment: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      attachment: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      status: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      assignment: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      resolved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      tag: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      timer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
    };
    return colors[type] || colors.comment;
  };

  const filters = [
    { id: 'all', label: 'Tudo', icon: Filter },
    { id: 'comment', label: 'Comentários', icon: MessageCircle },
    { id: 'attachment', label: 'Anexos', icon: Paperclip },
    { id: 'status', label: 'Status', icon: Edit },
    { id: 'assignment', label: 'Atribuições', icon: UserPlus }
  ];

  const activities = getFilteredActivities();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeFilter === filter.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma atividade neste filtro</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{activity.user?.name || 'Sistema'}</span>
                    {activity.data?.isInternal && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs rounded-full">
                        Interno
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(activity.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                  </span>
                </div>

                {activity.type === 'comment' && (
                  <div 
                    className="ticket-description-view text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: activity.data.content }}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
