import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import organizationService from '../../services/organizationService';
import { showSuccess, showError } from '../../utils/alerts';

const CreateOrganization = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    taxId: '',
    plan: 'basic',
    maxUsers: 10,
    maxClients: 50,
    maxStorage: 5
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await organizationService.create(formData);
      showSuccess('Organização criada com sucesso');
      navigate('/organizations');
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao criar organização');
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
          onClick={() => navigate('/organizations')}
        >
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Organização</h1>
          <p className="text-gray-600 mt-1">Cadastre uma nova organização no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <Input
                label="Nome da Organização"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Empresa XYZ Ltda"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="contato@empresa.com"
                />
                <Input
                  label="Telefone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <Input
                label="CNPJ"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Endereço</h2>
            <div className="space-y-4">
              <Input
                label="Endereço"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Rua, número, complemento"
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Cidade"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="São Paulo"
                />
                <Input
                  label="Estado"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="SP"
                />
                <Input
                  label="CEP"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="00000-000"
                />
              </div>
              <Input
                label="País"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Plano e Limites</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plano
                  </label>
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="basic">Básico</option>
                    <option value="professional">Profissional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
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
                  Criar Organização
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/organizations')}
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

export default CreateOrganization;
