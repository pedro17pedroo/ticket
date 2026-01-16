import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import PropTypes from 'prop-types'

/**
 * PhaseCard - Displays a project phase with progress bar and details
 * 
 * @param {Object} phase - Phase data object
 * @param {string} phase.id - Phase unique identifier
 * @param {string} phase.name - Phase name
 * @param {string} phase.status - Phase status (pending, in_progress, completed)
 * @param {number} phase.progress - Phase progress percentage (0-100)
 * @param {number} phase.orderIndex - Phase order index
 * @param {string} phase.startDate - Phase start date
 * @param {string} phase.endDate - Phase end date
 * @param {number} phase.taskCount - Number of tasks in the phase
 * @param {Function} getStatusBadge - Function to render status badge
 * @param {Function} getProgressColor - Function to get progress bar color class
 * @param {Function} onClick - Optional click handler
 */
const PhaseCard = ({ 
  phase, 
  getStatusBadge, 
  getProgressColor, 
  onClick,
  showTaskCount = false 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(phase)
    }
  }

  return (
    <div 
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            #{phase.orderIndex + 1}
          </span>
          <h3 className="font-medium">{phase.name}</h3>
          {getStatusBadge && getStatusBadge(phase.status, 'phase')}
        </div>
        <div className="flex items-center gap-3">
          {showTaskCount && phase.taskCount !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {phase.taskCount} {phase.taskCount === 1 ? 'tarefa' : 'tarefas'}
            </span>
          )}
          <span className="text-sm font-medium">{phase.progress || 0}%</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor ? getProgressColor(phase.progress) : 'bg-primary-500'}`}
          style={{ width: `${Math.min(phase.progress || 0, 100)}%` }}
        />
      </div>
      
      {/* Date Range */}
      {(phase.startDate || phase.endDate) && (
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="w-3 h-3" />
          {phase.startDate && format(new Date(phase.startDate), 'dd/MM', { locale: pt })}
          {phase.startDate && phase.endDate && ' - '}
          {phase.endDate && format(new Date(phase.endDate), 'dd/MM', { locale: pt })}
        </div>
      )}
      
      {/* Description (optional) */}
      {phase.description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {phase.description}
        </p>
      )}
    </div>
  )
}

PhaseCard.propTypes = {
  phase: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    status: PropTypes.string,
    progress: PropTypes.number,
    orderIndex: PropTypes.number,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    taskCount: PropTypes.number,
    description: PropTypes.string
  }).isRequired,
  getStatusBadge: PropTypes.func,
  getProgressColor: PropTypes.func,
  onClick: PropTypes.func,
  showTaskCount: PropTypes.bool
}

export default PhaseCard
