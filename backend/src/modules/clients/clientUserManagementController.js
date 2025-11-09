import { ClientUser, Client, Ticket, Organization } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

// GET /api/clients/:clientId/users - Listar usuários de uma empresa cliente
export const getClientUsers = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const organizationId = req.user.organizationId;
    const { search, isActive, role, page = 1, limit = 20 } = req.query;

    // Verificar se o cliente pertence à organização
    const client = await Client.findOne({
      where: { id: clientId, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    const where = { clientId, organizationId };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: users } = await ClientUser.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      users,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/client-users/:id - Obter usuário por ID
export const getClientUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const user = await ClientUser.findOne({
      where: { id, organizationId },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'contract']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Buscar estatísticas de tickets
    const ticketStats = {
      total: await Ticket.count({
        where: { requesterId: id, requesterType: 'client_user' }
      }),
      open: await Ticket.count({
        where: { 
          requesterId: id,
          requesterType: 'client_user',
          status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] }
        }
      }),
      resolved: await Ticket.count({
        where: { 
          requesterId: id,
          requesterType: 'client_user',
          status: { [Op.in]: ['resolvido', 'fechado'] }
        }
      })
    };

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        ticketStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/clients/:clientId/users - Criar usuário para empresa cliente
export const createClientUser = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const organizationId = req.user.organizationId;
    const {
      name,
      email,
      password,
      role,
      phone,
      position,
      departmentName,
      location,
      permissions
    } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    // Verificar se o cliente pertence à organização
    const client = await Client.findOne({
      where: { id: clientId, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Verificar se cliente está ativo
    if (!client.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cliente está desativado'
      });
    }

    // Verificar limite de usuários
    const currentUserCount = await ClientUser.count({
      where: { clientId, isActive: true }
    });

    if (client.contract.maxUsers && currentUserCount >= client.contract.maxUsers) {
      return res.status(400).json({
        success: false,
        error: `Limite de usuários atingido (${client.contract.maxUsers})`
      });
    }

    // Verificar se email já existe na organização
    const existingUser = await ClientUser.findOne({
      where: { email, organizationId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso nesta organização'
      });
    }

    // Verificar permissões
    // Tenant admin pode criar qualquer role
    // Client-admin pode criar apenas client-user e client-manager
    if (req.user.role === 'client-admin' && role === 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Client-admin não pode criar outro client-admin'
      });
    }

    const user = await ClientUser.create({
      organizationId,
      clientId,
      name,
      email,
      password, // Será hasheado pelo hook
      role: role || 'client-user',
      phone,
      position,
      departmentName,
      location: location || {},
      permissions: permissions || {},
      isActive: true,
      emailVerified: false
    });

    // Atualizar stats do cliente
    await client.update({
      stats: {
        ...client.stats,
        totalUsers: currentUserCount + 1,
        activeUsers: currentUserCount + 1
      }
    });

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: user.toJSON() // Senha já é removida pelo método toJSON
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/client-users/:id - Atualizar usuário
export const updateClientUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const {
      name,
      email,
      password,
      role,
      phone,
      position,
      departmentName,
      location,
      permissions,
      isActive
    } = req.body;

    const user = await ClientUser.findOne({
      where: { id, organizationId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões
    // Tenant admin pode atualizar tudo
    // Client-admin pode atualizar usuários do mesmo cliente
    // Client-user só pode atualizar seu próprio perfil
    if (req.user.role === 'client-admin' || req.user.role === 'client-manager') {
      // Verificar se está tentando modificar usuário do mesmo cliente
      if (user.clientId !== req.user.clientId) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para modificar usuário de outro cliente'
        });
      }
    } else if (req.user.role === 'client-user') {
      // Só pode modificar a si mesmo
      if (user.id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Você só pode modificar seu próprio perfil'
        });
      }
    }

    // Client-admin não pode modificar role para client-admin
    if (req.user.role === 'client-admin' && role === 'client-admin' && user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para promover usuário a client-admin'
      });
    }

    // Se mudou email, verificar se não está em uso
    if (email && email !== user.email) {
      const existingUser = await ClientUser.findOne({
        where: { 
          email,
          organizationId,
          id: { [Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso'
        });
      }
    }

    const updateData = {
      name: name || user.name,
      email: email || user.email,
      role: role !== undefined ? role : user.role,
      phone,
      position,
      departmentName,
      location: location !== undefined ? location : user.location,
      permissions: permissions !== undefined ? permissions : user.permissions,
      isActive: isActive !== undefined ? isActive : user.isActive
    };

    // Se forneceu nova senha
    if (password) {
      updateData.password = password; // Será hasheado pelo hook
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/client-users/:id - Desativar usuário (soft delete)
export const deleteClientUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const user = await ClientUser.findOne({
      where: { id, organizationId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões
    if (req.user.role === 'client-admin' && user.clientId !== req.user.clientId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para desativar usuário de outro cliente'
      });
    }

    // Verificar se tem tickets abertos
    const openTickets = await Ticket.count({
      where: { 
        requesterId: id,
        requesterType: 'client_user',
        status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] }
      }
    });

    if (openTickets > 0) {
      return res.status(400).json({
        success: false,
        error: `Usuário possui ${openTickets} ticket(s) em aberto`
      });
    }

    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/client-users/:id/activate - Reativar usuário
export const activateClientUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const user = await ClientUser.findOne({
      where: { id, organizationId },
      include: [
        {
          model: Client,
          as: 'client'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões
    if (req.user.role === 'client-admin' && user.clientId !== req.user.clientId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para reativar usuário de outro cliente'
      });
    }

    // Verificar se cliente está ativo
    if (!user.client.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cliente está desativado'
      });
    }

    // Verificar limite de usuários
    const activeUserCount = await ClientUser.count({
      where: { clientId: user.clientId, isActive: true }
    });

    if (user.client.contract.maxUsers && activeUserCount >= user.client.contract.maxUsers) {
      return res.status(400).json({
        success: false,
        error: `Limite de usuários atingido (${user.client.contract.maxUsers})`
      });
    }

    await user.update({ isActive: true });

    res.json({
      success: true,
      message: 'Usuário reativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/client-users/:id/change-password - Alterar senha
export const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    const user = await ClientUser.findOne({
      where: { id, organizationId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Apenas o próprio usuário pode alterar sua senha
    // Ou tenant-admin pode resetar
    if (req.user.id !== id && !['super-admin', 'provider-admin', 'tenant-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para alterar senha deste usuário'
      });
    }

    // Se não é admin, verificar senha atual
    if (req.user.id === id) {
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Senha atual incorreta'
        });
      }
    }

    await user.update({ password: newPassword }); // Será hasheado pelo hook

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
