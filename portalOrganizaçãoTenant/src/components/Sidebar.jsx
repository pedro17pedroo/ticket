import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
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
  ChevronDown,
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Tags as TagsIcon,
  FileText,
  HardDrive,
  FolderOpen,
  ThumbsUp,
  TrendingUp,
  Package,
  Shield,
  Cog,
  Monitor,
  Download,
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation()
  const location = useLocation()
  
  // Estados para controlar menus expansíveis
  const [inventoryOpen, setInventoryOpen] = useState(location.pathname.startsWith('/inventory'))
  const [catalogOpen, setCatalogOpen] = useState(location.pathname.startsWith('/catalog'))
  const [structureOpen, setStructureOpen] = useState(
    location.pathname.startsWith('/users') ||
    location.pathname.startsWith('/directions') ||
    location.pathname.startsWith('/departments') ||
    location.pathname.startsWith('/sections')
  )
  const [systemOpen, setSystemOpen] = useState(
    location.pathname.startsWith('/system/')
  )

  // Menus principais (não agrupados)
  const mainMenuItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/clients', icon: Users, label: t('nav.clients') },
    { path: '/tickets', icon: Ticket, label: t('nav.tickets') },
  ]

  // Submenu: Estrutura Organizacional
  const structureSubmenu = [
    { path: '/users', icon: UserCog, label: 'Utilizadores' },
    { path: '/directions', icon: Building2, label: 'Direções' },
    { path: '/departments', icon: Building2, label: 'Departamentos' },
    { path: '/sections', icon: FolderTree, label: 'Secções' },
  ]

  // Submenu: Sistema (Configurações Técnicas Globais)
  const systemSubmenu = [
    { path: '/system/slas', icon: Clock, label: 'SLAs' },
    { path: '/system/priorities', icon: AlertCircle, label: 'Prioridades' },
    { path: '/system/types', icon: FileType, label: 'Tipos' },
    { path: '/system/roles', icon: Shield, label: 'Permissões (RBAC)' },
  ]

  // Submenu: Inventário
  const inventorySubmenu = [
    { path: '/inventory/organization', icon: Building2, label: 'Inventário Organização' },
    { path: '/inventory/clients', icon: Users, label: 'Inventário Clientes' },
    { path: '/inventory/assets', icon: HardDrive, label: 'Todos os Inventários' },
  ]

  // Submenu: Catálogo de Serviços
  const catalogSubmenu = [
    { path: '/catalog', icon: Package, label: 'Itens/Serviços' },
    { path: '/catalog/categories', icon: FolderOpen, label: 'Categorias' },
    { path: '/catalog/approvals', icon: ThumbsUp, label: 'Aprovações' },
    { path: '/catalog/analytics', icon: TrendingUp, label: 'Analytics' },
  ]

  // Outros menus
  const otherMenuItems = [
    { path: '/knowledge', icon: BookOpen, label: 'Base de Conhecimento' },
    { path: '/hours-bank', icon: Timer, label: 'Bolsa de Horas' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios Avançados' },
    { path: '/tags', icon: TagsIcon, label: 'Tags' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/desktop-agent', icon: Monitor, label: 'Desktop Agent' },
  ]

  // Menu inferior (removido Configurações)
  const bottomMenuItems = [
    // { path: '/settings', icon: SettingsIcon, label: t('nav.settings') },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isGroupActive = (paths) => {
    return paths.some(item => location.pathname.startsWith(item.path))
  }

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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

        {/* Menu - Com Scroll */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-2"
             style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          
          {/* Menus Principais */}
          {mainMenuItems.map((item) => (
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

          {/* Estrutura Organizacional - Grupo Expansível */}
          <div className="space-y-1">
            <button
              onClick={() => setStructureOpen(!structureOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isGroupActive(structureSubmenu)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Building2 className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Estrutura Organizacional</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      structureOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {structureOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {structureSubmenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>


          {/* Inventário - Grupo Expansível */}
          <div className="space-y-1">
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isGroupActive(inventorySubmenu)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <HardDrive className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Inventário</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      inventoryOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {inventoryOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {inventorySubmenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Catálogo de Serviços - Grupo Expansível */}
          <div className="space-y-1">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isGroupActive(catalogSubmenu)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ShoppingCart className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Catálogo de Serviços</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      catalogOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {catalogOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {catalogSubmenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

          {/* Outros Menus */}
          {otherMenuItems.map((item) => (
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

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

          {/* Sistema - Grupo Expansível (Configurações Técnicas) */}
          <div className="space-y-1">
            <button
              onClick={() => setSystemOpen(!systemOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isGroupActive(systemSubmenu)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Cog className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Sistema</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      systemOpen ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {systemOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {systemSubmenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Menu Inferior (Configurações) */}
          {bottomMenuItems.map((item) => (
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
