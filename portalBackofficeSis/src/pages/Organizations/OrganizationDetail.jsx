import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Users, Building2, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Table from '../../components/common/Table';
import organizationService from '../../services/organizationService';
import { showError } from '../../utils/alerts';

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadOrganization();
  }, [id]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const [orgData, usersData, clientsData] = await Promise.all([
        organizationService.getById(id),
        organizationService.getUsers(id),
        organizationService.getClients(id)
      ]);
      setOrganization(orgData);
      setUsers(usersData.users || []);
      setClients(clientsData.clients || []);
    } catch (error) {
      showError('Erro ao carregar organização');
    } finally {
      setLoading(false);
    }
  };

  const userColumns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      accessor: 'role',
      render: (user) => <Badge variant="primary">{user.role}</Badge>
    },
    { 
      header: 'Status', 
      accessor: 'isActive',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'danger'}>
          {user.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  ];

  const clientColumns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Telefone', accessor: 'phone' },
    { 
      header: 'Status', 
      accessor: 'isActive',
      render: (client) => (
        <Badge variant={client.isActive ? 'success' : 'danger'}>
          {client.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  ];

  if (loading) return <Loading />;
  if (!organization) return <div>Organização não encontrada</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/organizations')}
          >
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600 mt-1">{organization.email}</p>
          </div>
        </div>
        <Button
          icon={<Edit className="w-4 h-4" />}
          onClick={() => navigate(`/organizations/${id}/edit`)}
        >
          Editar
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clients'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Clientes ({clients.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Detalhes da Organização</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{organization.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{organization.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{organization.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="font-medium">{organization.address || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Criado em</p>
                  <p className="font-medium">
                    {new Date(organization.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Status</h2>
              <Badge variant={organization.isActive ? 'success' : 'danger'} className="text-base">
                {organization.isActive ? 'Ativo' : 'Suspenso'}
              </Badge>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4">Plano</h2>
              <Badge variant="primary" className="text-base">
                {organization.subscription?.plan || 'N/A'}
              </Badge>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4">Estatísticas</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuários</span>
                  <span className="font-semibold">{organization.stats?.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clientes</span>
                  <span className="font-semibold">{organization.stats?.totalClients || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tickets</span>
                  <span className="font-semibold">{organization.stats?.totalTickets || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <Table
            columns={userColumns}
            data={users}
            emptyMessage="Nenhum usuário encontrado"
          />
        </Card>
      )}

      {activeTab === 'clients' && (
        <Card>
          <Table
            columns={clientColumns}
            data={clients}
            emptyMessage="Nenhum cliente encontrado"
          />
        </Card>
      )}
    </div>
  );
};

export default OrganizationDetail;
