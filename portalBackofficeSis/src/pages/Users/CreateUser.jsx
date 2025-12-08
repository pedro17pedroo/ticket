import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import userService from '../../services/userService';
import { showSuccess, showError } from '../../utils/alerts';

const CreateUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'support',
    phone: '',
    department: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 8) {
      showError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      const { confirmPassword, ...userData } = formData;
      await userService.create(userData);
      showSuccess('Usuário criado com sucesso');
      navigate('/users');
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao criar usuário');
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
          onClick={() => navigate('/users')}
        >
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Usuário</h1>
          <p className="text-gray-600 mt-1">Cadastre um novo usuário provider</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Informações Pessoais</h2>
            <div className="space-y-4">
              <Input
                label="Nome Completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="João Silva"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="joao@tatuticket.com"
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
                label="Departamento"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Ex: Suporte, Vendas, TI"
              />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Credenciais de Acesso</h2>
            <div className="space-y-4">
              <Input
                label="Senha"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres"
                helperText="A senha deve ter no mínimo 8 caracteres"
              />
              <Input
                label="Confirmar Senha"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Digite a senha novamente"
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Permissões</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="support">Support</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  {formData.role === 'super-admin' && 'Acesso total ao sistema'}
                  {formData.role === 'admin' && 'Gestão de organizações e usuários'}
                  {formData.role === 'manager' && 'Gestão de operações e relatórios'}
                  {formData.role === 'support' && 'Suporte e atendimento'}
                </p>
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
                  Criar Usuário
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/users')}
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

export default CreateUser;
