import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Edit,
  LayoutGrid,
  GanttChart,
  Calendar,
  Users,
  Ticket,
  Clock,
  ListTodo,
  User,
  ChevronRight,
  Plus,
  Layers,
  Link as LinkIcon
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import PermissionGate from '../components/PermissionGate'
import PhaseCard from '../components/PhaseCard'
import PhaseManager from '../components/PhaseManager'
import StakeholderManager from '../components/StakeholderManager'
import TicketAssociation from '../components/TicketAssociation'
import ProjectStats from '../components/ProjectStats'
import { 
  getProjectDashboard,
  PROJECT_STATUSES,
  PROJECT_METHODOLOGIES,
  PHASE_STATUSES,
  TASK_STATUSES
} from '../services/projectService'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // overview, phases, stakeholders, tickets

  useEffect(() => {
    loadDashboard()
  }, [id])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const response = await getProjectDashboard(id)
      setDashboard(response.dashboard)
    } catch (error) {
      console.error('Erro ao carregar dashboard do projeto:', error)
      toast.error('Erro ao carregar dados do projeto')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  // Get status badge styling
  const getStatusBadge = (status, type = 'project') => {
    const statusList = type === 'project' ? PROJECT_STATUSES : 
                       type === 'phase' ? PHASE_STATUSES : TASK_STATUSES
    const statusConfig = statusList.find(s => s.value === status)
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[statusConfig?.color] || colorMap.gray}`}>
        {statusConfig?.label || status}
      </span>
    )
  }

  // Get methodology badge
  const getMethodologyBadge = (methodology) => {
    const methodConfig = PROJECT_METHODOLOGIES.find(m => m.value === methodology)
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
        {methodConfig?.label || methodology}
      </span>
    )
  }

  // Get progress bar color
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutGrid },
    { id: 'phases', label: 'Fases & Tarefas', icon: Layers },
    { id: 'stakeholders', label: 'Stakeholders', icon: Users },
    { id: 'tickets', label: 'Tickets', icon: LinkIcon },
  ]

  // Reload dashboard when switching to overview tab
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'overview') {
      loadDashboard()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Projeto não encontrado</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Voltar para projetos
        </button>
      </div>
    )
  }

  const { project, phases, taskStats, stakeholders, ticketsCount, upcomingDeadlines, recentActivity } = dashboard

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                {project.code}
              </span>
              {getStatusBadge(project.status)}
              {getMethodologyBadge(project.methodology)}
            </div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.startDate && project.endDate && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: pt })} - {format(new Date(project.endDate), 'dd/MM/yyyy', { locale: pt })}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <PermissionGate permission="projects.update">
            <button
              onClick={() => navigate(`/projects/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          </PermissionGate>
          <button
            onClick={() => navigate(`/projects/${id}/kanban`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => navigate(`/projects/${id}/gantt`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <GanttChart className="w-4 h-4" />
            Gantt
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso Geral</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
            style={{ width: `${Math.min(project.progress || 0, 100)}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'phases' && phases.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {phases.length}
                  </span>
                )}
                {tab.id === 'stakeholders' && stakeholders.total > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {stakeholders.total}
                  </span>
                )}
                {tab.id === 'tickets' && ticketsCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {ticketsCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          project={project}
          phases={phases}
          taskStats={taskStats}
          stakeholders={stakeholders}
          ticketsCount={ticketsCount}
          upcomingDeadlines={upcomingDeadlines}
          recentActivity={recentActivity}
          getStatusBadge={getStatusBadge}
          getProgressColor={getProgressColor}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'phases' && (
        <PhaseManager 
          projectId={id} 
          onUpdate={loadDashboard}
        />
      )}

      {activeTab === 'stakeholders' && (
        <StakeholderManager 
          projectId={id}
          onUpdate={loadDashboard}
        />
      )}

      {activeTab === 'tickets' && (
        <TicketAssociation 
          projectId={id}
          onUpdate={loadDashboard}
        />
      )}
    </div>
  )
}

// Overview Tab Component
const OverviewTab = ({ 
  project, phases, taskStats, stakeholders, ticketsCount, 
  upcomingDeadlines, recentActivity, getStatusBadge, getProgressColor, setActiveTab 
}) => {
  return (
    <>
      {/* Stats Cards */}
      <ProjectStats taskStats={taskStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Phases */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phases */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Fases do Projeto</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {phases.length} {phases.length === 1 ? 'fase' : 'fases'}
                </span>
                <button
                  onClick={() => setActiveTab('phases')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Gerir
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {phases.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma fase criada</p>
                  <button
                    onClick={() => setActiveTab('phases')}
                    className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Criar primeira fase
                  </button>
                </div>
              ) : (
                phases.slice(0, 3).map((phase) => (
                  <PhaseCard key={phase.id} phase={phase} getStatusBadge={getStatusBadge} getProgressColor={getProgressColor} />
                ))
              )}
              {phases.length > 3 && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setActiveTab('phases')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Ver todas as {phases.length} fases
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Próximos Prazos</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {upcomingDeadlines.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Sem prazos próximos</p>
                </div>
              ) : (
                upcomingDeadlines.map((task) => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'critical' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(task.dueDate), 'dd/MM', { locale: pt })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Activity, Stakeholders, Tickets */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Atividade Recente</h2>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Sem atividade recente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {activity.assignee?.avatar ? (
                          <img 
                            src={activity.assignee.avatar} 
                            alt={activity.assignee.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(activity.status, 'task')}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true, locale: pt })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stakeholders Summary */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            onClick={() => setActiveTab('stakeholders')}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Stakeholders</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {stakeholders.total} {stakeholders.total === 1 ? 'pessoa' : 'pessoas'}
              </span>
            </div>
            <div className="p-4">
              {stakeholders.total === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Sem stakeholders</p>
                  <p className="text-sm mt-1">Clique para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stakeholders.byRole.sponsor > 0 && (
                    <StakeholderRoleRow role="Patrocinadores" count={stakeholders.byRole.sponsor} />
                  )}
                  {stakeholders.byRole.manager > 0 && (
                    <StakeholderRoleRow role="Gestores" count={stakeholders.byRole.manager} />
                  )}
                  {stakeholders.byRole.teamMember > 0 && (
                    <StakeholderRoleRow role="Membros da Equipa" count={stakeholders.byRole.teamMember} />
                  )}
                  {stakeholders.byRole.observer > 0 && (
                    <StakeholderRoleRow role="Observadores" count={stakeholders.byRole.observer} />
                  )}
                  {stakeholders.byRole.client > 0 && (
                    <StakeholderRoleRow role="Clientes" count={stakeholders.byRole.client} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Linked Tickets */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            onClick={() => setActiveTab('tickets')}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tickets Associados</h2>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                {ticketsCount}
              </span>
            </div>
            <div className="p-4">
              {ticketsCount === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Sem tickets associados</p>
                  <p className="text-sm mt-1">Clique para associar</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <Ticket className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium">{ticketsCount} {ticketsCount === 1 ? 'ticket' : 'tickets'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">associados a este projeto</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Stakeholder Role Row Component
const StakeholderRoleRow = ({ role, count }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{role}</span>
      <span className="text-sm font-medium">{count}</span>
    </div>
  )
}

export default ProjectDetail
