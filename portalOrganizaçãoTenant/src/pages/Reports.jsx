import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  FileDown, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw
} from 'lucide-react';
import { ticketService } from '../services/api';
import hoursService from '../services/hoursService';
import inventoryService from '../services/inventoryService';
import { exportStatsToPDF, exportHoursReportToPDF, exportToCSV } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Estados dos dados
  const [ticketStats, setTicketStats] = useState(null);
  const [hoursStats, setHoursStats] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [detailedTickets, setDetailedTickets] = useState([]);

  // Cores para gráficos
  const COLORS = {
    primary: '#4F46E5',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899',
    gray: '#6B7280'
  };

  const STATUS_COLORS = {
    novo: COLORS.info,
    em_progresso: COLORS.warning,
    aguardando_cliente: COLORS.purple,
    resolvido: COLORS.secondary,
    fechado: COLORS.gray
  };

  const PRIORITY_COLORS = {
    urgente: COLORS.danger,
    alta: '#FF6B35',
    media: COLORS.warning,
    baixa: COLORS.secondary
  };

  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTicketStats(),
        loadHoursStats(),
        loadInventoryStats(),
        loadDetailedTickets()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
      toast.success('Dados atualizados com sucesso');
    } finally {
      setRefreshing(false);
    }
  };

  const loadTicketStats = async () => {
    try {
      const { data } = await ticketService.getStatistics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setTicketStats(data?.statistics || data || {});
    } catch (error) {
      console.error('Erro ao carregar estatísticas de tickets:', error);
      setTicketStats({});
    }
  };

  const loadHoursStats = async () => {
    try {
      const { data } = await hoursService.getStatistics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setHoursStats(data || {});
    } catch (error) {
      console.error('Erro ao carregar estatísticas de horas:', error);
      setHoursStats({});
    }
  };

  const loadInventoryStats = async () => {
    try {
      const { data } = await inventoryService.getStatistics();
      setInventoryStats(data?.statistics || data || {});
    } catch (error) {
      console.error('Erro ao carregar estatísticas de inventário:', error);
      setInventoryStats({});
    }
  };

  const loadDetailedTickets = async () => {
    try {
      const { data } = await ticketService.getTickets({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000
      });
      setDetailedTickets(data?.tickets || data || []);
    } catch (error) {
      console.error('Erro ao carregar tickets detalhados:', error);
      setDetailedTickets([]);
    }
  };

  // Preparar dados para gráficos
  const prepareTicketStatusData = () => {
    if (!ticketStats?.byStatus) return [];
    
    return Object.entries(ticketStats.byStatus).map(([status, count]) => ({
      name: getStatusLabel(status),
      value: count,
      color: STATUS_COLORS[status] || COLORS.gray
    }));
  };

  const prepareTicketTrendData = () => {
    if (!detailedTickets.length) return [];

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = detailedTickets.filter(ticket => 
        ticket.createdAt.split('T')[0] === dateStr
      );

      last30Days.push({
        date: date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
        tickets: dayTickets.length,
        resolved: dayTickets.filter(t => t.status === 'resolvido' || t.status === 'fechado').length
      });
    }

    return last30Days;
  };

  const preparePriorityData = () => {
    if (!detailedTickets.length) return [];

    const priorityCount = detailedTickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(priorityCount).map(([priority, count]) => ({
      name: getPriorityLabel(priority),
      value: count,
      color: PRIORITY_COLORS[priority] || COLORS.gray
    }));
  };

  const prepareHoursData = () => {
    if (!hoursStats?.banks) return [];

    return hoursStats.banks.map(bank => ({
      client: bank.client?.name || 'Cliente',
      totalHours: parseInt(bank.dataValues?.totalHours || 0),
      usedHours: parseInt(bank.dataValues?.usedHours || 0),
      remainingHours: parseInt(bank.dataValues?.totalHours || 0) - parseInt(bank.dataValues?.usedHours || 0)
    }));
  };

  const getStatusLabel = (status) => {
    const labels = {
      novo: 'Novo',
      em_progresso: 'Em Progresso',
      aguardando_cliente: 'Aguardando Cliente',
      resolvido: 'Resolvido',
      fechado: 'Fechado'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      urgente: 'Urgente',
      alta: 'Alta',
      media: 'Média',
      baixa: 'Baixa'
    };
    return labels[priority] || priority;
  };

  // Funções de export
  const exportTicketsReport = () => {
    if (!ticketStats) return;

    const reportData = {
      total: ticketStats.total,
      byStatus: Object.entries(ticketStats.byStatus).map(([status, count]) => ({
        status: getStatusLabel(status),
        count
      })),
      byPriority: preparePriorityData().map(item => ({
        priority: item.name,
        count: item.value
      }))
    };

    exportStatsToPDF(reportData, `relatorio-tickets-${dateRange.startDate}-${dateRange.endDate}.pdf`);
    toast.success('Relatório de tickets exportado');
  };

  const exportHoursReport = () => {
    if (!hoursStats?.banks) return;

    const reportData = hoursStats.banks.map(bank => ({
      clientName: bank.client?.name || 'Cliente',
      totalHours: parseInt(bank.dataValues?.totalHours || 0),
      usedHours: parseInt(bank.dataValues?.usedHours || 0),
      balance: parseInt(bank.dataValues?.totalHours || 0) - parseInt(bank.dataValues?.usedHours || 0),
      status: parseInt(bank.dataValues?.totalHours || 0) > parseInt(bank.dataValues?.usedHours || 0) ? 'Ativo' : 'Esgotado'
    }));

    exportHoursReportToPDF(reportData, `relatorio-horas-${dateRange.startDate}-${dateRange.endDate}.pdf`);
    toast.success('Relatório de horas exportado');
  };

  const exportCSVData = () => {
    let data = [];
    let filename = '';

    switch (activeTab) {
      case 'tickets':
        data = detailedTickets.map(ticket => ({
          'Número': ticket.ticketNumber,
          'Assunto': ticket.subject,
          'Status': getStatusLabel(ticket.status),
          'Prioridade': getPriorityLabel(ticket.priority),
          'Solicitante': ticket.requester?.name || '',
          'Responsável': ticket.assignee?.name || '',
          'Data Criação': new Date(ticket.createdAt).toLocaleDateString('pt-PT'),
          'Última Atualização': new Date(ticket.updatedAt).toLocaleDateString('pt-PT')
        }));
        filename = `tickets-${dateRange.startDate}-${dateRange.endDate}.csv`;
        break;
      case 'hours':
        data = prepareHoursData();
        filename = `horas-${dateRange.startDate}-${dateRange.endDate}.csv`;
        break;
      case 'inventory':
        if (inventoryStats?.assets?.byType) {
          data = inventoryStats.assets.byType.map(item => ({
            'Tipo': item.type,
            'Quantidade': item.count
          }));
        }
        filename = `inventario-${dateRange.startDate}-${dateRange.endDate}.csv`;
        break;
    }

    if (data.length > 0) {
      exportToCSV(data, filename);
      toast.success('Dados exportados para CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Avançados</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise detalhada e exportação de dados
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportCSVData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros de Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Período:</span>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
          <span className="text-gray-500">até</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'tickets', label: 'Tickets', icon: BarChart3 },
            { id: 'hours', label: 'Bolsa de Horas', icon: Clock },
            { id: 'inventory', label: 'Inventário', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Tickets</p>
                  <p className="text-2xl font-bold">{ticketStats?.total || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Progresso</p>
                  <p className="text-2xl font-bold">{ticketStats?.byStatus?.em_progresso || 0}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolvidos</p>
                  <p className="text-2xl font-bold">{ticketStats?.byStatus?.resolvido || 0}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Novos</p>
                  <p className="text-2xl font-bold">{ticketStats?.byStatus?.novo || 0}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Tickets por Status</h3>
                <button
                  onClick={exportTicketsReport}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prepareTicketStatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareTicketStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Tendência */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Tendência dos Últimos 30 Dias</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={prepareTicketTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="tickets" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} name="Criados" />
                  <Area type="monotone" dataKey="resolved" stackId="2" stroke={COLORS.secondary} fill={COLORS.secondary} name="Resolvidos" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Prioridade */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Tickets por Prioridade</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={preparePriorityData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.primary}>
                    {preparePriorityData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="space-y-6">
          {/* Resumo de Horas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Clientes</p>
                  <p className="text-2xl font-bold">{hoursStats?.banks?.length || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Horas Totais</p>
                  <p className="text-2xl font-bold">
                    {prepareHoursData().reduce((acc, item) => acc + item.totalHours, 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Horas Utilizadas</p>
                  <p className="text-2xl font-bold">
                    {prepareHoursData().reduce((acc, item) => acc + item.usedHours, 0)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Horas por Cliente */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Utilização de Horas por Cliente</h3>
              <button
                onClick={exportHoursReport}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={prepareHoursData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="client" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalHours" fill={COLORS.primary} name="Total de Horas" />
                <Bar dataKey="usedHours" fill={COLORS.warning} name="Horas Utilizadas" />
                <Bar dataKey="remainingHours" fill={COLORS.secondary} name="Horas Restantes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && inventoryStats && (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Assets</p>
                  <p className="text-2xl font-bold">{inventoryStats.assets?.total || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assets Ativos</p>
                  <p className="text-2xl font-bold">{inventoryStats.assets?.active || 0}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Licenças</p>
                  <p className="text-2xl font-bold">{inventoryStats.licenses?.total || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <PieChartIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Software</p>
                  <p className="text-2xl font-bold">{inventoryStats.software?.total || 0}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Assets por Tipo */}
          {inventoryStats.assets?.byType && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Assets por Tipo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryStats.assets.byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;