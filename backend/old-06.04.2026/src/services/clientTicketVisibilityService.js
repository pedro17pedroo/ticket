/**
 * Client Ticket Visibility Service
 * 
 * Gerencia a visibilidade de tickets para usuários de empresas clientes (B2B)
 * baseado na estrutura organizacional do cliente.
 * 
 * Regras de Visibilidade para Clientes (quanto mais específica a estrutura, MENOS tickets vê):
 * 
 * 1. USUÁRIO SEM ESTRUTURA ORGANIZACIONAL:
 *    - Vê apenas seus próprios tickets
 * 
 * 2. USUÁRIO COM DIREÇÃO (sem departamento):
 *    - Vê seus próprios tickets
 *    - Vê tickets de TODOS os usuários da mesma direção (incluindo departamentos e secções)
 * 
 * 3. USUÁRIO COM DIREÇÃO + DEPARTAMENTO (sem secção):
 *    - Vê seus próprios tickets
 *    - Vê tickets de TODOS os usuários do mesmo departamento (incluindo secções)
 *    - NÃO vê tickets de outros departamentos da mesma direção
 * 
 * 4. USUÁRIO COM DIREÇÃO + DEPARTAMENTO + SECÇÃO:
 *    - Vê seus próprios tickets
 *    - Vê tickets APENAS de usuários da mesma secção
 *    - NÃO vê tickets de outras secções do mesmo departamento
 *    - NÃO vê tickets de outros departamentos da mesma direção
 * 
 * 5. CLIENT-ADMIN:
 *    - Vê todos os tickets do cliente
 * 
 * 6. WATCHERS:
 *    - Usuários podem ser adicionados como watchers em tickets
 *    - Watchers veem o ticket independente da estrutura organizacional
 */

import { Op } from 'sequelize';
import { ClientUser, Direction, Department, Section } from '../modules/models/index.js';
import logger from '../config/logger.js';

class ClientTicketVisibilityService {
  
  /**
   * Verifica se um usuário cliente pode ver um ticket específico
   * @param {Object} clientUser - Usuário do cliente (ClientUser)
   * @param {Object} ticket - Ticket a verificar
   * @returns {boolean} Se o usuário pode ver o ticket
   */
  canViewTicket(clientUser, ticket) {
    logger.info(`🔍 canViewTicket - Usuário: ${clientUser.email} (${clientUser.id}), Role: ${clientUser.role}, ClientId: ${clientUser.clientId}`);
    logger.info(`🔍 canViewTicket - Ticket: ${ticket.ticketNumber}, ClientId: ${ticket.clientId}, RequesterClientUserId: ${ticket.requesterClientUserId}`);
    
    // Admin do cliente vê todos os tickets do cliente
    if (clientUser.role === 'client-admin') {
      // Verificar por clientId OU por requesterClientUserId (fallback para tickets antigos)
      let canView = false;
      
      // Primeiro, verificar pelo clientId do ticket
      if (ticket.clientId) {
        canView = ticket.clientId === clientUser.clientId;
        logger.info(`🔍 canViewTicket - Admin check via clientId: ${canView}`);
      }
      
      // Se não tem clientId, verificar pelo requesterClientUserId
      if (!canView && ticket.requesterClientUserId) {
        // Buscar o clientId do requester para comparar
        const requesterClientUser = ticket.requesterClientUser;
        if (requesterClientUser && requesterClientUser.clientId) {
          canView = requesterClientUser.clientId === clientUser.clientId;
          logger.info(`🔍 canViewTicket - Admin check via requesterClientUser.clientId: ${canView}`);
        } else {
          // Se não temos o requesterClientUser carregado, precisamos verificar de outra forma
          // Vamos assumir que se o ticket foi criado por um client_user, ele pertence ao mesmo cliente
          logger.info(`🔍 canViewTicket - RequesterClientUser não carregado, verificando assincronamente`);
          // Por segurança, retornamos false aqui - a verificação assíncrona será feita no controller
          canView = false;
        }
      }
      
      logger.info(`🔍 canViewTicket - Admin final result: ${canView}`);
      return canView;
    }

    // Se o usuário é o requester, pode ver
    if (ticket.requesterClientUserId === clientUser.id) {
      logger.info(`🔍 canViewTicket - Usuário é o requester: true`);
      return true;
    }

    // Se o usuário é watcher, pode ver
    if (ticket.clientWatchers && ticket.clientWatchers.includes(clientUser.id)) {
      logger.info(`🔍 canViewTicket - Usuário é watcher: true`);
      return true;
    }

    // Verificar baseado na estrutura organizacional
    const structuralAccess = this._checkStructuralAccess(clientUser, ticket);
    logger.info(`🔍 canViewTicket - Acesso estrutural: ${structuralAccess}`);
    return structuralAccess;
  }
  
  /**
   * Verifica se um usuário cliente pode ver um ticket específico (versão assíncrona)
   * Usa quando precisamos buscar dados adicionais do banco
   * @param {Object} clientUser - Usuário do cliente (ClientUser)
   * @param {Object} ticket - Ticket a verificar
   * @returns {Promise<boolean>} Se o usuário pode ver o ticket
   */
  async canViewTicketAsync(clientUser, ticket) {
    logger.info(`🔍 canViewTicketAsync - Usuário: ${clientUser.email} (${clientUser.id}), Role: ${clientUser.role}, ClientId: ${clientUser.clientId}`);
    logger.info(`🔍 canViewTicketAsync - Ticket: ${ticket.ticketNumber}, ClientId: ${ticket.clientId}, RequesterClientUserId: ${ticket.requesterClientUserId}`);
    
    // Admin do cliente vê todos os tickets do cliente
    if (clientUser.role === 'client-admin') {
      // Verificar por clientId OU por requesterClientUserId (fallback para tickets antigos)
      
      // Primeiro, verificar pelo clientId do ticket
      if (ticket.clientId) {
        const canView = ticket.clientId === clientUser.clientId;
        logger.info(`🔍 canViewTicketAsync - Admin check via clientId: ${canView}`);
        return canView;
      }
      
      // Se não tem clientId, verificar pelo requesterClientUserId
      if (ticket.requesterClientUserId) {
        // Buscar o clientId do requester
        const requesterClientUser = await ClientUser.findByPk(ticket.requesterClientUserId, {
          attributes: ['id', 'clientId']
        });
        
        if (requesterClientUser) {
          const canView = requesterClientUser.clientId === clientUser.clientId;
          logger.info(`🔍 canViewTicketAsync - Admin check via requesterClientUser.clientId: ${canView}`);
          return canView;
        }
      }
      
      logger.info(`🔍 canViewTicketAsync - Admin check: false (sem clientId ou requesterClientUserId)`);
      return false;
    }

    // Se o usuário é o requester, pode ver
    if (ticket.requesterClientUserId === clientUser.id) {
      logger.info(`🔍 canViewTicketAsync - Usuário é o requester: true`);
      return true;
    }

    // Se o usuário é watcher, pode ver
    if (ticket.clientWatchers && ticket.clientWatchers.includes(clientUser.id)) {
      logger.info(`🔍 canViewTicketAsync - Usuário é watcher: true`);
      return true;
    }

    // Verificar baseado na estrutura organizacional
    const structuralAccess = this._checkStructuralAccess(clientUser, ticket);
    logger.info(`🔍 canViewTicketAsync - Acesso estrutural: ${structuralAccess}`);
    return structuralAccess;
  }

  /**
   * Verifica acesso baseado na estrutura organizacional do cliente
   * Regra: Quanto mais específica a estrutura do usuário, MENOS tickets ele vê
   * @private
   */
  _checkStructuralAccess(clientUser, ticket) {
    // Se usuário não tem estrutura organizacional, só vê seus próprios tickets
    if (!clientUser.directionId) {
      return false;
    }

    // Buscar o requester do ticket para verificar sua estrutura
    if (!ticket.requesterClientUser) {
      // Se não temos informação do requester, não podemos verificar
      return false;
    }

    const ticketRequester = ticket.requesterClientUser;

    // Se o requester não tem estrutura organizacional, apenas ele pode ver
    if (!ticketRequester.directionId) {
      return false;
    }

    // CASO 1: Usuário tem APENAS Direção (sem departamento)
    // Vê TODOS os tickets da mesma direção (incluindo departamentos e secções)
    if (clientUser.directionId && !clientUser.departmentId) {
      return ticketRequester.directionId === clientUser.directionId;
    }

    // CASO 2: Usuário tem Direção + Departamento (sem Secção)
    // Vê APENAS tickets do mesmo departamento (incluindo secções)
    if (clientUser.departmentId && !clientUser.sectionId) {
      // Requester deve ser do mesmo departamento
      return ticketRequester.departmentId === clientUser.departmentId;
    }

    // CASO 3: Usuário tem Direção + Departamento + Secção
    // Vê APENAS tickets da mesma secção
    if (clientUser.sectionId) {
      // Requester deve ser da mesma secção
      return ticketRequester.sectionId === clientUser.sectionId;
    }

    return false;
  }

  /**
   * Constrói filtro WHERE para listar tickets visíveis ao usuário cliente
   * @param {Object} clientUser - Usuário do cliente
   * @returns {Object} Condições WHERE para Sequelize
   */
  async buildVisibilityFilter(clientUser) {
    const conditions = [];

    // Admin do cliente vê todos os tickets do cliente
    if (clientUser.role === 'client-admin') {
      logger.info(`Admin ${clientUser.email} (${clientUser.id}) vendo todos os tickets do cliente ${clientUser.clientId}`);
      
      // Buscar todos os usuários do mesmo cliente para incluir tickets antigos sem clientId
      const clientUserIds = await this._getAllClientUserIds(clientUser.clientId);
      
      return { 
        [Op.or]: [
          // Tickets com clientId preenchido
          { 
            clientId: clientUser.clientId,
            requesterType: 'client'
          },
          // Tickets antigos sem clientId mas com requesterClientUserId de usuários do mesmo cliente
          {
            clientId: null,
            requesterType: 'client',
            requesterClientUserId: { [Op.in]: clientUserIds }
          }
        ]
      };
    }

    // Sempre pode ver seus próprios tickets
    conditions.push({ requesterClientUserId: clientUser.id });

    // Sempre pode ver tickets onde é watcher
    conditions.push({
      clientWatchers: { [Op.contains]: [clientUser.id] }
    });

    // Se usuário tem estrutura organizacional, buscar tickets de colegas
    if (clientUser.directionId) {
      // Buscar todos os usuários da mesma estrutura
      const colleagueIds = await this._getColleagueIds(clientUser);
      
      logger.info(`Usuário ${clientUser.email} (${clientUser.id}) com estrutura organizacional. Colegas encontrados: ${colleagueIds.length}`);
      
      if (colleagueIds.length > 0) {
        conditions.push({
          requesterClientUserId: { [Op.in]: colleagueIds }
        });
      }
    }

    return { [Op.or]: conditions };
  }
  
  /**
   * Busca todos os IDs de usuários de um cliente
   * @private
   */
  async _getAllClientUserIds(clientId) {
    const users = await ClientUser.findAll({
      where: {
        clientId: clientId,
        isActive: true
      },
      attributes: ['id']
    });
    
    return users.map(u => u.id);
  }

  /**
   * Busca IDs de colegas baseado na estrutura organizacional
   * Regra: Quanto mais específica a estrutura do usuário, MENOS colegas ele vê
   * @private
   */
  async _getColleagueIds(clientUser) {
    const where = {
      clientId: clientUser.clientId,
      isActive: true,
      id: { [Op.ne]: clientUser.id } // Excluir o próprio usuário
    };

    // CASO 1: Usuário tem APENAS Direção (sem departamento)
    // Buscar TODOS da mesma direção (incluindo departamentos e secções)
    if (clientUser.directionId && !clientUser.departmentId) {
      where.directionId = clientUser.directionId;
    }
    // CASO 2: Usuário tem Direção + Departamento (sem Secção)
    // Buscar APENAS usuários do mesmo departamento (incluindo secções)
    else if (clientUser.departmentId && !clientUser.sectionId) {
      where.departmentId = clientUser.departmentId;
    }
    // CASO 3: Usuário tem Direção + Departamento + Secção
    // Buscar APENAS usuários da mesma secção
    else if (clientUser.sectionId) {
      where.sectionId = clientUser.sectionId;
    }

    const colleagues = await ClientUser.findAll({
      where,
      attributes: ['id']
    });

    return colleagues.map(c => c.id);
  }

  /**
   * Verifica permissões completas de um usuário cliente sobre um ticket
   * @param {Object} clientUser - Usuário do cliente
   * @param {Object} ticket - Ticket
   * @returns {Object} Objeto com permissões detalhadas
   */
  getTicketPermissions(clientUser, ticket) {
    const isAdmin = clientUser.role === 'client-admin';
    const isRequester = ticket.requesterClientUserId === clientUser.id;
    const isWatcher = ticket.clientWatchers?.includes(clientUser.id);
    
    const canView = this.canViewTicket(clientUser, ticket);
    
    // Cliente pode comentar se pode ver
    const canComment = canView;
    
    // Cliente pode editar apenas seus próprios tickets (ou admin)
    const canEdit = isAdmin || isRequester;
    
    // Cliente pode fechar apenas seus próprios tickets (ou admin)
    const canClose = isAdmin || isRequester;
    
    // Cliente não pode atribuir tickets (isso é feito pela organização)
    const canAssign = false;
    
    // Cliente não pode transferir tickets
    const canTransfer = false;

    return {
      canView,
      canEdit,
      canComment,
      canClose,
      canAssign,
      canTransfer,
      isAdmin,
      isRequester,
      isWatcher,
      // Informação sobre o nível de acesso
      accessLevel: isAdmin ? 'admin' : 
                   isRequester ? 'requester' : 
                   canView ? 'viewer' : 'none'
    };
  }

  /**
   * Adiciona usuário como watcher em um ticket
   * @param {Object} ticket - Ticket
   * @param {string} clientUserId - ID do usuário cliente
   */
  async addWatcher(ticket, clientUserId) {
    const watchers = ticket.clientWatchers || [];
    if (!watchers.includes(clientUserId)) {
      watchers.push(clientUserId);
      await ticket.update({ clientWatchers: watchers });
      logger.info(`Cliente ${clientUserId} adicionado como watcher do ticket ${ticket.ticketNumber}`);
    }
  }

  /**
   * Remove usuário como watcher de um ticket
   * @param {Object} ticket - Ticket
   * @param {string} clientUserId - ID do usuário cliente
   */
  async removeWatcher(ticket, clientUserId) {
    const watchers = ticket.clientWatchers || [];
    const index = watchers.indexOf(clientUserId);
    if (index > -1) {
      watchers.splice(index, 1);
      await ticket.update({ clientWatchers: watchers });
      logger.info(`Cliente ${clientUserId} removido como watcher do ticket ${ticket.ticketNumber}`);
    }
  }
}

export default new ClientTicketVisibilityService();
