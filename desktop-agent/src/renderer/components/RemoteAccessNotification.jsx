import React, { useState, useEffect } from 'react';
import { Monitor, X, Check, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const RemoteAccessNotification = ({ socket, apiUrl, token }) => {
  const [requests, setRequests] = useState([]);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    // Buscar solicitações pendentes ao carregar
    loadPendingRequests();

    // Escutar novas solicitações via WebSocket
    if (socket) {
      socket.on('remote-access-requested', (request) => {
        setRequests(prev => [...prev, request]);
        
        // Mostrar notificação do sistema
        if (window.electron) {
          window.electron.showNotification({
            title: 'Solicitação de Acesso Remoto',
            body: `${request.requester.name} está solicitando acesso remoto para o ticket ${request.ticket.ticketNumber}`
          });
        }

        // Tocar som (opcional)
        playNotificationSound();
      });

      socket.on('remote-access-ended', (data) => {
        setRequests(prev => prev.filter(r => r.id !== data.id));
      });
    }

    return () => {
      if (socket) {
        socket.off('remote-access-requested');
        socket.off('remote-access-ended');
      }
    };
  }, [socket]);

  const loadPendingRequests = async () => {
    try {
      const response = await axios.get(`${apiUrl}/remote-access/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    }
  };

  const handleAccept = async (requestId) => {
    setResponding(requestId);
    try {
      await axios.post(
        `${apiUrl}/remote-access/${requestId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Iniciar servidor de acesso remoto
      if (window.electron) {
        window.electron.startRemoteAccessServer();
      }
    } catch (error) {
      console.error('Erro ao aceitar acesso:', error);
      alert('Erro ao aceitar acesso remoto');
    } finally {
      setResponding(null);
    }
  };

  const handleReject = async (requestId) => {
    setResponding(requestId);
    try {
      await axios.post(
        `${apiUrl}/remote-access/${requestId}/reject`,
        { reason: 'Recusado pelo usuário' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Erro ao rejeitar acesso:', error);
      alert('Erro ao rejeitar acesso remoto');
    } finally {
      setResponding(null);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2W89euZTQ0OTqni7q5iGggrhM3y0nwsAwBG');
    audio.play().catch(() => {});
  };

  const dismissRequest = (requestId) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white border-2 border-purple-500 rounded-lg shadow-2xl p-4 animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Monitor className="w-6 h-6 text-purple-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-gray-900 text-sm">
                  Solicitação de Acesso Remoto
                </h4>
                <button
                  onClick={() => dismissRequest(request.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-1">
                <strong>{request.requester.name}</strong> está solicitando acesso remoto
              </p>
              
              <div className="bg-gray-50 rounded p-2 mb-3">
                <p className="text-xs text-gray-600">
                  <strong>Ticket:</strong> {request.ticket.ticketNumber}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {request.ticket.subject}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    O técnico terá acesso temporário ao seu computador. Você pode encerrar a qualquer momento.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={responding === request.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Recusar
                </button>
                <button
                  onClick={() => handleAccept(request.id)}
                  disabled={responding === request.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {responding === request.id ? 'Aceitando...' : 'Aceitar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RemoteAccessNotification;
