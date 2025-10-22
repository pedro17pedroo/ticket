import Organization from '../organizations/organizationModel.js';
import User from '../users/userModel.js';
import Department from '../departments/departmentModel.js';
import Category from '../categories/categoryModel.js';
import Ticket from '../tickets/ticketModel.js';
import Comment from '../comments/commentModel.js';
import SLA from '../slas/slaModel.js';
import KnowledgeArticle from '../knowledge/knowledgeModel.js';
import { HoursBank, HoursTransaction } from '../hours/hoursBankModel.js';

// Definir associações entre modelos
const setupAssociations = () => {
  // Organization associations
  Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });
  Organization.hasMany(Department, { foreignKey: 'organizationId', as: 'departments' });
  Organization.hasMany(Ticket, { foreignKey: 'organizationId', as: 'tickets' });
  Organization.hasMany(Category, { foreignKey: 'organizationId', as: 'categories' });
  Organization.hasMany(SLA, { foreignKey: 'organizationId', as: 'slas' });
  Organization.hasMany(KnowledgeArticle, { foreignKey: 'organizationId', as: 'articles' });
  Organization.hasMany(HoursBank, { foreignKey: 'organizationId', as: 'hoursBanks' });

  // User associations
  User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  User.hasMany(Ticket, { foreignKey: 'requesterId', as: 'requestedTickets' });
  User.hasMany(Ticket, { foreignKey: 'assigneeId', as: 'assignedTickets' });
  User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
  User.hasMany(KnowledgeArticle, { foreignKey: 'authorId', as: 'articles' });
  User.hasMany(HoursBank, { foreignKey: 'clientId', as: 'hoursBanks' });

  // Department associations
  Department.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });
  Department.hasMany(Ticket, { foreignKey: 'departmentId', as: 'tickets' });

  // Category associations
  Category.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Category.hasMany(Ticket, { foreignKey: 'categoryId', as: 'tickets' });
  Category.hasMany(KnowledgeArticle, { foreignKey: 'categoryId', as: 'articles' });

  // Ticket associations
  Ticket.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Ticket.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Ticket.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  Ticket.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
  Ticket.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
  Ticket.hasMany(Comment, { foreignKey: 'ticketId', as: 'comments' });
  Ticket.hasMany(HoursTransaction, { foreignKey: 'ticketId', as: 'hoursTransactions' });

  // Comment associations
  Comment.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // SLA associations
  SLA.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  // KnowledgeArticle associations
  KnowledgeArticle.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  KnowledgeArticle.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  KnowledgeArticle.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

  // HoursBank associations
  HoursBank.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  HoursBank.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
  HoursBank.hasMany(HoursTransaction, { foreignKey: 'hoursBankId', as: 'transactions' });

  // HoursTransaction associations
  HoursTransaction.belongsTo(HoursBank, { foreignKey: 'hoursBankId', as: 'hoursBank' });
  HoursTransaction.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  HoursTransaction.belongsTo(User, { foreignKey: 'performedById', as: 'performedBy' });
};

export {
  Organization,
  User,
  Department,
  Category,
  Ticket,
  Comment,
  SLA,
  KnowledgeArticle,
  HoursBank,
  HoursTransaction,
  setupAssociations
};
