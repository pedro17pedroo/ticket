import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const SLAIndicator = ({ ticket, sla }) => {
  if (!sla || !ticket) return null;

  const now = new Date();
  const createdAt = new Date(ticket.createdAt);
  const firstResponseTime = ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : null;
  const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;

  // Calcular SLA de Resposta
  const responseMinutes = sla.responseTimeMinutes || 0;
  const responseElapsed = differenceInMinutes(firstResponseTime || now, createdAt);
  const responseProgress = Math.min((responseElapsed / responseMinutes) * 100, 100);
  const responseRemaining = responseMinutes - responseElapsed;
  const responseBreached = responseRemaining < 0;
  const responseCompleted = firstResponseTime !== null;

  // Calcular SLA de Resolução
  const resolutionMinutes = sla.resolutionTimeMinutes || 0;
  const resolutionElapsed = differenceInMinutes(resolvedTime || now, createdAt);
  const resolutionProgress = Math.min((resolutionElapsed / resolutionMinutes) * 100, 100);
  const resolutionRemaining = resolutionMinutes - resolutionElapsed;
  const resolutionBreached = resolutionRemaining < 0;
  const resolutionCompleted = resolvedTime !== null;

  const getProgressColor = (progress, breached, completed) => {
    if (completed) return 'bg-green-500';
    if (breached) return 'bg-red-500';
    if (progress >= 75) return 'bg-orange-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = (breached, completed) => {
    if (completed) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (breached) return <XCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-gray-600" />;
  };

  const formatRemainingTime = (minutes) => {
    if (minutes < 0) return `Atrasado ${Math.abs(minutes)}m`;
    if (minutes < 60) return `${minutes}m restantes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m restantes`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold">SLA - {sla.name}</h3>
      </div>

      <div className="space-y-4">
        {/* SLA de Resposta */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(responseBreached, responseCompleted)}
              <span className="text-sm font-medium">Primeira Resposta</span>
            </div>
            {!responseCompleted && (
              <span className={`text-xs ${responseBreached ? 'text-red-600' : 'text-gray-600'}`}>
                {formatRemainingTime(responseRemaining)}
              </span>
            )}
            {responseCompleted && (
              <span className="text-xs text-green-600">
                ✓ Respondido
              </span>
            )}
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(responseProgress, responseBreached, responseCompleted)}`}
              style={{ width: `${responseProgress}%` }}
            />
          </div>

          {responseCompleted && (
            <p className="text-xs text-gray-500 mt-1">
              Respondido {formatDistanceToNow(firstResponseTime, { locale: pt, addSuffix: true })}
            </p>
          )}
        </div>

        {/* SLA de Resolução */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(resolutionBreached, resolutionCompleted)}
              <span className="text-sm font-medium">Resolução</span>
            </div>
            {!resolutionCompleted && (
              <span className={`text-xs ${resolutionBreached ? 'text-red-600' : 'text-gray-600'}`}>
                {formatRemainingTime(resolutionRemaining)}
              </span>
            )}
            {resolutionCompleted && (
              <span className="text-xs text-green-600">
                ✓ Resolvido
              </span>
            )}
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(resolutionProgress, resolutionBreached, resolutionCompleted)}`}
              style={{ width: `${resolutionProgress}%` }}
            />
          </div>

          {resolutionCompleted && (
            <p className="text-xs text-gray-500 mt-1">
              Resolvido {formatDistanceToNow(resolvedTime, { locale: pt, addSuffix: true })}
            </p>
          )}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Atrasado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLAIndicator;
