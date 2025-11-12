import { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuthStore();

  // Carregar notificações (com useCallback para evitar loops)
  const loadNotifications = useCallback(async (options = {}) => {
    // 🛡️ GUARD: Não carregar se não há usuário logado
    if (!token || !user) {
      console.log('⚠️ [CLIENTE] Sem usuário logado - cancelando carregamento');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 [CLIENTE] Carregando notificações...', options);
      const { data } = await api.get('/notifications', { params: options });
      console.log('📬 [CLIENTE] Notificações carregadas:', data);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('❌ [CLIENTE] Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Carregar contagem (com useCallback)
  const loadUnreadCount = useCallback(async () => {
    // 🛡️ GUARD: Não carregar se não há usuário logado
    if (!token || !user) {
      console.log('⚠️ [CLIENTE] Sem usuário logado - cancelando contagem');
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

  // Carregar ao montar E limpar quando usuário sair
  useEffect(() => {
    if (token && user) {
      // Usuário logado - carregar notificações
      loadNotifications({ limit: 20 });
      loadUnreadCount();
    } else {
      // Usuário deslogado - limpar estado
      console.log('🧹 [CLIENTE] Limpando notificações - usuário deslogado');
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [token, user]); // Depende de token e user

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
