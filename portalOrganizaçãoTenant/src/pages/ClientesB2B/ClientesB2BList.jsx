import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientB2BService } from '../../services/clientB2BService';
import { Plus, Search, Building2, Users, Ticket, AlertCircle } from 'lucide-react';

export default function ClientesB2BList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientB2BService.getClients();
      setClients(data.clients || []);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadClients}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes B2B</h1>
          <p className="text-gray-600 mt-1">Gerenciar empresas clientes</p>
        </div>
        <Link
          to="/clientes-b2b/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou NIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} onUpdate={loadClients} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Nenhum cliente encontrado</p>
          <p className="text-gray-400 mt-2">Crie o primeiro cliente para começar</p>
        </div>
      )}
    </div>
  );
}

function ClientCard({ client, onUpdate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      const data = await clientB2BService.getClientStats(client.id);
      setStats(data.stats);
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    }
  };

  const isActive = client.isActive;

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 ${
      !isActive ? 'opacity-75 border-2 border-gray-200' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg truncate">{client.name}</h3>
            {client.taxId && (
              <p className="text-sm text-gray-500">NIF: {client.taxId}</p>
            )}
          </div>
        </div>
        {!isActive && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded flex-shrink-0">
            Inativo
          </span>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-1 mb-4 text-sm">
        {client.email && (
          <p className="text-gray-600 truncate">📧 {client.email}</p>
        )}
        {client.phone && (
          <p className="text-gray-600">📞 {client.phone}</p>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{stats.users || 0}</p>
            <p className="text-xs text-gray-500">Usuários</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Ticket className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{stats.tickets || 0}</p>
            <p className="text-xs text-gray-500">Tickets</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/clientes-b2b/${client.id}`}
          className="flex-1 text-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          Detalhes
        </Link>
        <Link
          to={`/clientes-b2b/${client.id}/users`}
          className="flex-1 text-center px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          Usuários
        </Link>
      </div>
    </div>
  );
}
