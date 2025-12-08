import { useState, useEffect } from 'react';
import { Download, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Table from '../../components/common/Table';
import dashboardService from '../../services/dashboardService';
import { showError } from '../../utils/alerts';

const SupportReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getSupportReports(period);
      setData(result);
    } catch (error) {
      showError('Erro ao carregar relatório de suporte');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `support-report-${period}-${new Date().toISOString()}.json`;
    link.click();
  };

  const agentColumns = [
    { header: 'Agente', accessor: 'name' },
    { header: 'Tickets Resolvidos', accessor: 'ticketsResolved' },
    { header: 'Tempo Médio', accessor: 'avgResolutionTime' },
    { 
      header: 'Satisfação', 
      accessor: 'satisfaction',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.satisfaction}%</span>
          <Badge variant={row.satisfaction >= 90 ? 'success' : 'warning'}>
            {row.satisfaction >= 90 ? 'Excelente' : 'Bom'}
          </Badge>
        </div>
      )
    }
  ];

  const mockAgents = [
    { name: 'João Silva', ticketsResolved: 145, avgResolutionTime: '3.2h', satisfaction: 95 },
    { name: 'Maria Santos', ticketsResolved: 132, avgResolutionTime: '3.8h', satisfaction: 92 },
    { name: 'Pedro Costa', ticketsResolved: 128, avgResolutionTime: '4.1h', satisfaction: 88 }
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Suporte</h1>
          <p className="text-gray-600 mt-1">Análise de performance do suporte</p>
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
          <Button icon={<Download className="w-4 h-4" />} onClick={handleExport}>
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Tickets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.totalTickets || '1,245'}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tickets Resolvidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.resolvedTickets || '1,173'}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.avgTime || '3.7h'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Satisfação</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.satisfaction || '92%'}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Performance por Agente</h2>
        <Table
          columns={agentColumns}
          data={data?.agents || mockAgents}
          emptyMessage="Nenhum dado disponível"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Tickets por Prioridade</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Crítica</span>
              <Badge variant="danger">{data?.byPriority?.critical || 45}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Alta</span>
              <Badge variant="warning">{data?.byPriority?.high || 128}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Média</span>
              <Badge variant="primary">{data?.byPriority?.medium || 542}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Baixa</span>
              <Badge variant="secondary">{data?.byPriority?.low || 530}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Tickets por Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Abertos</span>
              <Badge variant="warning">{data?.byStatus?.open || 72}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Em Progresso</span>
              <Badge variant="primary">{data?.byStatus?.inProgress || 156}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Resolvidos</span>
              <Badge variant="success">{data?.byStatus?.resolved || 1173}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fechados</span>
              <Badge variant="secondary">{data?.byStatus?.closed || 1089}</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SupportReports;
