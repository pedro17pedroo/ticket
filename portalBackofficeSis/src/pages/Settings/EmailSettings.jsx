import { useState, useEffect } from 'react';
import { Save, Send } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import dashboardService from '../../services/dashboardService';
import { showSuccess, showError } from '../../utils/alerts';

const EmailSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    fromName: '',
    fromEmail: '',
    replyToEmail: '',
    testEmail: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getEmailSettings();
      setFormData({
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || '587',
        smtpUser: data.smtpUser || '',
        smtpPassword: '',
        smtpSecure: data.smtpSecure !== false,
        fromName: data.fromName || 'TatuTicket',
        fromEmail: data.fromEmail || '',
        replyToEmail: data.replyToEmail || '',
        testEmail: ''
      });
    } catch (error) {
      showError('Erro ao carregar configurações de email');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await dashboardService.updateEmailSettings(formData);
      showSuccess('Configurações de email salvas com sucesso');
    } catch (error) {
      showError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!formData.testEmail) {
      showError('Digite um email para teste');
      return;
    }
    try {
      setTesting(true);
      await dashboardService.testEmail(formData.testEmail);
      showSuccess('Email de teste enviado com sucesso');
    } catch (error) {
      showError('Erro ao enviar email de teste');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações de Email</h1>
        <p className="text-gray-600 mt-1">Configure o servidor SMTP para envio de emails</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Servidor SMTP</h2>
            <div className="space-y-4">
              <Input
                label="Host SMTP"
                name="smtpHost"
                value={formData.smtpHost}
                onChange={handleChange}
                required
                placeholder="smtp.gmail.com"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Porta"
                  name="smtpPort"
                  type="number"
                  value={formData.smtpPort}
                  onChange={handleChange}
                  required
                />
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="smtpSecure"
                      checked={formData.smtpSecure}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Usar SSL/TLS</span>
                  </label>
                </div>
              </div>
              <Input
                label="Usuário SMTP"
                name="smtpUser"
                value={formData.smtpUser}
                onChange={handleChange}
                required
                placeholder="seu-email@gmail.com"
              />
              <Input
                label="Senha SMTP"
                name="smtpPassword"
                type="password"
                value={formData.smtpPassword}
                onChange={handleChange}
                placeholder="Digite a senha (deixe em branco para manter)"
              />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Configurações de Envio</h2>
            <div className="space-y-4">
              <Input
                label="Nome do Remetente"
                name="fromName"
                value={formData.fromName}
                onChange={handleChange}
                required
              />
              <Input
                label="Email do Remetente"
                name="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={handleChange}
                required
              />
              <Input
                label="Email de Resposta"
                name="replyToEmail"
                type="email"
                value={formData.replyToEmail}
                onChange={handleChange}
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Testar Configuração</h2>
              <div className="space-y-3">
                <Input
                  label="Email de Teste"
                  name="testEmail"
                  type="email"
                  value={formData.testEmail}
                  onChange={handleChange}
                  placeholder="teste@exemplo.com"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  loading={testing}
                  icon={<Send className="w-4 h-4" />}
                  onClick={handleTestEmail}
                >
                  Enviar Email de Teste
                </Button>
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
              <h2 className="text-lg font-semibold mb-3">Dicas</h2>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Gmail: smtp.gmail.com:587</li>
                <li>• Outlook: smtp.office365.com:587</li>
                <li>• Use senha de aplicativo para Gmail</li>
                <li>• Ative "Acesso menos seguro" se necessário</li>
              </ul>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmailSettings;
