import { User, Organization, Department, OrganizationUser, ClientUser, Client } from '../models/index.js';
import { generateToken } from '../../middleware/auth.js';
import logger from '../../config/logger.js';

// Login Multi-Tabela (Provider, Org Staff, Client Users)
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    let user = null;
    let userType = null;
    let organization = null;
    let client = null;

    // 1. Tentar login como Provider SaaS User (tabela users)
    user = await User.scope('withPassword').findOne({ 
      where: { email },
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'slug', 'logo', 'primaryColor', 'secondaryColor']
      }]
    });

    if (user && user.isActive) {
      const isPasswordValid = await user.comparePassword(password);
      if (isPasswordValid) {
        userType = 'provider';
        organization = user.organization;
        console.log('✅ Login como Provider SaaS User');
      } else {
        user = null;
      }
    }

    // 2. Se não encontrou, tentar como Organization User (tenant staff)
    if (!user) {
      user = await OrganizationUser.scope('withPassword').findOne({ 
        where: { email },
        include: [{
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'logo', 'primaryColor', 'secondaryColor']
        }]
      });

      if (user && user.isActive) {
        const isPasswordValid = await user.comparePassword(password);
        if (isPasswordValid) {
          userType = 'organization';
          organization = user.organization;
          console.log('✅ Login como Organization User (Tenant Staff)');
        } else {
          user = null;
        }
      }
    }

    // 3. Se não encontrou, tentar como Client User (empresa cliente)
    if (!user) {
      user = await ClientUser.scope('withPassword').findOne({ 
        where: { email },
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name', 'slug', 'logo', 'primaryColor', 'secondaryColor']
          },
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'tradeName']
          }
        ]
      });

      if (user && user.isActive) {
        const isPasswordValid = await user.comparePassword(password);
        if (isPasswordValid) {
          userType = 'client';
          organization = user.organization;
          client = user.client;
          console.log('✅ Login como Client User');
        } else {
          user = null;
        }
      }
    }

    // Se não encontrou em nenhuma tabela ou senha inválida
    if (!user) {
      console.log('❌ User not found or invalid password');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await user.update({ lastLogin: new Date() });

    // Gerar token com userType
    const token = generateToken({
      ...user.toJSON(),
      userType,
      clientId: client?.id || null
    });

    // Remover senha do retorno
    const userData = {
      ...user.toJSON(),
      userType,
      organization,
      client
    };

    logger.info(`Login bem-sucedido: ${user.email} (${userType})`);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// Registro de cliente (self-registration)
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, organizationId } = req.body;

    // Buscar organização (ou usar padrão)
    let orgId = organizationId;
    if (!orgId) {
      const defaultOrg = await Organization.findOne({ 
        where: { slug: process.env.DEFAULT_ORG_SLUG || 'empresa-demo' }
      });
      if (!defaultOrg) {
        return res.status(400).json({ error: 'Organização não encontrada' });
      }
      orgId = defaultOrg.id;
    }

    // Verificar se email já existe NESTA organização
    const existingUser = await User.findOne({ 
      where: { 
        email,
        organizationId: orgId 
      } 
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Email já cadastrado nesta organização' });
    }

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password,
      phone,
      organizationId: orgId,
      role: 'cliente-org'
    });

    // Gerar token
    const token = generateToken(user);

    logger.info(`Novo registro: ${user.email}`);

    res.status(201).json({
      message: 'Cadastro realizado com sucesso',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Obter perfil do usuário logado
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'logo', 'primaryColor', 'secondaryColor']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    // Carregar permissões do utilizador (se tabelas RBAC existirem)
    let permissions = [];
    try {
      const permissionService = (await import('../../services/permissionService.js')).default;
      permissions = await permissionService.getUserPermissions(req.user.id);
    } catch (error) {
      // Se tabelas RBAC não existirem ainda, ignorar
      if (!error.message?.includes('relation') || !error.message?.includes('does not exist')) {
        throw error; // Re-lançar se for outro erro
      }
    }

    res.json({ 
      user: {
        ...user.toJSON(),
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar perfil
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, settings } = req.body;
    const user = await User.findByPk(req.user.id);

    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      settings: settings ? { ...user.settings, ...settings } : user.settings
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Alterar senha
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Buscar usuário com senha
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualizar senha (será hasheada pelo hook)
    await user.update({ password: newPassword });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users - Listar usuários da organização
export const getUsers = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const users = await User.findAll({
      where: { 
        organizationId,
        isActive: true,
        role: ['admin-org', 'agente'] // Não incluir clientes
      },
      attributes: ['id', 'name', 'email', 'role'],
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    next(error);
  }
};
