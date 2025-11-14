import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Globe
} from 'lucide-react';
import { saasAPI } from '../../services/api';
import useSaasStore from '../../store/saasStore';

const DashboardOverview = () => {
  const { stats, setStats, setStatsLoading } = useSaasStore();
  const [timeFilter, setTimeFilter] = useState('30d');

  useEffect(() => {
    loadStats();
  }, [timeFilter]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await saasAPI.getSaasStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Mock data for now
  const mockStats = {
    totalOrganizations: 847,
    totalUsers: 12543,
    monthlyRevenue: 89750,
    activeTickets: 2341,
    organizationGrowth: 12.5,
    userGrowth: 8.3,
    revenueGrowth: 15.2,
    ticketGrowth: -3.1,
    recentOrganizations: [
      { name: 'TechCorp Solutions', plan: 'Enterprise', created: '2025-01-12', users: 45 },
      { name: 'StartupXYZ', plan: 'Business', created: '2025-01-11', users: 12 },
      { name: 'Global Services', plan: 'Enterprise', created: '2025-01-10', users: 78 },
      { name: 'Local Business', plan: 'Starter', created: '2025-01-09', users: 5 }
    ],
    planDistribution: [
      { plan: 'Starter', count: 421, percentage: 49.7 },
      { plan: 'Business', count: 312, percentage: 36.8 },
      { plan: 'Enterprise', count: 114, percentage: 13.5 }
    ]
  };

  const statsCards = [
    {
      title: 'Total de Organizações',
      value: mockStats.totalOrganizations.toLocaleString(),
      change: `+${mockStats.organizationGrowth}%`,
      changeType: 'positive',
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      title: 'Usuários Ativos',
      value: mockStats.totalUsers.toLocaleString(),
      change: `+${mockStats.userGrowth}%`,
      changeType: 'positive',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${mockStats.monthlyRevenue.toLocaleString()}`,
      change: `+${mockStats.revenueGrowth}%`,
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: 'Tickets Ativos',
      value: mockStats.activeTickets.toLocaleString(),
      change: `${mockStats.ticketGrowth}%`,
      changeType: 'negative',
      icon: Activity,
      color: 'bg-orange-500'
    }
  ];

  const timeFilters = [
    { label: '7 dias', value: '7d' },
    { label: '30 dias', value: '30d' },
    { label: '90 dias', value: '90d' },
    { label: 'Ano', value: '1y' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard SaaS</h1>
          <p className="text-gray-600">Visão geral da plataforma e métricas principais</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Calendar className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <div className="flex items-center">
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Organizations */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Organizações Recentes</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todas
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {mockStats.recentOrganizations.map((org, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Globe className="h-3 w-3 mr-1" />
                        {org.plan} • {org.users} usuários
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{org.created}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      org.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                      org.plan === 'Business' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {org.plan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Distribuição de Planos</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {mockStats.planDistribution.map((plan, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{plan.plan}</span>
                    <span className="text-sm text-gray-500">{plan.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        plan.plan === 'Enterprise' ? 'bg-purple-500' :
                        plan.plan === 'Business' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${plan.percentage}%` }}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-500">{plan.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {mockStats.totalOrganizations}
                </p>
                <p className="text-sm text-gray-500">Total de organizações</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">Nova Organização</span>
          </button>
          
          <button className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <Users className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-900">Gerenciar Usuários</span>
          </button>
          
          <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-900">Relatórios</span>
          </button>
          
          <button className="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
            <Activity className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-orange-900">Monitoramento</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
