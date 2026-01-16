import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import * as inventoryService from '../services/inventoryService';
import api from '../services/api';

const LicenseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    product: '',
    version: '',
    licenseKey: '',
    licenseType: 'subscription',
    totalSeats: 1,
    purchaseDate: '',
    activationDate: '',
    expiryDate: '',
    renewalDate: '',
    status: 'active',
    autoRenew: false,
    purchasePrice: '',
    renewalPrice: '',
    currency: 'EUR',
    billingCycle: '',
    supplier: '',
    supplierContact: '',
    supplierEmail: '',
    purchaseOrder: '',
    invoiceNumber: '',
    supportLevel: '',
    supportContact: '',
    supportExpiry: '',
    notifyDaysBefore: 30,
    clientId: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
    if (isEditing) {
      loadLicense();
    }
  }, [id]);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadLicense = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getLicenseById(id);
      if (data.license) {
        setFormData({
          ...data.license,
          purchaseDate: data.license.purchaseDate?.split('T')[0] || '',
          activationDate: data.license.activationDate?.split('T')[0] || '',
          expiryDate: data.license.expiryDate?.split('T')[0] || '',
          renewalDate: data.license.renewalDate?.split('T')[0] || '',
          supportExpiry: data.license.supportExpiry?.split('T')[0] || '',
          purchasePrice: data.license.purchasePrice || '',
          renewalPrice: data.license.renewalPrice || '',
          clientId: data.license.clientId || ''
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar licença');
      navigate('/inventory/licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.vendor || !formData.product || !formData.licenseKey) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        totalSeats: parseInt(formData.totalSeats) || 1,
        notifyDaysBefore: parseInt(formData.notifyDaysBefore) || 30,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        renewalPrice: formData.renewalPrice ? parseFloat(formData.renewalPrice) : null,
        clientId: formData.clientId || null,
        purchaseDate: formData.purchaseDate || null,
        activationDate: formData.activationDate || null,
        expiryDate: formData.expiryDate || null,
        renewalDate: formData.renewalDate || null,
        supportExpiry: formData.supportExpiry || null,
        billingCycle: formData.billingCycle || null,
        supportLevel: formData.supportLevel || null
      };

      if (isEditing) {
        await inventoryService.updateLicense(id, payload);
        toast.success('Licença atualizada com sucesso');
      } else {
        await inventoryService.createLicense(payload);
        toast.success('Licença criada com sucesso');
      }
      navigate('/inventory/licenses');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar licença');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/inventory/licenses')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Licença' : 'Nova Licença'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditing ? 'Atualize as informações da licença' : 'Adicione uma nova licença de software'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            Informações da Licença
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Microsoft Office 365"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fornecedor *</label>
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                required
                placeholder="Ex: Microsoft"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Produto *</label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                required
                placeholder="Ex: Office 365 Business"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Versão</label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="Ex: 2024"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Chave de Licença *</label>
              <input
                type="text"
                name="licenseKey"
                value={formData.licenseKey}
                onChange={handleChange}
                required
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Licença</label>
              <select
                name="licenseType"
                value={formData.licenseType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              >
                <option value="subscription">Subscrição</option>
                <option value="perpetual">Perpétua</option>
                <option value="trial">Trial</option>
                <option value="volume">Volume</option>
                <option value="oem">OEM</option>
                <option value="academic">Académica</option>
                <option value="nfr">NFR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Total de Seats</label>
              <input
                type="number"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              >
                <option value="active">Ativa</option>
                <option value="expired">Expirada</option>
                <option value="suspended">Suspensa</option>
                <option value="cancelled">Cancelada</option>
                <option value="trial">Trial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cliente (opcional)</label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              >
                <option value="">Nenhum (Organização)</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Datas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Data de Compra</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data de Ativação</label>
              <input
                type="date"
                name="activationDate"
                value={formData.activationDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data de Expiração</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data de Renovação</label>
              <input
                type="date"
                name="renewalDate"
                value={formData.renewalDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="autoRenew"
                checked={formData.autoRenew}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm">Renovação automática</span>
            </label>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Informações Financeiras</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preço de Compra</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Preço de Renovação</label>
              <input
                type="number"
                name="renewalPrice"
                value={formData.renewalPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Moeda</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              >
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dólar</option>
                <option value="AOA">AOA - Kwanza</option>
                <option value="BRL">BRL - Real</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ciclo de Faturação</label>
              <select
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              >
                <option value="">Selecione...</option>
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
                <option value="one_time">Único</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ordem de Compra</label>
              <input
                type="text"
                name="purchaseOrder"
                value={formData.purchaseOrder}
                onChange={handleChange}
                placeholder="PO-2024-001"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nº da Fatura</label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                placeholder="INV-2024-001"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Fornecedor */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Fornecedor</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Fornecedor</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Nome da empresa"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contacto</label>
              <input
                type="text"
                name="supplierContact"
                value={formData.supplierContact}
                onChange={handleChange}
                placeholder="Nome do contacto"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="supplierEmail"
                value={formData.supplierEmail}
                onChange={handleChange}
                placeholder="email@fornecedor.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Suporte */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Suporte</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nível de Suporte</label>
              <select
                name="supportLevel"
                value={formData.supportLevel}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              >
                <option value="">Selecione...</option>
                <option value="none">Nenhum</option>
                <option value="basic">Básico</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contacto de Suporte</label>
              <input
                type="text"
                name="supportContact"
                value={formData.supportContact}
                onChange={handleChange}
                placeholder="Email ou telefone"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expiração do Suporte</label>
              <input
                type="date"
                name="supportExpiry"
                value={formData.supportExpiry}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notificar (dias antes)</label>
              <input
                type="number"
                name="notifyDaysBefore"
                value={formData.notifyDaysBefore}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Notas</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Observações adicionais sobre esta licença..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 resize-none"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/inventory/licenses')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isEditing ? 'Atualizar' : 'Criar'} Licença
          </button>
        </div>
      </form>
    </div>
  );
};

export default LicenseForm;
