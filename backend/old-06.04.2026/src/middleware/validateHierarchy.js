import { User, Direction, Department, Section } from '../modules/models/index.js';

/**
 * Valida se o usuário atual pode atribuir ticket para o usuário alvo
 * baseado na hierarquia organizacional
 */
export const validateAssignment = async (req, res, next) => {
  try {
    const { assigneeId } = req.body;
    const currentUser = req.user;

    // Se não está alterando o assignee, prosseguir
    if (!assigneeId) {
      return next();
    }

    // Admin e Super Admin podem atribuir para qualquer um
    if (currentUser.role === 'org-admin' || currentUser.role === 'super-admin') {
      return next();
    }

    // Buscar usuário alvo com hierarquia completa
    const targetUser = await User.findOne({
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

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuário de destino não encontrado'
      });
    }

    // Verificar permissões baseadas no role
    const hasPermission = checkHierarchyPermission(currentUser, targetUser);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para atribuir tickets para este usuário. Verifique a hierarquia organizacional.'
      });
    }

    // Permitir prosseguir
    next();
  } catch (error) {
    console.error('Erro ao validar hierarquia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao validar permissões de atribuição'
    });
  }
};

/**
 * Verifica se currentUser pode atribuir para targetUser
 * baseado na hierarquia
 */
function checkHierarchyPermission(currentUser, targetUser) {
  // Admin pode atribuir para qualquer um (já verificado acima, mas mantém por segurança)
  if (currentUser.role === 'org-admin' || currentUser.role === 'super-admin') {
    return true;
  }

  // Responsável de Direção
  if (currentUser.role === 'resp-direcao' && currentUser.directionId) {
    // Mesma direção
    if (targetUser.directionId === currentUser.directionId) {
      return true;
    }
    // Departamento da sua direção
    if (targetUser.department?.directionId === currentUser.directionId) {
      return true;
    }
    // Seção de departamento da sua direção
    if (targetUser.section?.department?.directionId === currentUser.directionId) {
      return true;
    }
    return false;
  }

  // Responsável de Departamento
  if (currentUser.role === 'resp-departamento' && currentUser.departmentId) {
    // Mesmo departamento
    if (targetUser.departmentId === currentUser.departmentId) {
      return true;
    }
    // Seção do seu departamento
    if (targetUser.section?.departmentId === currentUser.departmentId) {
      return true;
    }
    return false;
  }

  // Responsável de Seção
  if (currentUser.role === 'resp-secao' && currentUser.sectionId) {
    // Mesma seção
    return targetUser.sectionId === currentUser.sectionId;
  }

  // Agente só pode atribuir para si mesmo
  if (currentUser.role === 'agente') {
    return targetUser.id === currentUser.id;
  }

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
