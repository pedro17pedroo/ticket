import Joi from 'joi';

// Middleware de validação genérico
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Erro de validação',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};

// Schemas de validação comuns
export const schemas = {
  // Autenticação
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  register: Joi.object({
    name: Joi.string().min(3).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional(),
    organizationId: Joi.string().uuid().optional()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(3).max(255).optional(),
    phone: Joi.string().optional(),
    settings: Joi.object().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  // Tickets
  createTicket: Joi.object({
    subject: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(10).required(),
    priority: Joi.string().default('media'),
    type: Joi.string().default('suporte'),
    categoryId: Joi.string().uuid().optional(),
    departmentId: Joi.string().uuid().optional()
  }),

  updateTicket: Joi.object({
    subject: Joi.string().min(5).max(255).optional(),
    description: Joi.string().min(10).optional(),
    status: Joi.string().valid('novo', 'em_progresso', 'aguardando_cliente', 'resolvido', 'fechado').optional(),
    priority: Joi.string().optional(),
    assigneeId: Joi.string().uuid().allow(null).optional(),
    departmentId: Joi.string().uuid().allow(null).optional()
  }),

  // Comentários
  createComment: Joi.object({
    content: Joi.string().min(1).required(),
    isPrivate: Joi.boolean().default(false),
    isInternal: Joi.boolean().default(false)
  }),

  // Departamentos
  createDepartment: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('', null).optional(),
    code: Joi.string().allow('', null).max(20).optional(),
    email: Joi.string().email().allow('', null).optional(),
    directionId: Joi.string().uuid().required(), // Obrigatório desde hierarquia
    managerId: Joi.string().uuid().allow('', null).optional(),
    isActive: Joi.boolean().optional()
  }),

  // Categorias
  createCategory: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().optional(),
    icon: Joi.string().optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
  }),

  // SLAs
  createSLA: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().optional(),
    priority: Joi.string().required(),
    responseTimeMinutes: Joi.number().integer().min(1).required(),
    resolutionTimeMinutes: Joi.number().integer().min(1).required()
  }),

  // Base de Conhecimento
  createArticle: Joi.object({
    title: Joi.string().min(5).max(255).required(),
    content: Joi.string().min(10).required(),
    excerpt: Joi.string().optional(),
    categoryId: Joi.string().uuid().optional(),
    tags: Joi.array().items(Joi.string()).default([]),
    isPublished: Joi.boolean().default(false)
  }),

  // Bolsa de Horas
  createHoursBank: Joi.object({
    clientId: Joi.string().uuid().required(),
    totalHours: Joi.number().min(0).required(),
    packageType: Joi.string().optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().optional(),
    notes: Joi.string().optional()
  }),

  createHoursTransaction: Joi.object({
    hoursBankId: Joi.string().uuid().required(),
    ticketId: Joi.string().uuid().optional(),
    hours: Joi.number().min(0).required(),
    type: Joi.string().valid('adicao', 'consumo', 'ajuste').required(),
    description: Joi.string().required()
  }),

  // Prioridades
  createPriority: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
    order: Joi.number().integer().optional()
  }),

  updatePriority: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    order: Joi.number().integer().optional(),
    isActive: Joi.boolean().optional()
  }),

  // Tipos
  createType: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('').optional(),
    icon: Joi.string().allow('').optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
    order: Joi.number().integer().optional()
  }),

  updateType: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().allow('').optional(),
    icon: Joi.string().allow('').optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    order: Joi.number().integer().optional(),
    isActive: Joi.boolean().optional()
  }),

  // Direções
  createDirection: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('').optional(),
    code: Joi.string().max(20).optional(),
    managerId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional()
  }),

  updateDirection: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().allow('').optional(),
    code: Joi.string().max(20).optional(),
    managerId: Joi.string().uuid().allow(null).optional(),
    isActive: Joi.boolean().optional()
  }),

  // Departamentos
  updateDepartment: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().allow('', null).optional(),
    code: Joi.string().allow('', null).max(20).optional(),
    email: Joi.string().email().allow('', null).optional(),
    directionId: Joi.string().uuid().required(), // Obrigatório - não pode remover direção
    managerId: Joi.string().uuid().allow('', null).optional(),
    isActive: Joi.boolean().optional()
  }),

  // Secções
  createSection: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('').optional(),
    code: Joi.string().max(20).optional(),
    departmentId: Joi.string().uuid().required(),
    managerId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional()
  }),

  updateSection: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().allow('').optional(),
    code: Joi.string().max(20).optional(),
    departmentId: Joi.string().uuid().optional(),
    managerId: Joi.string().uuid().allow(null).optional(),
    isActive: Joi.boolean().optional()
  }),

  // Clientes
  createClient: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('').optional(),
    password: Joi.string().min(6).required()
  }),

  updateClient: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('').optional(),
    isActive: Joi.boolean().optional()
  }),

  // Usuários
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null).optional(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(
      'super-admin',
      'provider-admin',
      'admin-org',
      'tenant-admin',
      'tenant-manager',
      'agent',
      'client-admin',
      'client-user',
      'client-manager'
    ).optional(),
    departmentId: Joi.string().uuid().allow('', null).optional(),
    sectionId: Joi.string().uuid().allow('', null).optional(),
    directionId: Joi.string().uuid().allow('', null).optional()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('', null).optional(),
    role: Joi.string().valid(
      'super-admin',
      'provider-admin',
      'admin-org',
      'tenant-admin',
      'tenant-manager',
      'agent',
      'client-admin',
      'client-user',
      'client-manager'
    ).optional(),
    departmentId: Joi.string().uuid().allow('', null).optional(),
    sectionId: Joi.string().uuid().allow('', null).optional(),
    directionId: Joi.string().uuid().allow('', null).optional(),
    isActive: Joi.boolean().optional()
  }),

  resetPassword: Joi.object({
    newPassword: Joi.string().min(6).required()
  }),

  // Portal Cliente - Users
  createClientUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('').optional(),
    password: Joi.string().min(6).required()
  }),

  updateClientUser: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('').optional(),
    isActive: Joi.boolean().optional()
  }),

  // Organização gerindo users de clientes
  createClientUserByOrg: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('').optional(),
    password: Joi.string().min(6).required(),
    isAdmin: Joi.boolean().optional()
  }),

  updateClientUserByOrg: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('').optional(),
    isActive: Joi.boolean().optional(),
    isAdmin: Joi.boolean().optional()
  })
};
