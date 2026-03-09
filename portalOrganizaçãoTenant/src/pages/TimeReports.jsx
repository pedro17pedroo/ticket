import { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import * as reportsService from '../services/reportsService';
import { showSuccess, showError } from '../utils/alerts';

const TimeReports = () => {
  const [activeTab, setActiveTab] = useState('by-ticket');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: '',
    clientId: '',
    ticketId: '',
    status: ''
  });

  const tabs = [
    { id: 'by-ticket', label: 'Por Ticket', icon: Briefcase },
    { id: 'by-user', label: 'Por Usuário', icon: Users },
    { id: 'by-client', label: 'Por Cliente', icon: TrendingUp },
    { id: 'daily', label: 'Diário', icon: Calendar },
    { id: 'summary', label: 'Resumo', icon: BarChart3 }
  ];

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let data;
      switch (activeTab) {
        case 'by-ticket':
          data = await reportsService.getHoursByTicket(filters);
          break;
        case 'by-user':
          data = await reportsService.getHoursByUser(filters);
          break;
        case 'by-client':
          data = await reportsService.getHoursByClient(filters);
          break;
        case 'daily':
          data = await reportsService.getDailyReport(filters);
          break;
        case 'summary':
          data = await reportsService.getClientSummary(filters.clientId);
          break;
        default:
          data = null;
      }
      setReportData(data);
    } catch (error) {
      showError('Erro ao carregar relatório');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    if (!reportData || !reportData.data) {
      showError('Nenhum dado para exportar');
      return;
    }
    reportsService.exportToCSV(activeTab, filters, reportData.data);
    showSuccess('Relatório exportado com sucesso!');
  };

  const renderSummaryCards = () => {
    if (!reportData || !reportData.summary) return null;

    const { summary } = reportData;
    const cards = [];

    if (activeTab === 'by-ticket') {
      cards.push(
        { label: 'Total de Tickets', value: summary.totalTickets, icon: Briefcase, color: 'blue' },
        { label: 'Total de Horas', value: summary.totalHours, icon: Clock, color: 'green' },
        { label: 'Usuários Envolvidos', value: summary.totalUsers, icon: Users, color: 'purple' }
      );
    } else if (activeTab === 'by-user') {
      cards.push(
        { label: 'Total de Usuários', value: summary.totalUsers, icon: Users, color: 'blue' },
        { label: 'Total de Horas', value: summary.totalHours, icon: Clock, color: 'green' },
        { label: 'Total de Tickets', value: summary.totalTickets, icon: Briefcase, color: 'purple' }
      );
    } else if (activeTab === 'by-client') {
      cards.push(
        { label: 'Total de Clientes', value: summary.totalClients, icon: TrendingUp, color: 'blue' },
        { label: 'Total de Horas', value: summary.totalHours, icon: Clock, color: 'green' },
        { label: 'Total de Tickets', value: summary.totalTickets, icon: Briefcase, color: 'purple' }
      );
    } else if (activeTab === 'daily') {
      cards.push(
        { label: 'Total de Dias', value: summary.totalDays, icon: Calendar, color: 'blue' },
        { label: 'Total de Horas', value: summary.totalHours, icon: Clock, color: 'green' },
        { label: 'Média por Dia', value: `${summary.averageHoursPerDay}h`, icon: Activity, color: 'purple' }
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${card.color}-100`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTableByTicket = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return <p className="text-center text-gray-500 py-8">Nenhum dado encontrado</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assunto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuários</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessões</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  #{item.ticket.ticketNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.ticket.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.ticket.client?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.ticket.status === 'fechado' ? 'bg-gray-100 text-gray-800' :
                    item.ticket.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalUsers}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalSessions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.formattedTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableByUser = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return <p className="text-center text-gray-500 py-8">Nenhum dado encontrado</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessões</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {item.user?.name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.user?.name || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.user?.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.user?.role || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalTickets}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalSessions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.formattedTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableByClient = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return <p className="text-center text-gray-500 py-8">Nenhum dado encontrado</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuários</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessões</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.client?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.client?.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalTickets}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalUsers}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalSessions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.formattedTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableDaily = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return <p className="text-center text-gray-500 py-8">Nenhum dado encontrado</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuários</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessões</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {new Date(item.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalTickets}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalUsers}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalSessions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.formattedTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'by-ticket':
        return renderTableByTicket();
      case 'by-user':
        return renderTableByUser();
      case 'by-client':
        return renderTableByClient();
      case 'daily':
        return renderTableDaily();
      case 'summary':
        return renderTableByClient(); // Usa mesma tabela
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Relatórios de Horas</h1>
        <p className="text-gray-600">Análise detalhada do tempo trabalhado em tickets</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </h3>
          <button
            onClick={loadReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Aplicar Filtros'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExport}
          disabled={!reportData || !reportData.data || reportData.data.length === 0}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Download className="w-5 h-5 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default TimeReports;
