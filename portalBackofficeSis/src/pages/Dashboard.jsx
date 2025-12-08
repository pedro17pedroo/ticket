import { useEffect, useState } from 'react';
import { tenantService } from '../services/tenantService';
import { Users, Building2, TrendingUp, Activity, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await tenantService.getStats();
      // Backend retorna { success: true, stats: {...} }
      setStats(response.stats || response);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Provider</h1>
        <p className="text-gray-600 mt-1">Visão geral de todos os Tenants</p>
      </div>
      
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Building2 className="w-8 h-8" />}
          title="Total Tenants"
          value={stats?.tenants?.total || 0}
          subtitle={`${stats?.tenants?.active || 0} ativos`}
          color="blue"
          trend={stats?.tenants?.trend}
        />
        <StatCard
          icon={<Users className="w-8 h-8" />}
          title="Total Usuários"
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.active || 0} ativos`}
          color="green"
          trend={stats?.users?.trend}
        />
        <StatCard
          icon={<Building2 className="w-8 h-8" />}
          title="Clientes B2B"
          value={stats?.clients?.total || 0}
          subtitle={`${stats?.clients?.active || 0} ativos`}
          color="purple"
          trend={stats?.clients?.trend}
        />
        <StatCard
          icon={<Activity className="w-8 h-8" />}
          title="Tickets"
          value={stats?.tickets?.total || 0}
          subtitle={`${stats?.tickets?.open || 0} em aberto`}
          color="orange"
          trend={stats?.tickets?.trend}
        />
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenants Recentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tenants Recentes</h2>
          <div className="space-y-3">
            {stats?.recentTenants?.length > 0 ? (
              stats.recentTenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-gray-500">{tenant.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tenant.subscription?.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tenant.subscription?.status || 'N/A'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum tenant cadastrado</p>
            )}
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.tenant}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Sem atividade recente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color, trend }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
    </div>
  );
}
