import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Monitor, 
  Package, 
  Key, 
  AlertTriangle, 
  TrendingUp,
  Download,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const InventoryDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await inventoryService.getStatistics();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      toast.success(`A exportar dados em formato ${format.toUpperCase()}...`);
      // Implementar exportação
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Inventário</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral do inventário de TI
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportData('csv')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => exportData('pdf')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Main Stats */}
      {statistics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  +12%
                </span>
              </div>
              <p className="text-3xl font-bold">{statistics.assets.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total de Assets</p>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="text-green-600">{statistics.assets.active} ativos</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">{statistics.assets.inactive} inativos</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <p className="text-3xl font-bold">{statistics.software.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Software Instalado</p>
              <div className="mt-4 text-xs text-gray-500">
                {statistics.software.unique} programas únicos
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              <p className="text-3xl font-bold">{statistics.licenses.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Licenças</p>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="text-green-600">{statistics.licenses.active} ativas</span>
                <span className="text-gray-400">•</span>
                <span className="text-red-600">{statistics.licenses.expired} expiradas</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                </div>
              </div>
              <p className="text-3xl font-bold">{statistics.licenses.expiringSoon || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Expirando em 30 dias</p>
              <Link 
                to="/inventory/licenses"
                className="mt-4 text-xs text-primary-600 hover:text-primary-700 inline-block"
              >
                Ver detalhes →
              </Link>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets por Tipo */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Assets por Tipo</h3>
              <div className="space-y-3">
                {statistics.assets.byType && Array.isArray(statistics.assets.byType) ? (
                  statistics.assets.byType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm capitalize">{item.type}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(item.count / statistics.assets.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                    </div>
                  ))
                ) : (
                  statistics.assets.byType && Object.entries(statistics.assets.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm capitalize">{type}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(count / statistics.assets.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assets por Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Assets por Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-sm">Ativo</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(statistics.assets.active / statistics.assets.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{statistics.assets.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                    <span className="text-sm">Inativo</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gray-500 h-2 rounded-full"
                        style={{ width: `${(statistics.assets.inactive / statistics.assets.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{statistics.assets.inactive}</span>
                </div>
                {statistics.assets.maintenance > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <span className="text-sm">Manutenção</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(statistics.assets.maintenance / statistics.assets.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{statistics.assets.maintenance}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/inventory/new"
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <Monitor className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-1">Adicionar Asset</h3>
              <p className="text-sm text-blue-100">Registre um novo equipamento</p>
            </Link>

            <Link
              to="/inventory/licenses"
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              <Key className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-1">Gerir Licenças</h3>
              <p className="text-sm text-purple-100">Controle seats e renovações</p>
            </Link>

            <Link
              to="/inventory/assets"
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white hover:from-green-600 hover:to-green-700 transition-all"
            >
              <TrendingUp className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-1">Ver Inventário</h3>
              <p className="text-sm text-green-100">Lista completa de assets</p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Atividade Recente
              </h3>
              <Link to="/inventory/assets" className="text-sm text-primary-600 hover:text-primary-700">
                Ver tudo →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-4 h-4 text-green-600 dark:text-green-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo asset adicionado</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Laptop Dell Latitude 7420 foi registrado
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Há 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Licença atribuída</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Microsoft Office 365 atribuída a Laptop-001
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Há 5 horas</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryDashboard;
