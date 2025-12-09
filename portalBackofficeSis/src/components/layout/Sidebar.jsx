import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  Activity,
  FileText,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Globe,
  Mail,
  Lock,
  Plug,
  Receipt,
  Clock,
  Download,
  Monitor
} from 'lucide-react';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/settings'));

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Organizações', href: '/organizations', icon: Building2 },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Planos', href: '/plans', icon: CreditCard },
    { name: 'Subscrições', href: '/subscriptions', icon: Receipt },
    { name: 'Aprovações', href: '/subscriptions/pending', icon: Clock },
    { name: 'Monitoramento', href: '/monitoring', icon: Activity },
    { name: 'Relatórios', href: '/reports', icon: FileText },
    { name: 'Auditoria', href: '/audit', icon: Shield },
    { name: 'Desktop Agent', href: '/downloads/desktop-agent', icon: Monitor },
  ];

  const settingsSubmenu = [
    { name: 'Geral', href: '/settings', icon: Settings },
    { name: 'Landing Page', href: '/settings/landing-page', icon: Globe },
    { name: 'Email', href: '/settings/email', icon: Mail },
    { name: 'Segurança', href: '/settings/security', icon: Lock },
    { name: 'Integrações', href: '/settings/integrations', icon: Plug },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          TatuTicket
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}

        {/* Settings with submenu */}
        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={clsx(
              'flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              location.pathname.startsWith('/settings')
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-3" />
              Configurações
            </div>
            <ChevronDown className={clsx('w-4 h-4 transition-transform', settingsOpen && 'rotate-180')} />
          </button>
          
          {settingsOpen && (
            <div className="mt-1 ml-4 space-y-1">
              {settingsSubmenu.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/settings'}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-gray-800 text-indigo-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.role || 'Admin'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
