import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TatuTicket API',
      version: '1.0.0',
      description: 'API REST para o sistema TatuTicket - Plataforma de gestão de tickets e suporte',
      contact: {
        name: 'Equipa TatuTicket',
        email: 'suporte@tatuticket.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.tatuticket.com/api',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido no endpoint /auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Mensagem de erro'
            }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            ticketNumber: {
              type: 'string',
              example: 'TICKET-0001'
            },
            subject: {
              type: 'string',
              example: 'Problema com sistema'
            },
            description: {
              type: 'string',
              example: 'Descrição detalhada do problema...'
            },
            status: {
              type: 'string',
              enum: ['novo', 'em_progresso', 'aguardando_cliente', 'resolvido', 'fechado']
            },
            priority: {
              type: 'string',
              example: 'alta'
            },
            type: {
              type: 'string',
              example: 'suporte'
            },
            source: {
              type: 'string',
              enum: ['portal', 'email', 'chat', 'whatsapp', 'telefone']
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@exemplo.com'
            },
            role: {
              type: 'string',
              enum: ['admin-sistema', 'org-admin', 'agente', 'cliente-org']
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Organization: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'Minha Empresa'
            },
            domain: {
              type: 'string',
              example: 'minhaempresa'
            },
            settings: {
              type: 'object'
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticação inválido ou ausente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Token inválido ou ausente'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Acesso negado - Permissões insuficientes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Acesso negado'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Recurso não encontrado'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erro de validação dos dados',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Dados inválidos',
                details: ['Campo obrigatório não fornecido']
              }
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      {
        name: 'Auth',
        description: 'Autenticação e autorização'
      },
      {
        name: 'Tickets',
        description: 'Gestão de tickets'
      },
      {
        name: 'Users',
        description: 'Gestão de usuários'
      },
      {
        name: 'Organizations',
        description: 'Gestão de organizações'
      },
      {
        name: 'Clients',
        description: 'Gestão de clientes'
      },
      {
        name: 'Departments',
        description: 'Gestão de departamentos'
      },
      {
        name: 'Categories',
        description: 'Gestão de categorias'
      },
      {
        name: 'SLAs',
        description: 'Gestão de SLAs'
      },
      {
        name: 'Knowledge',
        description: 'Base de conhecimento'
      },
      {
        name: 'Inventory',
        description: 'Gestão de inventário TI'
      },
      {
        name: 'Hours',
        description: 'Bolsa de horas'
      },
      {
        name: 'Catalog',
        description: 'Catálogo de serviços'
      }
    ]
  },
  // Arquivos que contêm anotações Swagger
  apis: [
    './src/routes/*.js',
    './src/modules/*/**.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
