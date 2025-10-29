import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Building2,
  Monitor,
  User,
  Search,
  Shield,
  Laptop,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const ClientInventoryDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClientInventory();
  }, [clientId]);

  const loadClientInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getClientInventory(clientId);
      setClient(data.client);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
      toast.error('Erro ao carregar inventário do cliente');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Building2 className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Cliente não encontrado</p>
        <button
          onClick={() => navigate('/inventory/clients')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/inventory/clients')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Inventário de {client.company || client.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{client.email}</p>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header with gradient */}
        <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-600 relative">
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-xl">
              <Building2 className="w-12 h-12 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-6 px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Empresa</p>
              <p className="font-semibold text-lg">{client.company || client.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Utilizadores</p>
              <p className="font-semibold text-2xl">{users.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Equipamentos</p>
              <p className="font-semibold text-2xl">{users.reduce((sum, u) => sum + (u.assetsCount || 0), 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Software Instalado</p>
              <p className="font-semibold text-2xl">{client.inventoryStats?.softwareCount || 0}</p>
            </div>
          </div>

          {client.inventoryStats?.avgSecurityLevel && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nível Médio de Segurança</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-semibold mt-1 ${
                    client.inventoryStats.avgSecurityLevel === 'high'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : client.inventoryStats.avgSecurityLevel === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {client.inventoryStats.avgSecurityLevel === 'high' ? 'Alto' :
                     client.inventoryStats.avgSecurityLevel === 'medium' ? 'Médio' : 'Baixo'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar utilizadores por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Utilizadores e Equipamentos</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'utilizador encontrado' : 'utilizadores encontrados'}
          </p>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Nenhum utilizador encontrado' : 'Nenhum utilizador neste cliente'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Link
                key={user.id}
                to={`/inventory/clients/${clientId}/users/${user.id}`}
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
                        <span className="flex items-center gap-1">
                          <Monitor className="w-4 h-4" />
                          {user.assetsCount || 0} {user.assetsCount === 1 ? 'equipamento' : 'equipamentos'}
                        </span>
                        {user.softwareCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {user.softwareCount} apps
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Asset Icons */}
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
                          user.assetsSummary.securityLevel === 'high' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : user.assetsSummary.securityLevel === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
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

export default ClientInventoryDetail;
