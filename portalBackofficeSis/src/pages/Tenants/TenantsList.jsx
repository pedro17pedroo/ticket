import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tenantService } from '../../services/tenantService';
import { Plus, Search, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { confirmInput, confirmAction } from '../../utils/alerts';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, suspended

  useEffect(() => {
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const data = await tenantService.getTenants(params);
      setTenants(data.tenants || []);
    } catch (err) {
      setError('Erro ao carregar tenants');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tenants</h1>
          <p className="text-gray-600 mt-1">Gerenciar organizações do sistema</p>
        </div>
        <Link
          to="/tenants/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Tenant
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de Status */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Lista de Tenants */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.length > 0 ? (
            filteredTenants.map((tenant) => (
              <TenantCard key={tenant.id} tenant={tenant} onUpdate={loadTenants} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nenhum tenant encontrado</p>
              <p className="text-gray-400 mt-2">Crie o primeiro tenant para começar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TenantCard({ tenant, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleSuspend = async () => {
    const reason = await confirmInput(
      'Suspender Tenant',
      `Deseja suspender o tenant "${tenant.name}"?`,
      'Motivo da suspensão'
    );

    if (reason) {
      try {
        setLoading(true);
        await tenantService.suspendTenant(tenant.id, reason);
        onUpdate();
      } catch (err) {
        console.error('Erro ao suspender tenant:', err);
        alert('Erro ao suspender tenant');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActivate = async () => {
    const confirmed = await confirmAction(
      'Reativar Tenant',
      `Deseja reativar o tenant "${tenant.name}"?`
    );

    if (confirmed) {
      try {
        setLoading(true);
        await tenantService.activateTenant(tenant.id);
        onUpdate();
      } catch (err) {
        console.error('Erro ao reativar tenant:', err);
        alert('Erro ao reativar tenant');
      } finally {
        setLoading(false);
      }
    }
  };

  const isSuspended = tenant.suspendedAt !== null;

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 ${isSuspended ? 'opacity-75 border-2 border-red-200' : ''
      }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{tenant.name}</h3>
            <p className="text-sm text-gray-500">{tenant.slug}.tatuticket.com</p>
          </div>
        </div>
        {isSuspended && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            Suspenso
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Email:</span> {tenant.email}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Plano:</span> {tenant.subscription?.plan || 'N/A'}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Deployment:</span> {tenant.deployment || 'cloud'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/tenants/${tenant.id}`}
          className="flex-1 text-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          Detalhes
        </Link>
        {isSuspended ? (
          <button
            onClick={handleActivate}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Ativando...' : 'Reativar'}
          </button>
        ) : (
          <button
            onClick={handleSuspend}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Suspendendo...' : 'Suspender'}
          </button>
        )}
      </div>
    </div>
  );
}
