import { useState, useEffect } from 'react';
import { Search, Filter, X, Save, BookmarkPlus } from 'lucide-react';
import api from '../services/api';

const AdvancedSearch = ({ onSearch, onSaveSearch }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    type: '',
    categoryId: '',
    departmentId: '',
    assigneeId: '',
    requesterId: '',
    dateFrom: '',
    dateTo: ''
  });

  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    try {
      const [categoriesRes, departmentsRes, usersRes, clientsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/departments'),
        api.get('/users'),
        api.get('/clients-b2b')
      ]);

      setCategories(categoriesRes.data.categories || []);
      setDepartments(departmentsRes.data.departments || []);
      setUsers(usersRes.data.users || []);
      setClients(clientsRes.data.clients || []);
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    // Remove filtros vazios
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});

    onSearch(activeFilters);
  };

  const handleClear = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      type: '',
      categoryId: '',
      departmentId: '',
      assigneeId: '',
      requesterId: '',
      dateFrom: '',
      dateTo: ''
    });
    onSearch({});
  };

  const handleSave = () => {
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});

    if (Object.keys(activeFilters).length === 0) {
      return;
    }

    const name = prompt('Nome da pesquisa:');
    if (name) {
      onSaveSearch?.({ name, filters: activeFilters });
    }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold">Busca Avançada</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-xs font-medium rounded-full">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Pesquisar por número ou assunto..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Todos</option>
                <option value="aberto">Aberto</option>
                <option value="em-progresso">Em Progresso</option>
                <option value="resolvido">Resolvido</option>
                <option value="fechado">Fechado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2">Prioridade</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Todas</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Todos</option>
                <option value="incidente">Incidente</option>
                <option value="requisicao">Requisição</option>
                <option value="problema">Problema</option>
                <option value="mudanca">Mudança</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium mb-2">Departamento</label>
              <select
                value={filters.departmentId}
                onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Todos</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium mb-2">Atribuído a</label>
              <select
                value={filters.assigneeId}
                onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Todos</option>
                <option value="unassigned">Não atribuído</option>
                {users.filter(u => u.role === 'agente' || u.role === 'admin-org').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Requester */}
            <div>
              <label className="block text-sm font-medium mb-2">Solicitante</label>
              <select
                value={filters.requesterId}
                onChange={(e) => handleFilterChange('requesterId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Todos</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium mb-2">Data De</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium mb-2">Data Até</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Aplicar Filtros
            </button>
            <button
              onClick={handleSave}
              disabled={activeFiltersCount === 0}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              title="Salvar pesquisa"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
