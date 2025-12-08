import { useState, useEffect } from 'react';
import { Activity, Database, Server, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import dashboardService from '../../services/dashboardService';
import { showError } from '../../utils/alerts';

const SystemStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getSystemStatus();
      setStatus(data);
    } catch (error) {
      showError('Erro ao carregar status do sistema');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStatus();
  };

  if (loading && !status) return <Loading />;

  const services = [
    { name: 'API Backend', status: status?.services?.api || 'online', icon: Server },
    { name: 'Base de Dados', status: status?.services?.database || 'online', icon: Database },
    { name: 'Cache Redis', status: status?.services?.redis || 'online', icon: Activity },
    { name: 'Storage', status: status?.services?.storage || 'online', icon: HardDrive }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Status do Sistema</h1>
          <p className="text-gray-600 mt-1">Monitoramento em tempo real</p>
        </div>
        <Button
          icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Atualizar
        </Button>
      </div>

      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status Geral</p>
              <p className="text-2xl font-bold text-green-600 mt-1">Operacional</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {status?.uptime || '99.9%'}
              </p>
            </div>
            <Server className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uso CPU</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {status?.cpu || '45%'}
              </p>
            </div>
            <Cpu className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uso Memória</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {status?.memory || '62%'}
              </p>
            </div>
            <HardDrive className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Serviços */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Serviços</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            const isOnline = service.status === 'online';
            return (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="font-medium">{service.name}</span>
                </div>
                <Badge variant={isOnline ? 'success' : 'danger'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Requisições (últimas 24h)</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold">{status?.requests?.total || '125,430'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sucesso</span>
              <span className="font-semibold text-green-600">
                {status?.requests?.success || '124,890'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Erro</span>
              <span className="font-semibold text-red-600">
                {status?.requests?.error || '540'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tempo Médio</span>
              <span className="font-semibold">{status?.requests?.avgTime || '120ms'}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Base de Dados</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Conexões Ativas</span>
              <span className="font-semibold">{status?.database?.connections || '45'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Queries/seg</span>
              <span className="font-semibold">{status?.database?.queries || '1,250'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tamanho</span>
              <span className="font-semibold">{status?.database?.size || '2.4 GB'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Último Backup</span>
              <span className="font-semibold">{status?.database?.lastBackup || 'Hoje, 03:00'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemStatus;
