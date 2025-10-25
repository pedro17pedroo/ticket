import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Monitor, 
  Laptop, 
  Server, 
  Smartphone, 
  Printer,
  HardDrive,
  Key,
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const Inventory = () => {
  const [statistics, setStatistics] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadData();
  }, [page, filterType, filterStatus, searchTerm, selectedClient]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, assetsData] = await Promise.all([
        inventoryService.getStatistics(),
        inventoryService.getAssets({
          page,
          limit: 20,
          type: filterType || undefined,
          status: filterStatus || undefined,
          search: searchTerm || undefined,
          clientId: selectedClient || undefined
        })
      ]);

      setStatistics(statsData.statistics);
      setAssets(assetsData.assets);
      setPagination(assetsData.pagination);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
      toast.error('Erro ao carregar dados do inventário');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const iconClass = "w-5 h-5";
    switch(type) {
      case 'laptop': return <Laptop className={iconClass} />;
      case 'desktop': return <Monitor className={iconClass} />;
      case 'server': return <Server className={iconClass} />;
      case 'smartphone': return <Smartphone className={iconClass} />;
      case 'printer': return <Printer className={iconClass} />;
      default: return <HardDrive className={iconClass} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'retired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      maintenance: 'Manutenção',
      retired: 'Retirado',
      lost: 'Perdido',
      stolen: 'Roubado'
    };
    return labels[status] || status;
  };

  const downloadScript = (type) => {
    const scripts = {
      windows: '/scripts/inventory-scan-windows.ps1',
      linux: '/scripts/inventory-scan-unix.sh',
      mac: '/scripts/inventory-scan-unix.sh'
    };
    
    const link = document.createElement('a');
    link.href = scripts[type];
    link.download = type === 'windows' ? 'inventory-scan-windows.ps1' : 'inventory-scan-unix.sh';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Script de ${type} baixado!`);
  };

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventário de TI</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestão de equipamentos e licenças
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/inventory/licenses"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Key className="w-5 h-5" />
            Licenças
          </Link>
          <Link
            to="/inventory/new"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Asset
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Assets</p>
                <p className="text-3xl font-bold mt-2">{statistics.assets.total}</p>
                <p className="text-sm text-green-600 mt-1">
                  {statistics.assets.active} ativos
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Software Instalado</p>
                <p className="text-3xl font-bold mt-2">{statistics.software.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">programas</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Licenças</p>
                <p className="text-3xl font-bold mt-2">{statistics.licenses.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">gerenciadas</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expirando em Breve</p>
                <p className="text-3xl font-bold mt-2">{statistics.licenses.expiringSoon}</p>
                <p className="text-sm text-orange-600 mt-1">próximos 30 dias</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Scripts */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Download className="w-5 h-5" />
              Scripts de Coleta Automática
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Baixe os scripts para coletar inventário automaticamente das máquinas dos clientes
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadScript('windows')}
              className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors shadow-sm"
            >
              Windows
            </button>
            <button
              onClick={() => downloadScript('linux')}
              className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors shadow-sm"
            >
              Linux
            </button>
            <button
              onClick={() => downloadScript('mac')}
              className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors shadow-sm"
            >
              macOS
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, hostname, série..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            >
              <option value="">Todos</option>
              <option value="desktop">Desktop</option>
              <option value="laptop">Laptop</option>
              <option value="server">Servidor</option>
              <option value="tablet">Tablet</option>
              <option value="smartphone">Smartphone</option>
              <option value="printer">Impressora</option>
              <option value="network_device">Dispositivo de Rede</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            >
              <option value="">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="maintenance">Manutenção</option>
              <option value="retired">Retirado</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setFilterStatus('');
                setSelectedClient('');
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Assets List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Especificações
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Última Visto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum asset encontrado</p>
                  <p className="text-sm mt-2">Adicione o primeiro asset ou ajuste os filtros</p>
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        {getTypeIcon(asset.type)}
                      </div>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{asset.hostname}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {asset.manufacturer && <p className="font-medium">{asset.manufacturer}</p>}
                    <p className="text-gray-500 dark:text-gray-400">{asset.model}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {asset.client ? (
                      <Link
                        to={`/clients/${asset.client.id}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {asset.client.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      {asset.processor && (
                        <p className="text-gray-700 dark:text-gray-300">
                          {asset.processor.substring(0, 30)}...
                        </p>
                      )}
                      {asset.ram && (
                        <p className="text-gray-500 dark:text-gray-400">{asset.ram} RAM</p>
                      )}
                      {asset.os && (
                        <p className="text-gray-500 dark:text-gray-400">{asset.os}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                      {getStatusLabel(asset.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {asset.lastSeen
                      ? new Date(asset.lastSeen).toLocaleDateString('pt-PT')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/inventory/${asset.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium text-sm"
                    >
                      Ver Detalhes
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Página {pagination.page} de {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
