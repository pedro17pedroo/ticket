import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import paymentService from '../../services/paymentService';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentHistory(filters);
      if (response.success) {
        setPayments(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (transactionId) => {
    try {
      const response = await paymentService.getReceipt(transactionId);
      if (response.success && response.data.pdfUrl) {
        window.open(response.data.pdfUrl, '_blank');
      } else {
        alert('Recibo não disponível');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Erro ao baixar recibo');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'yellow', text: 'Pendente', icon: Clock },
      completed: { color: 'green', text: 'Pago', icon: CheckCircle },
      failed: { color: 'red', text: 'Falhou', icon: XCircle },
      expired: { color: 'gray', text: 'Expirado', icon: XCircle }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getMethodName = (method) => {
    const names = {
      ekwanza: 'E-Kwanza',
      gpo: 'Multicaixa Express',
      ref: 'Referência Multicaixa'
    };
    return names[method] || method;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Histórico de Pagamentos</h2>
        
        {/* Filtros */}
        <div className="flex items-center space-x-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="completed">Pago</option>
            <option value="failed">Falhou</option>
            <option value="expired">Expirado</option>
          </select>

          <select
            value={filters.method}
            onChange={(e) => setFilters({ ...filters, method: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos os Métodos</option>
            <option value="ekwanza">E-Kwanza</option>
            <option value="gpo">Multicaixa Express</option>
            <option value="ref">Referência Multicaixa</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum pagamento encontrado</p>
        </div>
      ) : (
        <>
          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Método</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Referência</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(payment.createdAt).toLocaleDateString('pt-AO')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">
                        Kz {payment.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700">{getMethodName(payment.paymentMethod)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-gray-600">{payment.referenceCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => handleDownloadReceipt(payment.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Recibo</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentHistory;
