import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Save,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Grid3x3,
  Building2,
  FolderTree,
  Network,
  ChevronRight,
  ImageIcon,
  Layers,
  Settings,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { confirmDelete } from '../utils/alerts';
import DynamicIcon from '../components/DynamicIcon';
import PermissionGate from '../components/PermissionGate';

const CatalogCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [directions, setDirections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#3b82f6',
    imageUrl: '',
    parentCategoryId: '',
    order: 0,
    isActive: true,
    defaultDirectionId: '',
    defaultDepartmentId: '',
    defaultSectionId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, dirRes, deptRes, secRes] = await Promise.all([
        api.get('/catalog/categories?includeInactive=true'),
        api.get('/directions'),
        api.get('/departments'),
        api.get('/client/sections')
      ]);

      setCategories(catRes.data.categories || []);
      setDirections(dirRes.data.directions || []);
      setDepartments(deptRes.data.departments || []);
      setSections(secRes.data.sections || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      icon: '📁',
      color: '#3b82f6',
      imageUrl: '',
      parentCategoryId: '',
      order: 0,
      isActive: true,
      defaultDirectionId: '',
      defaultDepartmentId: '',
      defaultSectionId: ''
    });
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📁',
      color: category.color || '#3b82f6',
      imageUrl: category.imageUrl || '',
      parentCategoryId: category.parentCategoryId || '',
      order: category.order || 0,
      isActive: category.isActive !== false,
      defaultDirectionId: category.defaultDirectionId || '',
      defaultDepartmentId: category.defaultDepartmentId || '',
      defaultSectionId: category.defaultSectionId || ''
    });
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await api.put(`/catalog/categories/${editingCategory.id}`, formData);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await api.post('/catalog/categories', formData);
        toast.success('Categoria criada com sucesso!');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar categoria');
    }
  };

  const handleDelete = async (categoryId) => {
    const confirmed = await confirmDelete(
      'Excluir categoria?',
      'Tem certeza que deseja excluir esta categoria? Os itens associados serão desativados.'
    )
    if (!confirmed) return;

    try {
      await api.delete(`/catalog/categories/${categoryId}`);
      toast.success('Categoria excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error(error.response?.data?.error || 'Erro ao excluir categoria');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await api.put(`/catalog/categories/${category.id}`, {
        isActive: !category.isActive
      });
      toast.success(category.isActive ? 'Categoria desativada' : 'Categoria ativada');
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status da categoria');
    }
  };

  // Ícones sugeridos
  const iconSuggestions = [
    '📁', '📂', '💻', '🖥️', '⚙️', '🔧', '🔐', '🔑',
    '📱', '🌐', '📊', '📈', '🏢', '👥', '📧', '☁️',
    '🗄️', '🔌', '💾', '🖨️', '📞', '🎯', '🚀', '⭐'
  ];

  // Função auxiliar para construir path da categoria
  const getCategoryPath = (categoryId) => {
    const path = [];
    let current = categories.find(c => c.id === categoryId);

    while (current) {
      path.unshift(current.name);
      current = categories.find(c => c.id === current.parentCategoryId);
    }

    return path.join(' > ');
  };

  // Função para obter categorias raiz e hierarquia
  const getCategoriesHierarchy = () => {
    const rootCategories = categories.filter(c => !c.parentCategoryId);
    const result = [];

    const addChildren = (parent, level = 1) => {
      result.push({ ...parent, level });
      const children = categories.filter(c => c.parentCategoryId === parent.id);
      children.sort((a, b) => (a.order || 0) - (b.order || 0));
      children.forEach(child => addChildren(child, level + 1));
    };

    rootCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
    rootCategories.forEach(root => addChildren(root));

    return result;
  };

  const hierarchicalCategories = getCategoriesHierarchy();

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
          <h1 className="text-3xl font-bold">Categorias do Catálogo</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie as categorias de serviços disponíveis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            Como Funciona?
          </button>
          <PermissionGate permission="catalog.create">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Categoria
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total de Categorias</div>
          <div className="text-2xl font-bold mt-1">{categories.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Ativas</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {categories.filter(c => c.isActive !== false).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Inativas</div>
          <div className="text-2xl font-bold mt-1 text-gray-600">
            {categories.filter(c => c.isActive === false).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total de Items</div>
          <div className="text-2xl font-bold mt-1">
            {categories.reduce((sum, c) => sum + (c.itemCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Categoria / Hierarquia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Roteamento Padrão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {hierarchicalCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <FolderTree className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nenhuma categoria criada ainda
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Comece criando categorias raiz (nível 1) como "Hardware", "Software", etc. Depois você pode criar subcategorias dentro delas.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-lg mx-auto">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        📋 Fluxo de criação:
                      </p>
                      <ol className="text-sm text-left text-blue-800 dark:text-blue-300 space-y-1.5">
                        <li><strong>1️⃣ Categorias Raiz:</strong> Crie aqui as categorias principais</li>
                        <li><strong>2️⃣ Subcategorias:</strong> Crie subcategorias selecionando uma categoria pai</li>
                        <li><strong>3️⃣ Itens/Serviços:</strong> Vá em "Catálogo de Serviços" no menu para criar os serviços</li>
                      </ol>
                    </div>
                    <button
                      onClick={handleCreate}
                      className="mt-6 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      Criar Primeira Categoria
                    </button>
                  </td>
                </tr>
              ) : (
                hierarchicalCategories.map((category) => (
                  <tr key={category.id} className={category.isActive === false ? 'opacity-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3" style={{ paddingLeft: `${(category.level - 1) * 24}px` }}>
                        {category.level > 1 && (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            <DynamicIcon icon={category.icon} className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{category.name}</div>
                          {category.parentCategoryId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {getCategoryPath(category.parentCategoryId)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">Nível {category.level}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {category.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        {category.defaultDirection && (
                          <div className="flex items-center gap-1 text-xs">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span className="truncate">{category.defaultDirection.name}</span>
                          </div>
                        )}
                        {category.defaultDepartment && (
                          <div className="flex items-center gap-1 text-xs">
                            <FolderTree className="w-3 h-3 text-gray-400" />
                            <span className="truncate">{category.defaultDepartment.name}</span>
                          </div>
                        )}
                        {category.defaultSection && (
                          <div className="flex items-center gap-1 text-xs">
                            <Grid3x3 className="w-3 h-3 text-gray-400" />
                            <span className="truncate">{category.defaultSection.name}</span>
                          </div>
                        )}
                        {!category.defaultDirection && !category.defaultDepartment && !category.defaultSection && (
                          <span className="text-gray-400">Não definido</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        {category.itemCount || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PermissionGate permission="catalog.update">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${category.isActive !== false
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                          {category.isActive !== false ? 'Ativa' : 'Inativa'}
                        </button>
                      </PermissionGate>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <PermissionGate permission="catalog.update">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="catalog.delete">
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          {/* Header com gradiente */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FolderTree className="w-6 h-6" />
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {editingCategory
                    ? 'Atualize as informações da categoria de serviços'
                    : 'Crie uma nova categoria para organizar seus serviços'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <form id="categoryForm" onSubmit={handleSave} className="space-y-5">
                {/* Card: Informações Básicas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📝 Informações Básicas
                  </h3>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome da Categoria *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Ex: Tecnologia da Informação"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Descreva brevemente esta categoria e sua finalidade..."
                    />
                  </div>
                </div>

                {/* Card: Hierarquia */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary-500" />
                    Hierarquia (Opcional)
                  </h3>

                  {/* Explicação do fluxo hierárquico */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-2">📚 Como funciona a hierarquia:</p>
                        <ul className="space-y-1.5 list-disc list-inside">
                          <li><strong>Nível 1 (Raiz):</strong> Categorias principais - Ex: "Hardware", "Software"</li>
                          <li><strong>Nível 2+:</strong> Subcategorias - Ex: "Impressoras" dentro de "Hardware"</li>
                          <li><strong>Itens/Serviços:</strong> Criados em "Catálogo de Serviços" dentro das categorias</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria Pai
                    </label>
                    <select
                      value={formData.parentCategoryId}
                      onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">🏠 Nenhuma (Categoria Raiz - Nível 1)</option>
                      {categories
                        .filter(c => c.id !== editingCategory?.id)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {'  '.repeat(cat.level || 0)} {cat.icon || '📁'} {getCategoryPath(cat.id) || cat.name}
                          </option>
                        ))}
                    </select>
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                        <span className="font-semibold">💡 Dica:</span>
                        <span>Deixe em branco para criar uma <strong>categoria raiz</strong> (nível 1).</span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                        <span className="font-semibold">🔗 Próximo passo:</span>
                        <span>Após criar categorias, vá em <strong>"Catálogo de Serviços"</strong> no menu para adicionar itens/serviços.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card: Aparência Visual */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary-500" />
                    Aparência Visual
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Ícone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ícone Emoji
                      </label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-center text-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        maxLength={2}
                      />
                      <div className="flex flex-wrap gap-2 mt-3 justify-center">
                        {iconSuggestions.slice(0, 6).map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon })}
                            className="w-10 h-10 hover:bg-primary-50 hover:scale-110 dark:hover:bg-gray-700 rounded-lg text-xl transition-all border border-transparent hover:border-primary-300"
                            title="Usar este ícone"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cor Temática
                      </label>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full h-11 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className="flex-1 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                          style={{ backgroundColor: formData.color }}
                        />
                        <code className="text-xs text-gray-500 dark:text-gray-400 font-mono px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          {formData.color}
                        </code>
                      </div>
                    </div>

                    {/* Imagem */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL da Imagem
                      </label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                      {formData.imageUrl && (
                        <div className="mt-3 flex justify-center">
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card: Roteamento Organizacional */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Network className="w-5 h-5 text-primary-500" />
                    Roteamento Organizacional (Opcional)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        Direção Padrão
                      </label>
                      <select
                        value={formData.defaultDirectionId}
                        onChange={(e) => setFormData({ ...formData, defaultDirectionId: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="">Nenhuma</option>
                        {directions.map((dir) => (
                          <option key={dir.id} value={dir.id}>
                            {dir.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FolderTree className="w-4 h-4 text-gray-400" />
                        Departamento Padrão
                      </label>
                      <select
                        value={formData.defaultDepartmentId}
                        onChange={(e) => setFormData({ ...formData, defaultDepartmentId: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="">Nenhum</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Grid3x3 className="w-4 h-4 text-gray-400" />
                        Seção Padrão
                      </label>
                      <select
                        value={formData.defaultSectionId}
                        onChange={(e) => setFormData({ ...formData, defaultSectionId: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="">Nenhuma</option>
                        {sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Define o fluxo organizacional padrão: <strong>Direção → Departamento → Seção</strong> para itens desta categoria</span>
                  </p>
                </div>

                {/* Card: Configurações */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-500" />
                    Configurações
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ordem de Exibição
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Menor número = maior prioridade na listagem
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status da Categoria
                      </label>
                      <label className="flex items-center gap-3 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium">Categoria Ativa</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formData.isActive ? 'Visível para usuários' : 'Oculta para usuários'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* Footer fixo com botões */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="categoryForm"
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {editingCategory ? 'Atualizar' : 'Criar'} Categoria
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <HelpCircle className="w-6 h-6" />
                  Como Funciona o Catálogo de Serviços?
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Entenda o fluxo completo de categorias, subcategorias e itens
                </p>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
            {/* Hierarquia Visual */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                📊 Estrutura Hierárquica
              </h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <span className="text-2xl">📁</span>
                  <span className="font-semibold">Hardware</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">Nível 1 - Raiz</span>
                </div>
                <div className="flex items-center gap-2 pl-8 text-gray-700 dark:text-gray-300">
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-xl">🖨️</span>
                  <span className="font-semibold">Impressoras</span>
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded">Nível 2 - Subcategoria</span>
                </div>
                <div className="flex items-center gap-2 pl-16 text-gray-600 dark:text-gray-400">
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-lg">📄</span>
                  <span>"Instalação de Impressora HP"</span>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">Item/Serviço</span>
                </div>
                <div className="flex items-center gap-2 pl-16 text-gray-600 dark:text-gray-400">
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-lg">📄</span>
                  <span>"Manutenção Preventiva"</span>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">Item/Serviço</span>
                </div>
              </div>
            </div>

            {/* Fluxo de Criação */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                🚀 Fluxo de Criação (Passo a Passo)
              </h3>
              <div className="space-y-4">
                {/* Passo 1 */}
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        Criar Categorias Raiz (Nível 1)
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Onde:</strong> Nesta página (Categorias)
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Clique em <strong>"+ Nova Categoria"</strong> e deixe <strong>"Categoria Pai"</strong> em branco (Nenhuma).
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                        <strong>Exemplos:</strong> Hardware, Software, Suporte Técnico, RH
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        Criar Subcategorias (Opcional)
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Onde:</strong> Nesta página (Categorias)
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Clique em <strong>"+ Nova Categoria"</strong> e selecione uma <strong>"Categoria Pai"</strong>.
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                        <strong>Exemplos:</strong> Hardware → Impressoras, Notebooks | Software → Design, Produtividade
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="bg-white dark:bg-gray-700 border-2 border-green-200 dark:border-green-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        Criar Itens/Serviços
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded font-normal">
                          IMPORTANTE
                        </span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Onde:</strong> Menu Lateral → <strong>"Catálogo de Serviços"</strong> (NÃO em Categorias!)
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Clique em <strong>"+ Novo Item"</strong>, selecione a categoria e preencha os detalhes do serviço.
                      </p>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-sm">
                        <strong>Exemplos:</strong> "Instalação de Impressora HP", "Licença Microsoft 365", "Suporte Photoshop"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-bold text-yellow-900 dark:text-yellow-300 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                💡 Dicas Importantes
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Categorias</strong> são apenas para organização - os usuários solicitam <strong>Itens/Serviços</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Crie primeiro as <strong>categorias raiz</strong>, depois as subcategorias</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Use ícones emoji relevantes para facilitar a identificação visual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Evite criar muitos níveis de hierarquia (máximo 3-4 níveis)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Entendi!
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CatalogCategories;
