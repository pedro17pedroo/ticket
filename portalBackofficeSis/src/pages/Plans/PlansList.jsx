import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import planService from '../../services/planService';
import { showSuccess, showError } from '../../utils/alerts';

const PlansList = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await planService.getAll();
      setPlans(data.plans || []);
    } catch (error) {
      showError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await planService.deactivate(id);
        showSuccess('Plano desativado com sucesso');
      } else {
        await planService.activate(id);
        showSuccess('Plano ativado com sucesso');
      }
      loadPlans();
    } catch (error) {
      showError('Erro ao alterar status do plano');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const columns = [
    {
      header: 'Plano',
      accessor: 'name',
      render: (plan) => (
        <div>
          <div className="font-medium text-gray-900">{plan.name}</div>
          <div className="text-sm text-gray-500">{plan.description}</div>
        </div>
      )
    },
    {
      header: 'Preço',
      accessor: 'price',
      render: (plan) => (
        <div>
          <div className="font-semibold text-gray-900">{formatCurrency(plan.price)}</div>
          <div className="text-sm text-gray-500">/{plan.billingCycle}</div>
        </div>
      )
    },
    {
      header: 'Limites',
      render: (plan) => (
        <div className="text-sm">
          <div>{plan.limits?.maxUsers || 0} usuários</div>
          <div>{plan.limits?.maxClients || 0} clientes</div>
          <div>{plan.limits?.maxStorage || 0} GB</div>
        </div>
      )
    },
    {
      header: 'Organizações',
      accessor: 'organizationCount',
      render: (plan) => (
        <Badge variant="primary">
          {plan.organizationCount || 0}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (plan) => (
        <Badge variant={plan.isActive ? 'success' : 'danger'}>
          {plan.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      header: 'Ações',
      render: (plan) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/plans/${plan.id}/edit`)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant={plan.isActive ? 'danger' : 'success'}
            onClick={() => handleToggleStatus(plan.id, plan.isActive)}
          >
            {plan.isActive ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      )
    }
  ];

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(search.toLowerCase()) ||
    plan.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
          <p className="text-gray-600 mt-1">Gerencie os planos de assinatura</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/plans/new')}
        >
          Novo Plano
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar planos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <Table
            columns={columns}
            data={filteredPlans}
            emptyMessage="Nenhum plano encontrado"
          />
        )}
      </Card>
    </div>
  );
};

export default PlansList;
