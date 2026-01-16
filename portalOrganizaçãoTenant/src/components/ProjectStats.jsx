import { 
  ListTodo, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Ticket,
  Calendar
} from 'lucide-react'
import PropTypes from 'prop-types'

/**
 * StatCard - Individual statistic card component
 */
const StatCard = ({ title, value, icon: Icon, color, onClick }) => {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    gray: 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
  }

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 ${onClick ? 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 transition-colors' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.gray}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  )
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(['blue', 'gray', 'yellow', 'orange', 'green', 'red', 'purple', 'primary']),
  onClick: PropTypes.func
}

/**
 * ProjectStats - Displays project statistics in a grid of cards
 * 
 * @param {Object} taskStats - Task statistics object
 * @param {number} taskStats.total - Total number of tasks
 * @param {number} taskStats.todo - Tasks with status 'todo'
 * @param {number} taskStats.inProgress - Tasks with status 'in_progress'
 * @param {number} taskStats.inReview - Tasks with status 'in_review'
 * @param {number} taskStats.done - Tasks with status 'done'
 * @param {number} taskStats.overdue - Overdue tasks count
 * @param {number} stakeholdersCount - Optional stakeholders count
 * @param {number} ticketsCount - Optional tickets count
 * @param {number} phasesCount - Optional phases count
 * @param {Function} onStatClick - Optional callback when a stat card is clicked
 */
const ProjectStats = ({ 
  taskStats, 
  stakeholdersCount,
  ticketsCount,
  phasesCount,
  onStatClick,
  layout = 'default'
}) => {
  // Default task stats grid
  const defaultStats = [
    {
      key: 'total',
      title: 'Total Tarefas',
      value: taskStats?.total || 0,
      icon: ListTodo,
      color: 'blue'
    },
    {
      key: 'todo',
      title: 'A Fazer',
      value: taskStats?.todo || 0,
      icon: Clock,
      color: 'gray'
    },
    {
      key: 'inProgress',
      title: 'Em Progresso',
      value: taskStats?.inProgress || 0,
      icon: TrendingUp,
      color: 'yellow'
    },
    {
      key: 'inReview',
      title: 'Em Revisão',
      value: taskStats?.inReview || 0,
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      key: 'done',
      title: 'Concluídas',
      value: taskStats?.done || 0,
      icon: CheckCircle,
      color: 'green'
    },
    {
      key: 'overdue',
      title: 'Atrasadas',
      value: taskStats?.overdue || 0,
      icon: AlertTriangle,
      color: 'red'
    }
  ]

  // Extended stats with stakeholders, tickets, phases
  const extendedStats = [
    ...defaultStats,
    ...(stakeholdersCount !== undefined ? [{
      key: 'stakeholders',
      title: 'Stakeholders',
      value: stakeholdersCount,
      icon: Users,
      color: 'purple'
    }] : []),
    ...(ticketsCount !== undefined ? [{
      key: 'tickets',
      title: 'Tickets',
      value: ticketsCount,
      icon: Ticket,
      color: 'primary'
    }] : []),
    ...(phasesCount !== undefined ? [{
      key: 'phases',
      title: 'Fases',
      value: phasesCount,
      icon: Calendar,
      color: 'blue'
    }] : [])
  ]

  const stats = layout === 'extended' ? extendedStats : defaultStats

  // Determine grid columns based on number of stats
  const getGridClass = () => {
    const count = stats.length
    if (count <= 4) return 'grid-cols-2 md:grid-cols-4'
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
    return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8'
  }

  return (
    <div className={`grid ${getGridClass()} gap-4`}>
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          onClick={onStatClick ? () => onStatClick(stat.key) : undefined}
        />
      ))}
    </div>
  )
}

ProjectStats.propTypes = {
  taskStats: PropTypes.shape({
    total: PropTypes.number,
    todo: PropTypes.number,
    inProgress: PropTypes.number,
    inReview: PropTypes.number,
    done: PropTypes.number,
    overdue: PropTypes.number
  }),
  stakeholdersCount: PropTypes.number,
  ticketsCount: PropTypes.number,
  phasesCount: PropTypes.number,
  onStatClick: PropTypes.func,
  layout: PropTypes.oneOf(['default', 'extended'])
}

// Export both components for flexibility
export { StatCard, ProjectStats }
export default ProjectStats
