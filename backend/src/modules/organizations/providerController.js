import { Organization, User, Client, ClientUser, Ticket } from '../models/index.js';
import { Op } from 'sequelize';

// GET /api/provider/tenants - Listar organizações tenant (apenas Provider)
export const getTenants = async (req, res, next) => {
  try {
    // Apenas super-admin e provider-admin podem acessar
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas Provider pode acessar esta funcionalidade.'
      });
    }

    const { search, isActive, type, page = 1, limit = 20 } = req.query;

    const where = { 
      type: type || 'tenant'  // Por padrão lista tenants
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { taxId: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: tenants } = await Organization.findAndCountAll({
      where,
      include: [
        {
          model: Organization,
          as: 'parent',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Buscar estatísticas para cada tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const [userCount, clientCount, ticketCount] = await Promise.all([
          User.count({ where: { organizationId: tenant.id, isActive: true } }),
          Client.count({ where: { organizationId: tenant.id, isActive: true } }),
          Ticket.count({ where: { organizationId: tenant.id } })
        ]);

        return {
          ...tenant.toJSON(),
          stats: {
            totalUsers: userCount,
            totalClients: clientCount,
            totalTickets: ticketCount
          }
        };
      })
    );

    res.json({
      success: true,
      tenants: tenantsWithStats,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/provider/tenants/:id - Obter tenant específico
export const getTenantById = async (req, res, next) => {
  try {
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const { id } = req.params;

    const tenant = await Organization.findOne({
      where: { id, type: 'tenant' },
      include: [
        {
          model: Organization,
          as: 'parent',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Estatísticas detalhadas
    const stats = {
      users: {
        total: await User.count({ where: { organizationId: id } }),
        active: await User.count({ where: { organizationId: id, isActive: true } }),
        byRole: {
          'tenant-admin': await User.count({ where: { organizationId: id, role: 'tenant-admin' } }),
          'agent': await User.count({ where: { organizationId: id, role: 'agent' } }),
          'tenant-manager': await User.count({ where: { organizationId: id, role: 'tenant-manager' } })
        }
      },
      clients: {
        total: await Client.count({ where: { organizationId: id } }),
        active: await Client.count({ where: { organizationId: id, isActive: true } })
      },
      clientUsers: {
        total: await ClientUser.count({ where: { organizationId: id } }),
        active: await ClientUser.count({ where: { organizationId: id, isActive: true } })
      },
      tickets: {
        total: await Ticket.count({ where: { organizationId: id } }),
        open: await Ticket.count({
          where: { 
            organizationId: id,
            status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] }
          }
        }),
        resolved: await Ticket.count({
          where: { 
            organizationId: id,
            status: { [Op.in]: ['resolvido', 'fechado'] }
          }
        })
      }
    };

    res.json({
      success: true,
      tenant: {
        ...tenant.toJSON(),
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/provider/tenants - Criar novo tenant
export const createTenant = async (req, res, next) => {
  try {
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const {
      name,
      tradeName,
      taxId,
      slug,
      email,
      phone,
      address,
      logo,
      primaryColor,
      secondaryColor,
      subscription,
      deployment,
      settings
    } = req.body;

    // Validações
    if (!name || !slug || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nome, slug e email são obrigatórios'
      });
    }

    // Verificar se slug já existe
    const existingSlug = await Organization.findOne({ where: { slug } });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        error: 'Slug já está em uso'
      });
    }

    // Buscar organização provider
    const provider = await Organization.findOne({ where: { type: 'provider' } });
    if (!provider) {
      return res.status(500).json({
        success: false,
        error: 'Organização Provider não encontrada'
      });
    }

    const tenant = await Organization.create({
      type: 'tenant',
      parentId: provider.id,
      name,
      tradeName,
      taxId,
      slug,
      email,
      phone,
      address,
      logo,
      primaryColor: primaryColor || '#3B82F6',
      secondaryColor: secondaryColor || '#10B981',
      subscription: subscription || {
        plan: 'professional',
        status: 'active',
        maxUsers: 50,
        maxClients: 100,
        maxStorageGB: 50,
        features: ['sla', 'automation', 'reports']
      },
      deployment: deployment || {
        type: 'saas',
        region: 'eu-west'
      },
      settings: settings || {
        language: 'pt',
        timezone: 'Europe/Lisbon',
        dateFormat: 'DD/MM/YYYY',
        allowSelfRegistration: true,
        requireApproval: false,
        sessionTimeout: 480,
        twoFactorAuth: false
      },
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Tenant criado com sucesso',
      tenant: tenant.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/provider/tenants/:id - Atualizar tenant
export const updateTenant = async (req, res, next) => {
  try {
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const { id } = req.params;
    const {
      name,
      tradeName,
      taxId,
      slug,
      email,
      phone,
      address,
      logo,
      primaryColor,
      secondaryColor,
      subscription,
      deployment,
      settings,
      isActive
    } = req.body;

    const tenant = await Organization.findOne({
      where: { id, type: 'tenant' }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Se mudou slug, verificar se não está em uso
    if (slug && slug !== tenant.slug) {
      const existingSlug = await Organization.findOne({
        where: { 
          slug,
          id: { [Op.ne]: id }
        }
      });

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          error: 'Slug já está em uso'
        });
      }
    }

    await tenant.update({
      name: name || tenant.name,
      tradeName,
      taxId,
      slug: slug || tenant.slug,
      email: email || tenant.email,
      phone,
      address,
      logo,
      primaryColor,
      secondaryColor,
      subscription: subscription !== undefined ? subscription : tenant.subscription,
      deployment: deployment !== undefined ? deployment : tenant.deployment,
      settings: settings !== undefined ? settings : tenant.settings,
      isActive: isActive !== undefined ? isActive : tenant.isActive
    });

    res.json({
      success: true,
      message: 'Tenant atualizado com sucesso',
      tenant: tenant.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/provider/tenants/:id/suspend - Suspender tenant
export const suspendTenant = async (req, res, next) => {
  try {
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const tenant = await Organization.findOne({
      where: { id, type: 'tenant' }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    await tenant.update({
      isActive: false,
      suspendedAt: new Date(),
      suspendedReason: reason || 'Suspenso pelo Provider'
    });

    res.json({
      success: true,
      message: 'Tenant suspenso com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/provider/tenants/:id/activate - Reativar tenant
export const activateTenant = async (req, res, next) => {
  try {
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const { id } = req.params;

    const tenant = await Organization.findOne({
      where: { id, type: 'tenant' }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    await tenant.update({
      isActive: true,
      suspendedAt: null,
      suspendedReason: null
    });

    res.json({
      success: true,
      message: 'Tenant reativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/provider/stats - Estatísticas globais do Provider
export const getGlobalStats = async (req, res, next) => {
  try {
    if (!['super-admin', 'provider-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const stats = {
      tenants: {
        total: await Organization.count({ where: { type: 'tenant' } }),
        active: await Organization.count({ where: { type: 'tenant', isActive: true } }),
        suspended: await Organization.count({ where: { type: 'tenant', isActive: false } })
      },
      users: {
        total: await User.count(),
        active: await User.count({ where: { isActive: true } }),
        byRole: {
          'tenant-admin': await User.count({ where: { role: 'tenant-admin' } }),
          'agent': await User.count({ where: { role: 'agent' } }),
          'tenant-manager': await User.count({ where: { role: 'tenant-manager' } })
        }
      },
      clients: {
        total: await Client.count(),
        active: await Client.count({ where: { isActive: true } })
      },
      clientUsers: {
        total: await ClientUser.count(),
        active: await ClientUser.count({ where: { isActive: true } })
      },
      tickets: {
        total: await Ticket.count(),
        open: await Ticket.count({
          where: { status: { [Op.in]: ['novo', 'em_progresso', 'aguardando_cliente'] } }
        }),
        resolved: await Ticket.count({
          where: { status: { [Op.in]: ['resolvido', 'fechado'] } }
        })
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


// ==================== PROVIDER USERS ====================

// GET /api/provider/users - Listar usuários Provider
export const getProviderUsers = async (req, res, next) => {
  try {
    const { search, isActive, role, page = 1, limit = 20 } = req.query;

    const where = {
      role: { [Op.in]: ['super-admin', 'provider-admin'] }
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
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

// GET /api/provider/users/:id - Obter usuário Provider por ID
export const getProviderUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['super-admin', 'provider-admin'] }
      },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/provider/users - Criar usuário Provider
export const createProviderUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Apenas super-admin pode criar outros super-admin
    if (role === 'super-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas Super Admin pode criar outros Super Admins'
      });
    }

    const user = await User.create({
      name,
      email,
      password, // O model deve fazer o hash
      role: role || 'provider-admin',
      phone,
      department,
      isActive: true
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/provider/users/:id - Atualizar usuário Provider
export const updateProviderUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, role, isActive } = req.body;

    const user = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['super-admin', 'provider-admin'] }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se email já está em uso por outro usuário
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { 
          email,
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

    // Apenas super-admin pode alterar role para super-admin
    if (role === 'super-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas Super Admin pode promover para Super Admin'
      });
    }

    await user.update({
      name: name || user.name,
      email: email || user.email,
      phone,
      department,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/provider/users/:id - Deletar usuário Provider
export const deleteProviderUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Não pode deletar a si mesmo
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode deletar sua própria conta'
      });
    }

    const user = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['super-admin', 'provider-admin'] }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Apenas super-admin pode deletar outros super-admin
    if (user.role === 'super-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas Super Admin pode deletar outros Super Admins'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/provider/users/:id/toggle-status - Toggle status do usuário
export const toggleProviderUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Não pode desativar a si mesmo
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode desativar sua própria conta'
      });
    }

    const user = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['super-admin', 'provider-admin'] }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      success: true,
      message: user.isActive ? 'Usuário ativado' : 'Usuário desativado',
      isActive: user.isActive
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/provider/users/:id/permissions - Atualizar permissões
export const updateProviderUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const user = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['super-admin', 'provider-admin'] }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    await user.update({ permissions });

    res.json({
      success: true,
      message: 'Permissões atualizadas com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/provider/users/:id/reset-password - Resetar senha
export const resetProviderUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['super-admin', 'provider-admin'] }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    
    await user.update({ password: tempPassword });

    // TODO: Enviar email com nova senha

    res.json({
      success: true,
      message: 'Senha resetada com sucesso',
      tempPassword // Em produção, enviar por email e não retornar aqui
    });
  } catch (error) {
    next(error);
  }
};
