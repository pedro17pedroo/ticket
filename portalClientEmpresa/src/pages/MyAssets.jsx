import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Monitor, 
  Laptop, 
  Server, 
  Smartphone,
  HardDrive,
  Package,
  Key,
  Download,
  AlertCircle,
  CheckCircle,
  Search,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const MyAssets = () => {
  const [statistics, setStatistics] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, assetsData] = await Promise.all([
        inventoryService.getMyStatistics(),
        inventoryService.getMyAssets({
          type: filterType || undefined
        })
      ]);

      setStatistics(statsData.statistics);
      setAssets(assetsData.assets || []);
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
      default: return <HardDrive className={iconClass} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      maintenance: 'Em Manutenção'
    };
    return labels[status] || status;
  };

  const filteredAssets = assets.filter(asset => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        asset.name?.toLowerCase().includes(search) ||
        asset.hostname?.toLowerCase().includes(search) ||
        asset.model?.toLowerCase().includes(search)
      );
    }
    return true;
  });

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
      <div>
        <h1 className="text-2xl font-bold">Meus Equipamentos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visualize todos os seus equipamentos de TI
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Equipamentos</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">atribuídas</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box - Como Atualizar */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Como Atualizar o Inventário
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Para manter as informações dos seus equipamentos atualizadas, baixe e execute 
              o script de coleta automática no seu computador. O script é seguro e coleta apenas 
              informações técnicas do hardware e software.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => downloadScript('windows')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Windows
              </button>
              <button
                onClick={() => downloadScript('linux')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Linux
              </button>
              <button
                onClick={() => downloadScript('mac')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                macOS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, hostname, modelo..."
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
            </select>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum equipamento encontrado</p>
            <p className="text-sm mt-2">
              Execute o script de coleta para adicionar seus equipamentos
            </p>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <Link
              key={asset.id}
              to={`/my-assets/${asset.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  {getTypeIcon(asset.type)}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                  {getStatusLabel(asset.status)}
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-2">{asset.name}</h3>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {asset.manufacturer && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Fabricante:</span>
                    {asset.manufacturer}
                  </p>
                )}
                {asset.model && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Modelo:</span>
                    {asset.model}
                  </p>
                )}
                {asset.os && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">SO:</span>
                    {asset.os}
                  </p>
                )}
                {asset.ram && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">RAM:</span>
                    {asset.ram}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-1">
                  {asset.hasAntivirus ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>Protegido</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      <span>Sem antivírus</span>
                    </>
                  )}
                </div>
                {asset.lastSeen && (
                  <span>
                    Visto: {new Date(asset.lastSeen).toLocaleDateString('pt-PT')}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default MyAssets;
