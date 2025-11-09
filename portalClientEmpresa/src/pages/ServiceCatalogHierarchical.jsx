import { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Clock,
  Euro,
  ArrowRight,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  Box,
  Printer,
  Monitor,
  Wifi,
  Database,
  Server,
  HardDrive,
  Mail,
  Phone,
  Settings,
  ChevronRight,
  Home,
  FolderOpen,
  Package,
  Users,
  Briefcase,
  Building,
  Wrench,
  Cpu,
  Cloud,
  Shield,
  Headphones,
  FileText,
  Layers,
  Zap
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const ServiceCatalogHierarchical = () => {
  // Estados de navegação
  const [navigationLevel, setNavigationLevel] = useState('categories'); // 'categories', 'subcategories', 'items'
  const [rootCategories, setRootCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);
  
  // Estados de seleção
  const [selectedRootCategory, setSelectedRootCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRootCategories();
  }, []);

  // ===== FUNÇÕES DE CARREGAMENTO =====

  const loadRootCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/catalog/portal/categories');
      console.log('📁 Resposta da API:', response.data);
      
      const categories = response.data.categories || [];
      
      // A API retorna estrutura hierárquica com subcategories aninhadas
      // Categorias raiz já são o nível principal
      const roots = categories.map(cat => ({
        ...cat,
        subcategoryCount: cat.subcategories?.length || 0
      }));
      
      console.log('📁 Categorias raiz:', roots);
      setRootCategories(roots);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar catálogo');
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId) => {
    setLoading(true);
    try {
      // A categoria selecionada já tem as subcategorias aninhadas
      const selectedCategory = rootCategories.find(cat => cat.id === categoryId);
      
      console.log(`🔍 Categoria selecionada:`, selectedCategory);
      
      if (selectedCategory && selectedCategory.subcategories) {
        const subs = selectedCategory.subcategories.map(sub => ({
          ...sub,
          itemCount: 0 // Será preenchido quando carregar itens
        }));
        
        console.log(`📁 Subcategorias encontradas (${subs.length}):`, subs);
        setSubcategories(subs);
      } else {
        console.log('⚠️ Categoria sem subcategorias aninhadas');
        setSubcategories([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar subcategorias:', error);
      toast.error('Erro ao carregar subcategorias');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (categoryId) => {
    setLoading(true);
    try {
      const response = await api.get(`/catalog/portal/categories/${categoryId}/items`);
      console.log('📦 Itens:', response.data);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const loadItemDetails = async (itemId) => {
    try {
      const response = await api.get(`/catalog/items/${itemId}`);
      setSelectedItem(response.data.item || response.data);
      setFormData({});
      setFormErrors({});
      setShowRequestModal(true);
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes do serviço');
    }
  };

  // ===== NAVEGAÇÃO =====

  const handleCategoryClick = async (category) => {
    setSelectedRootCategory(category);
    await loadSubcategories(category.id);
    setNavigationLevel('subcategories');
  };

  const handleSubcategoryClick = async (subcategory) => {
    setSelectedSubcategory(subcategory);
    await loadItems(subcategory.id);
    setNavigationLevel('items');
  };

  const handleBackToCategories = () => {
    setNavigationLevel('categories');
    setSelectedRootCategory(null);
    setSubcategories([]);
  };

  const handleBackToSubcategories = () => {
    setNavigationLevel('subcategories');
    setSelectedSubcategory(null);
    setItems([]);
  };

  // ===== SUBMIT REQUEST =====

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const payload = { 
        catalogItemId: selectedItem.id,
        formData 
      };
      
      console.log('📤 Enviando solicitação:', payload);
      
      const response = await api.post(
        `/catalog/requests`,
        payload
      );

      if (response.data.requiresApproval) {
        toast.success('✅ Solicitação enviada para aprovação!', { duration: 3000, icon: '📋' });
      } else {
        toast.success('🎉 Ticket criado automaticamente!', { duration: 3000 });
      }

      setShowRequestModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('❌ Erro ao enviar solicitação:', error);
      
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
        toast.error('Por favor, corrija os campos destacados');
      } else {
        toast.error(error.response?.data?.message || 'Erro ao enviar solicitação');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ===== HELPERS =====

  const renderIcon = (iconName, className = "w-6 h-6") => {
    const icons = {
      // Hardware
      Box, Printer, Monitor, Wifi, Database, Server, HardDrive, Cpu,
      // Comunicação
      Mail, Phone, Headphones,
      // Organização
      Package, FolderOpen, FileText, Layers, Briefcase,
      // Pessoas e Admin
      Users, Building, Settings, Shield,
      // Ferramentas
      Wrench, Zap,
      // Cloud e Rede
      Cloud,
      // Fallback
      ShoppingCart
    };
    
    // Se não for um ícone válido do lucide-react, assumir que é emoji ou string
    if (!icons[iconName]) {
      // Se tem menos de 5 caracteres, provavelmente é emoji
      if (iconName && iconName.length < 5) {
        // Mapear tamanho de ícone para tamanho de texto
        const sizeMap = {
          'w-3': 'text-xs',
          'w-4': 'text-sm',
          'w-5': 'text-base',
          'w-6': 'text-lg',
          'w-8': 'text-2xl',
          'w-10': 'text-4xl'
        };
        const textSize = Object.keys(sizeMap).find(key => className.includes(key));
        const textClass = textSize ? sizeMap[textSize] : 'text-xl';
        
        return (
          <span className={`${textClass} flex items-center justify-center leading-none`}>
            {iconName}
          </span>
        );
      }
      // Fallback para ShoppingCart
      return <ShoppingCart className={className} />;
    }
    
    const IconComponent = icons[iconName];
    return <IconComponent className={className} />;
  };

  const getCategoryColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      lightblue: 'from-blue-400 to-blue-500',
      darkblue: 'from-blue-600 to-blue-700',
      cyan: 'from-cyan-500 to-cyan-600',
      sky: 'from-sky-500 to-sky-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      indigo: 'from-indigo-500 to-indigo-600',
      pink: 'from-pink-500 to-pink-600',
      teal: 'from-teal-500 to-teal-600'
    };
    // Fallback para azul (cor do sistema) em vez de cinza
    return colors[color] || 'from-blue-500 to-blue-600';
  };

  const renderFormField = (field) => {
    const baseClasses = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";

    const handleChange = (value) => {
      setFormData(prev => ({ ...prev, [field.name]: value }));
      if (formErrors[field.name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field.name];
          return newErrors;
        });
      }
    };

    return (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === 'text' && (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            rows={4}
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

        {formErrors[field.name] && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors[field.name]}
          </p>
        )}

        {field.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {field.description}
          </p>
        )}
      </div>
    );
  };

  // ===== BREADCRUMB =====

  const renderBreadcrumb = () => {
    return (
      <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
        <button
          onClick={handleBackToCategories}
          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Home className="w-4 h-4" />
          Catálogo
        </button>

        {selectedRootCategory && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={navigationLevel === 'items' ? handleBackToSubcategories : null}
              className={`flex items-center gap-1 ${
                navigationLevel === 'items'
                  ? 'text-blue-600 dark:text-blue-400 hover:underline'
                  : 'text-gray-900 dark:text-white font-medium'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              {selectedRootCategory.name}
            </button>
          </>
        )}

        {selectedSubcategory && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
              <Package className="w-4 h-4" />
              {selectedSubcategory.name}
            </span>
          </>
        )}
      </div>
    );
  };

  // ===== RENDER =====

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Catálogo de Serviços
            </h1>
            {/* Breadcrumb ou Subtítulo */}
            {navigationLevel === 'categories' ? (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Solicite serviços e recursos de forma rápida e fácil
              </p>
            ) : (
              <div className="mt-3">
                {renderBreadcrumb()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {/* NÍVEL 1: Categorias Raiz */}
        {!loading && navigationLevel === 'categories' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rootCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Background com gradiente ou imagem */}
                  <div className={`relative ${
                    category.imageUrl 
                      ? 'bg-gray-900' 
                      : `bg-gradient-to-br ${getCategoryColor(category.color)}`
                  } p-8 text-white min-h-[280px] flex flex-col`}>
                    
                    {/* Imagem de fundo se existir */}
                    {category.imageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
                        style={{ backgroundImage: `url(${category.imageUrl})` }}
                      />
                    )}
                    
                    {/* Conteúdo */}
                    <div className="relative z-10 flex-1 flex flex-col">
                      {/* Header com ícone e seta */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:bg-white/30 transition-colors">
                          {renderIcon(category.icon, "w-10 h-10")}
                        </div>
                        <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                      
                      {/* Título e descrição */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3 group-hover:scale-105 transition-transform origin-left">
                          {category.name}
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
                          {category.description || 'Explore os serviços disponíveis nesta categoria'}
                        </p>
                      </div>
                      
                      {/* Footer com badges */}
                      <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {category.itemCount > 0 && (
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {category.itemCount} {category.itemCount === 1 ? 'serviço' : 'serviços'}
                            </span>
                          )}
                          {category.subcategoryCount > 0 && (
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
                              <FolderOpen className="w-3 h-3" />
                              {category.subcategoryCount} {category.subcategoryCount === 1 ? 'subcategoria' : 'subcategorias'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {rootCategories.length === 0 && (
              <div className="text-center py-20">
                <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhuma categoria disponível no momento
                </p>
              </div>
            )}
          </div>
        )}

        {/* NÍVEL 2: Subcategorias */}
        {!loading && navigationLevel === 'subcategories' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryClick(subcategory)}
                  className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col"
                >
                  {/* Imagem ou ícone de topo */}
                  {subcategory.imageUrl ? (
                    <div className="relative h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <img 
                        src={subcategory.imageUrl} 
                        alt={subcategory.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                      <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        {renderIcon(subcategory.icon, "w-8 h-8 text-blue-600 dark:text-blue-400")}
                      </div>
                    </div>
                  )}
                  
                  {/* Conteúdo */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {subcategory.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 text-center mb-3 min-h-[32px]">
                        {subcategory.description || '\u00A0'}
                      </p>
                    </div>
                    
                    {/* Badge de itens */}
                    <div className="flex justify-center">
                      {subcategory.itemCount > 0 ? (
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {subcategory.itemCount} {subcategory.itemCount === 1 ? 'item' : 'itens'}
                        </span>
                      ) : (
                        <span className="invisible">placeholder</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {subcategories.length === 0 && (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Esta categoria não possui subcategorias
                </p>
                <button
                  onClick={handleBackToCategories}
                  className="text-blue-600 hover:underline"
                >
                  Voltar para categorias
                </button>
              </div>
            )}
          </div>
        )}

        {/* NÍVEL 3: Itens/Serviços */}
        {!loading && navigationLevel === 'items' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-2xl hover:border-blue-500 transition-all transform hover:-translate-y-1"
                >
                  {/* Imagem ou header */}
                  {item.imageUrl ? (
                    <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <div className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
                          {renderIcon(item.icon, "w-5 h-5 text-blue-600 dark:text-blue-400")}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-3 bg-gradient-to-r from-blue-500 to-blue-600" />
                  )}
                  
                  <div className="p-6">
                    {/* Header com ícone (se não houver imagem) */}
                    {!item.imageUrl && (
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          {renderIcon(item.icon, "w-6 h-6 text-blue-600 dark:text-blue-400")}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </h3>
                        </div>
                      </div>
                    )}
                    
                    {/* Título (se houver imagem) */}
                    {item.imageUrl && (
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h3>
                    )}
                    
                    {/* Descrição */}
                    {item.shortDescription && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                        {item.shortDescription}
                      </p>
                    )}

                    {/* Badges de info */}
                    {(item.estimatedCost || item.estimatedDeliveryTime || item.requiresApproval) && (
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {item.estimatedDeliveryTime && (
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.floor(item.estimatedDeliveryTime / 24)} dias
                          </span>
                        )}
                        {item.estimatedCost && (
                          <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded-md text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                            <Euro className="w-3 h-3" />
                            €{item.estimatedCost.toFixed(2)}
                          </span>
                        )}
                        {item.requiresApproval && (
                          <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-md text-xs font-medium text-orange-700 dark:text-orange-400 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Requer aprovação
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => loadItemDetails(item.id)}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all font-semibold shadow-sm hover:shadow-md group-hover:scale-[1.02]"
                    >
                      Solicitar Serviço
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Nenhum serviço disponível nesta categoria
                </p>
                <button
                  onClick={handleBackToSubcategories}
                  className="text-blue-600 hover:underline"
                >
                  Voltar para subcategorias
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Solicitação */}
      <Modal isOpen={showRequestModal && selectedItem} onClose={() => setShowRequestModal(false)}>
        {selectedItem && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
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

export default ServiceCatalogHierarchical;
