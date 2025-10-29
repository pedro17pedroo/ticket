import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Monitor, 
  Search,
  User,
  Laptop,
  HardDrive,
  Shield,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const OrganizationInventory = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalAssets: 0,
    onlineUsers: 0
  });

  useEffect(() => {
    loadOrganizationUsers();
    loadStatistics();
  }, []);

  const loadOrganizationUsers = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getOrganizationUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error);
      toast.error('Erro ao carregar utilizadores da organização');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await inventoryService.getOrganizationInventoryStats();
      setStatistics(data.statistics || {
        totalUsers: 0,
        totalAssets: 0,
        onlineUsers: 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Inventário da Organização</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestão de inventário dos utilizadores da organização
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Utilizadores</p>
              <p className="text-3xl font-bold mt-2">{statistics.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Equipamentos</p>
              <p className="text-3xl font-bold mt-2">{statistics.totalAssets}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Monitor className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Utilizadores Online</p>
              <p className="text-3xl font-bold mt-2">{statistics.onlineUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou função..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Utilizadores da Organização</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'utilizador encontrado' : 'utilizadores encontrados'}
          </p>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Nenhum utilizador encontrado' : 'Nenhum utilizador na organização'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Link
                key={user.id}
                to={`/inventory/organization/${user.id}`}
                className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{user.name}</h3>
                        {user.isOnline && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Online
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="capitalize">{user.role}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Laptop className="w-4 h-4" />
                          {user.assetsCount || 0} {user.assetsCount === 1 ? 'equipamento' : 'equipamentos'}
                        </span>
                      </div>
                    </div>

                    {/* Asset Summary Icons */}
                    <div className="hidden md:flex items-center gap-4">
                      {user.assetsSummary?.hasDesktop && (
                        <div className="text-center">
                          <Monitor className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">{user.assetsSummary.desktopCount}</p>
                        </div>
                      )}
                      {user.assetsSummary?.hasLaptop && (
                        <div className="text-center">
                          <Laptop className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">{user.assetsSummary.laptopCount}</p>
                        </div>
                      )}
                      {user.assetsSummary?.securityLevel && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                          user.assetsSummary.securityLevel === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          user.assetsSummary.securityLevel === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          <Shield className="w-4 h-4" />
                          <span className="text-xs font-medium capitalize">{user.assetsSummary.securityLevel}</span>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationInventory;
