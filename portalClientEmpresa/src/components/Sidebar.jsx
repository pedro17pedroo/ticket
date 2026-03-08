import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  Home,
  Ticket,
  BookOpen,
  Users,
  Building2,
  FolderTree,
  Network,
  Clock,
  ShoppingCart,
  ShoppingBag,
  HardDrive,
  X,
  Monitor,
  Download,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen, isMobile, onClose }) => {
  const location = useLocation()
  const { user } = useAuthStore()
  const isClientAdmin = user?.role === 'client-admin'

  const menuItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/service-catalog', icon: ShoppingCart, label: 'Catálogo de Serviços' },
    { path: '/my-requests', icon: ShoppingBag, label: 'Minhas Solicitações' },
    { path: '/todos', icon: CheckSquare, label: 'Minhas Tarefas' },
    { path: '/knowledge', icon: BookOpen, label: 'Base de Conhecimento' },
    { path: '/my-assets', icon: HardDrive, label: 'Meus Equipamentos' },
    { path: '/hours-bank', icon: Clock, label: 'Bolsa de Horas' },
    { path: '/desktop-agent', icon: Monitor, label: 'Desktop Agent' },
    ...(isClientAdmin ? [
      { path: '/organization', icon: Building2, label: 'Organização' },
    ] : []),
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLinkClick = () => {
    if (isMobile) {
      onClose()
    }
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
          isOpen ? 'w-64' : isMobile ? '-translate-x-full w-64' : 'w-20'
        } ${isMobile && isOpen ? 'translate-x-0' : ''}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {isOpen && (
            <img 
              src="/TDESK.png" 
              alt="T-Desk" 
              className="h-8 sm:h-10 w-auto"
            />
          )}
          {!isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isOpen ? 'Recolher menu' : 'Expandir menu'}
            >
              {isOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll p-3 sm:p-4 space-y-1 sm:space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={!isOpen && !isMobile ? item.label : ''}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(isOpen || isMobile) && <span className="font-medium text-sm sm:text-base">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
