import { Op } from 'sequelize';
import { User } from '../models/index.js';
import logger from '../../config/logger.js';

const ensureClientAdmin = (req, res) => {
  if (req.user.role !== 'cliente-org' || req.user?.settings?.clientAdmin !== true) {
    res.status(403).json({ success: false, error: 'Acesso negado. Somente administradores do cliente.' });
    return false;
  }
  return true;
};

// GET /api/client/users
export const getClientUsers = async (req, res, next) => {
  try {
    if (!ensureClientAdmin(req, res)) return; 
    const { search, isActive } = req.query;
    const organizationId = req.user.organizationId;
    
    // Define clientId: se user atual tem clientId, usa-o; senão usa id do user atual (é a empresa raiz)
    const clientId = req.user.clientId || req.user.id;

    const where = { organizationId, role: 'cliente-org', clientId }; // Filtrar por empresa
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: ['id','name','email','phone','isActive','createdAt','lastLogin','settings']
    });

    res.json({ success: true, users });
  } catch (error) { next(error); }
};

// POST /api/client/users
export const createClientUser = async (req, res, next) => {
  try {
    if (!ensureClientAdmin(req, res)) return;
    const { name, email, phone, password } = req.body;
    const organizationId = req.user.organizationId;
    
    // Define clientId: se user atual tem clientId, usa-o; senão usa id do user atual (é a empresa raiz)
    const clientId = req.user.clientId || req.user.id;

    const existing = await User.findOne({ where: { email, organizationId } });
    if (existing) return res.status(400).json({ success:false, error:'Email já está em uso nesta organização' });

    const user = await User.create({
      name, email, phone, password, role: 'cliente-org', organizationId, clientId, isActive: true
    });

    const data = user.toJSON();
    delete data.password;
    logger.info(`Cliente criou utilizador: ${user.email} (${organizationId})`);
    res.status(201).json({ success:true, message:'Utilizador criado com sucesso', user: data });
  } catch (error) { next(error); }
};

// PUT /api/client/users/:id
export const updateClientUser = async (req, res, next) => {
  try {
    if (!ensureClientAdmin(req, res)) return;
    const { id } = req.params;
    const { name, email, phone, isActive } = req.body;
    const organizationId = req.user.organizationId;

    const user = await User.findOne({ where: { id, organizationId, role: 'cliente-org' } });
    if (!user) return res.status(404).json({ success:false, error:'Utilizador não encontrado' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email, organizationId, id: { [Op.ne]: id } } });
      if (exists) return res.status(400).json({ success:false, error:'Email já está em uso nesta organização' });
    }

    await user.update({ name, email, phone, isActive });
    const data = user.toJSON();
    delete data.password;
    res.json({ success:true, message:'Utilizador atualizado com sucesso', user: data });
  } catch (error) { next(error); }
};

// DELETE /api/client/users/:id (soft delete)
export const deleteClientUser = async (req, res, next) => {
  try {
    if (!ensureClientAdmin(req, res)) return;
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const user = await User.findOne({ where: { id, organizationId, role: 'cliente-org' } });
    if (!user) return res.status(404).json({ success:false, error:'Utilizador não encontrado' });

    await user.update({ isActive: false });
    res.json({ success:true, message:'Utilizador desativado com sucesso' });
  } catch (error) { next(error); }
};

// PUT /api/client/users/:id/activate
export const activateClientUser = async (req, res, next) => {
  try {
    if (!ensureClientAdmin(req, res)) return;
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const user = await User.findOne({ where: { id, organizationId, role: 'cliente-org' } });
    if (!user) return res.status(404).json({ success:false, error:'Utilizador não encontrado' });

    await user.update({ isActive: true });
    res.json({ success:true, message:'Utilizador reativado com sucesso' });
  } catch (error) { next(error); }
};

// PUT /api/client/users/:id/reset-password
export const resetClientUserPassword = async (req, res, next) => {
  try {
    if (!ensureClientAdmin(req, res)) return;
    const { id } = req.params;
    const { newPassword } = req.body;
    const organizationId = req.user.organizationId;

    const user = await User.findOne({ where: { id, organizationId, role: 'cliente-org' } });
    if (!user) return res.status(404).json({ success:false, error:'Utilizador não encontrado' });

    await user.update({ password: newPassword });
    res.json({ success:true, message:'Senha redefinida com sucesso' });
  } catch (error) { next(error); }
};
