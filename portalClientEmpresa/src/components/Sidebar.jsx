import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  Home,
  Ticket,
  Plus,
  BookOpen,
  Users,
  Building2,
  FolderTree,
  Network,
  X,
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()
  const { user } = useAuthStore()
  const isClientUser = user?.role === 'cliente-org'

  const menuItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/tickets', icon: Ticket, label: 'Meus Tickets' },
    { path: '/tickets/new', icon: Plus, label: 'Novo Ticket' },
    { path: '/knowledge', icon: BookOpen, label: 'Base de Conhecimento' },
    ...(isClientUser ? [
      { path: '/users', icon: Users, label: 'Utilizadores' },
      { path: '/directions', icon: Building2, label: 'Direções' },
      { path: '/departments', icon: FolderTree, label: 'Departamentos' },
      { path: '/sections', icon: Network, label: 'Secções' },
    ] : []),
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          TatuTicket
        </h1>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
