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
    defaultValue: '/onboarding'
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
      { name: 'Starter', price: '€29', features: ['Até 10 usuários', '500 tickets/mês', 'Suporte por email', 'Base de conhecimento'], highlighted: false },
      { name: 'Professional', price: '€79', features: ['Até 50 usuários', '2000 tickets/mês', 'Suporte 24/7', 'SLA', 'Automações', 'API'], highlighted: true },
      { name: 'Enterprise', price: '€199', features: ['Até 200 usuários', '10000 tickets/mês', 'Suporte dedicado', 'White-label', 'Integrações avançadas'], highlighted: false }
    ]
  },
  // Clients Section (Logos)
  clientsTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Empresas que confiam em nós'
  },
  clientsLogos: {
    type: DataTypes.JSONB,
    defaultValue: [
      { name: 'Empresa 1', logoUrl: '/logos/empresa1.png' },
      { name: 'Empresa 2', logoUrl: '/logos/empresa2.png' },
      { name: 'Empresa 3', logoUrl: '/logos/empresa3.png' },
      { name: 'Empresa 4', logoUrl: '/logos/empresa4.png' },
      { name: 'Empresa 5', logoUrl: '/logos/empresa5.png' }
    ]
  },
  // Testimonials Section
  testimonialsTitle: {
    type: DataTypes.STRING,
    defaultValue: 'O que nossos clientes dizem'
  },
  testimonialsSubtitle: {
    type: DataTypes.STRING,
    defaultValue: 'Veja como o TatuTicket transformou o atendimento dessas empresas'
  },
  testimonials: {
    type: DataTypes.JSONB,
    defaultValue: [
      { 
        name: 'João Silva', 
        role: 'Diretor de TI', 
        company: 'TechCorp', 
        avatar: '/avatars/avatar1.jpg',
        text: 'O TatuTicket revolucionou nosso atendimento. Reduzimos o tempo de resposta em 60% e a satisfação dos clientes aumentou significativamente.',
        rating: 5
      },
      { 
        name: 'Maria Santos', 
        role: 'Gerente de Suporte', 
        company: 'InnovaSoft', 
        avatar: '/avatars/avatar2.jpg',
        text: 'A melhor plataforma de tickets que já utilizamos. Interface intuitiva e funcionalidades completas para nossa equipe.',
        rating: 5
      },
      { 
        name: 'Pedro Costa', 
        role: 'CEO', 
        company: 'StartupXYZ', 
        avatar: '/avatars/avatar3.jpg',
        text: 'Excelente custo-benefício. O suporte é excepcional e a plataforma atende todas as nossas necessidades.',
        rating: 5
      }
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
    defaultValue: '/onboarding'
  },
  // Footer
  footerText: {
    type: DataTypes.STRING,
    defaultValue: '© 2025 TatuTicket. Todos os direitos reservados.'
  },
  footerDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'A plataforma de gestão de tickets mais completa do mercado. Simplifique o atendimento, automatize processos e encante seus clientes.'
  },
  footerEmail: {
    type: DataTypes.STRING,
    defaultValue: 'contato@tatuticket.com'
  },
  footerPhone: {
    type: DataTypes.STRING,
    defaultValue: '+55 (11) 99999-9999'
  },
  footerAddress: {
    type: DataTypes.STRING,
    defaultValue: 'São Paulo, Brasil'
  },
  footerLinks: {
    type: DataTypes.JSONB,
    defaultValue: {
      produto: [
        { label: 'Funcionalidades', url: '/features' },
        { label: 'Preços', url: '/pricing' },
        { label: 'Desktop Agent', url: '/desktop-agent' },
        { label: 'Integrações', url: '/integrations' },
        { label: 'API', url: '/api' }
      ],
      empresa: [
        { label: 'Sobre Nós', url: '/about' },
        { label: 'Blog', url: '/blog' },
        { label: 'Carreiras', url: '/careers' },
        { label: 'Parceiros', url: '/partners' },
        { label: 'Imprensa', url: '/press' }
      ],
      recursos: [
        { label: 'Documentação', url: '/docs' },
        { label: 'Tutoriais', url: '/tutorials' },
        { label: 'Status', url: '/status' },
        { label: 'Webinars', url: '/webinars' },
        { label: 'Templates', url: '/templates' }
      ],
      suporte: [
        { label: 'Central de Ajuda', url: '/help' },
        { label: 'Fale Conosco', url: '/contact' },
        { label: 'Comunidade', url: '/community' },
        { label: 'Segurança', url: '/security' },
        { label: 'Compliance', url: '/compliance' }
      ]
    }
  },
  footerSocial: {
    type: DataTypes.JSONB,
    defaultValue: {
      twitter: 'https://twitter.com/tatuticket',
      linkedin: 'https://linkedin.com/company/tatuticket',
      github: 'https://github.com/tatuticket'
    }
  },
  footerLegal: {
    type: DataTypes.JSONB,
    defaultValue: [
      { label: 'Privacidade', url: '/privacy' },
      { label: 'Termos', url: '/terms' },
      { label: 'Cookies', url: '/cookies' }
    ]
  },
  newsletterTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Newsletter'
  },
  newsletterDescription: {
    type: DataTypes.STRING,
    defaultValue: 'Receba as últimas novidades sobre gestão de tickets e tecnologia.'
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
