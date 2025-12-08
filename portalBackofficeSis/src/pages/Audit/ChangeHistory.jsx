import { useState, useEffect } from 'react';
import { Search, Download, History } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import dashboardService from '../../services/dashboardService';
import { showError } from '../../utils/alerts';

const ChangeHistory = () => {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');

  useEffect(() => {
    loadChanges();
  }, []);

  const loadChanges = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getChangeHistory();
      setChanges(data.changes || []);
    } catch (error) {
      showError('Erro ao carregar histórico de alterações');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredChanges, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `change-history-${new Date().toISOString()}.json`;
    link.click();
  };

  const mockChanges = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      user: { name: 'Admin User', email: 'admin@tatuticket.com' },
      resourceType: 'Organization',
      resourceName: 'Tech Solutions',
      field: 'status',
      oldValue: 'active',
      newValue: 'suspended',
      reason: 'Pagamento pendente'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: { name: 'João Silva', email: 'joao@tatuticket.com' },
      resourceType: 'User',
      resourceName: 'Maria Santos',
      field: 'role',
      oldValue: 'support',
      newValue: 'admin',
      reason: 'Promoção'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: { name: 'Maria Santos', email: 'maria@tatuticket.com' },
      resourceType: 'Plan',
      resourceName: 'Professional',
      field: 'price',
      oldValue: '299.90',
      newValue: '349.90',
      reason: 'Reajuste anual'
    }
  ];

  const filteredChanges = (changes.length > 0 ? changes : mockChanges).filter(change => {
    const matchesSearch = 
      change.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      change.resourceName?.toLowerCase().includes(search.toLowerCase()) ||
      change.field?.toLowerCase().includes(search.toLowerCase());
    const matchesResource = resourceFilter === 'all' || change.resourceType === resourceFilter;
    return matchesSearch && matchesResource;
  });

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Alterações</h1>
          <p className="text-gray-600 mt-1">Rastreamento detalhado de mudanças</p>
        </div>
        <Button
          icon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          Exportar
        </Button>
      </div>

      <Card className="mb-6">
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alterações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os Recursos</option>
            <option value="Organization">Organizações</option>
            <option value="User">Usuários</option>
            <option value="Plan">Planos</option>
            <option value="Settings">Configurações</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredChanges.map((change) => (
            <div
              key={change.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <History className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{change.user?.name}</span>
                      <span className="text-gray-500">alterou</span>
                      <Badge variant="primary">{change.resourceType}</Badge>
                      <span className="font-medium text-gray-900">{change.resourceName}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Campo: <span className="font-medium">{change.field}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="bg-red-50 text-red-700 px-2 py-1 rounded">
                        <span className="line-through">{change.oldValue}</span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="bg-green-50 text-green-700 px-2 py-1 rounded">
                        {change.newValue}
                      </div>
                    </div>
                    {change.reason && (
                      <div className="mt-2 text-sm text-gray-500">
                        Motivo: {change.reason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-right">
                  {new Date(change.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredChanges.length === 0 && (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma alteração encontrada</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChangeHistory;
