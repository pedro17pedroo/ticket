import { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Clock,
  Euro,
  ArrowRight,
  CheckCircle,
  Calendar,
  TrendingUp,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Star,
  Box,
  Printer,
  Monitor,
  Wifi,
  Database,
  Server,
  HardDrive,
  Mail,
  Phone,
  Settings
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

const ServiceCatalogEnhanced = () => {
  const navigate = useNavigate();
  
  console.log('🚀 ServiceCatalogEnhanced montado');
  
  // Estados principais
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'name', 'recent'

  useEffect(() => {
    console.log('📞 useEffect inicial disparado - carregando catálogo');
    loadCatalog();
  }, []);

  useEffect(() => {
    loadItems();
  }, [selectedCategory, searchTerm, sortBy]);

  // ===== FUNÇÕES HELPER =====
  
  // Renderizar ícone dinamicamente
  const renderIcon = (iconName, className = "w-6 h-6") => {
    const icons = {
      Box, Printer, Monitor, Wifi, Database, Server, 
      HardDrive, Mail, Phone, Settings, ShoppingCart
    };
    
    const IconComponent = icons[iconName] || ShoppingCart;
    return <IconComponent className={className} />;
  };

  // ===== CARREGAR DADOS =====

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const response = await api.get('/catalog/categories', {
        params: { includeStats: true }
      });
      
      console.log('📁 Categorias carregadas:', response.data);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('❌ Erro ao carregar catálogo:', error);
      console.error('Detalhes:', error.response?.data);
      toast.error('Erro ao carregar catálogo de serviços');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const params = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      if (sortBy === 'popular') params.popular = true;

      console.log('🔍 Buscando itens com params:', params);
      const response = await api.get('/catalog/items', { params });
      console.log('📦 Itens carregados:', response.data);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error);
      console.error('Detalhes:', error.response?.data);
    }
  };

  const loadItemDetails = async (itemId) => {
    try {
      const response = await api.get(`/catalog/items/${itemId}`);
      console.log('📦 Detalhes do item:', response.data);
      setSelectedItem(response.data.item || response.data);
      setFormData({});
      setFormErrors({});
      setShowRequestModal(true);
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes do serviço');
    }
  };

  // ===== SUBMIT REQUEST =====

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const response = await api.post(
        `/catalog/items/${selectedItem.id}/request`,
        { formData }
      );

      if (response.data.requiresApproval) {
        toast.success(
          '✅ Solicitação enviada para aprovação!',
          { duration: 3000, icon: '📋' }
        );
      } else {
        toast.success(
          '🎉 Ticket criado automaticamente!',
          { duration: 3000 }
        );
      }

      setShowRequestModal(false);
      setSelectedItem(null);
      setFormData({});

      // Redirecionar após delay
      setTimeout(() => navigate('/my-tickets'), 1500);
    } catch (error) {
      if (error.response?.data?.errors) {
        // Erros de validação
        const errors = {};
        error.response.data.errors.forEach(err => {
          errors[err.field] = err.message;
        });
        setFormErrors(errors);
        toast.error('Por favor, corrija os campos marcados');
      } else {
        toast.error(
          error.response?.data?.error || 'Erro ao solicitar serviço'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ===== RENDER FORM FIELDS =====

  const renderFormField = (field) => {
    const hasError = formErrors[field.name];
    const baseClasses = `w-full px-4 py-2.5 border rounded-lg transition-colors
      ${hasError 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'
      }
      dark:bg-gray-700 focus:ring-2 focus:outline-none`;

    const handleChange = (value) => {
      setFormData({ ...formData, [field.name]: value });
      // Limpar erro ao editar
      if (formErrors[field.name]) {
        const newErrors = { ...formErrors };
        delete newErrors[field.name];
        setFormErrors(newErrors);
      }
    };

    // Verificar se campo deve ser mostrado (condicional)
    if (field.conditional) {
      const { field: condField, operator, value } = field.conditional;
      const condValue = formData[condField];
      
      let shouldShow = false;
      switch (operator) {
        case 'equals':
          shouldShow = condValue === value;
          break;
        case 'notEquals':
          shouldShow = condValue !== value;
          break;
        case 'contains':
          shouldShow = Array.isArray(condValue) && condValue.includes(value);
          break;
        default:
          shouldShow = true;
      }
      
      if (!shouldShow) return null;
    }

    return (
      <div key={field.name} className="mb-4">
        <label className="block text-sm font-medium mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.helpText && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {field.helpText}
          </p>
        )}

        {/* RENDER BY TYPE */}
        {field.type === 'text' && (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            minLength={field.minLength}
            maxLength={field.maxLength}
            className={baseClasses}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            minLength={field.minLength}
            maxLength={field.maxLength}
            rows={4}
            className={baseClasses}
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            required={field.required}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )}

        {field.type === 'email' && (
          <input
            type="email"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )}

        {field.type === 'date' && (
          <input
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            min={field.min}
            max={field.max}
            className={baseClasses}
          />
        )}

        {field.type === 'dropdown' && (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            className={baseClasses}
          >
            <option value="">Selecione...</option>
            {field.options?.map((option) => {
              const value = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        )}

        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const value = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              return (
                <label key={value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={field.name}
                    value={value}
                    checked={formData[field.name] === value}
                    onChange={(e) => handleChange(e.target.value)}
                    required={field.required}
                    className="mr-2"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        )}

        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const value = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              const checked = Array.isArray(formData[field.name]) && 
                formData[field.name].includes(value);
              
              return (
                <label key={value} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = formData[field.name] || [];
                      const updated = e.target.checked
                        ? [...current, value]
                        : current.filter(v => v !== value);
                      handleChange(updated);
                    }}
                    className="mr-2"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        )}

        {field.type === 'multiselect' && (
          <select
            multiple
            value={formData[field.name] || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value);
              handleChange(selected);
            }}
            required={field.required}
            className={`${baseClasses} h-32`}
          >
            {field.options?.map((option) => {
              const value = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        )}

        {/* Mostrar erro de validação */}
        {hasError && (
          <div className="flex items-center mt-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            {formErrors[field.name]}
          </div>
        )}

        {/* Caracteres restantes para textarea */}
        {field.type === 'textarea' && field.maxLength && formData[field.name] && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            {formData[field.name].length} / {field.maxLength} caracteres
          </div>
        )}
      </div>
    );
  };

  // ===== RENDER UI =====

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
          <h1 className="text-3xl font-bold">Catálogo de Serviços</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Solicite serviços e recursos de forma rápida e fácil
          </p>
        </div>

        {/* Meus Pedidos */}
        <button
          onClick={() => navigate('/my-requests')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Minhas Solicitações
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
        >
          <option value="popular">Mais Populares</option>
          <option value="name">Nome (A-Z)</option>
          <option value="recent">Mais Recentes</option>
        </select>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            !selectedCategory
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todos
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={{ borderLeftColor: category.color }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap border-l-4 transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
            {category.itemCount > 0 && (
              <span className="ml-2 text-sm opacity-60">({category.itemCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum serviço encontrado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Tente ajustar os filtros ou fazer uma nova busca'
              : 'Entre em contacto com o suporte para solicitar a configuração do catálogo de serviços'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            💡 Os serviços precisam estar marcados como <strong>públicos</strong> e <strong>ativos</strong> para aparecerem aqui
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Header com ícone e popularidade */}
              <div 
                className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"
                style={{ borderTopColor: item.category?.color }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                      {renderIcon(item.icon, "w-7 h-7 text-primary-600")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{item.name}</h3>
                      {item.requestCount > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <TrendingUp className="w-4 h-4" />
                          {item.requestCount} solicitações
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {item.shortDescription}
                </p>

                {/* Metadados */}
                <div className="space-y-2 mb-4">
                  {item.estimatedDeliveryTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Prazo: {Math.floor(item.estimatedDeliveryTime / 24)} dias úteis</span>
                    </div>
                  )}

                  {item.estimatedCost && (
                    <div className="flex items-center gap-2 text-sm">
                      <Euro className="w-4 h-4 text-gray-400" />
                      <span>Custo estimado: €{item.estimatedCost.toFixed(2)}</span>
                    </div>
                  )}

                  {item.requiresApproval && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Requer aprovação</span>
                    </div>
                  )}
                </div>

                {/* Button */}
                <button
                  onClick={() => loadItemDetails(item.id)}
                  className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  Solicitar Serviço
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Solicitação */}
      <Modal isOpen={showRequestModal && selectedItem} onClose={() => setShowRequestModal(false)}>
        {selectedItem && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header - Padrão Azul */}
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {renderIcon(selectedItem.icon, "w-6 h-6 text-white")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedItem.name}</h2>
                  {selectedItem.shortDescription && (
                    <p className="text-sm text-blue-100 mt-0.5">
                      {selectedItem.shortDescription}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
                {/* Descrição completa */}
                {selectedItem.fullDescription && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <AlertCircle className="w-5 h-5" />
                      <h3 className="font-semibold">Sobre este serviço</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-7">
                      {selectedItem.fullDescription}
                    </p>
                  </div>
                )}

              {/* Informações importantes */}
              {(selectedItem.estimatedDeliveryTime || selectedItem.estimatedCost) && (
                <div className="grid grid-cols-2 gap-4 pl-7">
                  {selectedItem.estimatedDeliveryTime && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Prazo de Entrega</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {Math.floor(selectedItem.estimatedDeliveryTime / 24)} dias
                      </div>
                    </div>
                  )}

                  {selectedItem.estimatedCost && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <Euro className="w-4 h-4" />
                        <span className="text-xs font-medium">Custo Estimado</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        €{selectedItem.estimatedCost.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formulário dinâmico */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                  <Settings className="w-5 h-5" />
                  <h3 className="font-semibold">
                    Informações da Solicitação
                  </h3>
                </div>

                {selectedItem.customFields && selectedItem.customFields.length > 0 ? (
                  <div className="space-y-4 pl-7">
                    {selectedItem.customFields.map((field) => renderFormField(field))}
                  </div>
                ) : (
                  <div className="ml-7 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ✓ Este serviço não requer informações adicionais
                    </p>
                  </div>
                )}
              </div>

              </form>
            </div>

            {/* Modal Footer - Fixo no rodapé */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
              {selectedItem.requiresApproval && (
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Esta solicitação será enviada para aprovação antes de ser processada
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {selectedItem.requiresApproval ? 'Enviar para Aprovação' : 'Solicitar Agora'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServiceCatalogEnhanced;
