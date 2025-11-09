import { Router } from 'express';
import searchController from './searchController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== SEARCH =====

// Busca global
router.get('/',
  authMiddleware,
  searchController.search.bind(searchController)
);

// Sugestões
router.get('/suggestions',
  authMiddleware,
  searchController.suggestions.bind(searchController)
);

// ===== SAVED SEARCHES =====

// Listar buscas salvas
router.get('/saved',
  authMiddleware,
  searchController.getSavedSearches.bind(searchController)
);

// Salvar busca
router.post('/saved',
  authMiddleware,
  searchController.saveSearch.bind(searchController)
);

// Executar busca salva
router.get('/saved/:id/execute',
  authMiddleware,
  searchController.executeSavedSearch.bind(searchController)
);

// Remover busca salva
router.delete('/saved/:id',
  authMiddleware,
  searchController.deleteSavedSearch.bind(searchController)
);

// ===== RECENT SEARCHES =====

// Buscar buscas recentes
router.get('/recent',
  authMiddleware,
  searchController.getRecentSearches.bind(searchController)
);

// ===== INDEXING =====

// Reindexar tudo
router.post('/reindex',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  searchController.reindex.bind(searchController)
);

// Indexar entidade específica
router.post('/index',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  searchController.indexEntity.bind(searchController)
);

// ===== STATISTICS =====

// Estatísticas de busca
router.get('/statistics',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  searchController.getStatistics.bind(searchController)
);

export default router;
