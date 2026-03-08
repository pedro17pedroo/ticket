import crypto from 'crypto';
import { User, Organization, Department, OrganizationUser, ClientUser, Client } from '../models/index.js';
import { generateToken } from '../../middleware/auth.js';
import logger from '../../config/logger.js';
import { sendPasswordResetEmail } from '../../services/emailService.js';
import { debug, info, warn, error } from '../../utils/debugLogger.js';
import contextService from '../../services/contextService.js';

// Login Multi-Tabela (Provider, Org Staff, Client Users) com suporte a múltiplos contextos
export const login = async (req, res, next) => {
  try {
    const { email, password, portalType } = req.body;

    debug('🔐 Login attempt:', email, 'Portal:', portalType || 'agent-desktop');

    // Buscar todos os contextos disponíveis para este email com validação de senha
    const availableContexts = await contextService.getContextsForEmail(email, password);

    // Se não encontrou nenhum contexto válido (credenciais inválidas)
    if (!availableContexts || availableContexts.length === 0) {
      debug('❌ User not found or invalid password');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    debug(`✅ Found ${availableContexts.length} available context(s) for ${email}`);

    // Enriquecer contextos com preferências e último uso
    const enrichedContexts = await contextService.enrichContextsWithPreferences(availableContexts, email);

    // Filtrar contextos por portalType se especificado
    let filteredContexts = enrichedContexts;
    if (portalType) {
      const portalTypeToUserType = {
        'provider': 'provider',
        'organization': 'organization',
        'client': 'client'
      };

      const expectedUserType = portalTypeToUserType[portalType];
      
      if (expectedUserType) {
        filteredContexts = enrichedContexts.filter(ctx => ctx.userType === expectedUserType);
        
        if (filteredContexts.length === 0) {
          debug(`❌ Acesso negado: Nenhum contexto do tipo '${expectedUserType}' disponível para portal '${portalType}'`);
          return res.status(403).json({
            error: 'Você não tem permissão para acessar este portal',
            details: 'Por favor, utilize o portal apropriado para seu tipo de conta'
          });
        }
      }
    }

    // Se múltiplos contextos disponíveis, retornar para seleção
    if (filteredContexts.length > 1) {
      debug(`🔀 Multiple contexts available, requiring selection`);
      return res.json({
        requiresContextSelection: true,
        contexts: filteredContexts.map(ctx => ({
          id: ctx.id,
          type: ctx.type,
          userType: ctx.userType,
          contextId: ctx.contextId,
          contextType: ctx.contextType,
          organizationId: ctx.organizationId,
          organizationName: ctx.organizationName,
          organizationSlug: ctx.organizationSlug,
          clientId: ctx.clientId,
          clientName: ctx.clientName,
          name: ctx.name,
          email: ctx.email,
          role: ctx.role,
          avatar: ctx.avatar,
          isLastUsed: ctx.isLastUsed || false,
          isPreferred: ctx.isPreferred || false
        }))
      });
    }

    // Único contexto disponível - auto-selecionar e criar sessão
    const selectedContext = filteredContexts[0];
    debug(`✅ Single context available, auto-selecting: ${selectedContext.contextType}:${selectedContext.contextId}`);

    // Criar sessão de contexto
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    
    const session = await contextService.createContextSession(
      selectedContext.userId,
      selectedContext.userType,
      selectedContext.contextId,
      selectedContext.contextType,
      ipAddress,
      userAgent
    );

    // Atualizar último login no modelo apropriado
    const Model = selectedContext.userType === 'organization' ? OrganizationUser
      : selectedContext.userType === 'client' ? ClientUser
        : User;
    
    const userRecord = await Model.findByPk(selectedContext.userId);
    if (userRecord) {
      await userRecord.update({ lastLogin: new Date() });
    }

    // Carregar permissões do utilizador (RBAC)
    let permissions = selectedContext.permissions || [];
    debug('🔍 Carregando permissões para userId:', selectedContext.userId);
    debug('🔍 Contexto:', {
      userType: selectedContext.userType,
      organizationId: selectedContext.organizationId,
      clientId: selectedContext.clientId,
      role: selectedContext.role
    });
    
    try {
      const permissionService = (await import('../../services/permissionService.js')).default;
      permissions = await permissionService.getUserPermissions(selectedContext.userId);
      debug('✅ Permissões carregadas:', permissions);
      debug('✅ Total de permissões:', permissions.length);
    } catch (error) {
      // Ignora se RBAC não estiver inicializado
      logger.error('❌ Erro ao carregar permissões RBAC:', error.message);
      logger.error('❌ Stack:', error.stack);
      debug('⚠️ Usando permissões padrão do role');
    }

    // Gerar token JWT com informações de contexto e sessão
    const token = generateToken({
      id: selectedContext.userId,
      email: selectedContext.email,
      name: selectedContext.name,
      role: selectedContext.role,
      userType: selectedContext.userType,
      contextId: selectedContext.contextId,
      contextType: selectedContext.contextType,
      organizationId: selectedContext.organizationId,
      clientId: selectedContext.clientId,
      sessionId: session.id,
      permissions
    });

    // Preparar resposta com dados do usuário e contexto
    const userResponse = {
      id: selectedContext.userId,
      email: selectedContext.email,
      name: selectedContext.name,
      role: selectedContext.role,
      avatar: selectedContext.avatar,
      userType: selectedContext.userType,
      permissions
    };

    const contextResponse = {
      id: selectedContext.contextId,
      type: selectedContext.contextType,
      organizationId: selectedContext.organizationId,
      organizationName: selectedContext.organizationName,
      clientId: selectedContext.clientId,
      clientName: selectedContext.clientName,
      sessionId: session.id
    };

    // Registrar login no audit log
    await contextService.logContextSwitch(
      selectedContext.userId,
      null, // fromContext é null no login inicial
      selectedContext,
      ipAddress,
      userAgent
    );

    logger.info(`Login bem-sucedido: ${selectedContext.email} (${selectedContext.userType}) no portal ${portalType || 'agent-desktop'}`);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userResponse,
      context: contextResponse
    });
  } catch (error) {
    next(error);
  }
};
// Selecionar contexto específico após login com múltiplos contextos
export const selectContext = async (req, res, next) => {
  try {
    const { email, password, contextId, contextType } = req.body;

    debug('🔀 Context selection attempt:', email, 'Context:', contextType, contextId);

    // Validar parâmetros obrigatórios
    if (!email || !password || !contextId || !contextType) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios ausentes',
        details: 'email, password, contextId e contextType são obrigatórios'
      });
    }

    // Validar contextType
    if (!['organization', 'client'].includes(contextType)) {
      return res.status(400).json({
        error: 'Tipo de contexto inválido',
        details: 'contextType deve ser "organization" ou "client"'
      });
    }

    // Validar acesso ao contexto selecionado
    const contextData = await contextService.validateContextAccess(email, contextId, contextType);

    if (!contextData) {
      debug('❌ Context access denied or not found');
      return res.status(403).json({
        error: 'Acesso negado',
        details: 'Você não tem permissão para acessar este contexto'
      });
    }

    // Validar senha
    const Model = contextType === 'organization' ? OrganizationUser : ClientUser;
    const userRecord = await Model.scope('withPassword').findByPk(contextData.userId);

    if (!userRecord) {
      debug('❌ User record not found');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isPasswordValid = await userRecord.comparePassword(password);
    if (!isPasswordValid) {
      debug('❌ Invalid password');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    debug('✅ Context access validated, creating session');

    // Criar sessão de contexto
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const session = await contextService.createContextSession(
      contextData.userId,
      contextData.userType,
      contextData.contextId,
      contextData.contextType,
      ipAddress,
      userAgent
    );

    // Atualizar último login
    await userRecord.update({ lastLogin: new Date() });

    // Carregar permissões do utilizador (RBAC)
    let permissions = contextData.permissions || [];
    try {
      const permissionService = (await import('../../services/permissionService.js')).default;
      permissions = await permissionService.getUserPermissions(contextData.userId);
      debug('✅ Permissões carregadas:', permissions);
    } catch (error) {
      // Ignora se RBAC não estiver inicializado
      logger.warn('Não foi possível carregar permissões RBAC:', error.message);
      debug('⚠️ Usando permissões padrão do role');
    }

    // Gerar token JWT com informações de contexto e sessão
    const token = generateToken({
      id: contextData.userId,
      email: contextData.email,
      name: contextData.name,
      role: contextData.role,
      userType: contextData.userType,
      contextId: contextData.contextId,
      contextType: contextData.contextType,
      organizationId: contextData.organizationId,
      clientId: contextData.clientId,
      sessionId: session.id,
      permissions
    });

    // Preparar resposta com dados do usuário e contexto
    const userResponse = {
      id: contextData.userId,
      email: contextData.email,
      name: contextData.name,
      role: contextData.role,
      avatar: userRecord.avatar,
      userType: contextData.userType,
      permissions
    };

    const contextResponse = {
      id: contextData.contextId,
      type: contextData.contextType,
      organizationId: contextData.organizationId,
      organizationName: contextData.organizationName,
      clientId: contextData.clientId,
      clientName: contextData.clientName,
      sessionId: session.id
    };

    // Registrar seleção de contexto no audit log
    await contextService.logContextSwitch(
      contextData.userId,
      null, // fromContext é null na seleção inicial
      contextData,
      ipAddress,
      userAgent
    );

    // Armazenar como contexto preferido
    await contextService.setPreferredContext(email, contextData.contextId, contextData.contextType);

    logger.info(`Contexto selecionado: ${contextData.email} (${contextData.userType}) - ${contextData.contextType}:${contextData.contextId}`);

    res.json({
      message: 'Contexto selecionado com sucesso',
      token,
      user: userResponse,
      context: contextResponse
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

    // Sincronizar senha em todos os contextos do usuário
    try {
      const { syncPasswordAcrossContexts } = await import('../../utils/passwordSync.js');
      await user.reload();
      await syncPasswordAcrossContexts(email, user.password);
      debug(`✅ Senha sincronizada em todos os contextos para ${email}`);
    } catch (syncError) {
      logger.error('Erro ao sincronizar senha entre contextos:', syncError);
    }

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
    const { id, userType, email } = req.user;

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

    // Sincronizar senha em todos os contextos do usuário (OrganizationUser e ClientUser)
    try {
      const { syncPasswordAcrossContexts } = await import('../../utils/passwordSync.js');
      const userEmail = email || user.email;
      
      // Buscar o hash atualizado
      await user.reload();
      await syncPasswordAcrossContexts(userEmail, user.password);
      
      debug(`✅ Senha sincronizada em todos os contextos para ${userEmail}`);
    } catch (syncError) {
      // Log do erro mas não falha a operação principal
      logger.error('Erro ao sincronizar senha entre contextos:', syncError);
    }

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/switch-context - Trocar contexto durante sessão ativa
export const switchContext = async (req, res, next) => {
  try {
    const { contextId, contextType } = req.body;
    const currentUser = req.user;

    debug('🔄 Context switch attempt:', currentUser.email, 'To:', contextType, contextId);

    // Validar parâmetros obrigatórios
    if (!contextId || !contextType) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios ausentes',
        details: 'contextId e contextType são obrigatórios'
      });
    }

    // Validar contextType
    if (!['organization', 'client'].includes(contextType)) {
      return res.status(400).json({
        error: 'Tipo de contexto inválido',
        details: 'contextType deve ser "organization" ou "client"'
      });
    }

    // Validar acesso ao novo contexto
    const newContextData = await contextService.validateContextAccess(
      currentUser.email,
      contextId,
      contextType
    );

    if (!newContextData) {
      debug('❌ Context access denied or not found');
      return res.status(403).json({
        error: 'Acesso negado',
        details: 'Você não tem permissão para acessar este contexto'
      });
    }

    debug('✅ New context access validated');

    // Extrair informações do contexto atual
    const fromContext = {
      contextId: currentUser.contextId,
      contextType: currentUser.contextType,
      userId: currentUser.id,
      userType: currentUser.userType
    };

    // Invalidar sessão atual se existir sessionId
    if (currentUser.sessionId) {
      await contextService.invalidateContextSession(currentUser.sessionId);
      debug('✅ Current session invalidated:', currentUser.sessionId);
    }

    // Criar nova sessão para o novo contexto
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const newSession = await contextService.createContextSession(
      newContextData.userId,
      newContextData.userType,
      newContextData.contextId,
      newContextData.contextType,
      ipAddress,
      userAgent
    );

    debug('✅ New session created:', newSession.id);

    // Atualizar último login no modelo apropriado
    const Model = newContextData.userType === 'organization' ? OrganizationUser : ClientUser;
    const userRecord = await Model.findByPk(newContextData.userId);
    if (userRecord) {
      await userRecord.update({ lastLogin: new Date() });
    }

    // Carregar permissões do utilizador (RBAC)
    let permissions = newContextData.permissions || [];
    try {
      const permissionService = (await import('../../services/permissionService.js')).default;
      permissions = await permissionService.getUserPermissions(newContextData.userId);
      debug('✅ Permissões carregadas:', permissions);
    } catch (error) {
      // Ignora se RBAC não estiver inicializado
      logger.warn('Não foi possível carregar permissões RBAC:', error.message);
      debug('⚠️ Usando permissões padrão do role');
    }

    // Gerar novo token JWT com informações do novo contexto
    const token = generateToken({
      id: newContextData.userId,
      email: newContextData.email,
      name: newContextData.name,
      role: newContextData.role,
      userType: newContextData.userType,
      contextId: newContextData.contextId,
      contextType: newContextData.contextType,
      organizationId: newContextData.organizationId,
      clientId: newContextData.clientId,
      sessionId: newSession.id,
      permissions
    });

    // Preparar resposta com dados do usuário e contexto
    const userResponse = {
      id: newContextData.userId,
      email: newContextData.email,
      name: newContextData.name,
      role: newContextData.role,
      avatar: userRecord?.avatar,
      userType: newContextData.userType,
      permissions
    };

    const contextResponse = {
      id: newContextData.contextId,
      type: newContextData.contextType,
      organizationId: newContextData.organizationId,
      organizationName: newContextData.organizationName,
      clientId: newContextData.clientId,
      clientName: newContextData.clientName,
      sessionId: newSession.id
    };

    // Registrar troca de contexto no audit log
    await contextService.logContextSwitch(
      newContextData.userId,
      fromContext,
      newContextData,
      ipAddress,
      userAgent
    );

    logger.info(`Troca de contexto: ${currentUser.email} de ${fromContext.contextType}:${fromContext.contextId} para ${newContextData.contextType}:${newContextData.contextId}`);

    res.json({
      message: 'Contexto alterado com sucesso',
      token,
      user: userResponse,
      context: contextResponse
    });
  } catch (error) {
    next(error);
  }
};
// GET /auth/contexts - Listar contextos disponíveis para usuário autenticado
export const listUserContexts = async (req, res, next) => {
  try {
    const currentUser = req.user;

    debug('📋 Listing contexts for user:', currentUser.email);

    // Buscar todos os contextos disponíveis para o email do usuário (sem validação de senha)
    const availableContexts = await contextService.getContextsForEmail(currentUser.email);

    if (!availableContexts || availableContexts.length === 0) {
      debug('⚠️ No contexts found for user');
      return res.json({ contexts: [] });
    }

    debug(`✅ Found ${availableContexts.length} context(s) for ${currentUser.email}`);

    // Marcar o contexto atual como isLastUsed
    const contextsWithFlag = availableContexts.map(ctx => ({
      id: ctx.id,
      type: ctx.type,
      userType: ctx.userType,
      contextId: ctx.contextId,
      contextType: ctx.contextType,
      organizationId: ctx.organizationId,
      organizationName: ctx.organizationName,
      organizationSlug: ctx.organizationSlug,
      clientId: ctx.clientId,
      clientName: ctx.clientName,
      name: ctx.name,
      email: ctx.email,
      role: ctx.role,
      avatar: ctx.avatar,
      isLastUsed: ctx.contextId === currentUser.contextId && ctx.contextType === currentUser.contextType
    }));

    res.json({
      contexts: contextsWithFlag,
      currentContext: {
        contextId: currentUser.contextId,
        contextType: currentUser.contextType
      }
    });
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


// GET /auth/contexts/history - Obter histórico de trocas de contexto do usuário
export const getContextHistory = async (req, res, next) => {
  try {
    const { email } = req.user;
    const { action, startDate, endDate, limit = 50, offset = 0 } = req.query;

    debug('📜 Fetching context history for:', email);

    // Buscar histórico de trocas de contexto
    const history = await contextService.getContextSwitchHistory(email, {
      action,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      history: history.logs,
      total: history.total,
      hasMore: history.hasMore,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar histórico de contexto:', error);
    next(error);
  }
};

// GET /auth/contexts/audit - Obter logs de auditoria de contexto (admin only)
export const getContextAudit = async (req, res, next) => {
  try {
    const { role } = req.user;
    const { 
      email, 
      action, 
      startDate, 
      endDate, 
      limit = 50, 
      offset = 0 
    } = req.query;

    // Verificar se o usuário é admin
    if (!['org-admin', 'super-admin', 'provider-admin'].includes(role)) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Apenas administradores podem acessar logs de auditoria'
      });
    }

    debug('🔍 Fetching context audit logs');

    // Se email não foi especificado, buscar todos os logs (admin)
    const targetEmail = email || req.user.email;

    const auditLogs = await contextService.getContextSwitchHistory(targetEmail, {
      action,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      logs: auditLogs.logs,
      total: auditLogs.total,
      hasMore: auditLogs.hasMore,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar logs de auditoria:', error);
    next(error);
  }
};
