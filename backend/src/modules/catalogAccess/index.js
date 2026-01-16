import ClientCatalogAccess from './ClientCatalogAccess.js';
import ClientUserCatalogAccess from './ClientUserCatalogAccess.js';
import CatalogAccessAuditLog from './CatalogAccessAuditLog.js';

// Note: Routes and controller are NOT exported here to avoid circular dependencies
// Import them directly where needed:
//   import catalogAccessRoutes from './modules/catalogAccess/catalogAccessRoutes.js';
//   import * as catalogAccessController from './modules/catalogAccess/catalogAccessController.js';

export {
  ClientCatalogAccess,
  ClientUserCatalogAccess,
  CatalogAccessAuditLog
};
