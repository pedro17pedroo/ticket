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

  // Tickets
  createTicket: Joi.object({
    subject: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(10).required(),
    priority: Joi.string().valid('baixa', 'media', 'alta', 'urgente').default('media'),
    type: Joi.string().valid('suporte', 'implementacao', 'problema', 'duvida').default('suporte'),
    categoryId: Joi.string().uuid().optional(),
    departmentId: Joi.string().uuid().optional()
  }),

  updateTicket: Joi.object({
    subject: Joi.string().min(5).max(255).optional(),
    description: Joi.string().min(10).optional(),
    status: Joi.string().valid('novo', 'em_progresso', 'aguardando_cliente', 'resolvido', 'fechado').optional(),
    priority: Joi.string().valid('baixa', 'media', 'alta', 'urgente').optional(),
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
    description: Joi.string().optional(),
    email: Joi.string().email().optional()
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
    priority: Joi.string().valid('baixa', 'media', 'alta', 'urgente').required(),
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
  })
};
