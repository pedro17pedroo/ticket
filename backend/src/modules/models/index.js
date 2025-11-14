import Organization from '../organizations/organizationModel.js';
import User from '../users/userModel.js';
import OrganizationUser from '../../models/OrganizationUser.js';
import Plan from '../../models/Plan.js';
import Subscription from '../../models/Subscription.js';
import Client from '../clients/clientModel.js';
import ClientUser from '../clients/clientUserModel.js';
import Direction from '../directions/directionModel.js';
import Department from '../departments/departmentModel.js';
import Section from '../sections/sectionModel.js';
import Category from '../categories/categoryModel.js';
import Ticket from '../tickets/ticketModel.js';
import Comment from '../comments/commentModel.js';
import Attachment from '../attachments/attachmentModel.js';
import SLA from '../slas/slaModel.js';
import Priority from '../priorities/priorityModel.js';
import Type from '../types/typeModel.js';
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
import RemoteAccess from '../../models/RemoteAccess.js';
import EmailTemplate from '../../models/EmailTemplate.js';
import AttachmentModel from '../../models/Attachment.js';
import Service from '../../models/Service.js';
import Incident from '../../models/Incident.js';
import Maintenance from '../../models/Maintenance.js';
import StatusSubscription from '../../models/StatusSubscription.js';
import TicketTemplate from '../../models/TicketTemplate.js';
import Macro from '../../models/Macro.js';
import Workflow from '../../models/Workflow.js';
import WorkflowExecution from '../../models/WorkflowExecution.js';
import Dashboard from '../../models/Dashboard.js';
import Report from '../../models/Report.js';
import KPI from '../../models/KPI.js';
import SearchIndex from '../../models/SearchIndex.js';
import SavedSearch from '../../models/SavedSearch.js';
import TicketRelationship from '../../models/TicketRelationship.js';
import TeamWorkspace from '../../models/TeamWorkspace.js';
import SharedView from '../../models/SharedView.js';
import TicketMention from '../../models/TicketMention.js';
import Badge from '../../models/Badge.js';
import UserBadge from '../../models/UserBadge.js';
import GamePoints from '../../models/GamePoints.js';
import Role from '../../models/Role.js';
import Permission from '../../models/Permission.js';
import RolePermission from '../../models/RolePermission.js';
import UserPermission from '../../models/UserPermission.js';
import AuditLog from '../../models/AuditLog.js';
import IPWhitelist from '../../models/IPWhitelist.js';
import Webhook from '../../models/Webhook.js';
import WebhookLog from '../../models/WebhookLog.js';
import Integration from '../../models/Integration.js';

// Definir associações entre modelos
const setupAssociations = () => {
  // Organization associations (Provider -> Tenant hierarchy)
  Organization.belongsTo(Organization, { foreignKey: 'parentId', as: 'parent' });
  Organization.hasMany(Organization, { foreignKey: 'parentId', as: 'tenants' });
  Organization.hasMany(User, { foreignKey: 'organizationId', as: 'providerUsers' });
  Organization.hasMany(OrganizationUser, { foreignKey: 'organizationId', as: 'organizationUsers' });
  Organization.hasMany(Client, { foreignKey: 'organizationId', as: 'clients' });
  Organization.hasMany(ClientUser, { foreignKey: 'organizationId', as: 'clientUsers' });
  Organization.hasMany(Direction, { foreignKey: 'organizationId', as: 'directions' });
  Organization.hasMany(Department, { foreignKey: 'organizationId', as: 'departments' });
  Organization.hasMany(Section, { foreignKey: 'organizationId', as: 'sections' });
  Organization.hasMany(Ticket, { foreignKey: 'organizationId', as: 'tickets' });
  Organization.hasMany(Category, { foreignKey: 'organizationId', as: 'categories' });
  Organization.hasMany(SLA, { foreignKey: 'organizationId', as: 'slas' });
  Organization.hasMany(Priority, { foreignKey: 'organizationId', as: 'priorities' });
  Organization.hasMany(KnowledgeArticle, { foreignKey: 'organizationId', as: 'articles' });
  Organization.hasMany(HoursBank, { foreignKey: 'organizationId', as: 'hoursBanks' });

  // Plan and Subscription associations
  Organization.hasOne(Subscription, { foreignKey: 'organizationId', as: 'subscriptionDetails' });
  Subscription.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
  Plan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });

  // Client associations (Empresas clientes B2B)
  Client.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Client.hasMany(ClientUser, { foreignKey: 'clientId', as: 'users' });
  Client.hasMany(Ticket, { foreignKey: 'clientId', as: 'tickets' });

  // ClientUser associations (Usuários das empresas clientes)
  ClientUser.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ClientUser.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
  ClientUser.hasMany(Ticket, { foreignKey: 'requesterId', as: 'tickets' });
  ClientUser.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

  // OrganizationUser associations (Staff das organizações tenant)
  OrganizationUser.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  OrganizationUser.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });
  OrganizationUser.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  OrganizationUser.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });
  OrganizationUser.hasMany(Ticket, { foreignKey: 'assigneeId', as: 'assignedTickets' });
  OrganizationUser.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

  // User associations (Provider SaaS Staff APENAS)
  User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  User.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });
  User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  User.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });
  User.hasMany(Ticket, { foreignKey: 'requesterId', as: 'requestedTickets' });
  User.hasMany(Ticket, { foreignKey: 'assigneeId', as: 'assignedTickets' });
  User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
  User.hasMany(KnowledgeArticle, { foreignKey: 'authorId', as: 'articles' });
  User.hasMany(HoursBank, { foreignKey: 'clientId', as: 'hoursBanks' });

  // RBAC associations
  // Role associations
  Role.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions'
  });

  // Permission associations
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles'
  });

  // User-Role association
  User.belongsTo(Role, { 
    foreignKey: 'role', 
    targetKey: 'name', 
    as: 'roleObject' 
  });

  // User-Permission (custom permissions)
  User.hasMany(UserPermission, { 
    foreignKey: 'userId', 
    as: 'customPermissions' 
  });
  
  UserPermission.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  UserPermission.belongsTo(Permission, { 
    foreignKey: 'permissionId', 
    as: 'permission' 
  });
  
  UserPermission.belongsTo(User, { 
    foreignKey: 'grantedBy', 
    as: 'granter' 
  });

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
  Ticket.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
  Ticket.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Ticket.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  Ticket.belongsTo(Direction, { foreignKey: 'directionId', as: 'direction' });
  Ticket.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });
  // Requester pode ser User ou ClientUser (polimórfico baseado em requesterType)
  Ticket.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
  Ticket.belongsTo(ClientUser, { foreignKey: 'requesterId', as: 'requesterClient' });
  Ticket.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
  Ticket.belongsTo(SLA, { foreignKey: 'slaId', as: 'sla' });
  Ticket.belongsTo(Priority, { foreignKey: 'priorityId', as: 'priorityConfig' });
  Ticket.belongsTo(Type, { foreignKey: 'typeId', as: 'typeConfig' });
  // Associações com Catálogo de Serviços
  Ticket.belongsTo(CatalogCategory, { foreignKey: 'catalogCategoryId', as: 'catalogCategory' });
  Ticket.belongsTo(CatalogItem, { foreignKey: 'catalogItemId', as: 'catalogItem' });
  CatalogCategory.hasMany(Ticket, { foreignKey: 'catalogCategoryId', as: 'tickets' });
  CatalogItem.hasMany(Ticket, { foreignKey: 'catalogItemId', as: 'tickets' });
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
  Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // Legado
  Comment.hasMany(Attachment, { foreignKey: 'commentId', as: 'attachments' });
  
  // Comment - Author polimórfico
  Comment.belongsTo(User, { foreignKey: 'authorUserId', as: 'authorUser' });
  Comment.belongsTo(OrganizationUser, { foreignKey: 'authorOrgUserId', as: 'authorOrgUser' });
  Comment.belongsTo(ClientUser, { foreignKey: 'authorClientUserId', as: 'authorClientUser' });

  // Attachment associations
  Attachment.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  Attachment.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });
  
  // Attachment - Uploader polimórfico
  Attachment.belongsTo(User, { foreignKey: 'uploadedByUserId', as: 'uploaderUser' });
  Attachment.belongsTo(OrganizationUser, { foreignKey: 'uploadedByOrgUserId', as: 'uploaderOrgUser' });
  Attachment.belongsTo(ClientUser, { foreignKey: 'uploadedByClientUserId', as: 'uploaderClientUser' });

  // SLA associations
  SLA.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  SLA.hasMany(Ticket, { foreignKey: 'slaId', as: 'tickets' });
  
  // EmailTemplate associations
  EmailTemplate.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Organization.hasMany(EmailTemplate, { foreignKey: 'organizationId', as: 'emailTemplates' });

  // Status Page associations
  Service.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Organization.hasMany(Service, { foreignKey: 'organizationId', as: 'services' });
  
  Incident.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Incident.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Incident.belongsTo(User, { foreignKey: 'resolvedById', as: 'resolvedBy' });
  Organization.hasMany(Incident, { foreignKey: 'organizationId', as: 'incidents' });
  
  Maintenance.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Maintenance.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Maintenance.belongsTo(User, { foreignKey: 'completedById', as: 'completedBy' });
  Organization.hasMany(Maintenance, { foreignKey: 'organizationId', as: 'maintenances' });
  
  StatusSubscription.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Organization.hasMany(StatusSubscription, { foreignKey: 'organizationId', as: 'statusSubscriptions' });
  
  // Template System associations
  TicketTemplate.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  TicketTemplate.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  TicketTemplate.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  TicketTemplate.belongsTo(Category, { foreignKey: 'categoryId', as: 'ticketCategory' });
  Organization.hasMany(TicketTemplate, { foreignKey: 'organizationId', as: 'ticketTemplates' });
  
  Macro.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Macro.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(Macro, { foreignKey: 'organizationId', as: 'macros' });
  
  // Workflow associations
  Workflow.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Workflow.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(Workflow, { foreignKey: 'organizationId', as: 'workflows' });
  
  WorkflowExecution.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });
  WorkflowExecution.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  WorkflowExecution.belongsTo(User, { foreignKey: 'executedById', as: 'executedBy' });
  Workflow.hasMany(WorkflowExecution, { foreignKey: 'workflowId', as: 'executions' });
  
  // Business Intelligence associations
  Dashboard.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Dashboard.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(Dashboard, { foreignKey: 'organizationId', as: 'dashboards' });
  
  Report.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Report.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(Report, { foreignKey: 'organizationId', as: 'reports' });
  
  KPI.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  KPI.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(KPI, { foreignKey: 'organizationId', as: 'kpis' });
  
  // Search associations
  SearchIndex.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Organization.hasMany(SearchIndex, { foreignKey: 'organizationId', as: 'searchIndexes' });
  
  SavedSearch.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  SavedSearch.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Organization.hasMany(SavedSearch, { foreignKey: 'organizationId', as: 'savedSearches' });
  User.hasMany(SavedSearch, { foreignKey: 'userId', as: 'savedSearches' });
  
  // Collaboration associations
  TicketRelationship.belongsTo(Ticket, { foreignKey: 'sourceTicketId', as: 'sourceTicket' });
  TicketRelationship.belongsTo(Ticket, { foreignKey: 'targetTicketId', as: 'targetTicket' });
  TicketRelationship.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Ticket.hasMany(TicketRelationship, { foreignKey: 'sourceTicketId', as: 'outgoingRelationships' });
  Ticket.hasMany(TicketRelationship, { foreignKey: 'targetTicketId', as: 'incomingRelationships' });
  
  TeamWorkspace.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  TeamWorkspace.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  TeamWorkspace.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(TeamWorkspace, { foreignKey: 'organizationId', as: 'teamWorkspaces' });
  
  SharedView.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  SharedView.belongsTo(TeamWorkspace, { foreignKey: 'teamWorkspaceId', as: 'teamWorkspace' });
  SharedView.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(SharedView, { foreignKey: 'organizationId', as: 'sharedViews' });
  TeamWorkspace.hasMany(SharedView, { foreignKey: 'teamWorkspaceId', as: 'views' });
  
  TicketMention.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  TicketMention.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });
  TicketMention.belongsTo(User, { foreignKey: 'mentionedUserId', as: 'mentionedUser' });
  TicketMention.belongsTo(User, { foreignKey: 'mentionedById', as: 'mentionedBy' });
  Ticket.hasMany(TicketMention, { foreignKey: 'ticketId', as: 'mentions' });
  User.hasMany(TicketMention, { foreignKey: 'mentionedUserId', as: 'mentions' });
  
  // Gamification associations
  Badge.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Organization.hasMany(Badge, { foreignKey: 'organizationId', as: 'badges' });
  
  UserBadge.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  UserBadge.belongsTo(Badge, { foreignKey: 'badgeId', as: 'badge' });
  UserBadge.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  User.hasMany(UserBadge, { foreignKey: 'userId', as: 'badges' });
  Badge.hasMany(UserBadge, { foreignKey: 'badgeId', as: 'userBadges' });
  
  GamePoints.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  GamePoints.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  User.hasOne(GamePoints, { foreignKey: 'userId', as: 'gamePoints' });
  Organization.hasMany(GamePoints, { foreignKey: 'organizationId', as: 'gamePoints' });
  
  // Security associations
  AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  AuditLog.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
  Organization.hasMany(AuditLog, { foreignKey: 'organizationId', as: 'auditLogs' });
  
  IPWhitelist.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  IPWhitelist.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(IPWhitelist, { foreignKey: 'organizationId', as: 'ipWhitelists' });
  
  // Integration associations
  Webhook.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Webhook.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(Webhook, { foreignKey: 'organizationId', as: 'webhooks' });
  
  WebhookLog.belongsTo(Webhook, { foreignKey: 'webhookId', as: 'webhook' });
  WebhookLog.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Webhook.hasMany(WebhookLog, { foreignKey: 'webhookId', as: 'logs' });
  
  Integration.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Integration.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Organization.hasMany(Integration, { foreignKey: 'organizationId', as: 'integrations' });

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
  
  // Hierarquia de categorias (parent/child)
  CatalogCategory.belongsTo(CatalogCategory, { foreignKey: 'parentCategoryId', as: 'parent' });
  CatalogCategory.hasMany(CatalogCategory, { foreignKey: 'parentCategoryId', as: 'children' });
  
  // Associação CatalogCategory <-> CatalogItem
  CatalogCategory.hasMany(CatalogItem, { foreignKey: 'categoryId', as: 'items' });
  CatalogItem.belongsTo(CatalogCategory, { foreignKey: 'categoryId', as: 'category' });
  
  // Outras associações do CatalogItem
  CatalogItem.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  CatalogItem.belongsTo(SLA, { foreignKey: 'slaId', as: 'sla' });
  CatalogItem.belongsTo(Priority, { foreignKey: 'priorityId', as: 'priority' });
  CatalogItem.belongsTo(Type, { foreignKey: 'typeId', as: 'type' });
  CatalogItem.belongsTo(Category, { foreignKey: 'defaultTicketCategoryId', as: 'ticketCategory' });
  CatalogItem.belongsTo(User, { foreignKey: 'defaultApproverId', as: 'approver' });
  CatalogItem.belongsTo(Department, { foreignKey: 'assignedDepartmentId', as: 'department' });
  
  ServiceRequest.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ServiceRequest.belongsTo(CatalogItem, { foreignKey: 'catalogItemId', as: 'catalogItem' });
  ServiceRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ServiceRequest.belongsTo(User, { foreignKey: 'requestedForUserId', as: 'requestedForUser' });
  ServiceRequest.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
  ServiceRequest.belongsTo(User, { foreignKey: 'rejectedById', as: 'rejectedBy' });
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
  Asset.belongsTo(User, { foreignKey: 'clientId', as: 'client' }); // Legado
  Asset.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // Legado
  Asset.belongsTo(Client, { foreignKey: 'clientId', as: 'clientEntity' }); // Novo
  Asset.belongsTo(OrganizationUser, { foreignKey: 'userId', as: 'orgUser' }); // Novo
  Asset.belongsTo(ClientUser, { foreignKey: 'userId', as: 'clientUser' }); // Novo
  
  Organization.hasMany(Asset, { foreignKey: 'organizationId', as: 'assets' });
  User.hasMany(Asset, { foreignKey: 'clientId', as: 'clientAssets' }); // Legado
  User.hasMany(Asset, { foreignKey: 'userId', as: 'userAssets' }); // Legado
  Client.hasMany(Asset, { foreignKey: 'clientId', as: 'clientAssets' }); // Novo
  OrganizationUser.hasMany(Asset, { foreignKey: 'userId', as: 'userAssets' }); // Novo
  ClientUser.hasMany(Asset, { foreignKey: 'userId', as: 'userAssets' }); // Novo

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

  // RemoteAccess associations
  RemoteAccess.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  RemoteAccess.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
  RemoteAccess.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
  RemoteAccess.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
  RemoteAccess.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
  
  Ticket.hasMany(RemoteAccess, { foreignKey: 'ticketId', as: 'remoteAccesses' });
  User.hasMany(RemoteAccess, { foreignKey: 'clientId', as: 'remoteAccessRequests' });
};

export {
  Organization,
  User,
  OrganizationUser,
  Plan,
  Subscription,
  Client,
  ClientUser,
  Direction,
  Department,
  Section,
  Category,
  Ticket,
  TicketHistory,
  Comment,
  Attachment,
  AttachmentModel,
  SLA,
  Priority,
  Type,
  KnowledgeArticle,
  HoursBank,
  HoursTransaction,
  TimeTracking,
  Tag,
  TicketTag,
  ResponseTemplate,
  EmailTemplate,
  Service,
  Incident,
  Maintenance,
  StatusSubscription,
  TicketTemplate,
  Macro,
  Workflow,
  WorkflowExecution,
  Dashboard,
  Report,
  KPI,
  SearchIndex,
  SavedSearch,
  TicketRelationship,
  TeamWorkspace,
  SharedView,
  TicketMention,
  Badge,
  UserBadge,
  GamePoints,
  AuditLog,
  IPWhitelist,
  Webhook,
  WebhookLog,
  Integration,
  CatalogCategory,
  CatalogItem,
  ServiceRequest,
  Notification,
  Asset,
  Software,
  License,
  AssetLicense,
  RemoteAccess,
  Role,
  Permission,
  RolePermission,
  UserPermission,
  setupAssociations
};
