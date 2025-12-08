import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import planService from '../../services/planService';
import { showSuccess, showError } from '../../utils/alerts';

const CreatePlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly',
    maxUsers: 10,
    maxClients: 50,
    maxStorage: 5,
    maxTickets: 1000,
    features: {
      remoteAccess: true,
      inventory: true,
      reports: true,
      api: false,
      customBranding: false,
      prioritySupport: false
    }
  });

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
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await planService.create(formData);
      showSuccess('Plano criado com sucesso');
      navigate('/plans');
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao criar plano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/plans')}
        >
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Plano</h1>
          <p className="text-gray-600 mt-1">Cadastre um novo plano de assinatura</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Informações do Plano</h2>
            <div className="space-y-4">
              <Input
                label="Nome do Plano"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Básico, Profissional, Enterprise"
              />
              <Input
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Descrição breve do plano"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Preço (R$)"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="99.90"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciclo de Cobrança
                  </label>
                  <select
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Limites</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Máximo de Usuários"
                name="maxUsers"
                type="number"
                value={formData.maxUsers}
                onChange={handleChange}
                min="1"
              />
              <Input
                label="Máximo de Clientes"
                name="maxClients"
                type="number"
                value={formData.maxClients}
                onChange={handleChange}
                min="1"
              />
              <Input
                label="Armazenamento (GB)"
                name="maxStorage"
                type="number"
                value={formData.maxStorage}
                onChange={handleChange}
                min="1"
              />
              <Input
                label="Máximo de Tickets/mês"
                name="maxTickets"
                type="number"
                value={formData.maxTickets}
                onChange={handleChange}
                min="1"
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Funcionalidades</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="features.remoteAccess"
                    checked={formData.features.remoteAccess}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Acesso Remoto</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="features.inventory"
                    checked={formData.features.inventory}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Inventário</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="features.reports"
                    checked={formData.features.reports}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Relatórios</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="features.api"
                    checked={formData.features.api}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Acesso API</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="features.customBranding"
                    checked={formData.features.customBranding}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Marca Personalizada</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="features.prioritySupport"
                    checked={formData.features.prioritySupport}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Suporte Prioritário</span>
                </label>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                  icon={<Save className="w-4 h-4" />}
                >
                  Criar Plano
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/plans')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePlan;
