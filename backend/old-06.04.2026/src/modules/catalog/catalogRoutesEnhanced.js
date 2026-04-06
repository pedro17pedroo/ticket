import { Router } from 'express';
import catalogController from './catalogControllerEnhanced.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== CATALOG CATEGORIES =====

// Listar categorias
router.get('/categories',
  authMiddleware,
  catalogController.getCategories.bind(catalogController)
);

// Buscar categoria por ID
router.get('/categories/:id',
  authMiddleware,
  catalogController.getCategoryById.bind(catalogController)
);

// Criar categoria (Admin apenas)
router.post('/categories',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  catalogController.createCategory.bind(catalogController)
);

// Atualizar categoria (Admin apenas)
router.put('/categories/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  catalogController.updateCategory.bind(catalogController)
);

// Deletar categoria (Admin apenas)
router.delete('/categories/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  catalogController.deleteCategory.bind(catalogController)
);

// ===== CATALOG ITEMS =====

// Listar itens
router.get('/items',
  authMiddleware,
  catalogController.getItems.bind(catalogController)
);

// Buscar item por ID (com schema do formulário)
router.get('/items/:id',
  authMiddleware,
  catalogController.getItemById.bind(catalogController)
);

// Criar item (Admin apenas)
router.post('/items',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  catalogController.createItem.bind(catalogController)
);

// Atualizar item (Admin apenas)
router.put('/items/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  catalogController.updateItem.bind(catalogController)
);

// Deletar item (Admin apenas)
router.delete('/items/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  catalogController.deleteItem.bind(catalogController)
);

// ===== SERVICE REQUESTS (DEPRECATED) =====

// @deprecated Use /items/:id/ticket instead
// Criar service request a partir de um item
router.post('/items/:id/request',
  authMiddleware,
  catalogController.createServiceRequest.bind(catalogController)
);

// @deprecated Use /api/tickets/my-tickets instead
// Listar minhas requests
router.get('/requests',
  authMiddleware,
  catalogController.getMyRequests.bind(catalogController)
);

// Detalhes de uma request
router.get('/requests/:id',
  authMiddleware,
  catalogController.getRequestById.bind(catalogController)
);

// ===== TICKETS (UNIFICADO) =====

// 🆕 Criar ticket diretamente do catálogo (substitui /items/:id/request)
router.post('/items/:id/ticket',
  authMiddleware,
  catalogController.createTicketFromCatalog.bind(catalogController)
);

// ===== PORTAL PÚBLICO =====

// Portal público do catálogo (sem autenticação)
router.get('/portal',
  catalogController.getPublicPortal.bind(catalogController)
);

export default router;
