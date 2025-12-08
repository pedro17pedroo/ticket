import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import organizationService from '../../services/organizationService';
import { showSuccess, showError } from '../../utils/alerts';

const OrganizationsList = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getAll();
      setOrganizations(data.organizations || []);
    } catch (error) {
      showError('Erro ao carregar organizações');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    if (!confirm('Deseja suspender esta organização?')) return;
    try {
      await organizationService.suspend(id, 'Suspensão manual');
      showSuccess('Organização suspensa com sucesso');
      loadOrganizations();
    } catch (error) {
      showError('Erro ao suspender organização');
    }
  };

  const handleActivate = async (id) => {
    try {
      await organizationService.activate(id);
      showSuccess('Organização ativada com sucesso');
      loadOrganizations();
    } catch (error) {
      showError('Erro ao ativar organização');
    }
  };

  const columns = [
    {
      header: 'Nome',
      accessor: 'name',
      render: (org) => (
        <div>
          <div className="font-medium text-gray-900">{org.name}</div>
          <div className="text-sm text-gray-500">{org.email}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (org) => (
        <Badge variant={org.isActive ? 'success' : 'danger'}>
          {org.isActive ? 'Ativo' : 'Suspenso'}
        </Badge>
      )
    },
    {
      header: 'Plano',
      accessor: 'subscription',
      render: (org) => (
        <Badge variant="primary">
          {org.subscription?.plan || 'N/A'}
        </Badge>
      )
    },
    {
      header: 'Usuários',
      accessor: 'stats',
      render: (org) => org.stats?.totalUsers || 0
    },
    {
      header: 'Criado em',
      accessor: 'createdAt',
      render: (org) => new Date(org.createdAt).toLocaleDateString('pt-BR')
    },
    {
      header: 'Ações',
      render: (org) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/organizations/${org.id}`)}
          >
            Ver
          </Button>
          {org.isActive ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleSuspend(org.id)}
            >
              Suspender
            </Button>
          ) : (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleActivate(org.id)}
            >
              Ativar
            </Button>
          )}
        </div>
      )
    }
  ];

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
                         org.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && org.isActive) ||
                         (statusFilter === 'suspended' && !org.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizações</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as organizações do sistema</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/organizations/new')}
        >
          Nova Organização
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar organizações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <Table
            columns={columns}
            data={filteredOrganizations}
            emptyMessage="Nenhuma organização encontrada"
          />
        )}
      </Card>
    </div>
  );
};

export default OrganizationsList;
