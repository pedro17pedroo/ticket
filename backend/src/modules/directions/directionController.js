import { Direction, User, Department } from '../models/index.js';
import emailValidationService from '../../services/emailValidationService.js';

// GET /api/directions - Listar direções (apenas internas do tenant, não de clientes)
export const getDirections = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const directions = await Direction.findAll({
      where: {
        organizationId,
        clientId: null // Apenas direções internas, não das empresas clientes
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      directions,
      total: directions.length
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/directions/:id - Obter direção por ID (apenas internas)
export const getDirectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const direction = await Direction.findOne({
      where: {
        id,
        organizationId,
        clientId: null // Apenas direções internas
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!direction) {
      return res.status(404).json({
        success: false,
        error: 'Direção não encontrada'
      });
    }

    res.json({
      success: true,
      direction
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/directions - Criar direção
export const createDirection = async (req, res, next) => {
  try {
    const { name, description, code, managerId, isActive, email } = req.body;
    const organizationId = req.user.organizationId;

    // Apenas admin pode criar direções
    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar direções'
      });
    }

    // Validate email uniqueness if provided
    if (email) {
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        organizationId
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }
    }

    const direction = await Direction.create({
      name,
      description: description && description.trim() !== '' ? description : null,
      code: code && code.trim() !== '' ? code : null,
      managerId: managerId && managerId.trim() !== '' ? managerId : null, // Converter string vazia para null
      email: email && email.trim() !== '' ? email : null,
      organizationId,
      clientId: null, // Direção interna do tenant, não de cliente
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Direção criada com sucesso',
      direction
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/directions/:id - Atualizar direção
export const updateDirection = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 ========== DEBUG UPDATE DIRECTION ==========');
    console.log('🔍 req.body COMPLETO:', JSON.stringify(req.body, null, 2));
    console.log('🔍 req.body.email:', req.body.email);
    console.log('🔍 typeof req.body.email:', typeof req.body.email);
    console.log('🔍 Object.keys(req.body):', Object.keys(req.body));
    console.log('🔍 req.headers["content-type"]:', req.headers['content-type']);
    console.log('🔍 ============================================');
    
    const { name, description, code, managerId, isActive, email } = req.body;

    console.log('📥 Recebido para atualização:', { id, name, description, code, managerId, isActive, email });
    console.log('📧 Email específico:', email, 'Tipo:', typeof email);

    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem atualizar direções'
      });
    }

    const direction = await Direction.findOne({
      where: {
        id,
        organizationId: req.user.organizationId,
        clientId: null // Apenas direções internas
      }
    });

    if (!direction) {
      return res.status(404).json({
        success: false,
        error: 'Direção não encontrada'
      });
    }

    // Validate email uniqueness if provided and changed
    if (email !== undefined && email !== null && email.trim() !== '') {
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        req.user.organizationId,
        { type: 'direction', id }
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description && description.trim() !== '' ? description : null;
    if (code !== undefined) updateData.code = code && code.trim() !== '' ? code : null;
    if (managerId !== undefined) updateData.managerId = managerId && managerId.trim() !== '' ? managerId : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Email: aceitar string vazia como null, mas preservar valores válidos
    if (email !== undefined) {
      updateData.email = (email && email.trim() !== '') ? email.trim() : null;
    }

    console.log('📤 Dados para atualizar:', updateData);

    await direction.update(updateData);

    console.log('✅ Direção após atualização:', direction.toJSON());

    res.json({
      success: true,
      message: 'Direção atualizada com sucesso',
      direction
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/directions/:id - Eliminar direção
export const deleteDirection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem eliminar direções'
      });
    }

    const direction = await Direction.findOne({
      where: {
        id,
        organizationId,
        clientId: null // Apenas direções internas
      },
      include: [{ model: Department, as: 'departments' }]
    });

    if (!direction) {
      return res.status(404).json({
        success: false,
        error: 'Direção não encontrada'
      });
    }

    // Verificar se tem departamentos
    if (direction.departments && direction.departments.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível eliminar uma direção com departamentos associados'
      });
    }

    await direction.destroy();

    res.json({
      success: true,
      message: 'Direção eliminada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
