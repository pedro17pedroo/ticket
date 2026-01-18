import { useState, useEffect } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Table from '../../components/common/Table';
import dashboardService from '../../services/dashboardService';
import { showError } from '../../utils/alerts';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    loadLogs();
  }, [dateRange]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getAuditLogs({ period: dateRange });
      
      // Mapear dados do backend para o formato esperado pelo frontend
      const mappedLogs = (data.logs || []).map(log => ({
        timestamp: log.createdAt,
        user: {
          name: log.userName || 'Sistema',
          email: log.userEmail || '-'
        },
        action: log.action,
        resourceType: log.entityType,
        resourceId: log.entityId,
        details: log.reason || log.metadata?.description || '-',
        ipAddress: log.ipAddress || '-'
      }));
      
      setLogs(mappedLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      showError('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString()}.json`;
    link.click();
  };

  const getActionBadge = (action) => {
    const variants = {
      create: 'success',
      update: 'primary',
      delete: 'danger',
      login: 'secondary',
      logout: 'secondary'
    };
    return <Badge variant={variants[action] || 'secondary'}>{action.toUpperCase()}</Badge>;
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (log) => new Date(log.timestamp).toLocaleString('pt-BR')
    },
    {
      header: 'Usuário',
      accessor: 'user',
      render: (log) => (
        <div>
          <div className="font-medium text-gray-900">{log.user?.name || 'Sistema'}</div>
          <div className="text-sm text-gray-500">{log.user?.email || '-'}</div>
        </div>
      )
    },
    {
      header: 'Ação',
      accessor: 'action',
      render: (log) => getActionBadge(log.action)
    },
    {
      header: 'Recurso',
      accessor: 'resource',
      render: (log) => (
        <div>
          <div className="font-medium">{log.resourceType}</div>
          <div className="text-sm text-gray-500">{log.resourceId}</div>
        </div>
      )
    },
    {
      header: 'Detalhes',
      accessor: 'details',
      render: (log) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {log.details || '-'}
        </div>
      )
    },
    {
      header: 'IP',
      accessor: 'ipAddress',
      render: (log) => <span className="font-mono text-sm">{log.ipAddress}</span>
    }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      log.resourceType?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
          <p className="text-gray-600 mt-1">Histórico completo de ações no sistema</p>
        </div>
        <Button
          icon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          Exportar
        </Button>
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
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas as Ações</option>
            <option value="create">Criar</option>
            <option value="update">Atualizar</option>
            <option value="delete">Deletar</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="24hours">Últimas 24h</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="90days">Últimos 90 dias</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <Table
            columns={columns}
            data={filteredLogs}
            emptyMessage="Nenhum log de auditoria encontrado"
          />
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;
