import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import planService from '../../services/planService';
import { showSuccess, showError } from '../../utils/alerts';

const currencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
  { code: 'AOA', symbol: 'Kz', name: 'Kwanza Angolano' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco Suíço' }
];

const EditPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'EUR',
    maxUsers: 10,
    maxClients: 50,
    maxStorageGB: 5,
    maxTicketsPerMonth: 1000,
    trialDays: 14,
    isDefault: false,
    sortOrder: 0,
    featuresText: [],
    features: {
      basicTicketing: true,
      emailIntegration: true,
      knowledgeBase: false,
      slaManagement: false,
      reporting: false,
      automation: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false
    }
  });

  useEffect(() => {
    loadPlan();
  }, [id]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const response = await planService.getById(id);
      const plan = response.plan || response;
      
      setFormData({
        name: plan.name || '',
        displayName: plan.displayName || '',
        description: plan.description || '',
        monthlyPrice: parseFloat(plan.monthlyPrice) || 0,
        yearlyPrice: parseFloat(plan.yearlyPrice) || 0,
        currency: plan.currency || 'EUR',
        maxUsers: plan.maxUsers || 10,
        maxClients: plan.maxClients || 50,
        maxStorageGB: plan.maxStorageGB || 5,
        maxTicketsPerMonth: plan.maxTicketsPerMonth || 1000,
        trialDays: plan.trialDays || 14,
        isDefault: plan.isDefault || false,
        sortOrder: plan.sortOrder || 0,
        featuresText: plan.featuresText || [],
        features: plan.features || {
          basicTicketing: true,
          emailIntegration: true,
          knowledgeBase: false,
          slaManagement: false,
          reporting: false,
          automation: false,
          apiAccess: false,
          whiteLabel: false,
          prioritySupport: false
        }
      });
    } catch (error) {
      showError('Erro ao carregar plano');
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('features.')) {
      const featureName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureName]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
      }));
    }
  };

  const addFeatureText = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        featuresText: [...prev.featuresText, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeatureText = (index) => {
    setFormData(prev => ({
      ...prev,
      featuresText: prev.featuresText.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await planService.update(id, formData);
      showSuccess('Plano atualizado com sucesso');
      navigate('/plans');
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao atualizar plano');
    } finally {
      setSaving(false);
    }
  };

  const selectedCurrency = currencies.find(c => c.code === formData.currency) || currencies[0];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/plans')}>
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Plano</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Atualize as informações do plano</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Informações do Plano</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="ID do Plano (slug)" name="name" value={formData.name} onChange={handleChange} required disabled />
                <Input label="Nome de Exibição" name="displayName" value={formData.displayName} onChange={handleChange} required />
              </div>
              <Input label="Descrição" name="description" value={formData.description} onChange={handleChange} />
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moeda</label>
                  <select name="currency" value={formData.currency} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <Input label={`Preço Mensal (${selectedCurrency.symbol})`} name="monthlyPrice" type="number" step="0.01" value={formData.monthlyPrice} onChange={handleChange} required />
                <Input label={`Preço Anual (${selectedCurrency.symbol})`} name="yearlyPrice" type="number" step="0.01" value={formData.yearlyPrice} onChange={handleChange} />
              </div>
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4 dark:text-white">Limites</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Máximo de Usuários (-1 = ilimitado)" name="maxUsers" type="number" value={formData.maxUsers} onChange={handleChange} />
              <Input label="Máximo de Clientes (-1 = ilimitado)" name="maxClients" type="number" value={formData.maxClients} onChange={handleChange} />
              <Input label="Armazenamento (GB)" name="maxStorageGB" type="number" value={formData.maxStorageGB} onChange={handleChange} />
              <Input label="Tickets/mês (-1 = ilimitado)" name="maxTicketsPerMonth" type="number" value={formData.maxTicketsPerMonth} onChange={handleChange} />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4 dark:text-white">Funcionalidades (Texto para Landing Page)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Adicione as funcionalidades que aparecerão na landing page</p>
            <div className="space-y-2 mb-4">
              {formData.featuresText.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                  <span className="flex-1 text-sm dark:text-white">{feature}</span>
                  <button type="button" onClick={() => removeFeatureText(index)} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Ex: Suporte 24/7"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeatureText())} />
              <Button type="button" onClick={addFeatureText} icon={<Plus className="w-4 h-4" />}>Adicionar</Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Funcionalidades do Sistema</h2>
              <div className="space-y-3">
                {[
                  ['basicTicketing', 'Tickets Básicos'],
                  ['emailIntegration', 'Integração Email'],
                  ['knowledgeBase', 'Base de Conhecimento'],
                  ['slaManagement', 'Gestão de SLA'],
                  ['reporting', 'Relatórios'],
                  ['automation', 'Automações'],
                  ['apiAccess', 'Acesso à API'],
                  ['whiteLabel', 'White-label'],
                  ['prioritySupport', 'Suporte Prioritário']
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input type="checkbox" name={`features.${key}`} checked={formData.features[key] || false} onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Configurações</h2>
              <div className="space-y-4">
                <Input label="Dias de Trial" name="trialDays" type="number" value={formData.trialDays} onChange={handleChange} />
                <Input label="Ordem de Exibição" name="sortOrder" type="number" value={formData.sortOrder} onChange={handleChange} />
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Plano Padrão (destacado)</span>
                </label>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <Button type="submit" className="w-full" loading={saving} icon={<Save className="w-4 h-4" />}>Salvar Alterações</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/plans')} disabled={saving}>Cancelar</Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditPlan;
