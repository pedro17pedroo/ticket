import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  Loader2,
  Filter,
  Box,
  Printer,
  Monitor,
  Wifi,
  Database,
  Server,
  HardDrive,
  Cpu,
  Laptop,
  Smartphone,
  Package,
  FileText,
  Settings,
  Wrench,
  Users,
  UserPlus,
  Key,
  Lock,
  Shield,
  Mail,
  MessageSquare,
  Headphones,
  HelpCircle,
  Clipboard,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Icon mapping for catalog items
const iconMap = {
  Box, Printer, Monitor, Wifi, Database, Server, HardDrive, Cpu,
  Laptop, Smartphone, Package, FileText, Settings, Wrench,
  Users, UserPlus, Key, Lock, Shield, Mail, MessageSquare,
  Headphones, HelpCircle, Clipboard, ShoppingCart, Clock, CheckCircle,
  XCircle, AlertCircle, Eye, Calendar
};

// Helper function to get icon component from name
const getIconComponent = (iconName) => {
  if (!iconName) return null;
  return iconMap[iconName] || Package;
};

const MyRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const hasFetched = useRef(false);

  // Advanced filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    // Prevent duplicate calls in React.StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Always load all requests without status filter
      const response = await api.get('/catalog/requests');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar suas solicitações');
    } finally {
      setLoading(false);
    }
  };


  // Status configs
  const statusConfig = {
    pending_approval: {
      label: 'Aguardando Aprovação',
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600'
    },
    approved: {
      label: 'Aprovado',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600'
    },
    rejected: {
      label: 'Rejeitado',
      icon: XCircle,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600'
    },
    in_progress: {
      label: 'Em Andamento',
      icon: Clock,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600'
    },
    completed: {
      label: 'Concluído',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600'
    },
    cancelled: {
      label: 'Cancelado',
      icon: XCircle,
      color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
      iconColor: 'text-gray-600'
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter requests client-side with advanced filters
  const filteredRequests = requests.filter(request => {
    // Status filter
    if (filterStatus !== 'all' && request.status !== filterStatus) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        request.catalogItem?.name?.toLowerCase().includes(searchLower) ||
        request.id?.toLowerCase().includes(searchLower) ||
        request.ticketId?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const requestDate = new Date(request.createdAt);
      if (dateFrom && requestDate < new Date(dateFrom)) return false;
      if (dateTo && requestDate > new Date(dateTo + 'T23:59:59')) return false;
    }

    return true;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setFilterStatus('all');
    setShowAdvancedFilters(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Acompanhe o status de suas solicitações de serviço
          </p>
        </div>

        <button
          onClick={() => navigate('/service-catalog')}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          Nova Solicitação
        </button>
      </div>

      {/* Search and Advanced Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome do serviço, ID da solicitação ou ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showAdvancedFilters || dateFrom || dateTo
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros Avançados
          </button>

          {/* Clear Filters */}
          {(searchTerm || dateFrom || dateTo || filterStatus !== 'all') && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Inicial
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Final
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${filterStatus === 'all'
            ? 'bg-primary-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          Todas ({filteredRequests.length})
        </button>

        {Object.entries(statusConfig).map(([status, config]) => {
          const count = filteredRequests.filter(r => r.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${filterStatus === status
                ? config.color
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              <config.icon className="w-4 h-4" />
              {config.label}
              {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma solicitação encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || dateFrom || dateTo || filterStatus !== 'all'
              ? 'Nenhuma solicitação corresponde aos filtros aplicados'
              : 'Você ainda não fez nenhuma solicitação de serviço'
            }
          </p>
          {(!searchTerm && !dateFrom && !dateTo && filterStatus === 'all') && (
            <button
              onClick={() => navigate('/service-catalog')}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Fazer Primeira Solicitação
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentRequests.map((request) => {
            const config = statusConfig[request.status] || statusConfig.in_progress;
            const StatusIcon = config.icon;
            const CatalogIcon = getIconComponent(request.catalogItem?.icon);

            return (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:border-primary-300 dark:hover:border-primary-700 flex flex-col"
              >
                {/* Header com ícone, nome e ticket */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      {CatalogIcon ? (
                        <CatalogIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base line-clamp-2 mb-1">
                        {request.catalogItem?.name}
                      </h3>
                      {/* Ticket ID */}
                      {request.ticketId ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary-500" />
                          <span className="font-medium text-primary-600 dark:text-primary-400">
                            #{request.ticketId.slice(0, 8)}
                          </span>
                          {request.ticket?.status && (
                            <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                              {request.ticket.status}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Aguardando processamento
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="font-medium text-sm">{config.label}</span>
                  </div>
                </div>

                {/* Body com informações */}
                <div className="p-4 flex-1 space-y-3">
                  {/* Solicitante */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">Solicitante:</span>
                      <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                        {request.requester?.name || request.requester?.email || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Data de criação */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">Criado em:</span>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Approval/Rejection info */}
                  {request.status === 'approved' && request.approvalComments && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">
                        ✓ Aprovado
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400 line-clamp-2">
                        {request.approvalComments}
                      </p>
                    </div>
                  )}

                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">
                        ✗ Rejeitado
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-400 line-clamp-2">
                        {request.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer com ação */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  {request.ticketId ? (
                    <button
                      onClick={() => navigate(`/tickets/${request.ticketId}`)}
                      className="w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Ticket
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/my-requests/${request.id}`)}
                      className="w-full px-4 py-2.5 border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-gray-600 dark:text-gray-400">por página</span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              A mostrar {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredRequests.length)} de {filteredRequests.length} solicitações
            </div>

            {/* Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primeira página"
                >
                  ««
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 rounded-lg text-sm min-w-[32px] ${
                            currentPage === pageNumber
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  »»
                </button>
              </div>
            )}
          </div>

          {/* Mobile pagination - simplified */}
          {totalPages > 1 && (
            <div className="sm:hidden mt-3 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MyRequests;
