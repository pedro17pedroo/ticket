import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Ticket,
  Users,
  UserCog,
  Building2,
  FolderTree,
  Tag,
  BookOpen,
  Clock,
  AlertCircle,
  FileType,
  Timer,
  Settings as SettingsIcon,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Tags as TagsIcon,
  FileText,
  HardDrive,
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation()
  const location = useLocation()

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/tickets', icon: Ticket, label: t('nav.tickets') },
    { path: '/clients', icon: Users, label: t('nav.clients') },
    { path: '/users', icon: UserCog, label: 'Utilizadores' },
    { path: '/directions', icon: Building2, label: 'Direções' },
    { path: '/departments', icon: Building2, label: t('nav.departments') },
    { path: '/sections', icon: FolderTree, label: 'Secções' },
    { path: '/categories', icon: Tag, label: 'Categorias' },
    { path: '/knowledge', icon: BookOpen, label: 'Base de Conhecimento' },
    { path: '/slas', icon: Clock, label: 'SLAs' },
    { path: '/priorities', icon: AlertCircle, label: 'Prioridades' },
    { path: '/types', icon: FileType, label: 'Tipos' },
    { path: '/hours-bank', icon: Timer, label: 'Bolsa de Horas' },
    { path: '/catalog', icon: ShoppingCart, label: 'Catálogo de Serviços' },
    { path: '/inventory', icon: HardDrive, label: 'Inventário' },
    { path: '/tags', icon: TagsIcon, label: 'Tags' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/settings', icon: SettingsIcon, label: t('nav.settings') },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {isOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              TatuTicket
            </h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
