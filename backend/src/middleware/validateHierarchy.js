import { User, OrganizationUser, Direction, Department, Section } from '../modules/models/index.js';
import permissionService from '../services/permissionService.js';
import logger from '../config/logger.js';

/**
 * Valida se o usuário atual pode atribuir ticket para o usuário alvo
 * baseado nas permissões RBAC (não em roles hardcoded)
 * 
 * Permissões de atribuição:
 * - tickets.assign_self: Pode se auto-atribuir
 * - tickets.assign_team: Pode atribuir a membros da equipe/estrutura
 * - tickets.assign_all: Pode atribuir a qualquer usuário
 */
export const validateAssignment = async (req, res, next) => {
  try {
    const { assigneeId } = req.body;
    const currentUser = req.user;

    // Se não está alterando o assignee, prosseguir
    if (!assigneeId) {
      return next();
    }

    logger.info(`🔍 Validando atribuição: ${currentUser.email} (${currentUser.id}) -> assigneeId: ${assigneeId}`);

    // Buscar usuário alvo com hierarquia completa
    // Tentar primeiro em organization_users (agentes, técnicos, managers)
    let targetUser = await OrganizationUser.findOne({
      where: {
        id: assigneeId,
        organizationId: currentUser.organizationId
      },
      include: [
        {
          model: Direction,
          as: 'direction',
          attributes: ['id', 'name']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'directionId'],
          include: [{
            model: Direction,
            as: 'direction',
            attributes: ['id', 'name']
          }]
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'directionId'],
            include: [{
              model: Direction,
              as: 'direction',
              attributes: ['id', 'name']
            }]
          }]
        }
      ]
    });

    // Se não encontrou em organization_users, tentar em users (provider staff - legado)
    if (!targetUser) {
      targetUser = await User.findOne({
        where: {
          id: assigneeId,
          organizationId: currentUser.organizationId
        },
        include: [
          {
            model: Direction,
            as: 'direction',
            attributes: ['id', 'name']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'directionId'],
            include: [{
              model: Direction,
              as: 'direction',
              attributes: ['id', 'name']
            }]
          },
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name', 'departmentId'],
            include: [{
              model: Department,
              as: 'department',
              attributes: ['id', 'name', 'directionId'],
              include: [{
                model: Direction,
                as: 'direction',
                attributes: ['id', 'name']
              }]
            }]
          }
        ]
      });
    }

    if (!targetUser) {
      logger.warn(`❌ Usuário de destino não encontrado: ${assigneeId}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário de destino não encontrado'
      });
    }

    logger.info(`✅ Usuário de destino encontrado: ${targetUser.name} (${targetUser.email})`);

    // Verificar permissões RBAC
    const hasPermission = await checkAssignmentPermission(currentUser, targetUser);

    if (!hasPermission) {
      logger.warn(`❌ Permissão negada: ${currentUser.email} não pode atribuir para ${targetUser.email}`);
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para atribuir tickets para este usuário.',
        details: 'Verifique suas permissões de atribuição (tickets.assign_self, tickets.assign_team, tickets.assign_all)'
      });
    }

    logger.info(`✅ Permissão concedida: ${currentUser.email} pode atribuir para ${targetUser.email}`);

    // Permitir prosseguir
    next();
  } catch (error) {
    logger.error('❌ Erro ao validar hierarquia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao validar permissões de atribuição'
    });
  }
};

/**
 * Verifica se currentUser pode atribuir para targetUser
 * baseado nas permissões RBAC (não em roles hardcoded)
 * 
 * Hierarquia de permissões:
 * 1. tickets.assign_all: Pode atribuir a qualquer usuário
 * 2. tickets.assign_team: Pode atribuir a membros da equipe/estrutura
 * 3. tickets.assign_self: Pode se auto-atribuir
 */
async function checkAssignmentPermission(currentUser, targetUser) {
  try {
    // 1. Verificar tickets.assign_all (pode atribuir a qualquer um)
    const hasAssignAll = await permissionService.hasPermission(
      currentUser,
      'tickets',
      'assign_all'
    );

    if (hasAssignAll) {
      logger.info(`✅ Usuário tem permissão tickets.assign_all`);
      return true;
    }

    // 2. Verificar tickets.assign_team (pode atribuir a membros da equipe)
    const hasAssignTeam = await permissionService.hasPermission(
      currentUser,
      'tickets',
      'assign_team'
    );

    if (hasAssignTeam) {
      // Verificar se targetUser está na mesma estrutura organizacional
      const isSameTeam = checkSameTeam(currentUser, targetUser);
      
      if (isSameTeam) {
        logger.info(`✅ Usuário tem permissão tickets.assign_team e target está na mesma equipe`);
        return true;
      } else {
        logger.warn(`⚠️  Usuário tem tickets.assign_team mas target não está na mesma equipe`);
      }
    }

    // 3. Verificar tickets.assign_self (pode se auto-atribuir)
    const hasAssignSelf = await permissionService.hasPermission(
      currentUser,
      'tickets',
      'assign_self'
    );

    if (hasAssignSelf && targetUser.id === currentUser.id) {
      logger.info(`✅ Usuário tem permissão tickets.assign_self e está se auto-atribuindo`);
      return true;
    }

    logger.warn(`❌ Usuário não tem permissão para atribuir a este usuário`);
    return false;
  } catch (error) {
    logger.error('❌ Erro ao verificar permissão de atribuição:', error);
    return false;
  }
}

/**
 * Verifica se dois usuários estão na mesma equipe/estrutura organizacional
 * Usado para validar permissão tickets.assign_team
 */
function checkSameTeam(currentUser, targetUser) {
  // Se usuário tem seção, target deve estar na mesma seção
  if (currentUser.sectionId) {
    return targetUser.sectionId === currentUser.sectionId;
  }

  // Se usuário tem departamento (sem seção), target deve estar no mesmo departamento
  if (currentUser.departmentId) {
    return targetUser.departmentId === currentUser.departmentId;
  }

  // Se usuário tem direção (sem dept/seção), target deve estar na mesma direção
  if (currentUser.directionId) {
    return targetUser.directionId === currentUser.directionId;
  }

  // Se não tem estrutura definida, não pode atribuir a equipe
  return false;
}

/**
 * Valida se o usuário pode criar/editar usuários
 * na estrutura organizacional especificada
 */
export const validateUserManagement = async (req, res, next) => {
  try {
    const { directionId, departmentId, sectionId, role } = req.body;
    const currentUser = req.user;

    // Admin e Super Admin podem gerenciar qualquer usuário
    if (currentUser.role === 'org-admin' || currentUser.role === 'super-admin') {
      return next();
    }

    // Responsável de Direção
    if (currentUser.role === 'resp-direcao' && currentUser.directionId) {
      // Pode criar usuários em sua direção
      if (directionId === currentUser.directionId && !departmentId && !sectionId) {
        return next();
      }

      // Pode criar usuários em departamentos de sua direção
      if (departmentId) {
        const dept = await Department.findOne({
          where: { id: departmentId, directionId: currentUser.directionId }
        });
        if (dept && !sectionId) {
          return next();
        }
      }

      // Pode criar usuários em seções de departamentos de sua direção
      if (sectionId) {
        const section = await Section.findOne({
          where: { id: sectionId },
          include: [{
            model: Department,
            as: 'department',
            where: { directionId: currentUser.directionId }
          }]
        });
        if (section) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: 'Você só pode criar usuários em sua direção ou departamentos/seções subordinados'
      });
    }

    // Responsável de Departamento
    if (currentUser.role === 'resp-departamento' && currentUser.departmentId) {
      // Pode criar usuários em seu departamento
      if (departmentId === currentUser.departmentId && !sectionId) {
        return next();
      }

      // Pode criar usuários em seções de seu departamento
      if (sectionId) {
        const section = await Section.findOne({
          where: { id: sectionId, departmentId: currentUser.departmentId }
        });
        if (section) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: 'Você só pode criar usuários em seu departamento ou seções subordinadas'
      });
    }

    // Responsável de Seção
    if (currentUser.role === 'resp-secao' && currentUser.sectionId) {
      // Pode criar usuários apenas em sua seção
      if (sectionId === currentUser.sectionId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Você só pode criar usuários em sua seção'
      });
    }

    // Agente não pode criar usuários
    return res.status(403).json({
      success: false,
      error: 'Você não tem permissão para gerenciar usuários'
    });

  } catch (error) {
    console.error('Erro ao validar gerenciamento de usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao validar permissões de gerenciamento'
    });
  }
};
