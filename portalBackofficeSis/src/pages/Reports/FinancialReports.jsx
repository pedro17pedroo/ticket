import { useState, useEffect } from 'react';
import { Download, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Table from '../../components/common/Table';
import dashboardService from '../../services/dashboardService';
import { showError } from '../../utils/alerts';

const FinancialReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getFinancialReports(period);
      setData(result);
    } catch (error) {
      showError('Erro ao carregar relatório financeiro');
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
    link.download = `financial-report-${period}-${new Date().toISOString()}.json`;
    link.click();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const subscriptionColumns = [
    { header: 'Organização', accessor: 'name' },
    { 
      header: 'Plano', 
      accessor: 'plan',
      render: (row) => <Badge variant="primary">{row.plan}</Badge>
    },
    { 
      header: 'Valor Mensal', 
      accessor: 'monthlyValue',
      render: (row) => formatCurrency(row.monthlyValue)
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'danger'}>
          {row.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    { 
      header: 'Próximo Pagamento', 
      accessor: 'nextPayment',
      render: (row) => new Date(row.nextPayment).toLocaleDateString('pt-BR')
    }
  ];

  const mockSubscriptions = [
    {
      name: 'Tech Solutions',
      plan: 'Enterprise',
      monthlyValue: 499.90,
      status: 'active',
      nextPayment: '2024-12-15'
    },
    {
      name: 'Digital Services',
      plan: 'Professional',
      monthlyValue: 299.90,
      status: 'active',
      nextPayment: '2024-12-20'
    },
    {
      name: 'Cloud Systems',
      plan: 'Basic',
      monthlyValue: 99.90,
      status: 'active',
      nextPayment: '2024-12-18'
    }
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Financeiro</h1>
          <p className="text-gray-600 mt-1">Análise de receitas e assinaturas</p>
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

      {/* Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data?.totalRevenue || 45890.50)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MRR</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data?.mrr || 38450.00)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+8.3%</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.churnRate || '2.3%'}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">-0.5%</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data?.avgTicket || 302.75)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+5.2%</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Assinaturas Ativas */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Assinaturas Ativas</h2>
        <Table
          columns={subscriptionColumns}
          data={data?.subscriptions || mockSubscriptions}
          emptyMessage="Nenhuma assinatura encontrada"
        />
      </Card>

      {/* Distribuição por Plano */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Receita por Plano</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Enterprise</span>
                <span className="font-semibold">{formatCurrency(18500)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '48%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Professional</span>
                <span className="font-semibold">{formatCurrency(14200)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '37%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Basic</span>
                <span className="font-semibold">{formatCurrency(5750)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Crescimento Mensal</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Novos Clientes</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">+15</span>
                <Badge variant="success">+18%</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Upgrades</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">+8</span>
                <Badge variant="success">+12%</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cancelamentos</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">-3</span>
                <Badge variant="danger">-2%</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="font-semibold">Crescimento Líquido</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-600">+20</span>
                <Badge variant="success">+28%</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinancialReports;
