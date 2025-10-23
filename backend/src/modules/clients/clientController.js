import { User, Ticket } from '../models/index.js';
import { Op } from 'sequelize';

// GET /api/clients - Listar clientes
export const getClients = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, isActive } = req.query;

    const where = { 
      organizationId,
      role: 'cliente-org'
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const clients = await User.findAll({
      where,
      attributes: [
        'id', 'name', 'email', 'phone',
        'isActive', 'createdAt', 'lastLogin'
      ],
      order: [['name', 'ASC']]
    });

    // Contar tickets por cliente
    const clientsWithTickets = await Promise.all(
      clients.map(async (client) => {
        const ticketCount = await Ticket.count({
          where: { 
            requesterId: client.id,  // Campo correto é requesterId, não createdById
            organizationId
          }
        });

        return {
          ...client.toJSON(),
          ticketCount
        };
      })
    );

    res.json({
      success: true,
      clients: clientsWithTickets,
      total: clientsWithTickets.length
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

    const client = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: 'cliente-org'
      },
      attributes: [
        'id', 'name', 'email', 'phone',
        'isActive', 'createdAt', 'lastLogin'
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Buscar tickets do cliente
    const tickets = await Ticket.findAll({
      where: { 
        requesterId: client.id,
        organizationId
      },
      attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Estatísticas
    const stats = {
      totalTickets: await Ticket.count({
        where: { requesterId: client.id, organizationId }
      }),
      openTickets: await Ticket.count({
        where: { 
          requesterId: client.id, 
          organizationId,
          status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] }
        }
      }),
      closedTickets: await Ticket.count({
        where: { 
          requesterId: client.id, 
          organizationId,
          status: { [Op.in]: ['resolvido', 'fechado'] }
        }
      })
    };

    res.json({
      success: true,
      client: {
        ...client.toJSON(),
        tickets,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/clients - Criar cliente
export const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const organizationId = req.user.organizationId;

    // Apenas admin pode criar clientes
    if (req.user.role !== 'admin-org') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar clientes'
      });
    }

    // Verificar se email já existe na organização
    const existingUser = await User.findOne({
      where: { 
        email,
        organizationId
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso nesta organização'
      });
    }

    // Criar utilizador admin do cliente com permissão de gestão
    const client = await User.create({
      name,
      email,
      phone,
      password, // Será hasheado pelo hook do modelo
      role: 'cliente-org',
      organizationId,
      isActive: true,
      settings: {
        notifications: true,
        emailNotifications: true,
        theme: 'light',
        language: 'pt',
        clientAdmin: true // Admin do cliente - pode gerir utilizadores
      }
    });

    // Remover senha da resposta
    const clientData = client.toJSON();
    delete clientData.password;

    res.status(201).json({
      success: true,
      message: 'Cliente criado com sucesso. Utilizador admin configurado.',
      client: clientData
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:id - Atualizar cliente
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, isActive } = req.body;
    const organizationId = req.user.organizationId;

    if (req.user.role !== 'admin-org') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem atualizar clientes'
      });
    }

    const client = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: 'cliente-org'
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Se mudou email, verificar se não está em uso
    if (email && email !== client.email) {
      const existingUser = await User.findOne({
        where: { 
          email,
          organizationId,
          id: { [Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso nesta organização'
        });
      }
    }

    await client.update({
      name,
      email,
      phone,
      isActive
    });

    const clientData = client.toJSON();
    delete clientData.password;

    res.json({
      success: true,
      message: 'Cliente atualizado com sucesso',
      client: clientData
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

    if (req.user.role !== 'admin-org') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem desativar clientes'
      });
    }

    const client = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: 'cliente-org'
      }
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
        requesterId: client.id,
        organizationId,
        status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] }
      }
    });

    if (openTickets > 0) {
      return res.status(400).json({
        success: false,
        error: `Cliente possui ${openTickets} ticket(s) em aberto. Feche-os antes de desativar o cliente.`
      });
    }

    await client.update({ isActive: false });

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

    if (req.user.role !== 'admin-org') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem reativar clientes'
      });
    }

    const client = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: 'cliente-org'
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    await client.update({ isActive: true });

    res.json({
      success: true,
      message: 'Cliente reativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
