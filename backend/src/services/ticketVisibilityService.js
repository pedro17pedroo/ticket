/**
 * Ticket Visibility Service
 * 
 * Gerencia a visibilidade e permissões de tickets baseado na estrutura organizacional.
 * 
 * Regras de Visibilidade:
 * 
 * 1. TICKET COM APENAS DIREÇÃO:
 *    - Todos os usuários da direção podem ver e acompanhar
 *    - Responsável da direção pode atribuir a qualquer usuário da sua estrutura
 * 
 * 2. TICKET COM DIREÇÃO + DEPARTAMENTO:
 *    - Responsável da direção pode ver e atribuir
 *    - Responsável do departamento pode ver e atribuir
 *    - Todos os usuários do departamento podem ver e acompanhar
 * 
 * 3. TICKET COM DIREÇÃO + DEPARTAMENTO + SECÇÃO:
 *    - Responsável da direção pode ver e atribuir
 *    - Responsável do departamento pode ver e atribuir
 *    - Responsável da secção pode ver e atribuir
 *    - Todos os usuários da secção podem ver e acompanhar
 * 
 * IMPORTANTE: Responsáveis de uma estrutura NÃO podem ver tickets de outras estruturas
 * do mesmo nível (ex: chefe do Dept A não vê tickets do Dept B)
 */

import { Op } from 'sequelize';
import { OrganizationUser, Direction, Department, Section } from '../modules/models/index.js';
import logger from '../config/logger.js';

class TicketVisibilityService {
  
  /**
   * Verifica se um usuário pode ver um ticket específico
   * @param {Object} user - Usuário da organização (OrganizationUser)
   * @param {Object} ticket - Ticket a verificar
   * @returns {boolean} Se o usuário pode ver o ticket
   */
  canViewTicket(user, ticket) {
    // Admin da organização vê tudo
    if (user.role === 'org-admin') {
      return true;
    }

    // Se o usuário é o assignee, pode ver
    if (ticket.assigneeId === user.id) {
      return true;
    }

    // Se o usuário é watcher, pode ver
    if (ticket.orgWatchers && ticket.orgWatchers.includes(user.id)) {
      return true;
    }

    // Verificar baseado na estrutura organizacional do ticket
    return this._checkStructuralAccess(user, ticket, 'view');
  }

  /**
   * Verifica se um usuário pode atribuir um ticket
   * @param {Object} user - Usuário da organização
   * @param {Object} ticket - Ticket a verificar
   * @returns {boolean} Se o usuário pode atribuir o ticket
   */
  canAssignTicket(user, ticket) {
    // Admin da organização pode atribuir qualquer ticket
    if (user.role === 'org-admin') {
      return true;
    }

    // Verificar se é responsável de alguma estrutura do ticket
    return this._checkStructuralAccess(user, ticket, 'assign');
  }

  /**
   * Verifica acesso baseado na estrutura organizacional
   * @private
   */
  _checkStructuralAccess(user, ticket, action) {
    const ticketDirectionId = ticket.directionId;
    const ticketDepartmentId = ticket.departmentId;
    const ticketSectionId = ticket.sectionId;

    // Se ticket não tem direção, não há restrição estrutural
    if (!ticketDirectionId) {
      return true;
    }

    // CASO 3: Ticket tem Secção (mais restritivo)
    if (ticketSectionId) {
      return this._checkSectionAccess(user, ticketDirectionId, ticketDepartmentId, ticketSectionId, action);
    }

    // CASO 2: Ticket tem Departamento (sem Secção)
    if (ticketDepartmentId) {
      return this._checkDepartmentAccess(user, ticketDirectionId, ticketDepartmentId, action);
    }

    // CASO 1: Ticket tem apenas Direção
    return this._checkDirectionAccess(user, ticketDirectionId, action);
  }

  /**
   * Verifica acesso quando ticket tem apenas Direção
   * - Todos os usuários da direção podem ver
   * - Responsável da direção pode atribuir
   */
  _checkDirectionAccess(user, ticketDirectionId, action) {
    // Usuário deve pertencer à mesma direção
    if (user.directionId !== ticketDirectionId) {
      return false;
    }

    if (action === 'view') {
      // Qualquer usuário da direção pode ver
      return true;
    }

    if (action === 'assign') {
      // Apenas responsável da direção pode atribuir
      // Responsável = org-manager da direção sem departamento/secção específica
      return this._isDirectionHead(user, ticketDirectionId);
    }

    return false;
  }

  /**
   * Verifica acesso quando ticket tem Direção + Departamento
   * - Responsável da direção pode ver e atribuir
   * - Responsável do departamento pode ver e atribuir
   * - Usuários do departamento podem ver
   */
  _checkDepartmentAccess(user, ticketDirectionId, ticketDepartmentId, action) {
    // Verificar se é responsável da direção (pode ver/atribuir qualquer dept da sua direção)
    if (this._isDirectionHead(user, ticketDirectionId)) {
      return true;
    }

    // Usuário deve pertencer à mesma direção
    if (user.directionId !== ticketDirectionId) {
      return false;
    }

    // Usuário deve pertencer ao mesmo departamento
    if (user.departmentId !== ticketDepartmentId) {
      return false;
    }

    if (action === 'view') {
      // Qualquer usuário do departamento pode ver
      return true;
    }

    if (action === 'assign') {
      // Responsável do departamento pode atribuir
      return this._isDepartmentHead(user, ticketDepartmentId);
    }

    return false;
  }

  /**
   * Verifica acesso quando ticket tem Direção + Departamento + Secção
   * - Responsável da direção pode ver e atribuir
   * - Responsável do departamento pode ver e atribuir
   * - Responsável da secção pode ver e atribuir
   * - Usuários da secção podem ver
   */
  _checkSectionAccess(user, ticketDirectionId, ticketDepartmentId, ticketSectionId, action) {
    // Verificar se é responsável da direção
    if (this._isDirectionHead(user, ticketDirectionId)) {
      return true;
    }

    // Verificar se é responsável do departamento
    if (this._isDepartmentHead(user, ticketDepartmentId) && user.directionId === ticketDirectionId) {
      return true;
    }

    // Usuário deve pertencer à mesma direção e departamento
    if (user.directionId !== ticketDirectionId || user.departmentId !== ticketDepartmentId) {
      return false;
    }

    // Usuário deve pertencer à mesma secção
    if (user.sectionId !== ticketSectionId) {
      return false;
    }

    if (action === 'view') {
      // Qualquer usuário da secção pode ver
      return true;
    }

    if (action === 'assign') {
      // Responsável da secção pode atribuir
      return this._isSectionHead(user, ticketSectionId);
    }

    return false;
  }

  /**
   * Verifica se usuário é responsável (chefe) da direção
   * Responsável = org-manager ou org-admin que pertence à direção sem dept/secção específica
   */
  _isDirectionHead(user, directionId) {
    if (!['org-admin', 'org-manager'].includes(user.role)) {
      return false;
    }
    
    // Deve pertencer à direção
    if (user.directionId !== directionId) {
      return false;
    }
    
    // Não deve ter departamento específico (é chefe da direção toda)
    // OU pode ter permissão especial de gestão
    if (!user.departmentId || user.permissions?.canManageDirection) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica se usuário é responsável (chefe) do departamento
   */
  _isDepartmentHead(user, departmentId) {
    if (!['org-admin', 'org-manager'].includes(user.role)) {
      return false;
    }
    
    // Deve pertencer ao departamento
    if (user.departmentId !== departmentId) {
      return false;
    }
    
    // Não deve ter secção específica (é chefe do departamento todo)
    // OU pode ter permissão especial de gestão
    if (!user.sectionId || user.permissions?.canManageDepartment) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica se usuário é responsável (chefe) da secção
   */
  _isSectionHead(user, sectionId) {
    if (!['org-admin', 'org-manager'].includes(user.role)) {
      return false;
    }
    
    // Deve pertencer à secção
    if (user.sectionId !== sectionId) {
      return false;
    }
    
    // Tem permissão de gestão da secção
    return user.permissions?.canManageSection || true; // Por padrão, manager da secção pode gerir
  }

  /**
   * Constrói filtro WHERE para listar tickets visíveis ao usuário
   * @param {Object} user - Usuário da organização
   * @returns {Object} Condições WHERE para Sequelize
   */
  buildVisibilityFilter(user) {
    // Admin vê tudo da organização
    if (user.role === 'org-admin') {
      return {};
    }

    const conditions = [];

    // Sempre pode ver tickets onde é assignee
    conditions.push({ assigneeId: user.id });

    // Sempre pode ver tickets onde é watcher
    conditions.push({
      orgWatchers: { [Op.contains]: [user.id] }
    });

    // Construir condições baseadas na estrutura do usuário
    if (user.directionId) {
      // Se usuário é chefe da direção (sem dept específico)
      if (this._isDirectionHead(user, user.directionId)) {
        // Vê todos os tickets da sua direção
        conditions.push({ directionId: user.directionId });
      } 
      // Se usuário tem departamento
      else if (user.departmentId) {
        // Se é chefe do departamento (sem secção específica)
        if (this._isDepartmentHead(user, user.departmentId)) {
          // Vê tickets do seu departamento
          conditions.push({
            directionId: user.directionId,
            departmentId: user.departmentId
          });
        }
        // Se usuário tem secção
        else if (user.sectionId) {
          // Se é chefe da secção
          if (this._isSectionHead(user, user.sectionId)) {
            // Vê tickets da sua secção
            conditions.push({
              directionId: user.directionId,
              departmentId: user.departmentId,
              sectionId: user.sectionId
            });
          } else {
            // Usuário comum da secção - vê apenas tickets da sua secção
            conditions.push({
              directionId: user.directionId,
              departmentId: user.departmentId,
              sectionId: user.sectionId
            });
          }
        } else {
          // Usuário do departamento sem secção - vê tickets do departamento sem secção
          // E tickets onde departamento é o dele
          conditions.push({
            directionId: user.directionId,
            departmentId: user.departmentId,
            sectionId: null
          });
          conditions.push({
            directionId: user.directionId,
            departmentId: user.departmentId
          });
        }
      } else {
        // Usuário da direção sem departamento - vê tickets da direção sem departamento
        conditions.push({
          directionId: user.directionId,
          departmentId: null
        });
      }
    }

    // Tickets sem direção são visíveis a todos (tickets legados ou gerais)
    conditions.push({ directionId: null });

    return { [Op.or]: conditions };
  }

  /**
   * Obtém lista de usuários que podem ser assignees para um ticket
   * @param {Object} user - Usuário que está atribuindo
   * @param {Object} ticket - Ticket a ser atribuído
   * @returns {Promise<Array>} Lista de usuários elegíveis
   */
  async getEligibleAssignees(user, ticket) {
    const where = {
      organizationId: user.organizationId,
      isActive: true
    };

    // Admin pode atribuir a qualquer um
    if (user.role === 'org-admin') {
      // Mas respeita a estrutura do ticket se definida
      if (ticket.sectionId) {
        where.sectionId = ticket.sectionId;
      } else if (ticket.departmentId) {
        where.departmentId = ticket.departmentId;
      } else if (ticket.directionId) {
        where.directionId = ticket.directionId;
      }
    } 
    // Chefe da direção pode atribuir a qualquer um da direção
    else if (this._isDirectionHead(user, ticket.directionId)) {
      where.directionId = ticket.directionId;
      if (ticket.departmentId) {
        where.departmentId = ticket.departmentId;
      }
      if (ticket.sectionId) {
        where.sectionId = ticket.sectionId;
      }
    }
    // Chefe do departamento pode atribuir a qualquer um do departamento
    else if (this._isDepartmentHead(user, ticket.departmentId)) {
      where.directionId = ticket.directionId;
      where.departmentId = ticket.departmentId;
      if (ticket.sectionId) {
        where.sectionId = ticket.sectionId;
      }
    }
    // Chefe da secção pode atribuir a qualquer um da secção
    else if (this._isSectionHead(user, ticket.sectionId)) {
      where.directionId = ticket.directionId;
      where.departmentId = ticket.departmentId;
      where.sectionId = ticket.sectionId;
    }
    // Usuário comum não pode atribuir
    else {
      return [];
    }

    const assignees = await OrganizationUser.findAll({
      where,
      attributes: ['id', 'name', 'email', 'avatar', 'role', 'directionId', 'departmentId', 'sectionId'],
      include: [
        { model: Direction, as: 'direction', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Section, as: 'section', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });

    return assignees;
  }

  /**
   * Verifica permissões completas de um usuário sobre um ticket
   * @param {Object} user - Usuário da organização
   * @param {Object} ticket - Ticket
   * @returns {Object} Objeto com permissões detalhadas
   */
  getTicketPermissions(user, ticket) {
    const isAdmin = user.role === 'org-admin';
    const isAssignee = ticket.assigneeId === user.id;
    const isWatcher = ticket.orgWatchers?.includes(user.id);
    
    const canView = this.canViewTicket(user, ticket);
    const canAssign = this.canAssignTicket(user, ticket);
    
    // Pode editar se pode ver e (é admin, assignee, ou responsável)
    const canEdit = canView && (isAdmin || isAssignee || canAssign);
    
    // Pode comentar se pode ver
    const canComment = canView;
    
    // Pode fechar se pode editar
    const canClose = canEdit;
    
    // Pode transferir se pode atribuir
    const canTransfer = canAssign;

    return {
      canView,
      canEdit,
      canAssign,
      canComment,
      canClose,
      canTransfer,
      isAdmin,
      isAssignee,
      isWatcher,
      // Informação sobre o nível de acesso
      accessLevel: isAdmin ? 'admin' : 
                   canAssign ? 'manager' : 
                   isAssignee ? 'assignee' : 
                   canView ? 'viewer' : 'none'
    };
  }
}

export default new TicketVisibilityService();
