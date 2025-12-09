import { useState, useEffect } from 'react';
import { Save, RotateCcw, Eye, Plus, Trash2, GripVertical } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export default function LandingPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.get('/landing-page/config');
      setConfig(response.data.config);
    } catch (error) {
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/landing-page/config', config);
      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja resetar para os valores padrão?')) return;
    
    try {
      const response = await api.post('/landing-page/config/reset');
      setConfig(response.data.config);
      toast.success('Configuração resetada!');
    } catch (error) {
      toast.error('Erro ao resetar configuração');
    }
  };

  const updateField = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateStat = (index, field, value) => {
    const newStats = [...config.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    updateField('stats', newStats);
  };

  const addStat = () => {
    updateField('stats', [...config.stats, { value: '', label: '' }]);
  };

  const removeStat = (index) => {
    updateField('stats', config.stats.filter((_, i) => i !== index));
  };

  const updateFeature = (index, field, value) => {
    const newFeatures = [...config.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    updateField('features', newFeatures);
  };

  const addFeature = () => {
    updateField('features', [...config.features, { icon: 'Star', title: '', description: '' }]);
  };

  const removeFeature = (index) => {
    updateField('features', config.features.filter((_, i) => i !== index));
  };

  // Funções de planos removidas - agora os planos são gerenciados no menu "Planos"

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'hero', label: 'Hero' },
    { id: 'features', label: 'Funcionalidades' },
    { id: 'pricing', label: 'Preços' },
    { id: 'clients', label: 'Clientes' },
    { id: 'testimonials', label: 'Testemunhos' },
    { id: 'cta', label: 'CTA Final' },
    { id: 'footer', label: 'Footer' },
    { id: 'branding', label: 'Branding & SEO' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configuração da Landing Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Personalize o conteúdo do Portal SaaS
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="http://localhost:5176"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Eye className="w-4 h-4" />
            Pré-visualizar
          </a>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
            Resetar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        {activeTab === 'hero' && (
          <HeroSection config={config} updateField={updateField} updateStat={updateStat} addStat={addStat} removeStat={removeStat} />
        )}
        {activeTab === 'features' && (
          <FeaturesSection config={config} updateField={updateField} updateFeature={updateFeature} addFeature={addFeature} removeFeature={removeFeature} />
        )}
        {activeTab === 'pricing' && (
          <PricingSection config={config} updateField={updateField} />
        )}
        {activeTab === 'clients' && (
          <ClientsSection config={config} updateField={updateField} />
        )}
        {activeTab === 'testimonials' && (
          <TestimonialsSection config={config} updateField={updateField} />
        )}
        {activeTab === 'cta' && (
          <CTASection config={config} updateField={updateField} />
        )}
        {activeTab === 'footer' && (
          <FooterSection config={config} updateField={updateField} />
        )}
        {activeTab === 'branding' && (
          <BrandingSection config={config} updateField={updateField} />
        )}
      </div>
    </div>
  );
}

function HeroSection({ config, updateField, updateStat, addStat, removeStat }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Seção Hero</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Badge</label>
          <input
            type="text"
            value={config.heroBadge}
            onChange={(e) => updateField('heroBadge', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Título Principal</label>
          <input
            type="text"
            value={config.heroTitle}
            onChange={(e) => updateField('heroTitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Subtítulo (destaque)</label>
          <input
            type="text"
            value={config.heroSubtitle}
            onChange={(e) => updateField('heroSubtitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Descrição</label>
          <textarea
            value={config.heroDescription}
            onChange={(e) => updateField('heroDescription', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Botão Principal - Texto</label>
          <input
            type="text"
            value={config.heroCta1Text}
            onChange={(e) => updateField('heroCta1Text', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Botão Principal - Link</label>
          <input
            type="text"
            value={config.heroCta1Link}
            onChange={(e) => updateField('heroCta1Link', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Botão Secundário - Texto</label>
          <input
            type="text"
            value={config.heroCta2Text}
            onChange={(e) => updateField('heroCta2Text', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Botão Secundário - Link</label>
          <input
            type="text"
            value={config.heroCta2Link}
            onChange={(e) => updateField('heroCta2Link', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium">Estatísticas</label>
          <button onClick={addStat} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <div className="space-y-3">
          {config.stats.map((stat, index) => (
            <div key={index} className="flex gap-4 items-center">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              <input
                type="text"
                value={stat.value}
                onChange={(e) => updateStat(index, 'value', e.target.value)}
                placeholder="Valor (ex: 32+)"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                value={stat.label}
                onChange={(e) => updateStat(index, 'label', e.target.value)}
                placeholder="Label (ex: Funcionalidades)"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <button onClick={() => removeStat(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSection({ config, updateField, updateFeature, addFeature, removeFeature }) {
  const iconOptions = ['Zap', 'Shield', 'Globe', 'Star', 'Heart', 'Check', 'Clock', 'Users', 'Lock', 'Rocket'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Seção de Funcionalidades</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Título da Seção</label>
          <input
            type="text"
            value={config.featuresTitle}
            onChange={(e) => updateField('featuresTitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Subtítulo</label>
          <input
            type="text"
            value={config.featuresSubtitle}
            onChange={(e) => updateField('featuresSubtitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium">Cards de Funcionalidades</label>
          <button onClick={addFeature} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <div className="space-y-4">
          {config.features.map((feature, index) => (
            <div key={index} className="p-4 border rounded-lg dark:border-gray-600">
              <div className="flex gap-4 items-start">
                <select
                  value={feature.icon}
                  onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                    placeholder="Título"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                  <textarea
                    value={feature.description}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                    placeholder="Descrição"
                    rows={2}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <button onClick={() => removeFeature(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingSection({ config, updateField }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/plans');
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Seção de Preços</h3>
        <a 
          href="/plans" 
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
        >
          Gerenciar Planos →
        </a>
      </div>

      {/* Aviso informativo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>ℹ️ Nota:</strong> Os planos exibidos na landing page são carregados automaticamente do menu <strong>"Planos"</strong>. 
          Para alterar preços, limites ou funcionalidades, acesse o menu Planos no sidebar.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Título da Seção</label>
          <input
            type="text"
            value={config.pricingTitle}
            onChange={(e) => updateField('pricingTitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Subtítulo</label>
          <input
            type="text"
            value={config.pricingSubtitle}
            onChange={(e) => updateField('pricingSubtitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Preview dos planos reais */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-gray-600 dark:text-gray-400">Planos que serão exibidos na Landing Page:</h4>
        
        {loadingPlans ? (
          <div className="text-center py-8 text-gray-500">Carregando planos...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum plano cadastrado. <a href="/plans" className="text-blue-600 hover:underline">Criar planos</a>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {plans.filter(p => p.isActive).map((plan) => {
              // Mapeamento de símbolos de moeda
              const currencySymbols = { EUR: '€', USD: '$', BRL: 'R$', AOA: 'Kz', GBP: '£', CHF: 'CHF' };
              const symbol = plan.currencySymbol || currencySymbols[plan.currency] || '€';
              const price = plan.priceFormatted || `${symbol}${parseFloat(plan.price || plan.monthlyPrice).toFixed(2)}`;
              
              return (
                <div 
                  key={plan.id} 
                  className={`p-4 border rounded-lg ${plan.isDefault ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-lg">{plan.displayName || plan.name}</h5>
                      {plan.isDefault && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Popular</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {price}
                      <span className="text-sm font-normal text-gray-500">/mês</span>
                    </p>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                    <div className="pt-2 border-t dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {plan.limits?.maxUsers || plan.maxUsers} usuários • {plan.limits?.maxClients || plan.maxClients} clientes
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientsSection({ config, updateField }) {
  const updateClient = (index, field, value) => {
    const newClients = [...(config.clientsLogos || [])];
    newClients[index] = { ...newClients[index], [field]: value };
    updateField('clientsLogos', newClients);
  };

  const addClient = () => {
    const newClients = [...(config.clientsLogos || []), { name: '', logoUrl: '' }];
    updateField('clientsLogos', newClients);
  };

  const removeClient = (index) => {
    updateField('clientsLogos', (config.clientsLogos || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Logos de Clientes</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">Título da Seção</label>
        <input
          type="text"
          value={config.clientsTitle || ''}
          onChange={(e) => updateField('clientsTitle', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          placeholder="Empresas que confiam em nós"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium">Logos dos Clientes</label>
          <button onClick={addClient} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <div className="space-y-3">
          {(config.clientsLogos || []).map((client, index) => (
            <div key={index} className="flex gap-4 items-center p-3 border rounded-lg dark:border-gray-600">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              <input
                type="text"
                value={client.name}
                onChange={(e) => updateClient(index, 'name', e.target.value)}
                placeholder="Nome da empresa"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                value={client.logoUrl}
                onChange={(e) => updateClient(index, 'logoUrl', e.target.value)}
                placeholder="URL do logo (ex: /logos/empresa.png)"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <button onClick={() => removeClient(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Dica: Use URLs de imagens ou deixe vazio para mostrar apenas o nome da empresa.
        </p>
      </div>
    </div>
  );
}

function TestimonialsSection({ config, updateField }) {
  const updateTestimonial = (index, field, value) => {
    const newTestimonials = [...(config.testimonials || [])];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    updateField('testimonials', newTestimonials);
  };

  const addTestimonial = () => {
    const newTestimonials = [...(config.testimonials || []), { 
      name: '', 
      role: '', 
      company: '', 
      avatar: '', 
      text: '', 
      rating: 5 
    }];
    updateField('testimonials', newTestimonials);
  };

  const removeTestimonial = (index) => {
    updateField('testimonials', (config.testimonials || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Testemunhos de Clientes</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Título da Seção</label>
          <input
            type="text"
            value={config.testimonialsTitle || ''}
            onChange={(e) => updateField('testimonialsTitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="O que nossos clientes dizem"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Subtítulo</label>
          <input
            type="text"
            value={config.testimonialsSubtitle || ''}
            onChange={(e) => updateField('testimonialsSubtitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Veja como transformamos o atendimento"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium">Testemunhos</label>
          <button onClick={addTestimonial} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <div className="space-y-4">
          {(config.testimonials || []).map((testimonial, index) => (
            <div key={index} className="p-4 border rounded-lg dark:border-gray-600">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-gray-500">Testemunho #{index + 1}</span>
                <button onClick={() => removeTestimonial(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  value={testimonial.name}
                  onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                  placeholder="Nome"
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={testimonial.role}
                  onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                  placeholder="Cargo"
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={testimonial.company}
                  onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                  placeholder="Empresa"
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-3">
                  <input
                    type="text"
                    value={testimonial.avatar}
                    onChange={(e) => updateTestimonial(index, 'avatar', e.target.value)}
                    placeholder="URL do avatar (opcional)"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <select
                    value={testimonial.rating || 5}
                    onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐</option>
                    <option value={4}>⭐⭐⭐⭐</option>
                    <option value={3}>⭐⭐⭐</option>
                  </select>
                </div>
              </div>
              <textarea
                value={testimonial.text}
                onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                placeholder="Texto do testemunho..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTASection({ config, updateField }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Seção CTA Final</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Título</label>
          <input
            type="text"
            value={config.ctaTitle}
            onChange={(e) => updateField('ctaTitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Descrição</label>
          <textarea
            value={config.ctaDescription}
            onChange={(e) => updateField('ctaDescription', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Texto do Botão</label>
          <input
            type="text"
            value={config.ctaButtonText}
            onChange={(e) => updateField('ctaButtonText', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Link do Botão</label>
          <input
            type="text"
            value={config.ctaButtonLink}
            onChange={(e) => updateField('ctaButtonLink', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Texto do Footer</label>
          <input
            type="text"
            value={config.footerText}
            onChange={(e) => updateField('footerText', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
    </div>
  );
}

function FooterSection({ config, updateField }) {
  const updateFooterLink = (category, index, field, value) => {
    const newLinks = { ...config.footerLinks };
    newLinks[category][index] = { ...newLinks[category][index], [field]: value };
    updateField('footerLinks', newLinks);
  };

  const addFooterLink = (category) => {
    const newLinks = { ...config.footerLinks };
    newLinks[category] = [...newLinks[category], { label: '', url: '' }];
    updateField('footerLinks', newLinks);
  };

  const removeFooterLink = (category, index) => {
    const newLinks = { ...config.footerLinks };
    newLinks[category] = newLinks[category].filter((_, i) => i !== index);
    updateField('footerLinks', newLinks);
  };

  const updateLegalLink = (index, field, value) => {
    const newLegal = [...config.footerLegal];
    newLegal[index] = { ...newLegal[index], [field]: value };
    updateField('footerLegal', newLegal);
  };

  const addLegalLink = () => {
    updateField('footerLegal', [...config.footerLegal, { label: '', url: '' }]);
  };

  const removeLegalLink = (index) => {
    updateField('footerLegal', config.footerLegal.filter((_, i) => i !== index));
  };

  const updateSocial = (key, value) => {
    updateField('footerSocial', { ...config.footerSocial, [key]: value });
  };

  const categoryLabels = {
    produto: 'Produto',
    empresa: 'Empresa',
    recursos: 'Recursos',
    suporte: 'Suporte'
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">Configuração do Footer</h3>
      
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Informações da Empresa</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              value={config.footerDescription || ''}
              onChange={(e) => updateField('footerDescription', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Descrição curta da empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email de Contato</label>
            <input
              type="email"
              value={config.footerEmail || ''}
              onChange={(e) => updateField('footerEmail', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="contato@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Telefone</label>
            <input
              type="text"
              value={config.footerPhone || ''}
              onChange={(e) => updateField('footerPhone', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="+55 (11) 99999-9999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Endereço</label>
            <input
              type="text"
              value={config.footerAddress || ''}
              onChange={(e) => updateField('footerAddress', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="São Paulo, Brasil"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Texto de Copyright</label>
            <input
              type="text"
              value={config.footerText || ''}
              onChange={(e) => updateField('footerText', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="© 2025 Empresa. Todos os direitos reservados."
            />
          </div>
        </div>
      </div>

      {/* Links do Footer */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Links do Footer</h4>
        <div className="grid grid-cols-2 gap-6">
          {config.footerLinks && Object.keys(categoryLabels).map(category => (
            <div key={category} className="border rounded-lg p-4 dark:border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">{categoryLabels[category]}</span>
                <button 
                  onClick={() => addFooterLink(category)} 
                  className="text-blue-600 text-xs hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              <div className="space-y-2">
                {config.footerLinks[category]?.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateFooterLink(category, index, 'label', e.target.value)}
                      placeholder="Label"
                      className="flex-1 px-3 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateFooterLink(category, index, 'url', e.target.value)}
                      placeholder="/url"
                      className="flex-1 px-3 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button 
                      onClick={() => removeFooterLink(category, index)} 
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redes Sociais */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Redes Sociais</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Twitter/X</label>
            <input
              type="text"
              value={config.footerSocial?.twitter || ''}
              onChange={(e) => updateSocial('twitter', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://twitter.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn</label>
            <input
              type="text"
              value={config.footerSocial?.linkedin || ''}
              onChange={(e) => updateSocial('linkedin', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://linkedin.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">GitHub</label>
            <input
              type="text"
              value={config.footerSocial?.github || ''}
              onChange={(e) => updateSocial('github', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://github.com/..."
            />
          </div>
        </div>
      </div>

      {/* Links Legais */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Links Legais</h4>
          <button onClick={addLegalLink} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {config.footerLegal?.map((link, index) => (
            <div key={index} className="flex gap-4 items-center">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLegalLink(index, 'label', e.target.value)}
                placeholder="Label (ex: Privacidade)"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => updateLegalLink(index, 'url', e.target.value)}
                placeholder="URL (ex: /privacy)"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <button onClick={() => removeLegalLink(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Newsletter</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              value={config.newsletterTitle || ''}
              onChange={(e) => updateField('newsletterTitle', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Newsletter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <input
              type="text"
              value={config.newsletterDescription || ''}
              onChange={(e) => updateField('newsletterDescription', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Receba as últimas novidades..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandingSection({ config, updateField }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Branding & SEO</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Nome da Marca</label>
          <input
            type="text"
            value={config.brandName}
            onChange={(e) => updateField('brandName', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">URL do Logo</label>
          <input
            type="text"
            value={config.logoUrl || ''}
            onChange={(e) => updateField('logoUrl', e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Meta Title (SEO)</label>
          <input
            type="text"
            value={config.metaTitle}
            onChange={(e) => updateField('metaTitle', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Meta Description (SEO)</label>
          <textarea
            value={config.metaDescription}
            onChange={(e) => updateField('metaDescription', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
    </div>
  );
}
