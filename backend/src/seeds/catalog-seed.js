/**
 * Seed: Dados de Exemplo do Sistema de Catálogo
 * 
 * Cria:
 * - Categorias hierárquicas
 * - Itens de diferentes tipos (incident, service, support, request)
 * - Exemplos realistas de TI
 */

import { CatalogCategory, CatalogItem } from '../modules/catalog/catalogModel.js';
import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

export async function seedCatalog(organizationId, directionId, departmentId, slaId) {
  try {
    logger.info('🌱 Iniciando seed do catálogo...');

    // ========== CATEGORIAS RAIZ ==========

    const categoryTI = await CatalogCategory.create({
      organizationId,
      name: 'Tecnologia da Informação',
      description: 'Serviços relacionados a TI e infraestrutura tecnológica',
      icon: 'Monitor',
      color: '#3B82F6',
      imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=ti',
      level: 1,
      defaultDirectionId: directionId,
      order: 1,
      isActive: true
    });

    const categoryRH = await CatalogCategory.create({
      organizationId,
      name: 'Recursos Humanos',
      description: 'Solicitações relacionadas a RH e gestão de pessoas',
      icon: 'Users',
      color: '#10B981',
      imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=rh',
      level: 1,
      order: 2,
      isActive: true
    });

    const categoryFacilities = await CatalogCategory.create({
      organizationId,
      name: 'Facilities',
      description: 'Serviços de facilities e manutenção predial',
      icon: 'Building',
      color: '#F59E0B',
      imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=facilities',
      level: 1,
      order: 3,
      isActive: true
    });

    // ========== SUBCATEGORIAS TI ==========

    const subInfraestrutura = await CatalogCategory.create({
      organizationId,
      parentCategoryId: categoryTI.id,
      name: 'Infraestrutura',
      description: 'Serviços de infraestrutura de TI',
      icon: 'Server',
      color: '#2563EB',
      level: 2,
      defaultDepartmentId: departmentId,
      order: 1,
      isActive: true
    });

    const subAplicacoes = await CatalogCategory.create({
      organizationId,
      parentCategoryId: categoryTI.id,
      name: 'Aplicações',
      description: 'Suporte a sistemas e aplicações',
      icon: 'AppWindow',
      color: '#7C3AED',
      level: 2,
      order: 2,
      isActive: true
    });

    const subHardware = await CatalogCategory.create({
      organizationId,
      parentCategoryId: categoryTI.id,
      name: 'Hardware',
      description: 'Solicitações de hardware e equipamentos',
      icon: 'Laptop',
      color: '#06B6D4',
      level: 2,
      order: 3,
      isActive: true
    });

    // ========== SUBCATEGORIAS RH ==========

    const subRecrutamento = await CatalogCategory.create({
      organizationId,
      parentCategoryId: categoryRH.id,
      name: 'Recrutamento',
      description: 'Processos de recrutamento e seleção',
      icon: 'UserPlus',
      color: '#059669',
      level: 2,
      order: 1,
      isActive: true
    });

    const subBeneficios = await CatalogCategory.create({
      organizationId,
      parentCategoryId: categoryRH.id,
      name: 'Benefícios',
      description: 'Gestão de benefícios e vantagens',
      icon: 'Gift',
      color: '#16A34A',
      level: 2,
      order: 2,
      isActive: true
    });

    logger.info('✅ Categorias criadas com sucesso');

    // ========== ITENS - INCIDENTES (TI - Infraestrutura) ==========

    await CatalogItem.create({
      organizationId,
      categoryId: subInfraestrutura.id,
      name: 'Falha de Acesso à VPN',
      shortDescription: 'Problemas para conectar na VPN corporativa',
      fullDescription: 'Reporte problemas de conexão com a VPN, incluindo erros de autenticação, timeout ou configuração.',
      icon: 'ShieldAlert',
      imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=vpn',
      itemType: 'incident',
      slaId,
      defaultPriority: 'alta',
      autoAssignPriority: true,
      skipApprovalForIncidents: true,
      requiresApproval: false,
      defaultDepartmentId: departmentId,
      keywords: ['vpn', 'acesso remoto', 'rede', 'conexão', 'segurança'],
      customFields: [
        {
          name: 'mensagem_erro',
          type: 'textarea',
          label: 'Mensagem de Erro',
          required: false,
          placeholder: 'Cole a mensagem de erro exibida'
        },
        {
          name: 'sistema_operacional',
          type: 'select',
          label: 'Sistema Operacional',
          required: true,
          options: ['Windows 10', 'Windows 11', 'macOS', 'Linux']
        }
      ],
      estimatedDeliveryTime: 2, // 2 horas
      isPublic: true,
      order: 1
    });

    await CatalogItem.create({
      organizationId,
      categoryId: subInfraestrutura.id,
      name: 'Servidor Fora do Ar',
      shortDescription: 'Servidor ou serviço crítico inacessível',
      fullDescription: 'Incidente crítico: servidor ou serviço essencial está fora do ar ou inacessível.',
      icon: 'ServerCrash',
      itemType: 'incident',
      slaId,
      defaultPriority: 'critica',
      autoAssignPriority: true,
      skipApprovalForIncidents: true,
      requiresApproval: false,
      defaultDepartmentId: departmentId,
      keywords: ['servidor', 'downtime', 'indisponibilidade', 'crítico'],
      customFields: [
        {
          name: 'servidor_nome',
          type: 'text',
          label: 'Nome do Servidor',
          required: true
        },
        {
          name: 'servico_afetado',
          type: 'text',
          label: 'Serviço Afetado',
          required: true
        },
        {
          name: 'usuarios_impactados',
          type: 'number',
          label: 'Usuários Impactados (estimativa)',
          required: false
        }
      ],
      estimatedDeliveryTime: 1, // 1 hora
      isPublic: true,
      order: 2
    });

    await CatalogItem.create({
      organizationId,
      categoryId: subInfraestrutura.id,
      name: 'Falha de Rede Interna',
      shortDescription: 'Problemas de conectividade na rede local',
      fullDescription: 'Sem acesso à rede interna, compartilhamento de arquivos ou impressoras.',
      icon: 'WifiOff',
      itemType: 'incident',
      slaId,
      defaultPriority: 'alta',
      autoAssignPriority: true,
      skipApprovalForIncidents: true,
      requiresApproval: false,
      defaultDepartmentId: departmentId,
      keywords: ['rede', 'internet', 'wifi', 'conectividade', 'lan'],
      customFields: [
        {
          name: 'local',
          type: 'text',
          label: 'Local/Sala',
          required: true
        },
        {
          name: 'tipo_conexao',
          type: 'select',
          label: 'Tipo de Conexão',
          required: true,
          options: ['Wi-Fi', 'Cabo (Ethernet)', 'Ambos']
        }
      ],
      estimatedDeliveryTime: 3,
      isPublic: true,
      order: 3
    });

    // ========== ITENS - SERVIÇOS (TI - Hardware) ==========

    await CatalogItem.create({
      organizationId,
      categoryId: subHardware.id,
      name: 'Solicitar Novo Computador',
      shortDescription: 'Requisição de novo equipamento (desktop/notebook)',
      fullDescription: 'Solicite um novo computador para colaborador. Requer aprovação do gestor.',
      icon: 'Laptop',
      itemType: 'service',
      slaId,
      defaultPriority: 'media',
      autoAssignPriority: false,
      skipApprovalForIncidents: true,
      requiresApproval: true,
      defaultDepartmentId: departmentId,
      keywords: ['computador', 'notebook', 'desktop', 'equipamento', 'hardware'],
      customFields: [
        {
          name: 'nome_colaborador',
          type: 'text',
          label: 'Nome do Colaborador',
          required: true
        },
        {
          name: 'tipo_equipamento',
          type: 'select',
          label: 'Tipo de Equipamento',
          required: true,
          options: ['Desktop', 'Notebook', 'Workstation']
        },
        {
          name: 'justificativa',
          type: 'textarea',
          label: 'Justificativa',
          required: true
        },
        {
          name: 'centro_custo',
          type: 'text',
          label: 'Centro de Custo',
          required: true
        }
      ],
      estimatedCost: 3500.00,
      costCurrency: 'EUR',
      estimatedDeliveryTime: 120, // 5 dias
      isPublic: true,
      order: 1
    });

    await CatalogItem.create({
      organizationId,
      categoryId: subAplicacoes.id,
      name: 'Criar Novo Usuário no Sistema',
      shortDescription: 'Criação de novo usuário em sistema corporativo',
      fullDescription: 'Solicite criação de conta de usuário em sistemas internos (ERP, CRM, etc).',
      icon: 'UserPlus',
      itemType: 'service',
      slaId,
      defaultPriority: 'media',
      requiresApproval: true,
      defaultDepartmentId: departmentId,
      keywords: ['usuário', 'acesso', 'conta', 'permissão', 'sistema'],
      customFields: [
        {
          name: 'nome_completo',
          type: 'text',
          label: 'Nome Completo',
          required: true
        },
        {
          name: 'email',
          type: 'email',
          label: 'E-mail',
          required: true
        },
        {
          name: 'sistema',
          type: 'select',
          label: 'Sistema',
          required: true,
          options: ['ERP', 'CRM', 'BI', 'E-mail', 'Outro']
        },
        {
          name: 'perfil_acesso',
          type: 'select',
          label: 'Perfil de Acesso',
          required: true,
          options: ['Consulta', 'Operador', 'Gestor', 'Administrador']
        }
      ],
      estimatedDeliveryTime: 24,
      isPublic: true,
      order: 2
    });

    // ========== ITENS - SUPORTE (TI - Aplicações) ==========

    await CatalogItem.create({
      organizationId,
      categoryId: subAplicacoes.id,
      name: 'Dúvida sobre Software',
      shortDescription: 'Ajuda para utilização de software corporativo',
      fullDescription: 'Tire dúvidas sobre como usar sistemas e ferramentas corporativas.',
      icon: 'HelpCircle',
      itemType: 'support',
      defaultPriority: 'media',
      requiresApproval: false,
      defaultDepartmentId: departmentId,
      keywords: ['dúvida', 'ajuda', 'tutorial', 'treinamento', 'software'],
      customFields: [
        {
          name: 'software',
          type: 'text',
          label: 'Nome do Software',
          required: true
        },
        {
          name: 'duvida',
          type: 'textarea',
          label: 'Descreva sua Dúvida',
          required: true,
          placeholder: 'Seja específico sobre o que você precisa'
        }
      ],
      estimatedDeliveryTime: 4,
      isPublic: true,
      order: 1
    });

    // ========== ITENS - REQUISIÇÕES (RH) ==========

    await CatalogItem.create({
      organizationId,
      categoryId: subBeneficios.id,
      name: 'Solicitar Declaração',
      shortDescription: 'Requisitar declarações diversas de RH',
      fullDescription: 'Solicite declarações de vínculo empregatício, salário, etc.',
      icon: 'FileText',
      itemType: 'request',
      defaultPriority: 'baixa',
      requiresApproval: false,
      keywords: ['declaração', 'documento', 'comprovante', 'rh'],
      customFields: [
        {
          name: 'tipo_declaracao',
          type: 'select',
          label: 'Tipo de Declaração',
          required: true,
          options: [
            'Vínculo Empregatício',
            'Salário',
            'Tempo de Serviço',
            'Férias',
            'Outra'
          ]
        },
        {
          name: 'finalidade',
          type: 'text',
          label: 'Finalidade',
          required: true
        }
      ],
      estimatedDeliveryTime: 48,
      isPublic: true,
      order: 1
    });

    await CatalogItem.create({
      organizationId,
      categoryId: subRecrutamento.id,
      name: 'Abrir Vaga Interna',
      shortDescription: 'Requisitar abertura de vaga de emprego',
      fullDescription: 'Solicite abertura de processo de recrutamento para nova vaga.',
      icon: 'Briefcase',
      itemType: 'request',
      defaultPriority: 'baixa',
      requiresApproval: true,
      keywords: ['vaga', 'contratação', 'recrutamento', 'rh', 'admissão'],
      customFields: [
        {
          name: 'cargo',
          type: 'text',
          label: 'Cargo',
          required: true
        },
        {
          name: 'departamento',
          type: 'text',
          label: 'Departamento',
          required: true
        },
        {
          name: 'descricao_vaga',
          type: 'textarea',
          label: 'Descrição da Vaga',
          required: true
        },
        {
          name: 'requisitos',
          type: 'textarea',
          label: 'Requisitos',
          required: true
        }
      ],
      estimatedDeliveryTime: 240, // 10 dias
      isPublic: false, // Apenas gestores
      order: 1
    });

    // ========== ITENS - FACILITIES ==========

    await CatalogItem.create({
      organizationId,
      categoryId: categoryFacilities.id,
      name: 'Manutenção Predial',
      shortDescription: 'Reportar problemas de manutenção',
      fullDescription: 'Reporte problemas estruturais, elétricos, hidráulicos ou de ar-condicionado.',
      icon: 'Wrench',
      itemType: 'incident',
      defaultPriority: 'media',
      skipApprovalForIncidents: true,
      requiresApproval: false,
      keywords: ['manutenção', 'reparo', 'facilities', 'predial'],
      customFields: [
        {
          name: 'local',
          type: 'text',
          label: 'Local/Sala',
          required: true
        },
        {
          name: 'tipo_problema',
          type: 'select',
          label: 'Tipo de Problema',
          required: true,
          options: [
            'Elétrico',
            'Hidráulico',
            'Ar-Condicionado',
            'Estrutural',
            'Limpeza',
            'Outro'
          ]
        },
        {
          name: 'descricao',
          type: 'textarea',
          label: 'Descrição do Problema',
          required: true
        }
      ],
      estimatedDeliveryTime: 24,
      isPublic: true,
      order: 1
    });

    logger.info('✅ Itens do catálogo criados com sucesso');
    logger.info('📊 Resumo:');
    logger.info(`   - 6 Categorias (3 raiz + 5 subcategorias)`);
    logger.info(`   - 10 Itens do catálogo`);
    logger.info(`   - 3 Incidentes, 2 Serviços, 1 Suporte, 3 Requisições, 1 Facilities`);

    return {
      categories: [categoryTI, categoryRH, categoryFacilities],
      subcategories: [subInfraestrutura, subAplicacoes, subHardware, subRecrutamento, subBeneficios],
      itemsCount: 10
    };

  } catch (error) {
    logger.error('❌ Erro ao criar seed do catálogo:', error);
    throw error;
  }
}

// Executar seed standalone
export async function runCatalogSeed() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conectado ao banco de dados');

    // Buscar primeira organização
    const [org] = await sequelize.query(
      'SELECT id FROM organizations LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!org) {
      throw new Error('Nenhuma organização encontrada. Execute o seed principal primeiro.');
    }

    // Buscar direção e departamento
    const [direction] = await sequelize.query(
      'SELECT id FROM directions WHERE organization_id = :orgId LIMIT 1',
      { replacements: { orgId: org.id }, type: sequelize.QueryTypes.SELECT }
    );

    const [department] = await sequelize.query(
      'SELECT id FROM departments WHERE organization_id = :orgId LIMIT 1',
      { replacements: { orgId: org.id }, type: sequelize.QueryTypes.SELECT }
    );

    const [sla] = await sequelize.query(
      'SELECT id FROM slas WHERE organization_id = :orgId LIMIT 1',
      { replacements: { orgId: org.id }, type: sequelize.QueryTypes.SELECT }
    );

    await seedCatalog(
      org.id,
      direction?.id || null,
      department?.id || null,
      sla?.id || null
    );

    logger.info('🎉 Seed do catálogo executado com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runCatalogSeed();
}
