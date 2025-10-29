import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Monitor, 
  Search,
  Users,
  TrendingUp,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const ClientsInventory = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({
    totalClients: 0,
    totalUsers: 0,
    totalAssets: 0
  });

  useEffect(() => {
    loadClients();
    loadStatistics();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getClientsWithInventory();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await inventoryService.getClientsInventoryStats();
      setStatistics(data.statistics || {
        totalClients: 0,
        totalUsers: 0,
        totalAssets: 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.company?.toLowerCase().includes(searchLower)
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
        <h1 className="text-2xl font-bold">Inventário de Clientes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestão de inventário das empresas clientes
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Clientes</p>
              <p className="text-3xl font-bold mt-2">{statistics.totalClients}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>

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
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome da empresa, email ou contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </p>
            </div>
          </div>
        ) : (
          filteredClients.map((client) => (
            <Link
              key={client.id}
              to={`/inventory/clients/${client.id}`}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="h-24 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-8">
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary-600 transition-colors truncate">
                  {client.company || client.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 truncate">
                  {client.email}
                </p>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Utilizadores
                    </span>
                    <span className="font-semibold">{client.usersCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Equipamentos
                    </span>
                    <span className="font-semibold">{client.assetsCount || 0}</span>
                  </div>

                  {client.inventoryStats && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Software Instalado
                        </span>
                        <span className="font-semibold">{client.inventoryStats.softwareCount || 0}</span>
                      </div>

                      {client.inventoryStats.avgSecurityLevel && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Nível de Segurança
                            </span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
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
                      )}
                    </>
                  )}
                </div>

                {/* Last sync */}
                {client.lastInventoryScan && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500">
                      Última atualização: {new Date(client.lastInventoryScan).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                )}

                {/* View button */}
                <div className="mt-4 flex items-center justify-end text-sm text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                  Ver inventário
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientsInventory;
