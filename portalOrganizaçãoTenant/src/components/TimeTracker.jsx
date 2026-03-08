import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, Plus, User, Calendar, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Modal from './Modal';

const TimeTracker = ({ ticketId, ticket }) => {
  const [timer, setTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeEntries, setTimeEntries] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const intervalRef = useRef(null);

  // Verificar se ticket está atribuído e não está concluído
  const isTicketAssigned = ticket?.assigneeId !== null && ticket?.assigneeId !== undefined;
  const isTicketClosed = ['fechado', 'resolvido', 'concluido'].includes(ticket?.status?.toLowerCase());
  const canUseTimer = isTicketAssigned && !isTicketClosed;

  // Buscar timer ativo e histórico ao montar
  useEffect(() => {
    loadActiveTimer();
    loadTimeEntries();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ticketId]);

  // Atualizar tempo decorrido
  useEffect(() => {
    if (timer && timer.status === 'running') {
      const calculateElapsed = () => {
        const start = new Date(timer.startTime);
        const now = new Date();
        const totalElapsed = Math.floor((now - start) / 1000);
        const pausedTime = timer.totalPausedTime || 0;
        return Math.max(0, totalElapsed - pausedTime);
      };
      
      setElapsed(calculateElapsed());
      
      intervalRef.current = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);
    } else if (timer && timer.status === 'paused') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      const start = new Date(timer.startTime);
      const pauseStart = timer.lastPauseAt ? new Date(timer.lastPauseAt) : new Date();
      const elapsedUntilPause = Math.floor((pauseStart - start) / 1000);
      const pausedTime = timer.totalPausedTime || 0;
      setElapsed(Math.max(0, elapsedUntilPause - pausedTime));
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer]);

  const loadActiveTimer = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/timer/active`);
      
      if (data.timer) {
        const now = new Date();
        const start = new Date(data.timer.startTime);
        const totalElapsed = Math.floor((now - start) / 1000);
        const pausedTime = data.timer.totalPausedTime || 0;
        const elapsed = Math.max(0, totalElapsed - pausedTime);
        
        setTimer(data.timer);
        setElapsed(elapsed);
      }
    } catch (error) {
      console.error('Erro ao carregar timer:', error);
    }
  };

  const loadTimeEntries = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/time-entries`);
      setTimeEntries(data.entries || []);
      setTotalTime(data.totalSeconds || 0);
    } catch (error) {
      console.error('Erro ao carregar registros de tempo:', error);
    }
  };

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (timer && timer.isActive) {
        await api.put(`/timers/${timer.id}/stop`);
      }
      
      const { data } = await api.post(`/tickets/${ticketId}/timer/start`);
      setTimer(data.timer);
      setElapsed(0);
      toast.success('Cronômetro iniciado');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao iniciar cronômetro');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (loading || !timer) return;
    setLoading(true);
    try {
      const { data } = await api.put(`/timers/${timer.id}/pause`);
      setTimer(data.timer);
      toast.success('Cronômetro pausado');
    } catch (error) {
      toast.error('Erro ao pausar cronômetro');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (loading || !timer) return;
    setLoading(true);
    try {
      const { data } = await api.put(`/timers/${timer.id}/resume`);
      setTimer(data.timer);
      toast.success('Cronômetro retomado');
    } catch (error) {
      toast.error('Erro ao retomar cronômetro');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (loading || !timer) return;
    
    const result = await Swal.fire({
      title: 'Parar Cronômetro?',
      text: 'O tempo será registrado no histórico do ticket.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, parar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    
    if (!result.isConfirmed) return;
    
    setLoading(true);
    try {
      const { data } = await api.put(`/timers/${timer.id}/stop`);
      toast.success(`Tempo registrado: ${data.totalHours}h`);
      setTimer(null);
      setElapsed(0);
      // Recarregar histórico
      await loadTimeEntries();
    } catch (error) {
      toast.error('Erro ao parar cronômetro');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualTime = async () => {
    setShowManualModal(true);
  };

  const handleManualTimeSubmit = async (e) => {
    e.preventDefault();
    
    if (!manualHours || parseFloat(manualHours) <= 0) {
      toast.error('Por favor, insira um tempo válido');
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/tickets/${ticketId}/time-entries/manual`, {
        hours: parseFloat(manualHours),
        description: manualDescription
      });
      toast.success(`${manualHours}h adicionado com sucesso`);
      setShowManualModal(false);
      setManualHours('');
      setManualDescription('');
      await loadTimeEntries();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar tempo');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelManualTime = () => {
    setShowManualModal(false);
    setManualHours('');
    setManualDescription('');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Header com Total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold">Tempo Trabalhado</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-bold text-primary-600">{formatDuration(totalTime)}</div>
        </div>
      </div>

      {/* Cronômetro Atual */}
      {timer && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <div className="text-3xl font-mono font-bold text-primary-600">
              {formatTime(elapsed)}
            </div>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
              timer.status === 'running' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              {timer.status === 'running' ? 'Em execução' : 'Pausado'}
            </span>
          </div>
        </div>
      )}

      {/* Alerta se não pode usar cronômetro */}
      {!canUseTimer && (
        <div className={`p-3 rounded-lg text-sm ${
          isTicketClosed 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300'
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-300'
        }`}>
          {isTicketClosed ? (
            <>ℹ️ <strong>Ticket concluído.</strong> Cronômetro não disponível.</>
          ) : (
            <>⚠️ <strong>Ticket não atribuído.</strong> Atribua antes de usar o cronômetro.</>
          )}
        </div>
      )}

      {/* Botões de Controle */}
      <div className="flex gap-2">
        {!timer ? (
          <>
            <button
              onClick={handleStart}
              disabled={loading || !canUseTimer}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              Iniciar
            </button>
            <button
              onClick={handleAddManualTime}
              disabled={loading || isTicketClosed}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              title="Adicionar tempo manualmente"
            >
              <Plus className="w-4 h-4" />
            </button>
          </>
        ) : timer.status === 'running' ? (
          <>
            <button
              onClick={handlePause}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Pausar
            </button>
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              Parar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleResume}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Retomar
            </button>
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              Parar
            </button>
          </>
        )}
      </div>

      {/* Histórico de Registros */}
      {timeEntries.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Histórico de Registros ({timeEntries.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {entry.user?.name || 'Usuário'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">
                      {format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary-600">
                    {formatDuration(entry.duration)}
                  </div>
                  {entry.billable === false && (
                    <span className="text-xs text-gray-500">Não faturável</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Adicionar Tempo Manual */}
      <Modal isOpen={showManualModal} onClose={handleCancelManualTime}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Adicionar Tempo Manual
              </h2>
              <button
                onClick={handleCancelManualTime}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleManualTimeSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tempo (horas) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                placeholder="Ex: 2.5"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">Use 0.5 para 30 minutos, 1 para 1 hora, etc.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Descreva o trabalho realizado..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelManualTime}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default TimeTracker;
