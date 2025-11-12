import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import api from '../services/api';

const TimeTrackerReadOnly = ({ ticketId }) => {
  const [timer, setTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [totalWorkedTime, setTotalWorkedTime] = useState(0);
  const intervalRef = useRef(null);

  // Buscar timer ativo e histórico ao montar
  useEffect(() => {
    loadTimers();
    const interval = setInterval(loadTimers, 30000); // Atualizar a cada 30 segundos
    
    return () => {
      clearInterval(interval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ticketId]);

  // Atualizar tempo decorrido do timer ativo
  useEffect(() => {
    if (timer && timer.status === 'running') {
      const calculateElapsed = () => {
        const start = new Date(timer.startTime);
        const now = new Date();
        const totalElapsed = Math.floor((now - start) / 1000);
        const pausedTime = timer.totalPausedTime || 0;
        return Math.max(0, totalElapsed - pausedTime);
      };
      
      // Atualizar imediatamente
      setElapsed(calculateElapsed());
      
      // Continuar atualizando a cada segundo
      intervalRef.current = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);
    } else if (timer && timer.status === 'paused') {
      // Quando pausado, mostrar tempo até a pausa
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      const start = new Date(timer.startTime);
      const pauseStart = timer.lastPauseStart ? new Date(timer.lastPauseStart) : new Date();
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

  const loadTimers = async () => {
    try {
      // Buscar timer ativo
      const { data: activeData } = await api.get(`/tickets/${ticketId}/timer/active`);
      if (activeData.timer) {
        setTimer(activeData.timer);
      } else {
        setTimer(null);
        setElapsed(0);
      }

      // Buscar todos os timers (para calcular total trabalhado)
      const { data: timersData } = await api.get(`/tickets/${ticketId}/timers`);
      setTotalWorkedTime(timersData.totalSeconds || 0);
    } catch (error) {
      console.error('Erro ao carregar timers:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatHours = (seconds) => {
    return (seconds / 3600).toFixed(2);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold">Tempo de Trabalho</h3>
      </div>

      {/* Timer Ativo */}
      {timer ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Em Andamento:</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              timer.status === 'running' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              {timer.status === 'running' ? 'Trabalhando' : 'Pausado'}
            </span>
          </div>
          <div className="text-3xl font-mono font-bold text-primary-600 text-center py-2">
            {formatTime(elapsed)}
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
            Sessão atual
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-center py-4">
            <span className="px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              ⏸️ Ainda não iniciado
            </span>
          </div>
        </div>
      )}

      {/* Tempo Total Trabalhado */}
      <div className={timer ? 'pt-4 border-t border-gray-200 dark:border-gray-700' : ''}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Total Trabalhado:</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {totalWorkedTime > 0 ? `${formatHours(totalWorkedTime)}h` : '0.00h'}
          </span>
        </div>
        {totalWorkedTime > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTime(totalWorkedTime)} dedicados ao ticket
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTrackerReadOnly;
