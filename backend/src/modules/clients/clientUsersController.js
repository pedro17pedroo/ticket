import { User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';

// GET /api/clients/:clientId/users - Organização listar utilizadores de um cliente
export const getClientUsers = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const organizationId = req.user.organizationId;

    // Verificar se o cliente existe e pertence à organização
    const client = await User.findOne({
      where: { 
        id: clientId, 
        organizationId,
        role: 'cliente-org',
        clientId: null  // Deve ser uma empresa cliente, não um utilizador
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Buscar todos os utilizadores desta empresa cliente específica
    const users = await User.findAll({
      where: {
        organizationId,
        role: 'cliente-org',
        clientId: clientId // Apenas users desta empresa cliente
      },
      attributes: [
        'id', 'name', 'email', 'phone',
        'isActive', 'createdAt', 'lastLogin', 'settings', 'clientId'
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      users,
      client: {
        id: client.id,
        name: client.name,
        email: client.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/clients/:clientId/users - Organização criar utilizador para um cliente
export const createClientUser = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { name, email, phone, password, isAdmin } = req.body;
    const organizationId = req.user.organizationId;

    // Verificar se o cliente existe
    const client = await User.findOne({
      where: { 
        id: clientId, 
        organizationId,
        role: 'cliente-org',
        clientId: null  // Deve ser uma empresa cliente, não um utilizador
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Verificar se email já existe
    const existingUser = await User.findOne({
      where: { email, organizationId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso nesta organização'
      });
    }

    // Criar utilizador pertencente a esta empresa cliente
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'cliente-org',
      organizationId,
      clientId: clientId, // Pertence a esta empresa cliente
      isActive: true,
      settings: {
        notifications: true,
        emailNotifications: true,
        theme: 'light',
        language: 'pt',
        clientAdmin: isAdmin || false
      }
    });

    const userData = user.toJSON();
    delete userData.password;

    logger.info(`Organização criou utilizador cliente: ${user.email} (${organizationId})`);

    res.status(201).json({
      success: true,
      message: 'Utilizador criado com sucesso',
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:clientId/users/:userId - Organização atualizar utilizador de um cliente
export const updateClientUser = async (req, res, next) => {
  try {
    const { clientId, userId } = req.params;
    const { name, email, phone, isActive, isAdmin } = req.body;
    const organizationId = req.user.organizationId;

    // Verificar se o cliente existe
    const client = await User.findOne({
      where: { 
        id: clientId, 
        organizationId,
        role: 'cliente-org',
        clientId: null  // Deve ser uma empresa cliente
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Buscar utilizador
    const user = await User.findOne({
      where: {
        id: userId,
        organizationId,
        role: 'cliente-org'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado'
      });
    }

    // Verificar email duplicado
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          organizationId,
          id: { [Op.ne]: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso nesta organização'
        });
      }
    }

    // Atualizar settings se isAdmin foi fornecido
    const updatedSettings = isAdmin !== undefined 
      ? { ...user.settings, clientAdmin: isAdmin }
      : user.settings;

    await user.update({
      name,
      email,
      phone,
      isActive,
      settings: updatedSettings
    });

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: 'Utilizador atualizado com sucesso',
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/clients/:clientId/users/:userId - Organização desativar utilizador de um cliente
export const deleteClientUser = async (req, res, next) => {
  try {
    const { clientId, userId } = req.params;
    const organizationId = req.user.organizationId;

    // Verificar se o cliente existe
    const client = await User.findOne({
      where: { 
        id: clientId, 
        organizationId,
        role: 'cliente-org',
        clientId: null  // Deve ser uma empresa cliente
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Buscar utilizador
    const user = await User.findOne({
      where: {
        id: userId,
        organizationId,
        role: 'cliente-org'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado'
      });
    }

    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'Utilizador desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:clientId/users/:userId/activate - Organização reativar utilizador
export const activateClientUser = async (req, res, next) => {
  try {
    const { clientId, userId } = req.params;
    const organizationId = req.user.organizationId;

    // Verificar se o cliente existe
    const client = await User.findOne({
      where: { 
        id: clientId, 
        organizationId,
        role: 'cliente-org',
        clientId: null  // Deve ser uma empresa cliente
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    const user = await User.findOne({
      where: {
        id: userId,
        organizationId,
        role: 'cliente-org'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado'
      });
    }

    await user.update({ isActive: true });

    res.json({
      success: true,
      message: 'Utilizador reativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:clientId/users/:userId/reset-password - Organização redefinir senha
export const resetClientUserPassword = async (req, res, next) => {
  try {
    const { clientId, userId } = req.params;
    const { newPassword } = req.body;
    const organizationId = req.user.organizationId;

    // Verificar se o cliente existe
    const client = await User.findOne({
      where: { 
        id: clientId, 
        organizationId,
        role: 'cliente-org',
        clientId: null  // Deve ser uma empresa cliente
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    const user = await User.findOne({
      where: {
        id: userId,
        organizationId,
        role: 'cliente-org'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado'
      });
    }

    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
