import { Router } from 'express';
import advancedTemplateController from './advancedTemplateController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== TICKET TEMPLATES =====

// Listar templates
router.get('/templates',
  authMiddleware,
  advancedTemplateController.getTemplates.bind(advancedTemplateController)
);

// Buscar template por ID
router.get('/templates/:id',
  authMiddleware,
  advancedTemplateController.getTemplateById.bind(advancedTemplateController)
);

// Criar template
router.post('/templates',
  authMiddleware,
  requireRole(['admin', 'admin-org', 'tecnico', 'agente']),
  advancedTemplateController.createTemplate.bind(advancedTemplateController)
);

// Atualizar template
router.put('/templates/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org', 'tecnico', 'agente']),
  advancedTemplateController.updateTemplate.bind(advancedTemplateController)
);

// Deletar template
router.delete('/templates/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  advancedTemplateController.deleteTemplate.bind(advancedTemplateController)
);

// Aplicar template a ticket
router.post('/templates/apply',
  authMiddleware,
  advancedTemplateController.applyTemplate.bind(advancedTemplateController)
);

// ===== MACROS =====

// Listar macros
router.get('/macros',
  authMiddleware,
  advancedTemplateController.getMacros.bind(advancedTemplateController)
);

// Buscar macro por ID
router.get('/macros/:id',
  authMiddleware,
  advancedTemplateController.getMacroById.bind(advancedTemplateController)
);

// Criar macro
router.post('/macros',
  authMiddleware,
  requireRole(['admin', 'admin-org', 'tecnico']),
  advancedTemplateController.createMacro.bind(advancedTemplateController)
);

// Atualizar macro
router.put('/macros/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org', 'tecnico']),
  advancedTemplateController.updateMacro.bind(advancedTemplateController)
);

// Deletar macro
router.delete('/macros/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  advancedTemplateController.deleteMacro.bind(advancedTemplateController)
);

// Executar macro
router.post('/macros/execute',
  authMiddleware,
  advancedTemplateController.executeMacro.bind(advancedTemplateController)
);

// Executar macro em lote
router.post('/macros/batch-execute',
  authMiddleware,
  requireRole(['admin', 'admin-org', 'tecnico']),
  advancedTemplateController.batchExecuteMacro.bind(advancedTemplateController)
);

// ===== EMAIL TEMPLATES =====

// Listar templates de e-mail
router.get('/email-templates',
  authMiddleware,
  advancedTemplateController.getEmailTemplates.bind(advancedTemplateController)
);

// Criar template de e-mail
router.post('/email-templates',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  advancedTemplateController.createEmailTemplate.bind(advancedTemplateController)
);

// Atualizar template de e-mail
router.put('/email-templates/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  advancedTemplateController.updateEmailTemplate.bind(advancedTemplateController)
);

// Deletar template de e-mail
router.delete('/email-templates/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  advancedTemplateController.deleteEmailTemplate.bind(advancedTemplateController)
);

// Preview de template de e-mail
router.get('/email-templates/:id/preview',
  authMiddleware,
  advancedTemplateController.previewEmailTemplate.bind(advancedTemplateController)
);

// ===== UTILITÁRIOS =====

// Itens de acesso rápido
router.get('/quick-access',
  authMiddleware,
  advancedTemplateController.getQuickAccessItems.bind(advancedTemplateController)
);

// Estatísticas
router.get('/statistics',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  advancedTemplateController.getTemplateStatistics.bind(advancedTemplateController)
);

export default router;
