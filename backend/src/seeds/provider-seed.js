/**
 * Provider Seed Script
 * 
 * Creates the Provider organization (TatuTicket) and its admin users.
 * This is the ROOT organization that must exist before any tenant can be created.
 * 
 * Usage:
 *   node src/seeds/provider-seed.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectPostgreSQL, connectMongoDB, syncDatabase } from '../config/database.js';
import { Organization, Plan, User, setupAssociations } from '../modules/models/index.js';
import logger from '../config/logger.js';

const runProviderSeed = async () => {
    try {
        logger.info('🌱 Iniciando seed do Provider (TatuTicket)...\n');

        // Conectar bancos
        await connectPostgreSQL();
        await connectMongoDB();
        setupAssociations();
        await syncDatabase();

        // ==========================================
        // 1. CRIAR ORGANIZAÇÃO PROVIDER (TatuTicket)
        // ==========================================
        logger.info('📦 Criando Organização Provider...');
        const [provider, providerCreated] = await Organization.findOrCreate({
            where: { slug: 'tatuticket' },
            defaults: {
                type: 'provider',
                parentId: null,
                name: 'TatuTicket',
                tradeName: 'TatuTicket Solutions Lda',
                taxId: '123456789',
                slug: 'tatuticket',
                email: 'admin@tatuticket.com',
                phone: '+351 210 000 000',
                address: 'Avenida da Liberdade, 1000, Lisboa, Portugal',
                primaryColor: '#3B82F6',
                secondaryColor: '#10B981',
                subscription: {
                    plan: 'unlimited',
                    status: 'active',
                    maxUsers: 999999,
                    maxClients: 999999,
                    maxStorageGB: 999999,
                    features: ['all']
                },
                deployment: {
                    type: 'saas',
                    region: 'global'
                },
                settings: {
                    language: 'pt',
                    timezone: 'Europe/Lisbon',
                    dateFormat: 'DD/MM/YYYY',
                    allowSelfRegistration: false,
                    requireApproval: true,
                    sessionTimeout: 480,
                    twoFactorAuth: true
                },
                isActive: true
            }
        });

        if (providerCreated) {
            logger.info(`✅ Provider criado: ${provider.name} (ID: ${provider.id})\n`);
        } else {
            logger.info(`ℹ️  Provider já existe: ${provider.name} (ID: ${provider.id})\n`);
        }

        // ==========================================
        // 2. CRIAR USUÁRIOS DO PROVIDER (na tabela 'users')
        // Provider users use: super-admin, provider-admin, provider-support
        // ==========================================
        logger.info('👥 Criando/Verificando usuários do Provider (tabela users)...');

        const providerUsersData = [
            {
                organizationId: provider.id,
                name: 'Super Admin',
                email: 'superadmin@tatuticket.com',
                password: 'Super@123',
                role: 'super-admin',  // User model supports: super-admin, provider-admin, provider-support
                phone: '+351 910 000 001',
                permissions: {
                    canManageUsers: true,
                    canManageClients: true,
                    canManageTickets: true,
                    canViewReports: true,
                    canManageSettings: true,
                    canAccessAPI: true
                },
                settings: {
                    emailVerified: true,
                    notifications: true,
                    theme: 'light',
                    language: 'pt'
                },
                isActive: true
            },
            {
                organizationId: provider.id,
                name: 'Provider Admin',
                email: 'provideradmin@tatuticket.com',
                password: 'Provider@123',
                role: 'provider-admin',  // User model supports: super-admin, provider-admin, provider-support
                phone: '+351 910 000 002',
                permissions: {
                    canManageUsers: true,
                    canManageClients: true,
                    canManageTickets: true,
                    canViewReports: true,
                    canManageSettings: true,
                    canAccessAPI: true
                },
                settings: {
                    emailVerified: true,
                    notifications: true,
                    theme: 'light',
                    language: 'pt'
                },
                isActive: true
            }
        ];

        let usersCreated = 0;
        for (const userData of providerUsersData) {
            const [user, created] = await User.findOrCreate({
                where: { email: userData.email, organizationId: provider.id },
                defaults: userData
            });
            if (created) {
                logger.info(`  ✅ Usuário criado: ${user.email} (role: ${user.role})`);
                usersCreated++;
            } else {
                logger.info(`  ℹ️  Usuário já existe: ${user.email}`);
            }
        }
        logger.info('');

        // ==========================================
        // 3. CRIAR PLANOS PADRÃO DO SAAS
        // ==========================================
        logger.info('💳 Criando/Verificando Planos SaaS...');

        const plansData = [
            {
                name: 'starter',
                displayName: 'Starter',
                description: 'Ideal para pequenas equipas',
                monthlyPrice: 29.00,
                yearlyPrice: 290.00,
                currency: 'EUR',
                maxUsers: 10,
                maxClients: 50,
                maxStorageGB: 5,
                maxTicketsPerMonth: 500,
                features: ['basic_tickets', 'email_support', 'knowledge_base'],
                trialDays: 14,
                isDefault: false,
                isActive: true
            },
            {
                name: 'professional',
                displayName: 'Professional',
                description: 'Para equipas em crescimento',
                monthlyPrice: 79.00,
                yearlyPrice: 790.00,
                currency: 'EUR',
                maxUsers: 50,
                maxClients: 100,
                maxStorageGB: 50,
                maxTicketsPerMonth: 2000,
                features: ['basic_tickets', 'email_support', 'knowledge_base', 'sla', 'automation', 'reports', 'api'],
                trialDays: 14,
                isDefault: true,
                isActive: true
            },
            {
                name: 'enterprise',
                displayName: 'Enterprise',
                description: 'Solução completa para grandes organizações',
                monthlyPrice: 199.00,
                yearlyPrice: 1990.00,
                currency: 'EUR',
                maxUsers: 200,
                maxClients: 500,
                maxStorageGB: 200,
                maxTicketsPerMonth: 10000,
                features: ['basic_tickets', 'email_support', 'knowledge_base', 'sla', 'automation', 'reports', 'api', 'white_label', 'advanced_integrations', 'priority_support'],
                trialDays: 30,
                isDefault: false,
                isActive: true
            }
        ];

        let plansCreated = 0;
        for (const planData of plansData) {
            const [plan, created] = await Plan.findOrCreate({
                where: { name: planData.name },
                defaults: planData
            });
            if (created) {
                logger.info(`  ✅ Plano criado: ${plan.displayName}`);
                plansCreated++;
            } else {
                logger.info(`  ℹ️  Plano já existe: ${plan.displayName}`);
            }
        }
        logger.info('');

        // ==========================================
        // RESUMO
        // ==========================================
        logger.info('\n📋 ========================================');
        logger.info('   PROVIDER SEED COMPLETO!');
        logger.info('========================================\n');

        logger.info('🔐 CREDENCIAIS DO PROVIDER:\n');
        logger.info('━━━ Portal Backoffice SaaS ━━━');
        logger.info('Super Admin: superadmin@tatuticket.com / Super@123');
        logger.info('Provider Admin: provideradmin@tatuticket.com / Provider@123\n');

        logger.info('━━━ PROVIDER INFO ━━━');
        logger.info(`ID: ${provider.id}`);
        logger.info(`Slug: ${provider.slug}`);
        logger.info(`Type: ${provider.type}\n`);

        logger.info('✨ Provider pronto! Agora pode fazer onboarding de novas organizações.\n');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Erro ao executar seed do Provider:', error);
        process.exit(1);
    }
};

runProviderSeed();
