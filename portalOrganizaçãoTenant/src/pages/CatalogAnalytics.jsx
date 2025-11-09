import { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CatalogAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // dias

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/catalog/analytics', {
        params: { period }
      });
      setStats(response.data.data || {});
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics do Catálogo</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Estatísticas e métricas de uso do catálogo de serviços
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-8 h-8 text-blue-500" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.totalRequests || 0}</div>
          <div className="text-sm text-gray-500">Total de Solicitações</div>
          {stats.requestsGrowth && (
            <div className="text-xs text-green-600 mt-1">
              +{stats.requestsGrowth}% vs período anterior
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">{stats.pendingApprovals || 0}</div>
          <div className="text-sm text-gray-500">Aguardando Aprovação</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.approvedRequests || 0}</div>
          <div className="text-sm text-gray-500">Aprovadas</div>
          {stats.approvalRate && (
            <div className="text-xs text-gray-500 mt-1">
              {stats.approvalRate}% de taxa de aprovação
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">{stats.uniqueRequesters || 0}</div>
          <div className="text-sm text-gray-500">Usuários Únicos</div>
        </div>
      </div>

      {/* Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items Mais Solicitados */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Items Mais Solicitados
            </h2>
          </div>
          <div className="p-6">
            {stats.topItems && stats.topItems.length > 0 ? (
              <div className="space-y-4">
                {stats.topItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center font-bold text-primary-600">
                      {index + 1}
                    </div>
                    <div className="text-2xl">{item.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.category?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{item.requestCount}</div>
                      <div className="text-xs text-gray-500">solicitações</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Categorias Mais Populares */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Categorias Mais Populares
            </h2>
          </div>
          <div className="p-6">
            {stats.topCategories && stats.topCategories.length > 0 ? (
              <div className="space-y-4">
                {stats.topCategories.map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span className="font-bold">{category.requestCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(category.requestCount / stats.totalRequests) * 100}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>

      {/* Tempo Médio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-500" />
            <h3 className="font-semibold">Tempo Médio de Aprovação</h3>
          </div>
          <div className="text-3xl font-bold">
            {stats.avgApprovalTime ? `${Math.round(stats.avgApprovalTime / 60)} min` : 'N/A'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-green-500" />
            <h3 className="font-semibold">Tempo Médio de Resolução</h3>
          </div>
          <div className="text-3xl font-bold">
            {stats.avgResolutionTime ? `${Math.round(stats.avgResolutionTime / 24)} dias` : 'N/A'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-purple-500" />
            <h3 className="font-semibold">Taxa de Conclusão</h3>
          </div>
          <div className="text-3xl font-bold">
            {stats.completionRate ? `${stats.completionRate}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Usuários Mais Ativos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários Mais Ativos
          </h2>
        </div>
        <div className="p-6">
          {stats.topRequesters && stats.topRequesters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.topRequesters.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{user.requestCount}</div>
                    <div className="text-xs text-gray-500">solicitações</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
          )}
        </div>
      </div>

      {/* Rejeições */}
      {stats.rejectedRequests > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-600" />
            Análise de Rejeições
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Rejeitadas</div>
              <div className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Taxa de Rejeição</div>
              <div className="text-2xl font-bold text-red-600">
                {((stats.rejectedRequests / stats.totalRequests) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Motivo Principal</div>
              <div className="font-medium text-red-600">
                {stats.topRejectionReason || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogAnalytics;
