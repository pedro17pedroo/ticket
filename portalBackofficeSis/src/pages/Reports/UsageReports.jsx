import { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Table from '../../components/common/Table';
import dashboardService from '../../services/dashboardService';
import { showError } from '../../utils/alerts';

const UsageReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getUsageReports(period);
      setData(result);
    } catch (error) {
      showError('Erro ao carregar relatório de uso');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Implementar exportação
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usage-report-${period}-${new Date().toISOString()}.json`;
    link.click();
  };

  const organizationColumns = [
    { header: 'Organização', accessor: 'name' },
    { header: 'Usuários Ativos', accessor: 'activeUsers' },
    { header: 'Tickets Criados', accessor: 'ticketsCreated' },
    { header: 'Tickets Resolvidos', accessor: 'ticketsResolved' },
    { header: 'Tempo Médio Resolução', accessor: 'avgResolutionTime' },
    { header: 'Armazenamento Usado', accessor: 'storageUsed' }
  ];

  const mockOrganizations = [
    {
      name: 'Tech Solutions',
      activeUsers: 45,
      ticketsCreated: 230,
      ticketsResolved: 215,
      avgResolutionTime: '4.2h',
      storageUsed: '2.3 GB'
    },
    {
      name: 'Digital Services',
      activeUsers: 32,
      ticketsCreated: 180,
      ticketsResolved: 165,
      avgResolutionTime: '5.1h',
      storageUsed: '1.8 GB'
    },
    {
      name: 'Cloud Systems',
      activeUsers: 28,
      ticketsCreated: 150,
      ticketsResolved: 142,
      avgResolutionTime: '3.8h',
      storageUsed: '1.5 GB'
    }
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Uso</h1>
          <p className="text-gray-600 mt-1">Análise de uso do sistema por organização</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="90days">Últimos 90 dias</option>
            <option value="year">Último ano</option>
          </select>
          <Button
            icon={<Download className="w-4 h-4" />}
            onClick={handleExport}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Organizações</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.totalOrganizations || '127'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.activeUsers || '3,245'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tickets Criados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.ticketsCreated || '12,450'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Resolução</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.resolutionRate || '94.2%'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Uso por Organização */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Uso por Organização</h2>
        <Table
          columns={organizationColumns}
          data={data?.organizations || mockOrganizations}
          emptyMessage="Nenhum dado disponível"
        />
      </Card>

      {/* Estatísticas Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Top 5 Organizações por Tickets</h2>
          <div className="space-y-3">
            {(data?.topByTickets || mockOrganizations.slice(0, 5)).map((org, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <span className="font-medium">{org.name}</span>
                </div>
                <span className="font-semibold text-indigo-600">{org.ticketsCreated}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Top 5 por Armazenamento</h2>
          <div className="space-y-3">
            {(data?.topByStorage || mockOrganizations.slice(0, 5)).map((org, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <span className="font-medium">{org.name}</span>
                </div>
                <span className="font-semibold text-blue-600">{org.storageUsed}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UsageReports;
