/**
 * Organization Seed Service
 * 
 * Populates default configurations for new organizations during SaaS onboarding.
 * Includes: Priorities, Types, SLAs, and Catalog Categories.
 * Based on ITIL best practices.
 */

import { Priority, Type, SLA } from '../modules/models/index.js';
import { CatalogCategory } from '../modules/catalog/catalogModel.js';
import logger from '../config/logger.js';

/**
 * Default Priorities (ITIL-based with response/resolution times in minutes)
 */
const DEFAULT_PRIORITIES = [
    {
        name: 'Crítica',
        description: 'Impacto crítico no negócio. Serviços essenciais totalmente indisponíveis.',
        color: '#DC2626',
        responseTime: 15,     // 15 minutes
        resolutionTime: 120,  // 2 hours
        order: 1
    },
    {
        name: 'Urgente',
        description: 'Impacto significativo. Serviços degradados ou funcionalidades críticas afetadas.',
        color: '#EA580C',
        responseTime: 30,     // 30 minutes
        resolutionTime: 240,  // 4 hours
        order: 2
    },
    {
        name: 'Alta',
        description: 'Impacto moderado. Múltiplos utilizadores afetados ou funcionalidades importantes.',
        color: '#D97706',
        responseTime: 60,     // 1 hour
        resolutionTime: 480,  // 8 hours
        order: 3
    },
    {
        name: 'Média',
        description: 'Impacto limitado. Poucos utilizadores afetados ou funcionalidades secundárias.',
        color: '#2563EB',
        responseTime: 240,    // 4 hours
        resolutionTime: 1440, // 24 hours
        order: 4
    },
    {
        name: 'Baixa',
        description: 'Impacto mínimo. Melhorias, dúvidas ou solicitações não urgentes.',
        color: '#16A34A',
        responseTime: 480,    // 8 hours
        resolutionTime: 2880, // 48 hours
        order: 5
    }
];

/**
 * Default Types (ITIL-based)
 */
const DEFAULT_TYPES = [
    {
        name: 'Incidente',
        description: 'Interrupção não planejada de um serviço ou redução na qualidade do serviço.',
        icon: 'AlertTriangle',
        color: '#DC2626',
        order: 1
    },
    {
        name: 'Requisição',
        description: 'Pedido formal de um utilizador para algo a ser fornecido (acesso, informação, serviço).',
        icon: 'FileText',
        color: '#2563EB',
        order: 2
    },
    {
        name: 'Problema',
        description: 'Causa ou causa potencial de um ou mais incidentes.',
        icon: 'AlertCircle',
        color: '#7C3AED',
        order: 3
    },
    {
        name: 'Mudança',
        description: 'Adição, modificação ou remoção de algo que pode afetar serviços de TI.',
        icon: 'Settings',
        color: '#D97706',
        order: 4
    },
    {
        name: 'Tarefa',
        description: 'Atividade interna da equipa de suporte.',
        icon: 'CheckSquare',
        color: '#0891B2',
        order: 5
    }
];

/**
 * Default Categories (Common IT service categories)
 */
const DEFAULT_CATEGORIES = [
    {
        name: 'Acesso e Autenticação',
        description: 'Problemas de login, credenciais, permissões e autenticação.',
        icon: 'Lock',
        color: '#DC2626'
    },
    {
        name: 'Rede e Conectividade',
        description: 'Problemas de ligação à rede, internet, Wi-Fi e VPN.',
        icon: 'Wifi',
        color: '#EA580C'
    },
    {
        name: 'Hardware e Equipamentos',
        description: 'Problemas com computadores, monitores, impressoras e periféricos.',
        icon: 'Laptop',
        color: '#D97706'
    },
    {
        name: 'Software e Aplicações',
        description: 'Problemas com instalação, atualização ou funcionamento de software.',
        icon: 'Package',
        color: '#2563EB'
    },
    {
        name: 'Email e Comunicação',
        description: 'Problemas com email, calendário, Teams, Slack ou outras ferramentas de comunicação.',
        icon: 'Mail',
        color: '#7C3AED'
    },
    {
        name: 'Infraestrutura e Servidores',
        description: 'Problemas com servidores, storage, cloud ou serviços de infraestrutura.',
        icon: 'Server',
        color: '#0891B2'
    },
    {
        name: 'Segurança',
        description: 'Incidentes de segurança, malware, phishing ou vulnerabilidades.',
        icon: 'Shield',
        color: '#BE123C'
    },
    {
        name: 'Backup e Recuperação',
        description: 'Restauração de ficheiros, recuperação de dados ou problemas de backup.',
        icon: 'HardDrive',
        color: '#4338CA'
    },
    {
        name: 'Telefonia e VoIP',
        description: 'Problemas com telefones, extensões, voicemail ou sistemas VoIP.',
        icon: 'Phone',
        color: '#0D9488'
    },
    {
        name: 'Outros',
        description: 'Outras solicitações ou problemas não categorizados.',
        icon: 'HelpCircle',
        color: '#6B7280'
    }
];

/**
 * Default SLAs (linked to priorities)
 */
const DEFAULT_SLAS = [
    {
        name: 'SLA Crítico',
        description: 'Acordo de nível de serviço para tickets de prioridade crítica.',
        priority: 'Crítica',
        responseTimeMinutes: 15,
        resolutionTimeMinutes: 120
    },
    {
        name: 'SLA Urgente',
        description: 'Acordo de nível de serviço para tickets de prioridade urgente.',
        priority: 'Urgente',
        responseTimeMinutes: 30,
        resolutionTimeMinutes: 240
    },
    {
        name: 'SLA Alta',
        description: 'Acordo de nível de serviço para tickets de prioridade alta.',
        priority: 'Alta',
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 480
    },
    {
        name: 'SLA Padrão',
        description: 'Acordo de nível de serviço para tickets de prioridade média.',
        priority: 'Média',
        responseTimeMinutes: 240,
        resolutionTimeMinutes: 1440
    },
    {
        name: 'SLA Baixa',
        description: 'Acordo de nível de serviço para tickets de prioridade baixa.',
        priority: 'Baixa',
        responseTimeMinutes: 480,
        resolutionTimeMinutes: 2880
    }
];

/**
 * Default Catalog Categories (hierarchical structure)
 */
const DEFAULT_CATALOG_CATEGORIES = [
    // Root categories
    {
        name: 'Tecnologias de Informação',
        description: 'Serviços e suporte de TI',
        icon: 'Monitor',
        color: '#2563EB',
        level: 1,
        order: 1,
        children: [
            {
                name: 'Hardware',
                description: 'Solicitações relacionadas a equipamentos',
                icon: 'Laptop',
                color: '#D97706',
                level: 2,
                order: 1,
                children: [
                    { name: 'Computadores', description: 'Desktop, laptop e workstation', icon: 'Monitor', color: '#D97706', level: 3, order: 1 },
                    { name: 'Periféricos', description: 'Teclados, ratos, monitores, headsets', icon: 'Mouse', color: '#D97706', level: 3, order: 2 },
                    { name: 'Impressoras', description: 'Impressoras, scanners, multifuncionais', icon: 'Printer', color: '#D97706', level: 3, order: 3 },
                    { name: 'Dispositivos Móveis', description: 'Smartphones, tablets', icon: 'Smartphone', color: '#D97706', level: 3, order: 4 }
                ]
            },
            {
                name: 'Software',
                description: 'Solicitações relacionadas a software e aplicações',
                icon: 'Package',
                color: '#7C3AED',
                level: 2,
                order: 2,
                children: [
                    { name: 'Instalação de Software', description: 'Instalação de novos programas', icon: 'Download', color: '#7C3AED', level: 3, order: 1 },
                    { name: 'Licenciamento', description: 'Licenças de software e ativações', icon: 'Key', color: '#7C3AED', level: 3, order: 2 },
                    { name: 'Suporte a Aplicações', description: 'Problemas com software existente', icon: 'Wrench', color: '#7C3AED', level: 3, order: 3 }
                ]
            },
            {
                name: 'Acessos',
                description: 'Gestão de acessos e permissões',
                icon: 'Lock',
                color: '#DC2626',
                level: 2,
                order: 3,
                children: [
                    { name: 'Contas de Utilizador', description: 'Criação, modificação ou desativação de contas', icon: 'UserPlus', color: '#DC2626', level: 3, order: 1 },
                    { name: 'Permissões', description: 'Alteração de permissões e grupos', icon: 'Shield', color: '#DC2626', level: 3, order: 2 },
                    { name: 'VPN e Acesso Remoto', description: 'Configuração de acesso remoto', icon: 'Globe', color: '#DC2626', level: 3, order: 3 }
                ]
            },
            {
                name: 'Rede',
                description: 'Serviços de rede e conectividade',
                icon: 'Wifi',
                color: '#0891B2',
                level: 2,
                order: 4,
                children: [
                    { name: 'Conectividade', description: 'Problemas de ligação à rede', icon: 'Wifi', color: '#0891B2', level: 3, order: 1 },
                    { name: 'Email', description: 'Configuração e problemas de email', icon: 'Mail', color: '#0891B2', level: 3, order: 2 }
                ]
            }
        ]
    },
    {
        name: 'Facilities',
        description: 'Serviços de instalações e manutenção',
        icon: 'Building',
        color: '#16A34A',
        level: 1,
        order: 2,
        children: [
            { name: 'Manutenção', description: 'Reparações e manutenção geral', icon: 'Wrench', color: '#16A34A', level: 2, order: 1 },
            { name: 'Segurança Física', description: 'Controlo de acessos e segurança', icon: 'Shield', color: '#16A34A', level: 2, order: 2 },
            { name: 'Limpeza', description: 'Serviços de limpeza', icon: 'Sparkles', color: '#16A34A', level: 2, order: 3 }
        ]
    },
    {
        name: 'Recursos Humanos',
        description: 'Serviços de RH',
        icon: 'Users',
        color: '#EC4899',
        level: 1,
        order: 3,
        children: [
            { name: 'Onboarding', description: 'Integração de novos colaboradores', icon: 'UserPlus', color: '#EC4899', level: 2, order: 1 },
            { name: 'Offboarding', description: 'Desligamento de colaboradores', icon: 'UserMinus', color: '#EC4899', level: 2, order: 2 }
        ]
    }
];

/**
 * Seed organization defaults
 * @param {string} organizationId - UUID of the organization
 * @param {Object} options - Options for seeding
 * @returns {Object} Stats of created items
 */
export async function seedOrganizationDefaults(organizationId, options = {}) {
    const {
        skipPriorities = false,
        skipTypes = false,
        skipCategories = false,
        skipSLAs = false,
        skipCatalogCategories = false
    } = options;

    const stats = {
        priorities: 0,
        types: 0,
        categories: 0,
        slas: 0,
        catalogCategories: 0,
        skipped: []
    };

    try {
        logger.info(`[OrganizationSeed] Starting seed for organization: ${organizationId}`);

        // 1. Seed Priorities
        if (!skipPriorities) {
            const existingPriorities = await Priority.count({ where: { organizationId } });
            if (existingPriorities === 0) {
                for (const priority of DEFAULT_PRIORITIES) {
                    await Priority.create({ ...priority, organizationId });
                    stats.priorities++;
                }
                logger.info(`[OrganizationSeed] Created ${stats.priorities} priorities`);
            } else {
                stats.skipped.push('priorities (já existem)');
            }
        }

        // 2. Seed Types
        if (!skipTypes) {
            const existingTypes = await Type.count({ where: { organizationId } });
            if (existingTypes === 0) {
                for (const type of DEFAULT_TYPES) {
                    await Type.create({ ...type, organizationId });
                    stats.types++;
                }
                logger.info(`[OrganizationSeed] Created ${stats.types} types`);
            } else {
                stats.skipped.push('types (já existem)');
            }
        }

        // 3. Seed Categories - REMOVIDO (usar CatalogCategories)
        // Categories agora são unificadas em catalog_categories
        stats.skipped.push('categories (usar catalog_categories)');

        // 4. Seed SLAs
        if (!skipSLAs) {
            const existingSLAs = await SLA.count({ where: { organizationId } });
            if (existingSLAs === 0) {
                for (const sla of DEFAULT_SLAS) {
                    await SLA.create({ ...sla, organizationId });
                    stats.slas++;
                }
                logger.info(`[OrganizationSeed] Created ${stats.slas} SLAs`);
            } else {
                stats.skipped.push('slas (já existem)');
            }
        }

        // 5. Seed Catalog Categories (hierarchical)
        if (!skipCatalogCategories) {
            const existingCatalogCategories = await CatalogCategory.count({ where: { organizationId } });
            if (existingCatalogCategories === 0) {
                stats.catalogCategories = await seedCatalogCategoriesRecursive(
                    organizationId,
                    DEFAULT_CATALOG_CATEGORIES,
                    null
                );
                logger.info(`[OrganizationSeed] Created ${stats.catalogCategories} catalog categories`);
            } else {
                stats.skipped.push('catalog_categories (já existem)');
            }
        }

        logger.info(`[OrganizationSeed] Seed completed for organization: ${organizationId}`, stats);
        return stats;

    } catch (error) {
        logger.error(`[OrganizationSeed] Error seeding organization ${organizationId}:`, error);
        throw error;
    }
}

/**
 * Recursively create catalog categories
 * @param {string} organizationId 
 * @param {Array} categories 
 * @param {string|null} parentId 
 * @returns {number} Count of created categories
 */
async function seedCatalogCategoriesRecursive(organizationId, categories, parentId) {
    let count = 0;

    for (const cat of categories) {
        const { children, ...categoryData } = cat;

        const created = await CatalogCategory.create({
            ...categoryData,
            organizationId,
            parentCategoryId: parentId,
            isActive: true
        });
        count++;

        // Recursively create children
        if (children && children.length > 0) {
            count += await seedCatalogCategoriesRecursive(organizationId, children, created.id);
        }
    }

    return count;
}

/**
 * Check if organization has seed data
 * @param {string} organizationId 
 * @returns {Object} Status of each entity type
 */
export async function checkSeedStatus(organizationId) {
    const [priorities, types, slas, catalogCategories] = await Promise.all([
        Priority.count({ where: { organizationId } }),
        Type.count({ where: { organizationId } }),
        SLA.count({ where: { organizationId } }),
        CatalogCategory.count({ where: { organizationId } })
    ]);

    return {
        priorities: { count: priorities, hasData: priorities > 0 },
        types: { count: types, hasData: types > 0 },
        // Categories agora são unificadas em catalog_categories
        categories: { count: catalogCategories, hasData: catalogCategories > 0 },
        slas: { count: slas, hasData: slas > 0 },
        catalogCategories: { count: catalogCategories, hasData: catalogCategories > 0 },
        isComplete: priorities > 0 && types > 0 && slas > 0 && catalogCategories > 0
    };
}

export default {
    seedOrganizationDefaults,
    checkSeedStatus,
    DEFAULT_PRIORITIES,
    DEFAULT_TYPES,
    DEFAULT_SLAS,
    DEFAULT_CATALOG_CATEGORIES
};
