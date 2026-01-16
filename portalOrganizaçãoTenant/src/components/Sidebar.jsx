import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useMemo } from 'react'
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
  Key,
  FolderKanban,
  Kanban,
  GanttChart,
  ListTodo,
  FileBarChart,
} from 'lucide-react'
import { usePermissions } from '../hooks/usePermissions'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const { hasPermission, canAccess, isAdmin, filterByPermission } = usePermissions()
  
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
  const [projectsOpen, setProjectsOpen] = useState(
    location.pathname.startsWith('/projects')
  )

  // Menus principais (não agrupados) - com permissões
  const mainMenuItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard'), permission: 'dashboard.view' },
    { path: '/tickets', icon: Ticket, label: t('nav.tickets'), permission: 'tickets.view' },
  ]

  // Submenu: Projetos - com permissões
  const projectsSubmenu = [
    { path: '/projects', icon: ListTodo, label: 'Lista de Projetos', permission: 'projects.view' },
    { path: '/projects/reports', icon: FileBarChart, label: 'Relatórios', permission: 'projects.view' },
  ]

  // Submenu: Catálogo de Serviços - com permissões
  const catalogSubmenu = [
    { path: '/catalog', icon: Package, label: 'Itens/Serviços', permission: 'catalog.view' },
    { path: '/catalog/categories', icon: FolderOpen, label: 'Categorias', permission: 'catalog.view' },
    { path: '/catalog/approvals', icon: ThumbsUp, label: 'Aprovações', permission: 'catalog.approve' },
    { path: '/catalog/analytics', icon: TrendingUp, label: 'Analytics', permission: 'catalog.view' },
  ]

  // Submenu: Inventário - com permissões
  const inventorySubmenu = [
    { path: '/inventory', icon: LayoutDashboard, label: 'Dashboard', permission: 'inventory.view' },
    { path: '/inventory/organization', icon: Building2, label: 'Inventário Organização', permission: 'inventory.view' },
    { path: '/inventory/clients', icon: Users, label: 'Inventário Clientes', permission: 'inventory.view' },
    { path: '/inventory/assets', icon: HardDrive, label: 'Todos os Inventários', permission: 'inventory.view' },
    { path: '/inventory/licenses', icon: Key, label: 'Licenças', permission: 'licenses.view' },
  ]

  // Menu Clientes (individual)
  const clientsMenuItem = { path: '/clients', icon: Users, label: t('nav.clients'), permission: 'clients.view' }

  // Submenu: Estrutura Organizacional - com permissões
  const structureSubmenu = [
    { path: '/users', icon: UserCog, label: 'Utilizadores', permission: 'users.view' },
    { path: '/directions', icon: Building2, label: 'Direções', permission: 'directions.view' },
    { path: '/departments', icon: Building2, label: 'Departamentos', permission: 'departments.view' },
    { path: '/sections', icon: FolderTree, label: 'Secções', permission: 'sections.view' },
  ]

  // Submenu: Sistema (Configurações Técnicas Globais) - com permissões
  const systemSubmenu = [
    { path: '/system/slas', icon: Clock, label: 'SLAs', permission: 'slas.view' },
    { path: '/system/priorities', icon: AlertCircle, label: 'Prioridades', permission: 'priorities.view' },
    { path: '/system/types', icon: FileType, label: 'Tipos', permission: 'types.view' },
    { path: '/system/roles', icon: Shield, label: 'Permissões (RBAC)', permission: 'roles.view' },
  ]

  // Outros menus - com permissões
  const otherMenuItems = [
    { path: '/hours-bank', icon: Timer, label: 'Bolsa de Horas', permission: 'hours_bank.view' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios Avançados', permission: 'reports.view' },
    { path: '/knowledge', icon: BookOpen, label: 'Base de Conhecimento', permission: 'knowledge.view' },
    { path: '/tags', icon: TagsIcon, label: 'Tags', permission: 'tags.view' },
    { path: '/templates', icon: FileText, label: 'Templates', permission: 'templates.view' },
    { path: '/desktop-agent', icon: Monitor, label: 'Desktop Agent', permission: 'desktop_agent.view' },
  ]

  // Menu inferior (removido Configurações)
  const bottomMenuItems = []

  // Filtrar menus por permissão
  const filteredMainMenuItems = useMemo(() => filterByPermission(mainMenuItems), [filterByPermission])
  const filteredProjectsSubmenu = useMemo(() => filterByPermission(projectsSubmenu), [filterByPermission])
  const filteredCatalogSubmenu = useMemo(() => filterByPermission(catalogSubmenu), [filterByPermission])
  const filteredInventorySubmenu = useMemo(() => filterByPermission(inventorySubmenu), [filterByPermission])
  const filteredStructureSubmenu = useMemo(() => filterByPermission(structureSubmenu), [filterByPermission])
  const filteredSystemSubmenu = useMemo(() => filterByPermission(systemSubmenu), [filterByPermission])
  const filteredOtherMenuItems = useMemo(() => filterByPermission(otherMenuItems), [filterByPermission])
  const canViewClients = useMemo(() => hasPermission(clientsMenuItem.permission), [hasPermission])

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
        <nav className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-2" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          
          {/* 1. Dashboard e Tickets */}
          {filteredMainMenuItems.map((item) => (
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

          {/* 2. Projetos - Grupo Expansível */}
          {filteredProjectsSubmenu.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname.startsWith('/projects')
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FolderKanban className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Projetos</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${projectsOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {projectsOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {filteredProjectsSubmenu.map((item) => (
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
          )}

          {/* 3. Catálogo de Serviços - Grupo Expansível */}
          {filteredCatalogSubmenu.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isGroupActive(filteredCatalogSubmenu)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ShoppingCart className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Catálogo de Serviços</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${catalogOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {catalogOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {filteredCatalogSubmenu.map((item) => (
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
          )}

          {/* 4. Inventário - Grupo Expansível */}
          {filteredInventorySubmenu.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isGroupActive(filteredInventorySubmenu)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <HardDrive className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Inventário</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${inventoryOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {inventoryOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {filteredInventorySubmenu.map((item) => (
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
          )}

          {/* 5. Clientes */}
          {canViewClients && (
            <Link
              to={clientsMenuItem.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(clientsMenuItem.path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <clientsMenuItem.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{clientsMenuItem.label}</span>}
            </Link>
          )}

          {/* 6. Estrutura Organizacional - Grupo Expansível */}
          {filteredStructureSubmenu.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setStructureOpen(!structureOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isGroupActive(filteredStructureSubmenu)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Building2 className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Estrutura Organizacional</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${structureOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {structureOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {filteredStructureSubmenu.map((item) => (
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
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

          {/* Outros Menus */}
          {filteredOtherMenuItems.map((item) => (
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
          {filteredSystemSubmenu.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setSystemOpen(!systemOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isGroupActive(filteredSystemSubmenu)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Cog className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="font-medium flex-1 text-left">Sistema</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${systemOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {systemOpen && isOpen && (
              <div className="ml-8 space-y-1">
                {filteredSystemSubmenu.map((item) => (
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
          )}

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
