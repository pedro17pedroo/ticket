import { useState, useEffect, useRef } from 'react';
import { Monitor, MessageCircle, X, Send, Clock, History, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const RemoteAccessSession = ({ session, onClose, socket }) => {
  const [messages, setMessages] = useState(session?.chatMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [duration, setDuration] = useState(0);
  const [auditLog, setAuditLog] = useState(session?.auditLog || []);
  const messagesEndRef = useRef(null);
  const [expiresAt, setExpiresAt] = useState(session?.expiresAt ? new Date(session.expiresAt) : null);

  // Timer da sessão
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.requestedAt) {
        const start = new Date(session.requestedAt);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        setDuration(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Scroll automático do chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listener WebSocket para novas mensagens
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.sessionId === session?.id) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    socket.on('remote-access:chat-message', handleNewMessage);

    return () => {
      socket.off('remote-access:chat-message', handleNewMessage);
    };
  }, [socket, session?.id]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const diff = Math.floor((expiresAt - now) / 1000);
    if (diff <= 0) return 'Expirado';
    const mins = Math.floor(diff / 60);
    return `${mins} min`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await api.post(`/remote-access/${session.id}/chat`, {
        message: newMessage
      });

      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      const response = await api.get(`/remote-access/${session.id}/audit`);
      setAuditLog(response.data.session.auditLog || []);
      setShowAudit(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Aguardando' },
      accepted: { color: 'bg-green-100 text-green-800', text: 'Aceito' },
      active: { color: 'bg-blue-100 text-blue-800', text: 'Ativo' },
      ended: { color: 'bg-gray-100 text-gray-800', text: 'Encerrado' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejeitado' }
    };

    const status = statusConfig[session?.status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
        {status.text}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="font-bold text-lg">Sessão de Acesso Remoto</h3>
              <p className="text-sm text-gray-600">Ticket #{session?.ticket?.ticketNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge()}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="flex items-center justify-around p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Duração</p>
              <p className="font-mono font-bold">{formatDuration(duration)}</p>
            </div>
          </div>

          {expiresAt && session?.status === 'pending' && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Expira em</p>
                <p className="font-bold text-orange-600">{getTimeRemaining()}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Chat
          </button>

          <button
            onClick={loadAuditLog}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <History className="w-5 h-5" />
            Histórico
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Area */}
          <div className={`${showChat ? 'w-2/3' : 'w-full'} p-6 overflow-auto`}>
            {showAudit ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-lg">Histórico de Auditoria</h4>
                  <button
                    onClick={() => setShowAudit(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {auditLog.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum evento registrado</p>
                ) : (
                  auditLog.map((log, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold capitalize">{log.action}</p>
                          <p className="text-sm text-gray-600">{log.userName}</p>
                          {log.reason && (
                            <p className="text-sm text-gray-500 mt-1">{log.reason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-400">{log.ip}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Monitor className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-2">Área de Visualização Remota</p>
                <p className="text-sm text-gray-500">
                  A funcionalidade de compartilhamento de tela será implementada em breve
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Tecnologias planejadas: WebRTC, noVNC ou integração com AnyDesk
                </p>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="w-1/3 border-l flex flex-col bg-gray-50">
              <div className="p-4 border-b bg-white">
                <h4 className="font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </h4>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Nenhuma mensagem ainda
                  </p>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.userId === session?.requesterId
                          ? 'bg-blue-100 ml-auto'
                          : 'bg-white border border-gray-200'
                      } max-w-[80%]`}
                    >
                      <p className="text-xs font-semibold text-gray-700">
                        {msg.userName}
                      </p>
                      <p className="text-sm mt-1">{msg.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={session?.status !== 'accepted' && session?.status !== 'active'}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending || (session?.status !== 'accepted' && session?.status !== 'active')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoteAccessSession;
