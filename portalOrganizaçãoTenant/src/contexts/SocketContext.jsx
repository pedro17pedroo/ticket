import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuthStore();

  useEffect(() => {
    // Só conectar se usuário estiver autenticado
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Criar conexão Socket.IO
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      timeout: 5000,
      autoConnect: true
    });

    // Eventos de conexão
    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      // Ignorar erros de namespace inválido se socket.io não estiver configurado no servidor
      if (error.message === 'Invalid namespace') {
        newSocket.disconnect();
        return;
      }
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      // Socket autenticado com sucesso
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // Funções auxiliares
  const joinTicket = (ticketId) => {
    if (socket && isConnected) {
      socket.emit('join_ticket', ticketId);
    }
  };

  const leaveTicket = (ticketId) => {
    if (socket && isConnected) {
      socket.emit('leave_ticket', ticketId);
    }
  };

  const emitTyping = (ticketId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { ticketId, isTyping });
    }
  };

  const updatePresence = (status) => {
    if (socket && isConnected) {
      socket.emit('update_presence', status);
    }
  };

  const value = {
    socket,
    isConnected,
    joinTicket,
    leaveTicket,
    emitTyping,
    updatePresence
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
