import { Client, ClientUser, Ticket, Organization } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';
import { sendClientAdminWelcomeEmail } from '../../services/emailService.js';

const organizationAdminRoles = ['org-admin', 'org-admin', 'tenant-admin', 'super-admin', 'provider-admin'];

// GET /api/clients - Listar empresas clientes
export const getClients = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, isActive, page = 1, limit = 20 } = req.query;

    const where = { organizationId };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { tradeName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { taxId: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: clients } = await Client.findAndCountAll({
      where,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Buscar estatísticas para cada cliente
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const [userCount, ticketCount, openTicketCount] = await Promise.all([
          ClientUser.count({ where: { clientId: client.id, isActive: true } }),
          Ticket.count({ where: { clientId: client.id } }),
          Ticket.count({ 
            where: { 
              clientId: client.id,
              status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] }
            }
          })
        ]);

        // Atualizar cache de stats
        await client.update({
          stats: {
            ...client.stats,
            totalUsers: userCount,
            activeUsers: userCount,
            totalTickets: ticketCount,
            openTickets: openTicketCount
          }
        });

        return {
          ...client.toJSON(),
          stats: {
            totalUsers: userCount,
            activeUsers: userCount,
            totalTickets: ticketCount,
            openTickets: openTicketCount
          }
        };
      })
    );

    res.json({
      success: true,
      clients: clientsWithStats,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/clients/:id - Obter cliente por ID
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const client = await Client.findOne({
      where: { id, organizationId },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ClientUser,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role', 'isActive', 'lastLogin'],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Buscar tickets recentes
    const recentTickets = await Ticket.findAll({
      where: { clientId: id },
      attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Estatísticas detalhadas
    const stats = {
      totalUsers: await ClientUser.count({ where: { clientId: id } }),
      activeUsers: await ClientUser.count({ where: { clientId: id, isActive: true } }),
      totalTickets: await Ticket.count({ where: { clientId: id } }),
      openTickets: await Ticket.count({
        where: { 
          clientId: id,
          status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] }
        }
      }),
      resolvedTickets: await Ticket.count({
        where: { clientId: id, status: { [Op.in]: ['resolvido', 'fechado'] } }
      })
    };

    res.json({
      success: true,
      client: {
        ...client.toJSON(),
        recentTickets,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/clients - Criar empresa cliente
export const createClient = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      tradeName,
      taxId,
      industryType,
      email,
      phone,
      website,
      address,
      contract,
      billing,
      primaryContact,
      settings,
      password
    } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e password são obrigatórios'
      });
    }

    // Verificar permissões
    if (!organizationAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para criar clientes'
      });
    }

    // Verificar se email já existe
    const existingClient = await Client.findOne({
      where: { 
        email,
        organizationId
      }
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso por outro cliente'
      });
    }

    // Verificar se taxId já existe (se fornecido)
    if (taxId) {
      const existingTaxId = await Client.findOne({
        where: { taxId, organizationId }
      });

      if (existingTaxId) {
        return res.status(400).json({
          success: false,
          error: 'NIF/CNPJ já está em uso'
        });
      }
    }

    // Verificar se já existe utilizador de cliente com este email na organização
    const existingClientUser = await ClientUser.findOne({
      where: { email, organizationId }
    });

    if (existingClientUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso por um utilizador de cliente'
      });
    }

    const client = await Client.create({
      organizationId,
      name,
      tradeName,
      taxId,
      industryType,
      email,
      phone,
      website,
      address: address || {},
      contract: contract || {
        status: 'active',
        slaLevel: 'standard',
        supportHours: 'business-hours',
        maxUsers: 10,
        maxTicketsPerMonth: 100
      },
      billing: billing || {
        currency: 'EUR',
        billingCycle: 'monthly',
        paymentMethod: 'bank-transfer'
      },
      primaryContact: primaryContact || {},
      settings: settings || {},
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        totalTickets: 0,
        openTickets: 0
      }
    });

    // Criar utilizador admin da empresa cliente para o Portal do Cliente
    await ClientUser.create({
      organizationId,
      clientId: client.id,
      name: primaryContact?.name || name,
      email,
      password, // Será hasheado pelo hook do modelo
      phone,
      position: primaryContact?.position,
      departmentName: primaryContact?.departmentName,
      role: 'client-admin',
      permissions: {
        canCreateTickets: true,
        canViewAllClientTickets: true,
        canApproveRequests: true,
        canAccessKnowledgeBase: true,
        canRequestServices: true
      },
      isActive: true,
      emailVerified: false
    });

    // Enviar email de boas-vindas para o admin do portal do cliente
    try {
      const tenant = await Organization.findByPk(organizationId, { attributes: ['name'] });
      await sendClientAdminWelcomeEmail({
        email,
        name: primaryContact?.name || name,
        clientName: name,
        tenantName: tenant?.name,
        portalUrl: process.env.CLIENT_PORTAL_URL
      });
    } catch (emailError) {
      logger.warn('Falha ao enviar email de boas-vindas para client-admin:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Cliente criado com sucesso',
      client: client.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:id - Atualizar cliente
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const {
      name,
      tradeName,
      taxId,
      industryType,
      email,
      phone,
      website,
      address,
      contract,
      billing,
      primaryContact,
      settings,
      isActive
    } = req.body;

    // Verificar permissões
    if (!organizationAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para atualizar clientes'
      });
    }

    const client = await Client.findOne({
      where: { id, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Se mudou email, verificar se não está em uso
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({
        where: { 
          email,
          organizationId,
          id: { [Op.ne]: id }
        }
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso por outro cliente'
        });
      }
    }

    // Se mudou taxId, verificar se não está em uso
    if (taxId && taxId !== client.taxId) {
      const existingTaxId = await Client.findOne({
        where: { 
          taxId,
          organizationId,
          id: { [Op.ne]: id }
        }
      });

      if (existingTaxId) {
        return res.status(400).json({
          success: false,
          error: 'NIF/CNPJ já está em uso'
        });
      }
    }

    await client.update({
      name: name || client.name,
      tradeName,
      taxId,
      industryType,
      email: email || client.email,
      phone,
      website,
      address: address !== undefined ? address : client.address,
      contract: contract !== undefined ? contract : client.contract,
      billing: billing !== undefined ? billing : client.billing,
      primaryContact: primaryContact !== undefined ? primaryContact : client.primaryContact,
      settings: settings !== undefined ? settings : client.settings,
      isActive: isActive !== undefined ? isActive : client.isActive
    });

    res.json({
      success: true,
      message: 'Cliente atualizado com sucesso',
      client: client.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/clients/:id - Desativar cliente (soft delete)
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verificar permissões
    if (!organizationAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para desativar clientes'
      });
    }

    const client = await Client.findOne({
      where: { id, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Verificar se tem tickets abertos
    const openTickets = await Ticket.count({
      where: { 
        clientId: id,
        status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] }
      }
    });

    if (openTickets > 0) {
      return res.status(400).json({
        success: false,
        error: `Cliente possui ${openTickets} ticket(s) em aberto. Feche-os antes de desativar.`
      });
    }

    await client.update({ 
      isActive: false,
      suspendedAt: new Date(),
      suspendedReason: req.body.reason || 'Desativado manualmente'
    });

    // Desativar todos os usuários do cliente
    await ClientUser.update(
      { isActive: false },
      { where: { clientId: id } }
    );

    res.json({
      success: true,
      message: 'Cliente desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:id/activate - Reativar cliente
export const activateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verificar permissões
    if (!organizationAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para reativar clientes'
      });
    }

    const client = await Client.findOne({
      where: { id, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    await client.update({ 
      isActive: true,
      suspendedAt: null,
      suspendedReason: null
    });

    res.json({
      success: true,
      message: 'Cliente reativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/clients/:id/stats - Estatísticas detalhadas do cliente
export const getClientStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { startDate, endDate } = req.query;

    const client = await Client.findOne({
      where: { id, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    const ticketWhere = { clientId: id };
    if (startDate && endDate) {
      ticketWhere.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgResolutionTime
    ] = await Promise.all([
      Ticket.count({ where: ticketWhere }),
      Ticket.count({ where: { ...ticketWhere, status: 'novo' } }),
      Ticket.count({ where: { ...ticketWhere, status: 'em_progresso' } }),
      Ticket.count({ where: { ...ticketWhere, status: { [Op.in]: ['resolvido', 'fechado'] } } }),
      // Calcular tempo médio de resolução (simplificado)
      Ticket.count({ where: { ...ticketWhere, resolvedAt: { [Op.ne]: null } } })
    ]);

    const stats = {
      users: {
        total: await ClientUser.count({ where: { clientId: id } }),
        active: await ClientUser.count({ where: { clientId: id, isActive: true } })
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets
      },
      contract: client.contract,
      usage: {
        usersUsed: await ClientUser.count({ where: { clientId: id } }),
        usersLimit: client.contract.maxUsers || 'unlimited',
        ticketsThisMonth: await Ticket.count({
          where: {
            clientId: id,
            createdAt: {
              [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        ticketsLimit: client.contract.maxTicketsPerMonth || 'unlimited'
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};
