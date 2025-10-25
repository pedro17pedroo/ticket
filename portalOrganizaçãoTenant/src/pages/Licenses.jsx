import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Key, Plus, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';

const Licenses = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadLicenses();
  }, [filterStatus, searchTerm]);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getLicenses({
        status: filterStatus || undefined
      });
      
      let filtered = data.licenses;
      
      if (searchTerm) {
        filtered = filtered.filter(license =>
          license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          license.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          license.product.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setLicenses(filtered);
    } catch (error) {
      console.error('Erro ao carregar licenças:', error);
      toast.error('Erro ao carregar licenças');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'trial':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Ativa',
      expired: 'Expirada',
      suspended: 'Suspensa',
      cancelled: 'Cancelada',
      trial: 'Trial'
    };
    return labels[status] || status;
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Licenças</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Controle e monitore todas as licenças de software
          </p>
        </div>
        <Link
          to="/inventory/licenses/new"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Licença
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, fornecedor, produto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            >
              <option value="">Todos</option>
              <option value="active">Ativa</option>
              <option value="expired">Expirada</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspensa</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Licenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Licença
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Seats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Validade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                </td>
              </tr>
            ) : licenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma licença encontrada</p>
                  <p className="text-sm mt-2">Adicione a primeira licença ou ajuste os filtros</p>
                </td>
              </tr>
            ) : (
              licenses.map((license) => (
                <tr key={license.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <p className="font-medium">{license.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {license.vendor} • {license.product}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                      {license.licenseType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (license.usedSeats / license.totalSeats) * 100 >= 90
                              ? 'bg-red-600'
                              : (license.usedSeats / license.totalSeats) * 100 >= 75
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${(license.usedSeats / license.totalSeats) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">
                        {license.usedSeats}/{license.totalSeats}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {license.expiryDate ? (
                      <div>
                        <p className={isExpiringSoon(license.expiryDate) ? 'text-orange-600 font-medium' : ''}>
                          {new Date(license.expiryDate).toLocaleDateString('pt-PT')}
                        </p>
                        {isExpiringSoon(license.expiryDate) && (
                          <p className="text-xs text-orange-600 mt-1">
                            Expira em breve
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Perpétua</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(license.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(license.status)}`}>
                        {getStatusLabel(license.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/inventory/licenses/${license.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium text-sm"
                    >
                      Ver Detalhes
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Licenses;
