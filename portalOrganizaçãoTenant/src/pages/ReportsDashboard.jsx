import { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import * as reportsService from '../services/reportsService';
import BarChartComponent from '../components/charts/BarChartComponent';
import PieChartComponent from '../components/charts/PieChartComponent';
import LineChartComponent from '../components/charts/LineChartComponent';
import { showError } from '../utils/alerts';

const ReportsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: null,
    topTickets: null,
    topUsers: null,
    clientDistribution: null,
    dailyTrend: null
  });

  const [period, setPeriod] = useState('30'); // dias

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const filters = { startDate, endDate };

      // Carregar todos os dados em paralelo
      const [ticketsData, usersData, clientsData, dailyData] = await Promise.all([
        reportsService.getHoursByTicket(filters),
        reportsService.getHoursByUser(filters),
        reportsService.getHoursByClient(filters),
        reportsService.getDailyReport(filters)
      ]);

      setDashboardData({
        overview: {
          totalHours: ticketsData.summary.totalHours,
          totalTickets: ticketsData.summary.totalTickets,
          totalUsers: usersData.summary.totalUsers,
          totalClients: clientsData.summary.totalClients,
          avgHoursPerTicket: (ticketsData.summary.totalHours / ticketsData.summary.totalTickets).toFixed(1),
          avgHoursPerUser: (usersData.summary.totalHours / usersData.summary.totalUsers).toFixed(1)
        },
        topTickets: ticketsData.data.slice(0, 5),
        topUsers: usersData.data.slice(0, 5),
        clientDistribution: clientsData.data.slice(0, 6),
        dailyTrend: dailyData.data
      });
    } catch (error) {
      showError('Erro ao carregar dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewCards = () => {
    if (!dashboardData.overview) return null;

    const cards = [
      {
        title: 'Total de Horas',
        value: dashboardData.overview.totalHours,
        icon: Clock,
        color: 'blue',
        trend: '+12%',
        trendUp: true
      },
      {
        title: 'Tickets Trabalhados',
        value: dashboardData.overview.totalTickets,
        icon: Briefcase,
        color: 'green',
        trend: '+8%',
        trendUp: true
      },
      {
        title: 'Usuários Ativos',
        value: dashboardData.overview.totalUsers,
        icon: Users,
        color: 'purple',
        trend: '+5%',
        trendUp: true
      },
      {
        title: 'Clientes Atendidos',
        value: dashboardData.overview.totalClients,
        icon: Target,
        color: 'orange',
        trend: '-2%',
        trendUp: false
      },
      {
        title: 'Média por Ticket',
        value: `${dashboardData.overview.avgHoursPerTicket}h`,
        icon: Activity,
        color: 'indigo',
        trend: '+3%',
        trendUp: true
      },
      {
        title: 'Média por Usuário',
        value: `${dashboardData.overview.avgHoursPerUser}h`,
        icon: Zap,
        color: 'pink',
        trend: '+7%',
        trendUp: true
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? TrendingUp : TrendingDown;
          
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full bg-${card.color}-100`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
                <div className={`flex items-center text-sm ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  {card.trend}
                </div>
              </div>
              <h3 className="text-sm text-gray-600 mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTopTickets = () => {
    if (!dashboardData.topTickets) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2" />
          Top 5 Tickets por Horas
        </h3>
        <div className="space-y-3">
          {dashboardData.topTickets.map((ticket, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' :
                  'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">#{ticket.ticket.ticketNumber}</p>
                  <p className="text-sm text-gray-600 truncate">{ticket.ticket.subject}</p>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-gray-900">{ticket.formattedTime}</p>
                <p className="text-xs text-gray-500">{ticket.totalUsers} usuários</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTopUsers = () => {
    if (!dashboardData.topUsers) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Top 5 Usuários Mais Produtivos
        </h3>
        <div className="space-y-3">
          {dashboardData.topUsers.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
                  {user.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user.user?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{user.totalTickets} tickets</p>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-gray-900">{user.formattedTime}</p>
                <p className="text-xs text-gray-500">{user.totalSessions} sessões</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const prepareChartData = () => {
    if (!dashboardData.topUsers) return null;

    return dashboardData.topUsers.map(user => ({
      name: user.user?.name?.split(' ')[0] || 'N/A',
      horas: user.totalHours,
      tickets: user.totalTickets
    }));
  };

  const prepareClientChartData = () => {
    if (!dashboardData.clientDistribution) return null;

    return dashboardData.clientDistribution.map(client => ({
      name: client.client?.name || 'N/A',
      horas: client.totalHours
    }));
  };

  const prepareDailyChartData = () => {
    if (!dashboardData.dailyTrend) return null;

    return dashboardData.dailyTrend.slice(-14).map(day => ({
      name: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      horas: day.totalHours,
      tickets: day.totalTickets
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard de Relatórios</h1>
          <p className="text-gray-600">Visão geral do desempenho e produtividade</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Performance Chart */}
        <BarChartComponent
          data={prepareChartData()}
          dataKey="horas"
          xAxisKey="name"
          title="Produtividade por Usuário"
          color="#3b82f6"
        />

        {/* Client Distribution Chart */}
        <PieChartComponent
          data={prepareClientChartData()}
          dataKey="horas"
          nameKey="name"
          title="Distribuição de Horas por Cliente"
        />
      </div>

      {/* Daily Trend Chart */}
      <div className="mb-6">
        <LineChartComponent
          data={prepareDailyChartData()}
          dataKey="horas"
          xAxisKey="name"
          title="Evolução de Horas - Últimos 14 Dias"
          color="#10b981"
        />
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTopTickets()}
        {renderTopUsers()}
      </div>

      {/* Insights Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="font-semibold text-green-900">Desempenho Positivo</h4>
          </div>
          <p className="text-sm text-green-700">
            Produtividade aumentou 12% em relação ao período anterior
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="font-semibold text-blue-900">Eficiência</h4>
          </div>
          <p className="text-sm text-blue-700">
            Tempo médio por ticket reduziu em 8%
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="font-semibold text-yellow-900">Atenção</h4>
          </div>
          <p className="text-sm text-yellow-700">
            2 clientes com tickets acima da média de horas
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
