import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import userService from '../../services/userService';
import { showSuccess, showError } from '../../utils/alerts';

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data.users || []);
    } catch (error) {
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await userService.deactivate(id);
        showSuccess('Usuário desativado com sucesso');
      } else {
        await userService.activate(id);
        showSuccess('Usuário ativado com sucesso');
      }
      loadUsers();
    } catch (error) {
      showError('Erro ao alterar status do usuário');
    }
  };

  const columns = [
    {
      header: 'Usuário',
      accessor: 'name',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (user) => {
        const roleColors = {
          'super-admin': 'danger',
          'admin': 'warning',
          'manager': 'primary',
          'support': 'secondary'
        };
        return (
          <Badge variant={roleColors[user.role] || 'secondary'}>
            {user.role}
          </Badge>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'danger'}>
          {user.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      header: 'Último Acesso',
      accessor: 'lastLogin',
      render: (user) => user.lastLogin 
        ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
        : 'Nunca'
    },
    {
      header: 'Criado em',
      accessor: 'createdAt',
      render: (user) => new Date(user.createdAt).toLocaleDateString('pt-BR')
    },
    {
      header: 'Ações',
      render: (user) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/users/${user.id}/edit`)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant={user.isActive ? 'danger' : 'success'}
            onClick={() => handleToggleStatus(user.id, user.isActive)}
          >
            {user.isActive ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      )
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários Provider</h1>
          <p className="text-gray-600 mt-1">Gerencie os usuários do sistema SaaS</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/users/new')}
        >
          Novo Usuário
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas as Roles</option>
            <option value="super-admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="support">Support</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <Table
            columns={columns}
            data={filteredUsers}
            emptyMessage="Nenhum usuário encontrado"
          />
        )}
      </Card>
    </div>
  );
};

export default UsersList;
