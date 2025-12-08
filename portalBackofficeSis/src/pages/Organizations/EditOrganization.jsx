import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import organizationService from '../../services/organizationService';
import { showSuccess, showError } from '../../utils/alerts';

const EditOrganization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    taxId: '',
    plan: '',
    maxUsers: 0,
    maxClients: 0,
    maxStorage: 0
  });

  useEffect(() => {
    loadOrganization();
  }, [id]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getById(id);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        country: data.country || 'Brasil',
        taxId: data.taxId || '',
        plan: data.subscription?.plan || 'basic',
        maxUsers: data.limits?.maxUsers || 10,
        maxClients: data.limits?.maxClients || 50,
        maxStorage: data.limits?.maxStorage || 5
      });
    } catch (error) {
      showError('Erro ao carregar organização');
      navigate('/organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await organizationService.update(id, formData);
      showSuccess('Organização atualizada com sucesso');
      navigate(`/organizations/${id}`);
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao atualizar organização');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(`/organizations/${id}`)}
        >
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Organização</h1>
          <p className="text-gray-600 mt-1">Atualize as informações da organização</p>
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
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Telefone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="CNPJ"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
              />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Endereço</h2>
            <div className="space-y-4">
              <Input
                label="Endereço"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Cidade"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
                <Input
                  label="Estado"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                />
                <Input
                  label="CEP"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
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
                  loading={saving}
                  icon={<Save className="w-4 h-4" />}
                >
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate(`/organizations/${id}`)}
                  disabled={saving}
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

export default EditOrganization;
