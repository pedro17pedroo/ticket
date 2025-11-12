import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuthStore();

  // Carregar notificações iniciais
  const loadNotifications = useCallback(async (options = {}) => {
    // 🛡️ GUARD: Não carregar se não há usuário logado
    if (!token || !user) {
      console.log('⚠️ [ORGANIZAÇÃO] Sem usuário logado - cancelando carregamento');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Carregando notificações...', options);
      const { data } = await api.get('/notifications', { params: options });
      console.log('📬 Notificações carregadas:', data);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Carregar contagem de não lidas
  const loadUnreadCount = useCallback(async () => {
    // 🛡️ GUARD: Não carregar se não há usuário logado
    if (!token || !user) {
      console.log('⚠️ [ORGANIZAÇÃO] Sem usuário logado - cancelando contagem');
      return;
    }

    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Erro ao carregar contagem:', error);
    }
  }, [token, user]);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      toast.error('Erro ao atualizar notificação');
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      
      setUnreadCount(0);
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao atualizar notificações');
    }
  }, []);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  }, [notifications]);

  // Escutar notificações em tempo real via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Receber nova notificação
    const handleNotification = (notification) => {
      console.log('📬 Nova notificação:', notification);
      
      // Adicionar à lista
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Mostrar toast
      toast.custom((t) => (
        <div 
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          onClick={() => {
            toast.dismiss(t.id);
            // Navegar para o link se existir
            if (notification.link) {
              window.location.href = notification.link;
            }
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-300 text-lg">🔔</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
            >
              Fechar
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-right'
      });
      
      // Tocar som (opcional)
      playNotificationSound();
    };

    socket.on('notification', handleNotification);

    // Cleanup
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, isConnected]);

  // Carregar ao montar E limpar quando usuário sair
  useEffect(() => {
    if (token && user) {
      // Usuário logado - carregar notificações
      loadNotifications({ limit: 20 });
      loadUnreadCount();
    } else {
      // Usuário deslogado - limpar estado
      console.log('🧹 [ORGANIZAÇÃO] Limpando notificações - usuário deslogado');
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [token, user]); // Depende de token e user

  // Recarregar quando WebSocket conectar (mas só se logado)
  useEffect(() => {
    if (isConnected && token && user) {
      loadNotifications({ limit: 20 });
      loadUnreadCount();
    }
  }, [isConnected, token, user]);

  // Função para tocar som de notificação (opcional)
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if audio doesn't play
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
