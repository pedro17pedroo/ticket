import { User, Organization, Department } from '../models/index.js';
import { generateToken } from '../../middleware/auth.js';
import logger from '../../config/logger.js';

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário com senha
    const user = await User.scope('withPassword').findOne({ 
      where: { email },
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'slug', 'logo', 'primaryColor', 'secondaryColor']
      }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await user.update({ lastLogin: new Date() });

    // Gerar token
    const token = generateToken(user);

    // Remover senha do retorno
    const userData = user.toJSON();

    logger.info(`Login bem-sucedido: ${user.email}`);

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

    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

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

    res.json({ user });
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
    const user = await User.scope('withPassword').findByPk(req.user.id);

    // Verificar senha atual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualizar senha
    await user.update({ password: newPassword });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Scope para incluir senha (usado apenas no login)
User.addScope('withPassword', {
  attributes: { include: ['password'] }
});
