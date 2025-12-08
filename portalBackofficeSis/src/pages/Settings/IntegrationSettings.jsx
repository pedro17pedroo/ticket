import { useState, useEffect } from 'react';
import { Save, Key, Copy, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import dashboardService from '../../services/dashboardService';
import { showSuccess, showError } from '../../utils/alerts';

const IntegrationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    apiEnabled: true,
    apiKey: '',
    webhookUrl: '',
    webhookSecret: '',
    slackWebhook: '',
    slackEnabled: false,
    teamsWebhook: '',
    teamsEnabled: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getIntegrationSettings();
      setFormData({
        apiEnabled: data.apiEnabled !== false,
        apiKey: data.apiKey || '',
        webhookUrl: data.webhookUrl || '',
        webhookSecret: data.webhookSecret || '',
        slackWebhook: data.slackWebhook || '',
        slackEnabled: data.slackEnabled || false,
        teamsWebhook: data.teamsWebhook || '',
        teamsEnabled: data.teamsEnabled || false
      });
    } catch (error) {
      showError('Erro ao carregar configurações de integração');
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
      await dashboardService.updateIntegrationSettings(formData);
      showSuccess('Configurações de integração salvas com sucesso');
    } catch (error) {
      showError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      const newKey = await dashboardService.generateApiKey();
      setFormData(prev => ({ ...prev, apiKey: newKey }));
      showSuccess('Nova chave API gerada');
    } catch (error) {
      showError('Erro ao gerar chave API');
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(formData.apiKey);
    showSuccess('Chave API copiada');
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações de Integração</h1>
        <p className="text-gray-600 mt-1">Configure integrações com serviços externos</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">API REST</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="apiEnabled"
                  checked={formData.apiEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Habilitar API</span>
              </label>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave API
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.apiKey}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    icon={<Copy className="w-4 h-4" />}
                    onClick={handleCopyApiKey}
                  >
                    Copiar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={handleGenerateApiKey}
                  >
                    Gerar Nova
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use esta chave para autenticar requisições à API
                </p>
              </div>
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Webhooks</h2>
            <div className="space-y-4">
              <Input
                label="URL do Webhook"
                name="webhookUrl"
                value={formData.webhookUrl}
                onChange={handleChange}
                placeholder="https://seu-servidor.com/webhook"
                helperText="Receba notificações de eventos do sistema"
              />
              <Input
                label="Secret do Webhook"
                name="webhookSecret"
                type="password"
                value={formData.webhookSecret}
                onChange={handleChange}
                placeholder="Digite um secret para validação"
              />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Slack</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="slackEnabled"
                  checked={formData.slackEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Habilitar integração com Slack</span>
              </label>
              <Input
                label="Webhook URL do Slack"
                name="slackWebhook"
                value={formData.slackWebhook}
                onChange={handleChange}
                placeholder="https://hooks.slack.com/services/..."
                disabled={!formData.slackEnabled}
              />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Microsoft Teams</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="teamsEnabled"
                  checked={formData.teamsEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Habilitar integração com Teams</span>
              </label>
              <Input
                label="Webhook URL do Teams"
                name="teamsWebhook"
                value={formData.teamsWebhook}
                onChange={handleChange}
                placeholder="https://outlook.office.com/webhook/..."
                disabled={!formData.teamsEnabled}
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Status das Integrações</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API REST</span>
                  <Badge variant={formData.apiEnabled ? 'success' : 'danger'}>
                    {formData.apiEnabled ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Webhooks</span>
                  <Badge variant={formData.webhookUrl ? 'success' : 'secondary'}>
                    {formData.webhookUrl ? 'Configurado' : 'Não configurado'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Slack</span>
                  <Badge variant={formData.slackEnabled ? 'success' : 'secondary'}>
                    {formData.slackEnabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Teams</span>
                  <Badge variant={formData.teamsEnabled ? 'success' : 'secondary'}>
                    {formData.teamsEnabled ? 'Ativo' : 'Inativo'}
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
              <h2 className="text-lg font-semibold mb-3">Documentação</h2>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-indigo-600 hover:underline block">
                  → Documentação da API
                </a>
                <a href="#" className="text-indigo-600 hover:underline block">
                  → Guia de Webhooks
                </a>
                <a href="#" className="text-indigo-600 hover:underline block">
                  → Integração Slack
                </a>
                <a href="#" className="text-indigo-600 hover:underline block">
                  → Integração Teams
                </a>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default IntegrationSettings;
