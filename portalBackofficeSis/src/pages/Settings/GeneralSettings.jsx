import { useState, useEffect, useRef } from 'react';
import { Save, Upload } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import dashboardService from '../../services/dashboardService';
import { showSuccess, showError } from '../../utils/alerts';

const GeneralSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logo, setLogo] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    supportEmail: '',
    supportPhone: '',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getSettings();
      setFormData({
        companyName: data.companyName || 'TatuTicket',
        companyEmail: data.companyEmail || 'contato@tatuticket.com',
        companyPhone: data.companyPhone || '',
        companyAddress: data.companyAddress || '',
        supportEmail: data.supportEmail || 'suporte@tatuticket.com',
        supportPhone: data.supportPhone || '',
        timezone: data.timezone || 'America/Sao_Paulo',
        language: data.language || 'pt-BR',
        dateFormat: data.dateFormat || 'DD/MM/YYYY',
        currency: data.currency || 'BRL'
      });
      if (data.logo) {
        // Se o logo é uma URL relativa, adicionar a base URL do backend
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4003/api';
        const baseUrl = apiUrl.replace('/api', '');
        setLogo(data.logo.startsWith('http') ? data.logo : `${baseUrl}${data.logo}`);
      }
    } catch (error) {
      showError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showError('Formato inválido. Use PNG ou JPG.');
      return;
    }

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      
      // Fazer upload para o servidor primeiro
      const response = await dashboardService.uploadLogo(file);
      
      // Usar a URL retornada pelo servidor
      if (response.logo) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4003/api';
        const baseUrl = apiUrl.replace('/api', '');
        setLogo(`${baseUrl}${response.logo}`);
      }
      
      showSuccess('Logo atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showError('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await dashboardService.updateSettings(formData);
      showSuccess('Configurações salvas com sucesso');
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
        <h1 className="text-2xl font-bold text-gray-900">Configurações Gerais</h1>
        <p className="text-gray-600 mt-1">Configure as informações básicas do sistema</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Informações da Empresa</h2>
            <div className="space-y-4">
              <Input
                label="Nome da Empresa"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email da Empresa"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Telefone da Empresa"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="Endereço"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
              />
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Informações de Suporte</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email de Suporte"
                  name="supportEmail"
                  type="email"
                  value={formData.supportEmail}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Telefone de Suporte"
                  name="supportPhone"
                  value={formData.supportPhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <h2 className="text-lg font-semibold mt-6 mb-4">Regionalização</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuso Horário
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                  <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                  <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="pt-PT">Português (Portugal)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato de Data
                </label>
                <select
                  name="dateFormat"
                  value={formData.dateFormat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moeda
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Logo da Empresa</h2>
              <div className="text-center">
                <div 
                  className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleLogoClick}
                >
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-4xl font-bold text-gray-400">
                      {formData.companyName?.substring(0, 2).toUpperCase() || 'TT'}
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  icon={<Upload className="w-4 h-4" />}
                  className="w-full"
                  onClick={handleLogoClick}
                  loading={uploadingLogo}
                >
                  {uploadingLogo ? 'Enviando...' : 'Fazer Upload'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  PNG ou JPG (máx. 2MB)
                </p>
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
          </div>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettings;
