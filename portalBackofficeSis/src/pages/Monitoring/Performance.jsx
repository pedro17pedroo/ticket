import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Zap, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import dashboardService from '../../services/dashboardService';
import { showError } from '../../utils/alerts';

const Performance = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Atualiza a cada 1 min
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getPerformanceMetrics();
      setMetrics(data);
    } catch (error) {
      showError('Erro ao carregar métricas de performance');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) return <Loading />;

  const endpoints = [
    { path: '/api/tickets', avgTime: 120, requests: 45230, errors: 12 },
    { path: '/api/organizations', avgTime: 85, requests: 12450, errors: 3 },
    { path: '/api/users', avgTime: 95, requests: 23100, errors: 8 },
    { path: '/api/clients', avgTime: 110, requests: 18900, errors: 5 },
    { path: '/api/inventory', avgTime: 250, requests: 8700, errors: 15 }
  ];

  const getPerformanceBadge = (time) => {
    if (time < 100) return <Badge variant="success">Excelente</Badge>;
    if (time < 200) return <Badge variant="primary">Bom</Badge>;
    if (time < 500) return <Badge variant="warning">Regular</Badge>;
    return <Badge variant="danger">Lento</Badge>;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
        <p className="text-gray-600 mt-1">Métricas de performance da aplicação</p>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.avgResponseTime || '125ms'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Throughput</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.throughput || '1.2k/s'}
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Erro</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.errorRate || '0.43%'}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Apdex Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.apdex || '0.95'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Performance por Endpoint */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Performance por Endpoint</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Endpoint
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Tempo Médio
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Requisições
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Erros
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-mono text-sm">{endpoint.path}</td>
                  <td className="py-3 px-4">{endpoint.avgTime}ms</td>
                  <td className="py-3 px-4">{endpoint.requests.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4">
                    <span className={endpoint.errors > 10 ? 'text-red-600' : 'text-gray-900'}>
                      {endpoint.errors}
                    </span>
                  </td>
                  <td className="py-3 px-4">{getPerformanceBadge(endpoint.avgTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recursos do Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Uso de CPU</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Uso Atual</span>
                <span className="text-sm font-semibold">{metrics?.cpu?.current || '45%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: metrics?.cpu?.current || '45%' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Média (24h)</p>
                <p className="font-semibold">{metrics?.cpu?.avg24h || '38%'}</p>
              </div>
              <div>
                <p className="text-gray-600">Pico (24h)</p>
                <p className="font-semibold">{metrics?.cpu?.peak24h || '72%'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Uso de Memória</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Uso Atual</span>
                <span className="text-sm font-semibold">{metrics?.memory?.current || '62%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: metrics?.memory?.current || '62%' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Média (24h)</p>
                <p className="font-semibold">{metrics?.memory?.avg24h || '58%'}</p>
              </div>
              <div>
                <p className="text-gray-600">Pico (24h)</p>
                <p className="font-semibold">{metrics?.memory?.peak24h || '85%'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Performance;
