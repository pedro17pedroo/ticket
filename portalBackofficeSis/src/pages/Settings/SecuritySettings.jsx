import { useState, useEffect } from 'react';
import { Save, Shield, Key, Lock } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import dashboardService from '../../services/dashboardService';
import { showSuccess, showError } from '../../utils/alerts';

const SecuritySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordExpirationDays: 90,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 60,
    requireTwoFactor: false,
    allowedIpRanges: '',
    enableAuditLog: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getSecuritySettings();
      setFormData({
        passwordMinLength: data.passwordMinLength || 8,
        passwordRequireUppercase: data.passwordRequireUppercase !== false,
        passwordRequireLowercase: data.passwordRequireLowercase !== false,
        passwordRequireNumbers: data.passwordRequireNumbers !== false,
        passwordRequireSpecialChars: data.passwordRequireSpecialChars !== false,
        passwordExpirationDays: data.passwordExpirationDays || 90,
        maxLoginAttempts: data.maxLoginAttempts || 5,
        lockoutDuration: data.lockoutDuration || 30,
        sessionTimeout: data.sessionTimeout || 60,
        requireTwoFactor: data.requireTwoFactor || false,
        allowedIpRanges: data.allowedIpRanges || '',
        enableAuditLog: data.enableAuditLog !== false
      });
    } catch (error) {
      showError('Erro ao carregar configurações de segurança');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await dashboardService.updateSecuritySettings(formData);
      showSuccess('Configurações de segurança salvas com sucesso');
    } catch (error) {
      showError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações de Segurança</h1>
        <p className="text-gray-600 mt-1">Configure políticas de segurança do sistema</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Política de Senhas</h2>
            </div>
            <div className="space-y-4">
              <Input
                label="Comprimento Mínimo"
                name="passwordMinLength"
                type="number"
                value={formData.passwordMinLength}
                onChange={handleChange}
                min="6"
                max="32"
              />
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="passwordRequireUppercase"
                    checked={formData.passwordRequireUppercase}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Exigir letras maiúsculas</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="passwordRequireLowercase"
                    checked={formData.passwordRequireLowercase}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Exigir letras minúsculas</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="passwordRequireNumbers"
                    checked={formData.passwordRequireNumbers}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Exigir números</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="passwordRequireSpecialChars"
                    checked={formData.passwordRequireSpecialChars}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Exigir caracteres especiais</span>
                </label>
              </div>
              <Input
                label="Expiração de Senha (dias)"
                name="passwordExpirationDays"
                type="number"
                value={formData.passwordExpirationDays}
                onChange={handleChange}
                min="0"
                helperText="0 = nunca expira"
              />
            </div>

            <div className="flex items-center gap-2 mt-6 mb-4">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Controle de Acesso</h2>
            </div>
            <div className="space-y-4">
              <Input
                label="Máximo de Tentativas de Login"
                name="maxLoginAttempts"
                type="number"
                value={formData.maxLoginAttempts}
                onChange={handleChange}
                min="3"
                max="10"
              />
              <Input
                label="Duração do Bloqueio (minutos)"
                name="lockoutDuration"
                type="number"
                value={formData.lockoutDuration}
                onChange={handleChange}
                min="5"
              />
              <Input
                label="Timeout de Sessão (minutos)"
                name="sessionTimeout"
                type="number"
                value={formData.sessionTimeout}
                onChange={handleChange}
                min="15"
              />
              <Input
                label="IPs Permitidos (opcional)"
                name="allowedIpRanges"
                value={formData.allowedIpRanges}
                onChange={handleChange}
                placeholder="192.168.1.0/24, 10.0.0.0/8"
                helperText="Deixe em branco para permitir todos"
              />
            </div>

            <div className="flex items-center gap-2 mt-6 mb-4">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Autenticação</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requireTwoFactor"
                  checked={formData.requireTwoFactor}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Exigir autenticação de dois fatores (2FA)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enableAuditLog"
                  checked={formData.enableAuditLog}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Habilitar log de auditoria</span>
              </label>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Status de Segurança</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nível de Segurança</span>
                  <Badge variant="success">Alto</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">2FA Ativo</span>
                  <Badge variant={formData.requireTwoFactor ? 'success' : 'warning'}>
                    {formData.requireTwoFactor ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Auditoria</span>
                  <Badge variant={formData.enableAuditLog ? 'success' : 'danger'}>
                    {formData.enableAuditLog ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card>
              <Button
                type="submit"
                className="w-full"
                loading={saving}
                icon={<Save className="w-4 h-4" />}
              >
                Salvar Configurações
              </Button>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-3">Recomendações</h2>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Senha mínima de 8 caracteres</li>
                <li>✓ Exigir caracteres especiais</li>
                <li>✓ Habilitar 2FA para admins</li>
                <li>✓ Manter log de auditoria ativo</li>
                <li>✓ Revisar acessos regularmente</li>
              </ul>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SecuritySettings;
