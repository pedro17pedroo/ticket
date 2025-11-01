import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Monitor,
  Laptop,
  HardDrive,
  Shield,
  Package,
  Key,
  Cpu,
  MemoryStick,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const UserInventoryDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedSource, setSelectedSource] = useState('all'); // 'all', 'agent', 'web'

  useEffect(() => {
    loadUserInventory();
  }, [userId]);

  const loadUserInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getUserInventory(userId);
      setUser(data.user);
      setAssets(data.assets || []);
      
      // Select first asset by default
      if (data.assets && data.assets.length > 0) {
        setSelectedAsset(data.assets[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
      toast.error('Erro ao carregar inventário do utilizador');
    } finally {
      setLoading(false);
    }
  };

  const getSecurityColor = (level) => {
    switch (level) {
      case 'high':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getSecurityLabel = (level) => {
    switch (level) {
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      case 'critical': return 'Crítico';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Utilizador não encontrado</p>
        <button
          onClick={() => navigate(-1)}
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
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Inventário de {user.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Função</p>
              <p className="font-semibold capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Equipamentos</p>
              <p className="font-semibold">{assets.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Software Total</p>
              <p className="font-semibold">{assets.reduce((sum, a) => sum + (a.softwareCount || 0), 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                user.isOnline 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                {user.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Source Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Fonte de Inventário:</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSource('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSource === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos ({assets.length})
            </button>
            <button
              onClick={() => setSelectedSource('agent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSource === 'agent'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Agent Desktop ({assets.filter(a => a.collectionMethod === 'agent').length})
            </button>
            <button
              onClick={() => setSelectedSource('web')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSource === 'web'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Web ({assets.filter(a => a.collectionMethod === 'web').length})
            </button>
          </div>
        </div>
      </div>

      {assets.filter(a => selectedSource === 'all' || a.collectionMethod === selectedSource).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum equipamento registado para esta fonte</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assets List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold">Equipamentos ({assets.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {assets
                  .filter(a => selectedSource === 'all' || a.collectionMethod === selectedSource)
                  .map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedAsset?.id === asset.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        asset.type === 'desktop' ? 'bg-blue-100 dark:bg-blue-900' :
                        asset.type === 'laptop' ? 'bg-green-100 dark:bg-green-900' :
                        'bg-purple-100 dark:bg-purple-900'
                      }`}>
                        {asset.type === 'desktop' ? <Monitor className="w-5 h-5" /> :
                         asset.type === 'laptop' ? <Laptop className="w-5 h-5" /> :
                         <HardDrive className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{asset.name}</p>
                        <p className="text-xs text-gray-500 truncate">{asset.model || asset.manufacturer}</p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                          {asset.collectionMethod === 'agent' ? '🖥️ Agent Desktop' : '🌐 Web'}
                        </p>
                      </div>
                      {selectedAsset?.id === asset.id && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Asset Details */}
          {selectedAsset && (
            <div className="lg:col-span-2 space-y-6">
              {/* Hardware Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Informações de Hardware</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Processador</p>
                      <p className="font-medium">{selectedAsset.processor || '-'}</p>
                      <p className="text-xs text-gray-500">{selectedAsset.processorCores} cores</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MemoryStick className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Memória RAM</p>
                      <p className="font-medium">{selectedAsset.ram || selectedAsset.ramGB ? `${selectedAsset.ramGB} GB` : '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <HardDrive className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Armazenamento</p>
                      <p className="font-medium">{selectedAsset.storage || selectedAsset.storageGB ? `${selectedAsset.storageGB} GB` : '-'}</p>
                      <p className="text-xs text-gray-500">{selectedAsset.storageType || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Placa Gráfica</p>
                      <p className="font-medium text-sm">{selectedAsset.graphicsCard || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wifi className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rede</p>
                      <p className="font-medium text-sm">{selectedAsset.ipAddress || '-'}</p>
                      <p className="text-xs text-gray-500">{selectedAsset.macAddress || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sistema Operacional</p>
                      <p className="font-medium text-sm">{selectedAsset.os || '-'} {selectedAsset.osVersion || ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              {selectedAsset.rawData?.security && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Segurança
                  </h3>
                  
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-semibold ${
                      getSecurityColor(selectedAsset.rawData.security.securityLevel)
                    }`}>
                      Nível de Segurança: {getSecurityLabel(selectedAsset.rawData.security.securityLevel)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm">Antivírus</span>
                      {selectedAsset.hasAntivirus ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm">Firewall</span>
                      {selectedAsset.hasFirewall ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm">Criptografia</span>
                      {selectedAsset.isEncrypted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {selectedAsset.rawData.security.pendingUpdates !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm">Atualizações Pendentes</span>
                        <span className={`font-semibold ${
                          selectedAsset.rawData.security.pendingUpdates === 0 
                            ? 'text-green-500' 
                            : 'text-orange-500'
                        }`}>
                          {selectedAsset.rawData.security.pendingUpdates}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedAsset.antivirusName && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Antivírus: <span className="font-medium text-gray-900 dark:text-gray-100">{selectedAsset.antivirusName}</span></p>
                      {selectedAsset.antivirusVersion && (
                        <p className="text-xs text-gray-500 mt-1">Versão: {selectedAsset.antivirusVersion}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Software */}
              {selectedAsset.rawData?.software && selectedAsset.rawData.software.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Software Instalado ({selectedAsset.rawData.software.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {selectedAsset.rawData.software.map((sw, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <p className="font-medium text-sm">{sw.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <span>v{sw.version || 'N/A'}</span>
                          {sw.publisher && (
                            <>
                              <span>•</span>
                              <span>{sw.publisher}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Update */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Última atualização: {selectedAsset.lastInventoryScan ? new Date(selectedAsset.lastInventoryScan).toLocaleString('pt-PT') : '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserInventoryDetail;
