import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const TimeTracker = ({ ticketId, ticket }) => {
  const [timer, setTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  // Verificar se ticket está atribuído e não está concluído
  const isTicketAssigned = ticket?.assigneeId !== null && ticket?.assigneeId !== undefined;
  const isTicketClosed = ['fechado', 'resolvido'].includes(ticket?.status);
  const canUseTimer = isTicketAssigned && !isTicketClosed;

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
      // Calcular tempo inicial quando começa a rodar
      const calculateElapsed = () => {
        const start = new Date(timer.startTime);
        const now = new Date();
        const totalElapsed = Math.floor((now - start) / 1000);
        const pausedTime = timer.totalPausedTime || 0;
        const elapsed = Math.max(0, totalElapsed - pausedTime);
        
        // Debug log
        if (elapsed === 0 && totalElapsed > 0) {
          console.log('⚠️ Cronômetro em 0:', {
            startTime: timer.startTime,
            totalElapsed,
            pausedTime,
            difference: totalElapsed - pausedTime,
            timer
          });
        }
        
        return elapsed; // Garantir que não seja negativo
      };
      
      // Atualizar imediatamente
      setElapsed(calculateElapsed());
      
      // Continuar atualizando a cada segundo
      intervalRef.current = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);
    } else if (timer && timer.status === 'paused') {
      // Quando pausado, manter o tempo atual mas parar de contar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Calcular elapsed até o momento da pausa
      const start = new Date(timer.startTime);
      const pauseStart = timer.lastPauseStart ? new Date(timer.lastPauseStart) : new Date();
      const elapsedUntilPause = Math.floor((pauseStart - start) / 1000);
      const pausedTime = timer.totalPausedTime || 0;
      const frozenElapsed = Math.max(0, elapsedUntilPause - pausedTime);
      
      console.log('⏸️ Timer pausado - congelando em:', {
        startTime: timer.startTime,
        pauseStart: timer.lastPauseStart,
        elapsedUntilPause,
        pausedTime,
        frozenElapsed,
        timer
      });
      
      setElapsed(frozenElapsed);
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
        console.log('📥 Timer carregado:', data.timer);
        
        // Calcular elapsed inicial
        const now = new Date();
        const start = new Date(data.timer.startTime);
        const totalElapsed = Math.floor((now - start) / 1000);
        const pausedTime = data.timer.totalPausedTime || 0;
        
        // ✅ VALIDAÇÃO AGRESSIVA: Detectar timer corrompido
        if (pausedTime > totalElapsed * 0.5) {
          console.error('🔴 TIMER CORROMPIDO DETECTADO!', {
            totalElapsed,
            pausedTime,
            ratio: (pausedTime / totalElapsed * 100).toFixed(0) + '%'
          });
          
          toast.error('Timer corrompido detectado! Parando automaticamente...');
          
          // Parar timer corrompido automaticamente
          try {
            await api.put(`/timers/${data.timer.id}/stop`);
            setTimer(null);
            setElapsed(0);
            toast.success('Timer corrompido removido. Clique em Iniciar para começar novo timer.');
            return;
          } catch (stopError) {
            console.error('Erro ao parar timer corrompido:', stopError);
          }
        }
        
        const elapsed = Math.max(0, totalElapsed - pausedTime);
        
        console.log('⏱️ Tempo inicial calculado:', {
          totalElapsed,
          pausedTime,
          elapsed
        });
        
        setTimer(data.timer);
        setElapsed(elapsed);
      }
    } catch (error) {
      console.error('Erro ao carregar timer:', error);
    }
  };

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Se houver timer ativo, parar primeiro
      if (timer && timer.isActive) {
        console.log('⚠️ Timer ativo detectado ao iniciar. Parando automaticamente...', timer);
        await api.put(`/timers/${timer.id}/stop`);
      }
      
      // Iniciar novo timer
      const { data } = await api.post(`/tickets/${ticketId}/timer/start`);
      setTimer(data.timer);
      setElapsed(0);
      toast.success('Cronômetro iniciado');
    } catch (error) {
      // Se erro for "já existe timer ativo", tentar parar e iniciar novamente
      if (error.response?.status === 400 && error.response?.data?.timer) {
        console.log('⚠️ Timer ativo no banco. Parando e reiniciando...', error.response.data.timer);
        try {
          await api.put(`/timers/${error.response.data.timer.id}/stop`);
          const { data } = await api.post(`/tickets/${ticketId}/timer/start`);
          setTimer(data.timer);
          setElapsed(0);
          toast.success('Cronômetro reiniciado');
        } catch (retryError) {
          toast.error('Erro ao reiniciar cronômetro');
        }
      } else {
        toast.error(error.response?.data?.error || 'Erro ao iniciar cronômetro');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (loading || !timer) return;
    setLoading(true);
    try {
      console.log('⏸️ Pausando timer. Estado atual:', { elapsed, timer });
      const { data } = await api.put(`/timers/${timer.id}/pause`);
      console.log('⏸️ Timer pausado do backend:', data.timer);
      setTimer(data.timer);
      toast.success('Cronômetro pausado');
    } catch (error) {
      console.error('Erro ao pausar:', error);
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
      console.log('✅ Timer retomado do backend:', data.timer);
      setTimer(data.timer);
      toast.success('Cronômetro retomado');
    } catch (error) {
      console.error('Erro ao retomar:', error);
      toast.error('Erro ao retomar cronômetro');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (loading || !timer) return;
    
    const result = await Swal.fire({
      title: 'Parar Cronômetro?',
      text: 'Deseja realmente parar o cronômetro?',
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

      {/* Alerta se não pode usar cronômetro */}
      {!canUseTimer && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
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

      <div className="flex gap-2">
        {!timer ? (
          <button
            onClick={handleStart}
            disabled={loading || !canUseTimer}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            title={!canUseTimer ? (isTicketClosed ? 'Ticket concluído' : 'Ticket não atribuído') : ''}
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
