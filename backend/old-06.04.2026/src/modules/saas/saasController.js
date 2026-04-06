import { Organization, OrganizationUser, Plan, Subscription } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmailVerification, sendWelcomeEmail } from '../../services/emailService.js';
import organizationSeedService from '../../services/organizationSeedService.js';
import { debug, info, warn, error } from '../../utils/debugLogger.js';

// POST /api/saas/onboarding - Criar nova organização tenant com usuário admin
export const createTenantOrganization = async (req, res, next) => {
  try {
    debug('🚀 ===== INÍCIO CRIAÇÃO ORGANIZAÇÃO TENANT =====');
    debug('📥 POST /api/saas/onboarding - Body:', JSON.stringify(req.body, null, 2));

    let {
      // Dados da organização
      companyName,
      tradeName,
      slug,
      taxId,
      email,
      phone,
      address,
      industry,
      companySize,
      // Dados do usuário admin
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      // Configurações
      plan = 'professional',
      country = 'PT',
      language = 'pt',
      timezone = 'Europe/Lisbon'
    } = req.body;

    // Validações básicas
    if (!companyName || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios: companyName, adminName, adminEmail, adminPassword'
      });
    }

    // Gerar slug automaticamente se não fornecido
    if (!slug) {
      const generatedSlug = companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Adicionar timestamp para garantir unicidade
      slug = `${generatedSlug}-${Date.now()}`;
      debug('🏷️ Slug gerado automaticamente:', slug);
    }

    // Verificar se slug já existe
    const existingSlug = await Organization.findOne({
      where: { slug }
    });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        error: 'Este slug já está em uso. Escolha outro.'
      });
    }

    // Verificar se email da organização já existe
    if (email) {
      const existingOrgEmail = await Organization.findOne({
        where: { email }
      });

      if (existingOrgEmail) {
        return res.status(400).json({
          success: false,
          error: 'Este email já está registrado para outra organização.'
        });
      }
    }

    // Buscar organização provider (TatuTicket)
    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    if (!provider) {
      return res.status(500).json({
        success: false,
        error: 'Organização provider não encontrada'
      });
    }

    // Buscar o plano solicitado ou usar o padrão
    let selectedPlan;
    if (plan) {
      // Tentar buscar por name (ex: 'starter', 'professional', 'enterprise')
      selectedPlan = await Plan.findOne({ 
        where: { 
          [Op.or]: [
            { name: plan },
            { name: plan.toLowerCase() }
          ],
          isActive: true 
        } 
      });
    }

    if (!selectedPlan) {
      // Se não encontrou, usar o plano padrão
      selectedPlan = await Plan.findOne({ where: { isDefault: true, isActive: true } });
    }

    if (!selectedPlan) {
      // Se ainda não encontrou, usar o primeiro plano ativo
      selectedPlan = await Plan.findOne({ where: { isActive: true }, order: [['sortOrder', 'ASC']] });
    }

    if (!selectedPlan) {
      return res.status(500).json({
        success: false,
        error: 'Nenhum plano disponível encontrado'
      });
    }

    debug('📋 Plano selecionado:', {
      name: selectedPlan.name,
      displayName: selectedPlan.displayName,
      monthlyPrice: selectedPlan.monthlyPrice
    });

    // Criar organização tenant
    const organization = await Organization.create({
      type: 'tenant',
      parentId: provider.id,
      name: companyName,
      tradeName: tradeName || companyName,
      slug,
      taxId,
      email: email || adminEmail,
      phone,
      address,
      deployment: {
        type: 'saas',
        region: country === 'PT' ? 'eu-west' : 'global'
      },
      settings: {
        language,
        timezone,
        dateFormat: country === 'PT' ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
        industry,
        companySize,
        allowSelfRegistration: false,
        requireApproval: true,
        sessionTimeout: 480,
        twoFactorAuth: false
      },
      isActive: true
    });

    debug('✅ Organização criada:', {
      id: organization.id,
      name: organization.name,
      slug: organization.slug
    });

    // Criar subscription da organização
    const trialEndsAt = new Date(Date.now() + selectedPlan.trialDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      organizationId: organization.id,
      planId: selectedPlan.id,
      status: 'trial',
      startDate: new Date(),
      trialEndsAt,
      billingCycle: 'monthly',
      amount: selectedPlan.monthlyPrice,
      currency: 'EUR',
      currentUsage: {
        users: 0,
        clients: 0,
        ticketsThisMonth: 0,
        storageUsedGB: 0
      }
    });

    debug('✅ Subscription criada:', {
      id: subscription.id,
      plan: selectedPlan.displayName,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt
    });

    // Gerar token de validação de email
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Criar usuário admin da organização
    debug('🔄 Criando usuário admin...');
    debug('📋 Dados do usuário:', {
      organizationId: organization.id,
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      role: 'org-admin'
    });

    let adminUser;
    try {
      adminUser = await OrganizationUser.create({
        organizationId: organization.id,
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword, // Será hasheado pelo hook do modelo
        role: 'org-admin',
        permissions: {
          canManageTickets: true,
          canManageUsers: true,
          canManageClients: true,
          canViewReports: true,
          canManageSettings: true
        },
        settings: {
          notifications: true,
          emailNotifications: true,
          theme: 'light',
          language,
          timezone,
          emailVerificationToken,
          emailVerified: false
        },
        isActive: true
      });

      debug('✅ Usuário admin criado com sucesso:', {
        id: adminUser.id,
        email: adminUser.email,
        organizationId: adminUser.organizationId
      });

    } catch (userError) {
      error('❌ ERRO ao criar usuário admin:', userError);
      error('📋 Detalhes do erro:', {
        name: userError.name,
        message: userError.message,
        errors: userError.errors
      });

      return res.status(500).json({
        success: false,
        error: 'Erro ao criar usuário administrador',
        details: userError.message
      });
    }

    // Gerar JWT para o usuário
    const token = jwt.sign(
      {
        id: adminUser.id,
        organizationId: organization.id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remover dados sensíveis da resposta
    const organizationData = organization.toJSON();
    const userData = adminUser.toJSON();
    delete userData.password;

    // URL do portal da organização (configurável via .env)
    const portalUrl = process.env.ORGANIZATION_PORTAL_URL || 'http://localhost:5173';

    // Enviar email de boas-vindas
    try {
      await sendWelcomeEmail(
        adminEmail,
        adminName,
        companyName,
        portalUrl
      );
      debug(`📧 Email de boas-vindas enviado para: ${adminEmail}`);
    } catch (emailError) {
      error('⚠️ Erro ao enviar email de boas-vindas:', emailError);
      // Não falhamos a criação se o email não for enviado
    }

    // Seed default data (priorities, types, categories, SLAs, catalog categories)
    let seedStats = null;
    try {
      debug('🌱 Iniciando seed de dados padrão...');
      seedStats = await organizationSeedService.seedOrganizationDefaults(organization.id);
      debug('✅ Seed de dados padrão concluído:', seedStats);
    } catch (seedError) {
      error('⚠️ Erro no seed de dados padrão (não crítico):', seedError);
      // Não falhamos a criação se o seed não funcionar
    }

    debug(`✅ Organização criada: ${organization.name} (${organization.slug})`);
    debug(`✅ Admin criado: ${adminUser.name} (${adminUser.email})`);

    res.status(201).json({
      success: true,
      message: 'Organização criada com sucesso! Verifique seu email para confirmar o acesso.',
      data: {
        organization: organizationData,
        user: userData,
        token,
        portalUrl,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan: {
            name: selectedPlan.name,
            displayName: selectedPlan.displayName,
            monthlyPrice: selectedPlan.monthlyPrice
          },
          trialEndsAt: subscription.trialEndsAt,
          limits: {
            maxUsers: selectedPlan.maxUsers,
            maxClients: selectedPlan.maxClients,
            maxStorageGB: selectedPlan.maxStorageGB,
            maxTicketsPerMonth: selectedPlan.maxTicketsPerMonth
          },
          features: selectedPlan.features
        }
      }
    });

  } catch (error) {
    error('❌ Erro ao criar organização:', error);
    next(error);
  }
};

// GET /api/saas/check-slug/:slug - Verificar disponibilidade do slug
export const checkSlugAvailability = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug || slug.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Slug deve ter pelo menos 3 caracteres'
      });
    }

    // Validar formato do slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Slug deve conter apenas letras minúsculas, números e hífens'
      });
    }

    const existing = await Organization.findOne({
      where: { slug }
    });

    res.json({
      success: true,
      available: !existing,
      slug,
      suggestion: existing ? `${slug}-${Math.floor(Math.random() * 1000)}` : null
    });

  } catch (error) {
    next(error);
  }
};

// Armazenar tokens temporariamente (em produção usar Redis)
const emailVerificationTokens = new Map();

// POST /api/saas/send-verification - Enviar email de verificação
export const sendVerificationEmail = async (req, res, next) => {
  try {
    const { adminEmail, adminName, companyName } = req.body;

    if (!adminEmail || !adminName || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Email, nome e nome da empresa são obrigatórios'
      });
    }

    // Gerar token de 6 dígitos
    const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar token temporariamente (expira em 10 minutos)
    emailVerificationTokens.set(adminEmail, {
      token: emailVerificationToken,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutos
      companyName
    });

    // Limpar tokens expirados periodicamente
    setTimeout(() => {
      for (const [email, data] of emailVerificationTokens.entries()) {
        if (Date.now() > data.expires) {
          emailVerificationTokens.delete(email);
        }
      }
    }, 11 * 60 * 1000);

    // Enviar email de verificação
    const emailResult = await sendEmailVerification(
      adminEmail,
      adminName,
      emailVerificationToken,
      companyName
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao enviar email de verificação'
      });
    }

    debug(`✅ Email de verificação enviado para: ${adminEmail}`);

    res.json({
      success: true,
      message: 'Email de verificação enviado com sucesso!',
      data: {
        emailSent: true,
        expiresIn: 600 // 10 minutos em segundos
      }
    });

  } catch (error) {
    error('❌ Erro ao enviar email de verificação:', error);
    next(error);
  }
};

// POST /api/saas/verify-email - Verificar email com token
export const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: 'Token e email são obrigatórios'
      });
    }

    // Verificar token armazenado temporariamente
    const storedData = emailVerificationTokens.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'Token expirado ou não encontrado. Solicite um novo código.'
      });
    }

    // Verificar se token expirou
    if (Date.now() > storedData.expires) {
      emailVerificationTokens.delete(email);
      return res.status(400).json({
        success: false,
        error: 'Token expirado. Solicite um novo código.'
      });
    }

    // Verificar se token está correto
    if (storedData.token !== token) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido. Verifique o código e tente novamente.'
      });
    }

    // Token válido - remover da memória
    emailVerificationTokens.delete(email);

    debug(`✅ Email verificado com sucesso: ${email}`);

    res.json({
      success: true,
      message: 'Email verificado com sucesso!',
      data: {
        verified: true,
        email: email,
        companyName: storedData.companyName
      }
    });

  } catch (error) {
    error('❌ Erro na verificação de email:', error);
    next(error);
  }
};

// GET /api/saas/plans - Listar planos disponíveis
export const getPlans = async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'starter',
        name: 'Starter',
        price: 29,
        currency: 'EUR',
        period: 'month',
        maxUsers: 10,
        maxClients: 50,
        maxStorageGB: 5,
        features: ['Tickets básicos', 'Portal do cliente', 'Suporte por email'],
        popular: false
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 79,
        currency: 'EUR',
        period: 'month',
        maxUsers: 50,
        maxClients: 100,
        maxStorageGB: 50,
        features: ['Tudo do Starter', 'SLA', 'Automações', 'Relatórios', 'API'],
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        currency: 'EUR',
        period: 'month',
        maxUsers: 200,
        maxClients: 500,
        maxStorageGB: 200,
        features: ['Tudo do Professional', 'White-label', 'Integrações avançadas', 'Suporte prioritário'],
        popular: false
      }
    ];

    res.json({
      success: true,
      plans
    });

  } catch (error) {
    next(error);
  }
};
