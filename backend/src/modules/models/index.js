import Organization from '../organizations/organizationModel.js';
import User from '../users/userModel.js';
import Direction from '../directions/directionModel.js';
import Department from '../departments/departmentModel.js';
import Section from '../sections/sectionModel.js';
import Category from '../categories/categoryModel.js';
import Ticket from '../tickets/ticketModel.js';
import Comment from '../comments/commentModel.js';
import Attachment from '../attachments/attachmentModel.js';
import SLA from '../slas/slaModel.js';
import Priority from '../priorities/priorityModel.js';
import KnowledgeArticle from '../knowledge/knowledgeModel.js';
import { HoursBank, HoursTransaction } from '../hours/hoursBankModel.js';
import TimeTracking from '../timeTracking/timeTrackingModel.js';
import { Tag, TicketTag } from '../tags/tagModel.js';
import ResponseTemplate from '../templates/templateModel.js';
import { CatalogCategory, CatalogItem, ServiceRequest } from '../catalog/catalogModel.js';
import TicketHistory from '../tickets/ticketHistoryModel.js';
import Notification from '../notifications/notificationModel.js';
import Asset from '../inventory/assetModel.js';
import Software from '../inventory/softwareModel.js';
import License from '../inventory/licenseModel.js';
import AssetLicense from '../inventory/assetLicenseModel.js';

// Definir associações entre modelos
const setupAssociations = () => {
  // Organization associations
  Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });
  Organization.hasMany(Direction, { foreignKey: 'organizationId', as: 'directions' });
  Organization.hasMany(Department, { foreignKey: 'organizationId', as: 'departments' });
  Organization.hasMany(Section, { foreignKey: 'organizationId', as: 'sections' });
  Organization.hasMany(Ticket, { foreignKey: 'organizationId', as: 'tickets' });
  Organization.hasMany(Category, { foreignKey: 'organizationId', as: 'categories' });
  Organization.hasMany(SLA, { foreignKey: 'organizationId', as: 'slas' });
  Organization.hasMany(Priority, { foreignKey: 'organizationId', as: 'priorities' });
  Organization.hasMany(KnowledgeArticle, { foreignKey: 'organizationId', as: 'articles' });
  Organization.hasMany(HoursBank, { foreignKey: 'organizationId', as: 'hoursBanks' });

  // User associations
  User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  User.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });
  User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  User.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });
  User.hasMany(Ticket, { foreignKey: 'requesterId', as: 'requestedTickets' });
  User.hasMany(Ticket, { foreignKey: 'assigneeId', as: 'assignedTickets' });
  User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
  User.hasMany(KnowledgeArticle, { foreignKey: 'authorId', as: 'articles' });
  User.hasMany(HoursBank, { foreignKey: 'clientId', as: 'hoursBanks' });

  // Direction associations
  Direction.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Direction.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
  Direction.hasMany(User, { foreignKey: 'directionId', as: 'users' });
  Direction.hasMany(Department, { foreignKey: 'directionId', as: 'departments' });

  // Department associations
  Department.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Department.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });
  Department.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
  Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });
  Department.hasMany(Section, { foreignKey: 'departmentId', as: 'sections' });
  Department.hasMany(Ticket, { foreignKey: 'departmentId', as: 'tickets' });

  // Section associations
  Section.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Section.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  Section.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
  Section.hasMany(User, { foreignKey: 'sectionId', as: 'users' });

  // Category associations
  Category.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Category.hasMany(Ticket, { foreignKey: 'categoryId', as: 'tickets' });
  Category.hasMany(KnowledgeArticle, { foreignKey: 'categoryId', as: 'articles' });

  // Ticket associations
  Ticket.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Ticket.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Ticket.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  Ticket.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });
  Ticket.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });
  Ticket.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
  Ticket.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
  Ticket.hasMany(Comment, { foreignKey: 'ticketId', as: 'comments' });
  Ticket.hasMany(Attachment, { foreignKey: 'ticketId', as: 'attachments' });
  Ticket.hasMany(HoursTransaction, { foreignKey: 'ticketId', as: 'hoursTransactions' });
  Ticket.hasMany(TicketHistory, { foreignKey: 'ticketId', as: 'history' });

  // TicketHistory associations
  TicketHistory.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  TicketHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  TicketHistory.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  // Comment associations
  Comment.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Comment.hasMany(Attachment, { foreignKey: 'commentId', as: 'attachments' });

  // Attachment associations
  Attachment.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
  Attachment.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });

  // SLA associations
  SLA.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  // Priority associations
  Priority.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

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

  // TimeTracking associations
  TimeTracking.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  TimeTracking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  TimeTracking.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  TimeTracking.belongsTo(HoursBank, { foreignKey: 'hoursBankId', as: 'hoursBank' });
  Ticket.hasMany(TimeTracking, { foreignKey: 'ticketId', as: 'timeTracking' });
  User.hasMany(TimeTracking, { foreignKey: 'userId', as: 'timeTracking' });

  // Tag associations
  Tag.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Organization.hasMany(Tag, { foreignKey: 'organizationId', as: 'tags' });
  
  // Ticket-Tag associations (many-to-many)
  TicketTag.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  TicketTag.belongsTo(Tag, { foreignKey: 'tagId', as: 'tag' });
  Ticket.belongsToMany(Tag, { through: TicketTag, foreignKey: 'ticketId', as: 'ticketTags' });
  Tag.belongsToMany(Ticket, { through: TicketTag, foreignKey: 'tagId', as: 'tickets' });

  // ResponseTemplate associations
  ResponseTemplate.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ResponseTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  ResponseTemplate.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Organization.hasMany(ResponseTemplate, { foreignKey: 'organizationId', as: 'templates' });
  User.hasMany(ResponseTemplate, { foreignKey: 'createdBy', as: 'templates' });
  Category.hasMany(ResponseTemplate, { foreignKey: 'categoryId', as: 'templates' });

  // Catalog associations
  CatalogCategory.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Organization.hasMany(CatalogCategory, { foreignKey: 'organizationId', as: 'catalogCategories' });
  
  CatalogItem.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  CatalogItem.belongsTo(CatalogCategory, { foreignKey: 'categoryId', as: 'category' });
  CatalogItem.belongsTo(SLA, { foreignKey: 'slaId', as: 'sla' });
  CatalogItem.belongsTo(Category, { foreignKey: 'defaultTicketCategoryId', as: 'ticketCategory' });
  CatalogItem.belongsTo(User, { foreignKey: 'defaultApproverId', as: 'approver' });
  CatalogItem.belongsTo(Department, { foreignKey: 'assignedDepartmentId', as: 'department' });
  CatalogCategory.hasMany(CatalogItem, { foreignKey: 'categoryId', as: 'items' });
  
  ServiceRequest.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ServiceRequest.belongsTo(CatalogItem, { foreignKey: 'catalogItemId', as: 'catalogItem' });
  ServiceRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
  ServiceRequest.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
  ServiceRequest.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  CatalogItem.hasMany(ServiceRequest, { foreignKey: 'catalogItemId', as: 'requests' });
  Ticket.hasOne(ServiceRequest, { foreignKey: 'ticketId', as: 'serviceRequest' });

  // Notification associations
  Notification.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Notification.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  Organization.hasMany(Notification, { foreignKey: 'organizationId', as: 'notifications' });
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Ticket.hasMany(Notification, { foreignKey: 'ticketId', as: 'notifications' });

  // Inventory associations
  Asset.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Asset.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
  Asset.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Organization.hasMany(Asset, { foreignKey: 'organizationId', as: 'assets' });
  User.hasMany(Asset, { foreignKey: 'clientId', as: 'clientAssets' });
  User.hasMany(Asset, { foreignKey: 'userId', as: 'userAssets' });

  Software.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Software.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
  Organization.hasMany(Software, { foreignKey: 'organizationId', as: 'software' });
  Asset.hasMany(Software, { foreignKey: 'assetId', as: 'software' });

  License.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  License.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
  Organization.hasMany(License, { foreignKey: 'organizationId', as: 'licenses' });
  User.hasMany(License, { foreignKey: 'clientId', as: 'licenses' });

  AssetLicense.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
  AssetLicense.belongsTo(License, { foreignKey: 'licenseId', as: 'license' });
  Asset.belongsToMany(License, { through: AssetLicense, foreignKey: 'assetId', as: 'licenses' });
  License.belongsToMany(Asset, { through: AssetLicense, foreignKey: 'licenseId', as: 'assets' });
};

export {
  Organization,
  User,
  Direction,
  Department,
  Section,
  Category,
  Ticket,
  TicketHistory,
  Comment,
  Attachment,
  SLA,
  Priority,
  KnowledgeArticle,
  HoursBank,
  HoursTransaction,
  TimeTracking,
  Tag,
  TicketTag,
  ResponseTemplate,
  CatalogCategory,
  CatalogItem,
  ServiceRequest,
  Notification,
  Asset,
  Software,
  License,
  AssetLicense,
  setupAssociations
};
