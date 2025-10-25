import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TimeTracker = ({ ticketId }) => {
  const [timer, setTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  // Buscar timer ativo ao montar
  useEffect(() => {
    loadActiveTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ticketId]);

  // Atualizar tempo decorrido
  useEffect(() => {
    if (timer && timer.status === 'running') {
      intervalRef.current = setInterval(() => {
        const start = new Date(timer.startTime);
        const now = new Date();
        const totalElapsed = Math.floor((now - start) / 1000);
        const pausedTime = timer.totalPausedTime || 0;
        setElapsed(totalElapsed - pausedTime);
      }, 1000);
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
        setTimer(data.timer);
        // Calcular tempo inicial
        const start = new Date(data.timer.startTime);
        const now = new Date();
        const totalElapsed = Math.floor((now - start) / 1000);
        const pausedTime = data.timer.totalPausedTime || 0;
        setElapsed(totalElapsed - pausedTime);
      }
    } catch (error) {
      console.error('Erro ao carregar timer:', error);
    }
  };

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    try {
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
    if (!confirm('Deseja realmente parar o cronômetro?')) return;
    
    setLoading(true);
    try {
      const { data } = await api.put(`/timers/${timer.id}/stop`);
      toast.success(`Cronômetro parado: ${data.totalHours}h`);
      setTimer(null);
      setElapsed(0);
    } catch (error) {
      toast.error('Erro ao parar cronômetro');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold">Tempo Trabalhado</h3>
        </div>
        {timer && (
          <span className={`px-2 py-1 text-xs rounded-full ${
            timer.status === 'running' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
          }`}>
            {timer.status === 'running' ? 'Em execução' : 'Pausado'}
          </span>
        )}
      </div>

      <div className="text-center mb-4">
        <div className="text-4xl font-mono font-bold text-primary-600">
          {formatTime(elapsed)}
        </div>
      </div>

      <div className="flex gap-2">
        {!timer ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Iniciar
          </button>
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
    </div>
  );
};

export default TimeTracker;
