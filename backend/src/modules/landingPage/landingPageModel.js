import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const LandingPageConfig = sequelize.define('LandingPageConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Hero Section
  heroBadge: {
    type: DataTypes.STRING,
    defaultValue: '#1 em Funcionalidades do Mercado'
  },
  heroTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Gestão de Tickets'
  },
  heroSubtitle: {
    type: DataTypes.STRING,
    defaultValue: 'Multi-Tenant B2B2C'
  },
  heroDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'Plataforma completa de Help Desk com arquitetura multi-tenant, gestão de clientes B2B e funcionalidades enterprise.'
  },
  heroCta1Text: {
    type: DataTypes.STRING,
    defaultValue: 'Começar Agora'
  },
  heroCta1Link: {
    type: DataTypes.STRING,
    defaultValue: '/trial'
  },
  heroCta2Text: {
    type: DataTypes.STRING,
    defaultValue: 'Ver Funcionalidades'
  },
  heroCta2Link: {
    type: DataTypes.STRING,
    defaultValue: '/features'
  },
  // Stats
  stats: {
    type: DataTypes.JSONB,
    defaultValue: [
      { value: '32+', label: 'Funcionalidades' },
      { value: '99.9%', label: 'Uptime' },
      { value: '24/7', label: 'Suporte' }
    ]
  },
  // Features Section
  featuresTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Por que escolher TatuTicket?'
  },
  featuresSubtitle: {
    type: DataTypes.STRING,
    defaultValue: 'A solução mais completa do mercado para gestão de tickets'
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: [
      { icon: 'Zap', title: 'Ultra Rápido', description: 'Performance otimizada para milhões de usuários simultâneos' },
      { icon: 'Shield', title: 'Seguro', description: 'Criptografia end-to-end e conformidade com GDPR' },
      { icon: 'Globe', title: 'Multi-Tenant', description: 'Arquitetura B2B2C com segregação completa de dados' }
    ]
  },
  // Pricing Section
  pricingTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Planos Flexíveis'
  },
  pricingSubtitle: {
    type: DataTypes.STRING,
    defaultValue: 'Escolha o melhor plano para sua empresa'
  },
  pricingPlans: {
    type: DataTypes.JSONB,
    defaultValue: [
      { name: 'Starter', price: '€49', features: ['Até 10 usuários', '1000 tickets/mês', 'Suporte por email'], highlighted: false },
      { name: 'Professional', price: '€149', features: ['Até 50 usuários', '10000 tickets/mês', 'Suporte 24/7', 'API access'], highlighted: true },
      { name: 'Enterprise', price: 'Contacte-nos', features: ['Usuários ilimitados', 'Tickets ilimitados', 'Suporte dedicado', 'White-label'], highlighted: false }
    ]
  },
  // CTA Section
  ctaTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Pronto para começar?'
  },
  ctaDescription: {
    type: DataTypes.STRING,
    defaultValue: 'Experimente gratuitamente por 14 dias. Sem cartão de crédito.'
  },
  ctaButtonText: {
    type: DataTypes.STRING,
    defaultValue: 'Iniciar Trial Gratuito'
  },
  ctaButtonLink: {
    type: DataTypes.STRING,
    defaultValue: '/trial'
  },
  // Footer
  footerText: {
    type: DataTypes.STRING,
    defaultValue: '© 2025 TatuTicket. Todos os direitos reservados.'
  },
  // Branding
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  brandName: {
    type: DataTypes.STRING,
    defaultValue: 'TatuTicket'
  },
  // SEO
  metaTitle: {
    type: DataTypes.STRING,
    defaultValue: 'TatuTicket - Gestão de Tickets Multi-Tenant'
  },
  metaDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'Plataforma completa de Help Desk com arquitetura multi-tenant B2B2C'
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'landing_page_config',
  timestamps: true
});

export default LandingPageConfig;
