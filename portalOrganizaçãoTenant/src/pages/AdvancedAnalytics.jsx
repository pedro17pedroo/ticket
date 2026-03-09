import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  Clock,
  Briefcase,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import * as reportsService from '../services/reportsService';
import BarChartComponent from '../components/charts/BarChartComponent';
import LineChartComponent from '../components/charts/LineChartComponent';
import { showError } from '../utils/alerts';

const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [previousPeriod, setPreviousPeriod] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [periodDays, setPeriodDays] = useState('30');

  useEffect(() => {
    loadComparisonData();
  }, [periodDays]);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const days = parseInt(periodDays);
      
      // Período atual
      const currentEnd = new Date();
      const currentStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Período anterior
      const previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      const previousStart = new Date(previousEnd.getTime() - days * 24 * 60 * 60 * 1000);

      const currentFilters = {
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0]
      };

      const previousFilters = {
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0]
      };

      // Carregar dados dos dois períodos
      const [currentTickets, previousTickets, currentUsers, previousUsers] = await Promise.all([
        reportsService.getHoursByTicket(currentFilters),
        reportsService.getHoursByTicket(previousFilters),
        reportsService.getHoursByUser(currentFilters),
        reportsService.getHoursByUser(previousFilters)
      ]);

      setCurrentPeriod({
        tickets: currentTickets,
        users: currentUsers
      });

      setPreviousPeriod({
        tickets: previousTickets,
        users: previousUsers
      });

      // Calcular comparações
      const hoursChange = calculatePercentageChange(
        currentTickets.summary.totalHours,
        previousTickets.summary.totalHours
      );

      const ticketsChange = calculatePercentageChange(
        currentTickets.summary.totalTickets,
        previousTickets.summary.totalTickets
      );

      const usersChange = calculatePercentageChange(
        currentUsers.summary.totalUsers,
        previousUsers.summary.totalUsers
      );

      const avgHoursPerTicketCurrent = currentTickets.summary.totalHours / currentTickets.summary.totalTickets;
      const avgHoursPerTicketPrevious = previousTickets.summary.totalHours / previousTickets.summary.totalTickets;
      const efficiencyChange = calculatePercentageChange(avgHoursPerTicketCurrent, avgHoursPerTicketPrevious);

      setComparison({
        hours: hoursChange,
        tickets: ticketsChange,
        users: usersChange,
        efficiency: efficiencyChange,
        avgHoursPerTicketCurrent: avgHoursPerTicketCurrent.toFixed(1),
        avgHoursPerTicketPrevious: avgHoursPerTicketPrevious.toFixed(1)
      });

    } catch (error) {
      showError('Erro ao carregar análises');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const renderComparisonCard = (title, currentValue, previousValue, change, icon, unit = '') => {
    const Icon = icon;
    const isPositive = parseFloat(change) > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-3">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
        </div>

        <div className="space-y-3">
          {/* Valor Atual */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Período Atual</p>
            <p className="text-3xl font-bold text-gray-900">{currentValue}{unit}</p>
          </div>

          {/* Comparação */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 mb-1">Período Anterior</p>
              <p className="text-lg font-semibold text-gray-600">{previousValue}{unit}</p>
            </div>
            
            <div className={`flex items-center px-3 py-1 rounded-full ${
              isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <TrendIcon className="w-4 h-4 mr-1" />
              <span className="text-sm font-semibold">{Math.abs(change)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const prepareComparisonChartData = () => {
    if (!currentPeriod || !previousPeriod) return null;

    const currentTop5 = currentPeriod.users.data.slice(0, 5);
    const previousTop5 = previousPeriod.users.data.slice(0, 5);

    // Combinar dados
    const userMap = new Map();

    currentTop5.forEach(user => {
      userMap.set(user.user?.name, {
        name: user.user?.name?.split(' ')[0] || 'N/A',
        atual: user.totalHours,
        anterior: 0
      });
    });

    previousTop5.forEach(user => {
      const name = user.user?.name;
      if (userMap.has(name)) {
        userMap.get(name).anterior = user.totalHours;
      } else {
        userMap.set(name, {
          name: user.user?.name?.split(' ')[0] || 'N/A',
          atual: 0,
          anterior: user.totalHours
        });
      }
    });

    return Array.from(userMap.values());
  };

  const renderInsights = () => {
    if (!comparison) return null;

    const insights = [];

    // Insight sobre horas
    if (parseFloat(comparison.hours) > 10) {
      insights.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Aumento Significativo de Produtividade',
        description: `As horas trabalhadas aumentaram ${comparison.hours}% em relação ao período anterior.`
      });
    } else if (parseFloat(comparison.hours) < -10) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Redução na Atividade',
        description: `As horas trabalhadas diminuíram ${Math.abs(comparison.hours)}% em relação ao período anterior.`
      });
    }

    // Insight sobre eficiência
    if (parseFloat(comparison.efficiency) < 0) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'Melhoria na Eficiência',
        description: `O tempo médio por ticket reduziu ${Math.abs(comparison.efficiency)}%, indicando maior eficiência.`
      });
    }

    // Insight sobre equipe
    if (parseFloat(comparison.users) > 0) {
      insights.push({
        type: 'info',
        icon: Users,
        title: 'Expansão da Equipe',
        description: `${comparison.users}% mais usuários ativos neste período.`
      });
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const colors = {
            success: 'bg-green-50 border-green-200 text-green-700',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            info: 'bg-blue-50 border-blue-200 text-blue-700'
          };

          return (
            <div key={index} className={`border rounded-lg p-4 ${colors[insight.type]}`}>
              <div className="flex items-start">
                <Icon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm opacity-90">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Análises Avançadas</h1>
          <p className="text-gray-600">Comparação de períodos e insights de desempenho</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="60">60 dias</option>
            <option value="90">90 dias</option>
          </select>
        </div>
      </div>

      {/* Comparison Cards */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {renderComparisonCard(
            'Total de Horas',
            currentPeriod.tickets.summary.totalHours,
            previousPeriod.tickets.summary.totalHours,
            comparison.hours,
            Clock,
            'h'
          )}
          
          {renderComparisonCard(
            'Tickets Trabalhados',
            currentPeriod.tickets.summary.totalTickets,
            previousPeriod.tickets.summary.totalTickets,
            comparison.tickets,
            Briefcase
          )}
          
          {renderComparisonCard(
            'Usuários Ativos',
            currentPeriod.users.summary.totalUsers,
            previousPeriod.users.summary.totalUsers,
            comparison.users,
            Users
          )}
          
          {renderComparisonCard(
            'Média por Ticket',
            comparison.avgHoursPerTicketCurrent,
            comparison.avgHoursPerTicketPrevious,
            comparison.efficiency,
            Target,
            'h'
          )}
        </div>
      )}

      {/* Comparison Chart */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Comparação de Produtividade</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-600">Período Atual</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
                <span className="text-gray-600">Período Anterior</span>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            <BarChartComponent
              data={prepareComparisonChartData()}
              dataKey="atual"
              xAxisKey="name"
              title=""
              color="#3b82f6"
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ArrowRight className="w-5 h-5 mr-2" />
          Insights e Recomendações
        </h3>
        {renderInsights()}
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <h4 className="text-sm font-medium opacity-90 mb-2">Índice de Produtividade</h4>
          <p className="text-4xl font-bold mb-2">
            {comparison ? (100 + parseFloat(comparison.hours)).toFixed(0) : '100'}
          </p>
          <p className="text-sm opacity-90">Base: 100 (período anterior)</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <h4 className="text-sm font-medium opacity-90 mb-2">Índice de Eficiência</h4>
          <p className="text-4xl font-bold mb-2">
            {comparison ? (100 - parseFloat(comparison.efficiency)).toFixed(0) : '100'}
          </p>
          <p className="text-sm opacity-90">Quanto maior, melhor</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <h4 className="text-sm font-medium opacity-90 mb-2">Crescimento da Equipe</h4>
          <p className="text-4xl font-bold mb-2">
            {comparison ? `+${comparison.users}` : '0'}%
          </p>
          <p className="text-sm opacity-90">Variação de usuários ativos</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
