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

  const updatePlan = (index, field, value) => {
    const newPlans = [...config.pricingPlans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    updateField('pricingPlans', newPlans);
  };

  const updatePlanFeature = (planIndex, featureIndex, value) => {
    const newPlans = [...config.pricingPlans];
    newPlans[planIndex].features[featureIndex] = value;
    updateField('pricingPlans', newPlans);
  };

  const addPlanFeature = (planIndex) => {
    const newPlans = [...config.pricingPlans];
    newPlans[planIndex].features.push('');
    updateField('pricingPlans', newPlans);
  };

  const removePlanFeature = (planIndex, featureIndex) => {
    const newPlans = [...config.pricingPlans];
    newPlans[planIndex].features = newPlans[planIndex].features.filter((_, i) => i !== featureIndex);
    updateField('pricingPlans', newPlans);
  };

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
    { id: 'cta', label: 'CTA Final' },
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
          <PricingSection config={config} updateField={updateField} updatePlan={updatePlan} updatePlanFeature={updatePlanFeature} addPlanFeature={addPlanFeature} removePlanFeature={removePlanFeature} />
        )}
        {activeTab === 'cta' && (
          <CTASection config={config} updateField={updateField} />
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

function PricingSection({ config, updateField, updatePlan, updatePlanFeature, addPlanFeature, removePlanFeature }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Seção de Preços</h3>
      
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

      <div className="grid grid-cols-3 gap-6">
        {config.pricingPlans.map((plan, planIndex) => (
          <div key={planIndex} className={`p-4 border rounded-lg ${plan.highlighted ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
            <div className="space-y-4">
              <input
                type="text"
                value={plan.name}
                onChange={(e) => updatePlan(planIndex, 'name', e.target.value)}
                placeholder="Nome do Plano"
                className="w-full px-4 py-2 border rounded-lg font-semibold dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                value={plan.price}
                onChange={(e) => updatePlan(planIndex, 'price', e.target.value)}
                placeholder="Preço"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={plan.highlighted}
                  onChange={(e) => updatePlan(planIndex, 'highlighted', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Destacar este plano</span>
              </label>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Funcionalidades</span>
                  <button onClick={() => addPlanFeature(planIndex)} className="text-blue-600 text-xs hover:underline">
                    + Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updatePlanFeature(planIndex, featureIndex, e.target.value)}
                        className="flex-1 px-3 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                      <button onClick={() => removePlanFeature(planIndex, featureIndex)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
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
