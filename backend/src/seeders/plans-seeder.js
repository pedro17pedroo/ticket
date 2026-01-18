import Plan from '../models/Plan.js';
import { sequelize } from '../config/database.js';

const plansData = [
  {
    name: 'starter',
    displayName: 'Iniciante',
    description: 'Perfeito para pequenas equipas que estão começando',
    monthlyPrice: 19.99,
    yearlyPrice: 199.90, // 2 meses grátis
    maxUsers: 5,
    maxClients: 25,
    maxTicketsPerMonth: 100,
    maxStorageGB: 2,
    maxAttachmentSizeMB: 5,
    features: {
      basicTicketing: true,
      emailIntegration: true,
      knowledgeBase: false,
      slaManagement: false,
      reporting: false,
      automation: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
      customFields: false,
      workflows: false,
      integrations: false
    },
    trialDays: 14,
    isActive: true,
    isDefault: true,
    sortOrder: 1
  },
  {
    name: 'professional',
    displayName: 'Profissional',
    description: 'Para equipas que precisam de funcionalidades avançadas',
    monthlyPrice: 49.99,
    yearlyPrice: 499.90, // 2 meses grátis
    maxUsers: 25,
    maxClients: 100,
    maxTicketsPerMonth: 500,
    maxStorageGB: 10,
    maxAttachmentSizeMB: 20,
    features: {
      basicTicketing: true,
      emailIntegration: true,
      knowledgeBase: true,
      slaManagement: true,
      reporting: true,
      automation: true,
      apiAccess: true,
      whiteLabel: false,
      prioritySupport: false,
      customFields: true,
      workflows: true,
      integrations: true
    },
    trialDays: 14,
    isActive: true,
    isDefault: false,
    sortOrder: 2
  },
  {
    name: 'enterprise',
    displayName: 'Empresarial',
    description: 'Para grandes organizações com necessidades específicas',
    monthlyPrice: 99.99,
    yearlyPrice: 999.90, // 2 meses grátis
    maxUsers: 100,
    maxClients: 500,
    maxTicketsPerMonth: null, // Ilimitado
    maxStorageGB: 50,
    maxAttachmentSizeMB: 50,
    features: {
      basicTicketing: true,
      emailIntegration: true,
      knowledgeBase: true,
      slaManagement: true,
      reporting: true,
      automation: true,
      apiAccess: true,
      whiteLabel: true,
      prioritySupport: true,
      customFields: true,
      workflows: true,
      integrations: true
    },
    trialDays: 30,
    isActive: true,
    isDefault: false,
    sortOrder: 3
  }
];

export const seedPlans = async () => {
  try {
    console.log('🌱 Seeding plans...');
    
    await sequelize.authenticate();
    
    // Não alterar estrutura da tabela, apenas inserir dados
    // await Plan.sync({ alter: true });
    
    // Criar planos
    for (const planData of plansData) {
      const existingPlan = await Plan.findOne({ where: { name: planData.name } });
      
      if (!existingPlan) {
        await Plan.create(planData);
        console.log(`✅ Plano criado: ${planData.displayName}`);
      } else {
        console.log(`⏭️ Plano já existe: ${planData.displayName}`);
      }
    }
    
    console.log('🎉 Seeding de planos concluído!');
    
  } catch (error) {
    console.error('❌ Erro no seeding de planos:', error);
    throw error;
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPlans()
    .then(() => {
      console.log('✅ Seeding concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no seeding:', error);
      process.exit(1);
    });
}
