import { useState, useEffect } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Table from '../../components/common/Table';
import dashboardService from '../../services/dashboardService';
import { showError } from '../../utils/alerts';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getLogs();
      setLogs(data.logs || []);
    } catch (error) {
      showError('Erro ao carregar logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const handleExport = () => {
    // Implementar exportação de logs
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString()}.json`;
    link.click();
  };

  const getLevelBadge = (level) => {
    const variants = {
      error: 'danger',
      warning: 'warning',
      info: 'primary',
      debug: 'secondary'
    };
    return <Badge variant={variants[level] || 'secondary'}>{level.toUpperCase()}</Badge>;
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (log) => (
        <div className="text-sm">
          {new Date(log.timestamp).toLocaleString('pt-BR')}
        </div>
      )
    },
    {
      header: 'Nível',
      accessor: 'level',
      render: (log) => getLevelBadge(log.level)
    },
    {
      header: 'Mensagem',
      accessor: 'message',
      render: (log) => (
        <div className="max-w-md">
          <div className="font-medium text-gray-900">{log.message}</div>
          {log.details && (
            <div className="text-sm text-gray-500 mt-1">{log.details}</div>
          )}
        </div>
      )
    },
    {
      header: 'Origem',
      accessor: 'source',
      render: (log) => (
        <div className="text-sm">
          <div>{log.source}</div>
          {log.userId && (
            <div className="text-gray-500">User: {log.userId}</div>
          )}
        </div>
      )
    }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
                         (log.details && log.details.toLowerCase().includes(search.toLowerCase()));
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
          <p className="text-gray-600 mt-1">Visualize e analise os logs da aplicação</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExport}
          >
            Exportar
          </Button>
          <Button
            icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{logs.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Erros</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {logs.filter(l => l.level === 'error').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Avisos</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {logs.filter(l => l.level === 'warning').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Info</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {logs.filter(l => l.level === 'info').length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os Níveis</option>
            <option value="error">Erro</option>
            <option value="warning">Aviso</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <Table
            columns={columns}
            data={filteredLogs}
            emptyMessage="Nenhum log encontrado"
          />
        )}
      </Card>
    </div>
  );
};

export default Logs;
