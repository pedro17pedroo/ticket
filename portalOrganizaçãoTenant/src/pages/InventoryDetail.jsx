import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Shield,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  Key,
  Plus,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const InventoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAsset();
  }, [id]);

  const loadAsset = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAssetById(id);
      setAsset(data.asset);
    } catch (error) {
      console.error('Erro ao carregar asset:', error);
      toast.error('Erro ao carregar detalhes do asset');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este asset?')) return;

    try {
      await inventoryService.deleteAsset(id);
      toast.success('Asset deletado com sucesso');
      navigate('/inventory');
    } catch (error) {
      console.error('Erro ao deletar asset:', error);
      toast.error('Erro ao deletar asset');
    }
  };

  const handleUnassignLicense = async (licenseId) => {
    if (!confirm('Deseja desatribuir esta licença?')) return;

    try {
      await inventoryService.unassignLicense(licenseId, id);
      toast.success('Licença desatribuída');
      loadAsset();
    } catch (error) {
      console.error('Erro ao desatribuir licença:', error);
      toast.error('Erro ao desatribuir licença');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Asset não encontrado</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'retired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {asset.manufacturer} {asset.model}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/inventory/${id}/edit`)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Deletar
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(asset.status)}`}>
          {asset.status}
        </span>
        {asset.assetTag && (
          <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
            {asset.assetTag}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'hardware', label: 'Hardware' },
            { id: 'software', label: 'Software' },
            { id: 'licenses', label: 'Licenças' },
            { id: 'location', label: 'Localização' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Informações Gerais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hostname</p>
                    <p className="font-medium mt-1">{asset.hostname || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Número de Série</p>
                    <p className="font-medium mt-1">{asset.serialNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sistema Operativo</p>
                    <p className="font-medium mt-1">{asset.os || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Versão</p>
                    <p className="font-medium mt-1">{asset.osVersion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Arquitetura</p>
                    <p className="font-medium mt-1">{asset.osArchitecture || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Última Visto</p>
                    <p className="font-medium mt-1">
                      {asset.lastSeen 
                        ? new Date(asset.lastSeen).toLocaleString('pt-PT')
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Rede
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Endereço IP</p>
                    <p className="font-medium mt-1">{asset.ipAddress || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Endereço MAC</p>
                    <p className="font-medium mt-1">{asset.macAddress || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Domínio</p>
                    <p className="font-medium mt-1">{asset.domain || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Segurança
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Antivírus</p>
                    <p className="font-medium mt-1">
                      {asset.hasAntivirus ? (
                        <span className="text-green-600">
                          {asset.antivirusName || 'Instalado'}
                        </span>
                      ) : (
                        <span className="text-red-600">Não instalado</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Firewall</p>
                    <p className="font-medium mt-1">
                      {asset.hasFirewall ? (
                        <span className="text-green-600">Ativo</span>
                      ) : (
                        <span className="text-red-600">Inativo</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Criptografia de Disco</p>
                    <p className="font-medium mt-1">
                      {asset.isEncrypted ? (
                        <span className="text-green-600">Ativo</span>
                      ) : (
                        <span className="text-gray-600">Não ativo</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Processador
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Modelo</p>
                    <p className="font-medium mt-1">{asset.processor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Núcleos</p>
                    <p className="font-medium mt-1">{asset.processorCores || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MemoryStick className="w-5 h-5" />
                  Memória
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">RAM Total</p>
                    <p className="font-medium mt-1">{asset.ram || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Capacidade (GB)</p>
                    <p className="font-medium mt-1">{asset.ramGB || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Armazenamento
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Capacidade</p>
                    <p className="font-medium mt-1">{asset.storage || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                    <p className="font-medium mt-1">{asset.storageType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Placa Gráfica</p>
                    <p className="font-medium mt-1">{asset.graphicsCard || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'software' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Software Instalado
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {asset.software?.length || 0} programas
                </span>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {asset.software && asset.software.length > 0 ? (
                  asset.software.map((sw) => (
                    <div key={sw.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{sw.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {sw.vendor} {sw.version && `• v${sw.version}`}
                          </p>
                          {sw.installDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Instalado em: {new Date(sw.installDate).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                        </div>
                        {sw.category && (
                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                            {sw.category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum software registrado</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Licenças Atribuídas
                </h3>
                <button className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Atribuir
                </button>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {asset.licenses && asset.licenses.length > 0 ? (
                  asset.licenses.map((license) => (
                    <div key={license.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{license.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {license.vendor} • {license.product}
                          </p>
                          {license.expiryDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Expira: {new Date(license.expiryDate).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnassignLicense(license.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                    <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma licença atribuída</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Localização Física
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Localização</p>
                    <p className="font-medium mt-1">{asset.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Edifício</p>
                    <p className="font-medium mt-1">{asset.building || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Piso</p>
                    <p className="font-medium mt-1">{asset.floor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sala</p>
                    <p className="font-medium mt-1">{asset.room || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Informação Financeira
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Preço de Compra</p>
                    <p className="font-medium mt-1">
                      {asset.purchasePrice ? `€${asset.purchasePrice}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor Atual</p>
                    <p className="font-medium mt-1">
                      {asset.currentValue ? `€${asset.currentValue}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fornecedor</p>
                    <p className="font-medium mt-1">{asset.supplier || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data de Compra</p>
                    <p className="font-medium mt-1">
                      {asset.purchaseDate 
                        ? new Date(asset.purchaseDate).toLocaleDateString('pt-PT')
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Garantia Expira</p>
                    <p className="font-medium mt-1">
                      {asset.warrantyExpiry 
                        ? new Date(asset.warrantyExpiry).toLocaleDateString('pt-PT')
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          {asset.client && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Cliente</h3>
              <Link
                to={`/clients/${asset.client.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
              >
                <p className="font-medium">{asset.client.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {asset.client.email}
                </p>
              </Link>
            </div>
          )}

          {/* User Info */}
          {asset.user && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Usuário Atribuído</h3>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="font-medium">{asset.user.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {asset.user.email}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {asset.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Notas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {asset.notes}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Histórico
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-600 mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Criado</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(asset.createdAt).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
              {asset.lastInventoryScan && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Último Scan</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(asset.lastInventoryScan).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetail;
