import { Department } from '../models/index.js';
import logger from '../../config/logger.js';

// Listar departamentos
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      where: { 
        organizationId: req.user.organizationId,
        isActive: true 
      },
      order: [['name', 'ASC']]
    });

    res.json({ departments });
  } catch (error) {
    next(error);
  }
};

// Criar departamento
export const createDepartment = async (req, res, next) => {
  try {
    const { name, description, email } = req.body;

    const department = await Department.create({
      organizationId: req.user.organizationId,
      name,
      description,
      email
    });

    logger.info(`Departamento criado: ${name} por ${req.user.email}`);

    res.status(201).json({
      message: 'Departamento criado com sucesso',
      department
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar departamento
export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const department = await Department.findOne({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    await department.update(updates);

    res.json({
      message: 'Departamento atualizado com sucesso',
      department
    });
  } catch (error) {
    next(error);
  }
};

// Deletar departamento (soft delete)
export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await Department.findOne({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    await department.update({ isActive: false });

    res.json({ message: 'Departamento removido com sucesso' });
  } catch (error) {
    next(error);
  }
};
