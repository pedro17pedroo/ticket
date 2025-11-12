import TicketHistory from './ticketHistoryModel.js';
import { User, Department, Direction, Section, Category } from '../models/index.js';

/**
 * Registra uma mudança no histórico do ticket
 */
export const logTicketChange = async (ticketId, userId, organizationId, changeData, transaction = null) => {
  const { action, field, oldValue, newValue, description } = changeData;

  try {
    await TicketHistory.create({
      ticketId,
      userId,
      action,
      field,
      oldValue,
      newValue,
      description
    }, { transaction });
  } catch (error) {
    console.error('Erro ao registrar histórico:', error);
    // Não falhar a operação principal se o log falhar
  }
};

/**
 * Cria descrição legível para mudanças
 */
export const createChangeDescription = async (field, oldValue, newValue, models = {}) => {
  const descriptions = {
    status: (old, newVal) => `Status alterado de "${old}" para "${newVal}"`,
    priority: (old, newVal) => `Prioridade alterada de "${old}" para "${newVal}"`,
    internalPriority: (old, newVal) => `Prioridade interna alterada de "${old || 'Não definida'}" para "${newVal}"`,
    resolutionStatus: (old, newVal) => {
      const labels = {
        pendente: 'Pendente',
        em_analise: 'Em Análise',
        aguardando_terceiro: 'Aguardando Terceiro',
        solucao_proposta: 'Solução Proposta',
        resolvido: 'Resolvido',
        nao_resolvido: 'Não Resolvido',
        workaround: 'Workaround Aplicado'
      };
      return `Estado de resolução alterado de "${labels[old] || old || 'Não definido'}" para "${labels[newVal] || newVal}"`;
    },
    assigneeId: async (old, newVal) => {
      const oldUser = old ? await User.findByPk(old, { attributes: ['name'] }) : null;
      const newUser = newVal ? await User.findByPk(newVal, { attributes: ['name'] }) : null;
      return `Atribuído de "${oldUser?.name || 'Não atribuído'}" para "${newUser?.name || 'Não atribuído'}"`;
    },
    departmentId: async (old, newVal) => {
      const oldDept = old ? await Department.findByPk(old, { attributes: ['name'] }) : null;
      const newDept = newVal ? await Department.findByPk(newVal, { attributes: ['name'] }) : null;
      return `Departamento alterado de "${oldDept?.name || 'Não definido'}" para "${newDept?.name || 'Não definido'}"`;
    },
    directionId: async (old, newVal) => {
      const oldDir = old ? await Direction.findByPk(old, { attributes: ['name'] }) : null;
      const newDir = newVal ? await Direction.findByPk(newVal, { attributes: ['name'] }) : null;
      return `Direção alterada de "${oldDir?.name || 'Não definida'}" para "${newDir?.name || 'Não definida'}"`;
    },
    sectionId: async (old, newVal) => {
      const oldSec = old ? await Section.findByPk(old, { attributes: ['name'] }) : null;
      const newSec = newVal ? await Section.findByPk(newVal, { attributes: ['name'] }) : null;
      return `Seção alterada de "${oldSec?.name || 'Não definida'}" para "${newSec?.name || 'Não definida'}"`;
    },
    categoryId: async (old, newVal) => {
      const oldCat = old ? await Category.findByPk(old, { attributes: ['name'] }) : null;
      const newCat = newVal ? await Category.findByPk(newVal, { attributes: ['name'] }) : null;
      return `Categoria alterada de "${oldCat?.name || 'Não definida'}" para "${newCat?.name || 'Não definida'}"`;
    },
    type: (old, newVal) => `Tipo alterado de "${old}" para "${newVal}"`,
    subject: (old, newVal) => `Assunto alterado`,
    description: (old, newVal) => `Descrição alterada`
  };

  const descriptionFn = descriptions[field];
  if (!descriptionFn) {
    return `${field} alterado`;
  }

  if (typeof descriptionFn === 'function') {
    const result = descriptionFn(oldValue, newValue);
    return result instanceof Promise ? await result : result;
  }

  return descriptionFn;
};

/**
 * Obtém histórico completo de um ticket
 */
export const getTicketHistory = async (ticketId, options = {}) => {
  const { limit = 100, offset = 0, action = null } = options;

  const where = { ticketId };
  if (action) {
    where.action = action;
  }

  const history = await TicketHistory.findAll({
    attributes: ['id', 'ticketId', 'userId', 'action', 'field', 'oldValue', 'newValue', 'description', 'createdAt'],
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  return history;
};

/**
 * Compara valores antigos e novos de um ticket e registra mudanças
 */
export const trackTicketChanges = async (oldTicket, newTicket, userId, transaction = null) => {
  const fieldsToTrack = [
    'status',
    'priority',
    'internalPriority',
    'resolutionStatus',
    'assigneeId',
    'departmentId',
    'directionId',
    'sectionId',
    'categoryId',
    'type',
    'subject',
    'description'
  ];

  for (const field of fieldsToTrack) {
    const oldValue = oldTicket[field];
    const newValue = newTicket[field];

    if (oldValue !== newValue && newValue !== undefined) {
      const description = await createChangeDescription(field, oldValue, newValue);

      await logTicketChange(
        oldTicket.id,
        userId,
        {
          action: 'updated',
          field,
          oldValue,
          newValue,
          description
        },
        transaction
      );
    }
  }
};

export default {
  logTicketChange,
  createChangeDescription,
  getTicketHistory,
  trackTicketChanges
};
