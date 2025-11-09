import { Op } from 'sequelize';
import TicketRelationship from '../../models/TicketRelationship.js';
import TeamWorkspace from '../../models/TeamWorkspace.js';
import SharedView from '../../models/SharedView.js';
import TicketMention from '../../models/TicketMention.js';
import { Ticket, User, Comment } from '../models/index.js';
import logger from '../../config/logger.js';

class CollaborationController {
  // ===== TICKET RELATIONSHIPS =====

  async getTicketRelationships(req, res) {
    try {
      const { ticketId } = req.params;
      const { organizationId } = req.user;

      // Verificar se ticket pertence à organização
      const ticket = await Ticket.findOne({
        where: { id: ticketId, organizationId }
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      const [outgoing, incoming] = await Promise.all([
        // Relações onde este ticket é a origem
        TicketRelationship.findAll({
          where: { sourceTicketId: ticketId },
          include: [{
            model: Ticket,
            as: 'targetTicket',
            attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority']
          }]
        }),
        // Relações onde este ticket é o destino
        TicketRelationship.findAll({
          where: { targetTicketId: ticketId },
          include: [{
            model: Ticket,
            as: 'sourceTicket',
            attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority']
          }]
        })
      ]);

      res.json({
        outgoing,
        incoming,
        total: outgoing.length + incoming.length
      });
    } catch (error) {
      logger.error('Erro ao buscar relações de ticket:', error);
      res.status(500).json({ error: 'Erro ao buscar relações' });
    }
  }

  async createTicketRelationship(req, res) {
    try {
      const { sourceTicketId, targetTicketId, relationshipType, description } = req.body;
      const { organizationId, id: createdById } = req.user;

      // Validar que ambos tickets existem e pertencem à organização
      const [sourceTicket, targetTicket] = await Promise.all([
        Ticket.findOne({ where: { id: sourceTicketId, organizationId } }),
        Ticket.findOne({ where: { id: targetTicketId, organizationId } })
      ]);

      if (!sourceTicket || !targetTicket) {
        return res.status(404).json({ error: 'Um ou ambos tickets não encontrados' });
      }

      // Verificar se relação já existe
      const existing = await TicketRelationship.findOne({
        where: {
          sourceTicketId,
          targetTicketId,
          relationshipType
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Relação já existe' });
      }

      const relationship = await TicketRelationship.create({
        sourceTicketId,
        targetTicketId,
        relationshipType,
        description,
        createdById
      });

      // Criar relação reversa para alguns tipos
      const reverseTypes = {
        'parent_of': 'child_of',
        'child_of': 'parent_of',
        'blocks': 'blocked_by',
        'blocked_by': 'blocks',
        'duplicates': 'duplicated_by',
        'duplicated_by': 'duplicates',
        'causes': 'caused_by',
        'caused_by': 'causes',
        'follows': 'precedes',
        'precedes': 'follows'
      };

      if (reverseTypes[relationshipType]) {
        await TicketRelationship.create({
          sourceTicketId: targetTicketId,
          targetTicketId: sourceTicketId,
          relationshipType: reverseTypes[relationshipType],
          description,
          createdById
        });
      }

      res.status(201).json(relationship);
    } catch (error) {
      logger.error('Erro ao criar relação de ticket:', error);
      res.status(500).json({ error: 'Erro ao criar relação' });
    }
  }

  async deleteTicketRelationship(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const relationship = await TicketRelationship.findOne({
        where: { id },
        include: [{
          model: Ticket,
          as: 'sourceTicket',
          where: { organizationId }
        }]
      });

      if (!relationship) {
        return res.status(404).json({ error: 'Relação não encontrada' });
      }

      await relationship.destroy();

      res.json({ message: 'Relação removida com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover relação:', error);
      res.status(500).json({ error: 'Erro ao remover relação' });
    }
  }

  // ===== TEAM WORKSPACES =====

  async getTeamWorkspaces(req, res) {
    try {
      const { organizationId, id: userId } = req.user;

      const workspaces = await TeamWorkspace.findAll({
        where: {
          organizationId,
          [Op.or]: [
            { members: { [Op.contains]: [userId] } },
            { 'settings.visibility': 'organization' }
          ]
        },
        order: [['name', 'ASC']]
      });

      res.json(workspaces);
    } catch (error) {
      logger.error('Erro ao buscar workspaces:', error);
      res.status(500).json({ error: 'Erro ao buscar workspaces' });
    }
  }

  async getTeamWorkspaceById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;

      const workspace = await TeamWorkspace.findOne({
        where: { id, organizationId }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace não encontrado' });
      }

      // Verificar permissão
      if (!workspace.members.includes(userId) && workspace.settings.visibility !== 'organization') {
        return res.status(403).json({ error: 'Sem permissão para acessar este workspace' });
      }

      res.json(workspace);
    } catch (error) {
      logger.error('Erro ao buscar workspace:', error);
      res.status(500).json({ error: 'Erro ao buscar workspace' });
    }
  }

  async createTeamWorkspace(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;
      
      const workspace = await TeamWorkspace.create({
        ...req.body,
        organizationId,
        createdById,
        members: [createdById, ...(req.body.members || [])],
        roles: {
          [createdById]: {
            role: 'owner',
            permissions: ['read', 'write', 'delete', 'manage']
          }
        }
      });

      res.status(201).json(workspace);
    } catch (error) {
      logger.error('Erro ao criar workspace:', error);
      res.status(500).json({ error: 'Erro ao criar workspace' });
    }
  }

  async updateTeamWorkspace(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;

      const workspace = await TeamWorkspace.findOne({
        where: { id, organizationId }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace não encontrado' });
      }

      // Verificar permissão de edição
      const userRole = workspace.roles[userId];
      if (!userRole || !['owner', 'admin'].includes(userRole.role)) {
        return res.status(403).json({ error: 'Sem permissão para editar este workspace' });
      }

      await workspace.update(req.body);

      res.json(workspace);
    } catch (error) {
      logger.error('Erro ao atualizar workspace:', error);
      res.status(500).json({ error: 'Erro ao atualizar workspace' });
    }
  }

  async addWorkspaceMember(req, res) {
    try {
      const { id } = req.params;
      const { userId: newMemberId, role = 'member' } = req.body;
      const { organizationId, id: currentUserId } = req.user;

      const workspace = await TeamWorkspace.findOne({
        where: { id, organizationId }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace não encontrado' });
      }

      // Verificar permissão
      const currentUserRole = workspace.roles[currentUserId];
      if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole.role)) {
        return res.status(403).json({ error: 'Sem permissão para adicionar membros' });
      }

      // Verificar se usuário já é membro
      if (workspace.members.includes(newMemberId)) {
        return res.status(400).json({ error: 'Usuário já é membro' });
      }

      // Adicionar membro
      const updatedMembers = [...workspace.members, newMemberId];
      const updatedRoles = {
        ...workspace.roles,
        [newMemberId]: {
          role,
          permissions: this.getDefaultPermissionsForRole(role)
        }
      };

      await workspace.update({
        members: updatedMembers,
        roles: updatedRoles
      });

      res.json(workspace);
    } catch (error) {
      logger.error('Erro ao adicionar membro:', error);
      res.status(500).json({ error: 'Erro ao adicionar membro' });
    }
  }

  async removeWorkspaceMember(req, res) {
    try {
      const { id, userId: memberToRemove } = req.params;
      const { organizationId, id: currentUserId } = req.user;

      const workspace = await TeamWorkspace.findOne({
        where: { id, organizationId }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace não encontrado' });
      }

      // Owner não pode ser removido
      if (workspace.roles[memberToRemove]?.role === 'owner') {
        return res.status(400).json({ error: 'Owner não pode ser removido' });
      }

      // Verificar permissão
      const currentUserRole = workspace.roles[currentUserId];
      if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole.role)) {
        return res.status(403).json({ error: 'Sem permissão para remover membros' });
      }

      // Remover membro
      const updatedMembers = workspace.members.filter(id => id !== parseInt(memberToRemove));
      const updatedRoles = { ...workspace.roles };
      delete updatedRoles[memberToRemove];

      await workspace.update({
        members: updatedMembers,
        roles: updatedRoles
      });

      res.json(workspace);
    } catch (error) {
      logger.error('Erro ao remover membro:', error);
      res.status(500).json({ error: 'Erro ao remover membro' });
    }
  }

  // ===== SHARED VIEWS =====

  async getSharedViews(req, res) {
    try {
      const { organizationId, id: userId } = req.user;
      const { teamWorkspaceId } = req.query;

      const where = {
        organizationId,
        [Op.or]: [
          { isPublic: true },
          { createdById: userId },
          { 'sharedWith.users': { [Op.contains]: [userId] } }
        ]
      };

      if (teamWorkspaceId) {
        where.teamWorkspaceId = teamWorkspaceId;
      }

      const views = await SharedView.findAll({
        where,
        order: [['name', 'ASC']]
      });

      res.json(views);
    } catch (error) {
      logger.error('Erro ao buscar views:', error);
      res.status(500).json({ error: 'Erro ao buscar views' });
    }
  }

  async createSharedView(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;

      const view = await SharedView.create({
        ...req.body,
        organizationId,
        createdById
      });

      res.status(201).json(view);
    } catch (error) {
      logger.error('Erro ao criar view:', error);
      res.status(500).json({ error: 'Erro ao criar view' });
    }
  }

  async updateSharedView(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;

      const view = await SharedView.findOne({
        where: { id, organizationId }
      });

      if (!view) {
        return res.status(404).json({ error: 'View não encontrada' });
      }

      // Verificar permissão
      if (view.createdById !== userId && !view.permissions.canEdit.includes(userId)) {
        return res.status(403).json({ error: 'Sem permissão para editar esta view' });
      }

      await view.update(req.body);

      res.json(view);
    } catch (error) {
      logger.error('Erro ao atualizar view:', error);
      res.status(500).json({ error: 'Erro ao atualizar view' });
    }
  }

  // ===== MENTIONS =====

  async getMyMentions(req, res) {
    try {
      const { id: userId } = req.user;
      const { isRead } = req.query;

      const where = {
        mentionedUserId: userId
      };

      if (isRead !== undefined) {
        where.isRead = isRead === 'true';
      }

      const mentions = await TicketMention.findAll({
        where,
        include: [
          {
            model: Ticket,
            as: 'ticket',
            attributes: ['id', 'ticketNumber', 'subject', 'status']
          },
          {
            model: User,
            as: 'mentionedBy',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json(mentions);
    } catch (error) {
      logger.error('Erro ao buscar mentions:', error);
      res.status(500).json({ error: 'Erro ao buscar mentions' });
    }
  }

  async markMentionAsRead(req, res) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const mention = await TicketMention.findOne({
        where: { id, mentionedUserId: userId }
      });

      if (!mention) {
        return res.status(404).json({ error: 'Mention não encontrada' });
      }

      await mention.update({
        isRead: true,
        readAt: new Date()
      });

      res.json(mention);
    } catch (error) {
      logger.error('Erro ao marcar mention como lida:', error);
      res.status(500).json({ error: 'Erro ao marcar mention' });
    }
  }

  async createMention(ticketId, commentId, content, mentionedById) {
    try {
      // Extrair mentions do conteúdo (@username ou @userId)
      const mentionRegex = /@(\w+)/g;
      const matches = content.matchAll(mentionRegex);

      for (const match of matches) {
        const username = match[1];
        
        // Buscar usuário por username ou email
        const user = await User.findOne({
          where: {
            [Op.or]: [
              { username },
              { email: { [Op.iLike]: `${username}%` } }
            ]
          }
        });

        if (user && user.id !== mentionedById) {
          // Extrair contexto (50 caracteres antes e depois da mention)
          const matchIndex = match.index;
          const start = Math.max(0, matchIndex - 50);
          const end = Math.min(content.length, matchIndex + 50);
          const context = content.substring(start, end);

          await TicketMention.create({
            ticketId,
            commentId,
            mentionedUserId: user.id,
            mentionedById,
            context
          });
        }
      }
    } catch (error) {
      logger.error('Erro ao criar mentions:', error);
    }
  }

  // ===== HELPER METHODS =====

  getDefaultPermissionsForRole(role) {
    const permissions = {
      'owner': ['read', 'write', 'delete', 'manage'],
      'admin': ['read', 'write', 'delete'],
      'member': ['read', 'write'],
      'viewer': ['read']
    };

    return permissions[role] || permissions['viewer'];
  }
}

export default new CollaborationController();
