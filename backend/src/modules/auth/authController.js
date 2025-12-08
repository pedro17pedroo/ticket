import crypto from 'crypto';
import { User, Organization, Department, OrganizationUser, ClientUser, Client } from '../models/index.js';
import { generateToken } from '../../middleware/auth.js';
import logger from '../../config/logger.js';
import { sendPasswordResetEmail } from '../../services/emailService.js';

// Login Multi-Tabela (Provider, Org Staff, Client Users)
export const login = async (req, res, next) => {
  try {
    const { email, password, portalType } = req.body;

    console.log('🔐 Login attempt:', email, 'Portal:', portalType || 'agent-desktop');

    let user = null;
    let userType = null;
    let organization = null;
    let client = null;

    // Determinar qual tabela buscar baseado no portalType
    // portalType: 'provider' = users, 'organization' = organization_users, 'client' = client_users
    // Se não especificar portalType, assume Agent Desktop (pode logar qualquer tipo)

    const searchOrder = portalType
      ? (portalType === 'provider' ? ['provider']
        : portalType === 'organization' ? ['organization']
          : portalType === 'client' ? ['client']
            : ['provider', 'organization', 'client']) // fallback
      : ['provider', 'organization', 'client']; // Agent Desktop - busca em todas

    for (const type of searchOrder) {
      if (user) break; // Já encontrou usuário válido

      if (type === 'provider') {
        const foundUser = await User.scope('withPassword').findOne({
          where: { email },
          include: [{
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name', 'slug', 'logo', 'primaryColor', 'secondaryColor']
          }]
        });

        if (foundUser && foundUser.isActive) {
          const isPasswordValid = await foundUser.comparePassword(password);
          if (isPasswordValid) {
            user = foundUser;
            userType = 'provider';
            organization = foundUser.organization;
            console.log('✅ Login como Provider SaaS User');
          }
        }
      }

      if (type === 'organization') {
        const foundUser = await OrganizationUser.scope('withPassword').findOne({
          where: { email },
          include: [{
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name', 'slug', 'logo', 'primaryColor', 'secondaryColor']
          }]
        });

        if (foundUser && foundUser.isActive) {
          const isPasswordValid = await foundUser.comparePassword(password);
          if (isPasswordValid) {
            user = foundUser;
            userType = 'organization';
            organization = foundUser.organization;
            console.log('✅ Login como Organization User (Tenant Staff)');
          }
        }
      }

      if (type === 'client') {
        const foundUser = await ClientUser.scope('withPassword').findOne({
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

        if (foundUser && foundUser.isActive) {
          const isPasswordValid = await foundUser.comparePassword(password);
          if (isPasswordValid) {
            user = foundUser;
            userType = 'client';
            organization = foundUser.organization;
            client = foundUser.client;
            console.log('✅ Login como Client User', {
              userId: foundUser.id,
              clientId: foundUser.clientId,
              clientFromInclude: client?.id,
              organizationId: foundUser.organizationId
            });
          }
        }
      }
    }

    // Se não encontrou em nenhuma tabela ou senha inválida
    if (!user) {
      console.log('❌ User not found or invalid password');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // VALIDAÇÃO CRÍTICA: Verificar se o usuário pode acessar este portal
    if (portalType) {
      const portalTypeToUserType = {
        'provider': 'provider',
        'organization': 'organization',
        'client': 'client'
      };

      const expectedUserType = portalTypeToUserType[portalType];

      if (expectedUserType && userType !== expectedUserType) {
        console.log(`❌ Acesso negado: Usuário tipo '${userType}' tentando acessar portal '${portalType}'`);
        return res.status(403).json({
          error: 'Você não tem permissão para acessar este portal',
          details: 'Por favor, utilize o portal apropriado para seu tipo de conta'
        });
      }
    }

    // Atualizar último login
    await user.update({ lastLogin: new Date() });

    // Gerar token com userType (garantir que userType não seja sobrescrito)
    const userData = user.toJSON();
    const token = generateToken({
      ...userData,
      userType,  // Força o userType correto
      clientId: client?.id || user.clientId || null
    });

    // Remover senha do retorno
    const userResponse = {
      ...user.toJSON(),
      userType,
      organization,
      client
    };

    logger.info(`Login bem-sucedido: ${user.email} (${userType}) no portal ${portalType || 'agent-desktop'}`);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

const findUserForPasswordReset = async (email, portalType) => {
  const normalizedType = portalType?.toLowerCase();

  const searchOrder = normalizedType === 'client'
    ? ['client']
    : normalizedType === 'provider'
      ? ['provider']
      : normalizedType === 'organization'
        ? ['organization']
        : ['provider', 'organization', 'client'];

  for (const type of searchOrder) {
    if (type === 'provider') {
      const user = await User.findOne({ where: { email } });
      if (user) return { user, userType: 'provider' };
    }

    if (type === 'organization') {
      const user = await OrganizationUser.findOne({ where: { email } });
      if (user) return { user, userType: 'organization' };
    }

    if (type === 'client') {
      const user = await ClientUser.findOne({ where: { email } });
      if (user) return { user, userType: 'client' };
    }
  }

  return { user: null, userType: null };
};

const maskResponse = () => ({
  message: 'Se o email existir, enviamos instruções para redefinir a senha.'
});

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email, portalType } = req.body;

    const { user, userType } = await findUserForPasswordReset(email, portalType);

    if (!user) {
      logger.warn(`Pedido de recuperação para email inexistente: ${email}`);
      return res.json(maskResponse());
    }

    if (user.isActive === false) {
      logger.warn(`Pedido de recuperação para usuário inativo: ${email}`);
      return res.json(maskResponse());
    }

    const token = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutos

    await user.update({
      passwordResetToken: token,
      passwordResetExpires: expiresAt
    });

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token,
      portalType: userType
    });

    logger.info(`Token de recuperação gerado para ${email} (${userType})`);
    res.json(maskResponse());
  } catch (error) {
    next(error);
  }
};

export const validatePasswordResetToken = async (req, res, next) => {
  try {
    const { email, token, portalType } = req.body;

    const { user, userType } = await findUserForPasswordReset(email, portalType);

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    if (user.passwordResetToken !== token.toUpperCase()) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    if (new Date(user.passwordResetExpires) < new Date()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    res.json({ success: true, userType });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordWithToken = async (req, res, next) => {
  try {
    const { email, token, newPassword, portalType } = req.body;

    const { user } = await findUserForPasswordReset(email, portalType);

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    if (user.passwordResetToken !== token.toUpperCase()) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    if (new Date(user.passwordResetExpires) < new Date()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    await user.update({
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    logger.info(`Senha redefinida via token para ${email}`);
    res.json({ success: true, message: 'Senha redefinida com sucesso' });
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
    const { id, userType } = req.user;

    // Seleciona dinamicamente o modelo e os relacionamentos conforme o tipo de usuário do token
    let Model = User;
    let include = [
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
    ];

    // Ajusta include corretamente de acordo com o tipo
    if (userType === 'provider') {
      // Provider SaaS User (tabela User)
      Model = User;
      include = [
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
      ];
    } else if (userType === 'organization') {
      // Staff da organização (tabela OrganizationUser)
      Model = OrganizationUser;
      include = [
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
      ];
    } else if (userType === 'client') {
      // Usuário cliente B2B (tabela ClientUser)
      Model = ClientUser;
      include = [
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
      ];
    }

    const userRecord = await Model.findByPk(id, { include });
    if (!userRecord) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Carrega permissões (RBAC). Para tipos que não usam RBAC via tabela User, retornará [].
    let permissions = [];
    try {
      const permissionService = (await import('../../services/permissionService.js')).default;
      permissions = await permissionService.getUserPermissions(id);
    } catch (error) {
      // Ignora se RBAC não estiver inicializado; relança outros erros reais
      if (!error.message?.includes('relation') || !error.message?.includes('does not exist')) {
        throw error;
      }
    }

    res.json({
      user: {
        ...userRecord.toJSON(),
        userType,
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
    const { id, userType } = req.user;

    // Seleciona a tabela correta para atualização de perfil
    const Model = userType === 'organization' ? OrganizationUser
      : userType === 'client' ? ClientUser
        : User; // provider (default)

    const user = await Model.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Monta os dados de atualização; somente provider tem settings aqui
    const updateData = {
      name: typeof name === 'string' && name.trim() ? name : user.name,
      phone: typeof phone === 'string' && phone.trim() ? phone : user.phone
    };

    if (userType === 'provider' && settings && typeof settings === 'object') {
      updateData.settings = user.settings ? { ...user.settings, ...settings } : settings;
    }

    await user.update(updateData);

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
    const { id, userType } = req.user;

    // Determina a tabela correta e garante o escopo com senha
    const ScopedModel = userType === 'organization'
      ? OrganizationUser.scope('withPassword')
      : userType === 'client'
        ? ClientUser.scope('withPassword')
        : User.scope('withPassword');

    const user = await ScopedModel.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verifica a senha atual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza a senha (hash aplicado via hooks do modelo)
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

    const users = await OrganizationUser.findAll({
      where: {
        organizationId,
        isActive: true,
        role: ['org-admin', 'agent', 'org-manager', 'technician'] // Roles corretos de OrganizationUser
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
