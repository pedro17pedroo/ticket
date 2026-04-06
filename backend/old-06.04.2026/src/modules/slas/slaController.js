import SLA from './slaModel.js';
import { Op } from 'sequelize';

// GET /api/slas - Listar todos os SLAs
export const getSLAs = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const slas = await SLA.findAll({
      where: { organizationId },
      order: [
        ['priority', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    res.json({
      success: true,
      slas,
      total: slas.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/slas/:id - Obter SLA por ID
export const getSLAById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const sla = await SLA.findOne({
      where: { id, organizationId },
    });

    if (!sla) {
      return res.status(404).json({
        success: false,
        error: 'SLA não encontrado',
      });
    }

    res.json({
      success: true,
      sla,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/slas/priority/:priority - Obter SLA por prioridade
export const getSLAByPriority = async (req, res, next) => {
  try {
    const { priority } = req.params;
    const organizationId = req.user.organizationId;

    const sla = await SLA.findOne({
      where: { priority, organizationId },
    });

    if (!sla) {
      return res.status(404).json({
        success: false,
        error: 'SLA não encontrado para esta prioridade',
      });
    }

    res.json({
      success: true,
      sla,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/slas - Criar novo SLA
export const createSLA = async (req, res, next) => {
  try {
    const { name, priority, responseTimeMinutes, resolutionTimeMinutes } = req.body;
    const organizationId = req.user.organizationId;

    // Apenas admin-org pode criar SLAs
    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar SLAs',
      });
    }

    // Verificar se já existe SLA para esta prioridade
    const existingSLA = await SLA.findOne({
      where: { priority, organizationId },
    });

    if (existingSLA) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um SLA para esta prioridade',
      });
    }

    const sla = await SLA.create({
      name,
      priority,
      responseTimeMinutes,
      resolutionTimeMinutes,
      organizationId,
    });


    res.status(201).json({
      success: true,
      message: 'SLA criado com sucesso',
      sla,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/slas/:id - Atualizar SLA
export const updateSLA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, priority, responseTimeMinutes, resolutionTimeMinutes } = req.body;
    const organizationId = req.user.organizationId;

    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem atualizar SLAs',
      });
    }

    const sla = await SLA.findOne({
      where: { id, organizationId },
    });

    if (!sla) {
      return res.status(404).json({
        success: false,
        error: 'SLA não encontrado',
      });
    }

    // Se mudou prioridade, verificar conflito
    if (priority && priority !== sla.priority) {
      const existingSLA = await SLA.findOne({
        where: { priority, organizationId, id: { [Op.ne]: id } },
      });

      if (existingSLA) {
        return res.status(400).json({
          success: false,
          error: 'Já existe um SLA para esta prioridade',
        });
      }
    }

    const oldData = { ...sla.toJSON() };

    await sla.update({
      name,
      priority,
      responseTimeMinutes,
      resolutionTimeMinutes,
    });


    res.json({
      success: true,
      message: 'SLA atualizado com sucesso',
      sla,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/slas/:id - Eliminar SLA
export const deleteSLA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem eliminar SLAs',
      });
    }

    const sla = await SLA.findOne({
      where: { id, organizationId },
    });

    if (!sla) {
      return res.status(404).json({
        success: false,
        error: 'SLA não encontrado',
      });
    }

    const slaData = { ...sla.toJSON() };
    await sla.destroy();


    res.json({
      success: true,
      message: 'SLA eliminado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};
