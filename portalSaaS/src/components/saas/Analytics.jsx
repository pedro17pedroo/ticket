import { BarChart3, TrendingUp, Users, Building2 } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Métricas e relatórios detalhados da plataforma</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analytics em Desenvolvimento
          </h3>
          <p className="text-gray-600">
            Esta seção estará disponível em breve com gráficos detalhados e relatórios avançados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
