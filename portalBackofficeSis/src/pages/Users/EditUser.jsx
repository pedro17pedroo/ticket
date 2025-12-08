import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import userService from '../../services/userService';
import { showSuccess, showError } from '../../utils/alerts';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    department: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getById(id);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'support',
        phone: data.phone || '',
        department: data.department || '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      showError('Erro ao carregar usuário');
      navigate('/users');
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
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      showError('As senhas não coincidem');
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 8) {
      showError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    try {
      setSaving(true);
      const { confirmPassword, newPassword, ...userData } = formData;
      
      // Se houver nova senha, incluir no update
      if (newPassword) {
        userData.password = newPassword;
      }
      
      await userService.update(id, userData);
      showSuccess('Usuário atualizado com sucesso');
      navigate('/users');
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao atualizar usuário');
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
          onClick={() => navigate('/users')}
        >
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Usuário</h1>
          <p className="text-gray-600 mt-1">Atualize as informações do usuário</p>
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
                label="Departamento"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Alterar Senha (Opcional)</h2>
            <div className="space-y-4">
              <Input
                label="Nova Senha"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Deixe em branco para manter a senha atual"
                helperText="Mínimo 8 caracteres"
              />
              <Input
                label="Confirmar Nova Senha"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Digite a nova senha novamente"
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
                  loading={saving}
                  icon={<Save className="w-4 h-4" />}
                >
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/users')}
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

export default EditUser;
