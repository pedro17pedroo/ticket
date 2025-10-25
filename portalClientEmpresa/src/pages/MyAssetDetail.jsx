import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Shield,
  Package,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const MyAssetDetail = () => {
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
      console.error('Erro ao carregar equipamento:', error);
      toast.error('Erro ao carregar detalhes do equipamento');
    } finally {
      setLoading(false);
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
        <p className="text-gray-500 dark:text-gray-400">Equipamento não encontrado</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/my-assets')}
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
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(asset.status)}`}>
          {asset.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'hardware', label: 'Hardware' },
            { id: 'software', label: 'Software' },
            { id: 'security', label: 'Segurança' }
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
                  Informações do Sistema
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Última Atualização</p>
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
                  Informações de Rede
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Endereço IP</p>
                    <p className="font-medium mt-1 font-mono text-sm">{asset.ipAddress || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Endereço MAC</p>
                    <p className="font-medium mt-1 font-mono text-sm">{asset.macAddress || '-'}</p>
                  </div>
                  {asset.domain && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Domínio</p>
                      <p className="font-medium mt-1">{asset.domain}</p>
                    </div>
                  )}
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
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Modelo</p>
                    <p className="font-medium mt-1">{asset.processor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Núcleos</p>
                    <p className="font-medium mt-1">{asset.processorCores || '-'} núcleos</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MemoryStick className="w-5 h-5" />
                  Memória RAM
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Capacidade</p>
                    <p className="font-medium mt-1 text-2xl">{asset.ram || '-'}</p>
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
                    <p className="font-medium mt-1 text-2xl">{asset.storage || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                    <p className="font-medium mt-1">{asset.storageType || '-'}</p>
                  </div>
                </div>
              </div>

              {asset.graphicsCard && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Placa Gráfica</h3>
                  <p className="font-medium">{asset.graphicsCard}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'software' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Software Instalado
                  <span className="ml-auto text-sm font-normal text-gray-600 dark:text-gray-400">
                    {asset.software?.length || 0} programas
                  </span>
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {asset.software && asset.software.length > 0 ? (
                  asset.software.map((sw) => (
                    <div key={sw.id} className="p-4">
                      <p className="font-medium">{sw.name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {sw.vendor && <span>{sw.vendor}</span>}
                        {sw.version && <span>• v{sw.version}</span>}
                        {sw.category && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
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
                    <p className="text-sm mt-2">Execute o script de coleta para atualizar</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Status de Segurança
                </h3>
                
                <div className="space-y-4">
                  {/* Antivirus */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {asset.hasAntivirus ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">Antivírus</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {asset.hasAntivirus 
                            ? asset.antivirusName || 'Instalado' 
                            : 'Não instalado'
                          }
                        </p>
                      </div>
                    </div>
                    {!asset.hasAntivirus && (
                      <span className="text-xs text-red-600 font-medium">
                        Requer atenção
                      </span>
                    )}
                  </div>

                  {/* Firewall */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {asset.hasFirewall ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-medium">Firewall</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {asset.hasFirewall ? 'Ativo' : 'Inativo'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Encryption */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {asset.isEncrypted ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-medium">Criptografia de Disco</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {asset.isEncrypted ? 'Ativo' : 'Não ativo'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {(!asset.hasAntivirus || !asset.hasFirewall) && (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">
                          Atenção Necessária
                        </p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                          Seu equipamento não está totalmente protegido. Entre em contacto 
                          com o suporte técnico para melhorar a segurança.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Resumo Rápido</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Fabricante</span>
                <span className="font-medium">{asset.manufacturer || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Modelo</span>
                <span className="font-medium">{asset.model || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tipo</span>
                <span className="font-medium capitalize">{asset.type}</span>
              </div>
              {asset.assetTag && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tag</span>
                  <span className="font-medium font-mono">{asset.assetTag}</span>
                </div>
              )}
            </div>
          </div>

          {/* Licenses */}
          {asset.licenses && asset.licenses.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Licenças
              </h3>
              <div className="space-y-3">
                {asset.licenses.map((license) => (
                  <div key={license.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="font-medium text-sm">{license.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {license.vendor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {asset.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Notas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {asset.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssetDetail;
