import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as providerController from '../modules/organizations/providerController.js';
import * as settingsController from '../modules/settings/settingsController.js';
import * as reportsController from '../modules/reports/reportsController.js';
import * as monitoringController from '../modules/monitoring/monitoringController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Configuração de upload para logos
const logosDir = path.join(process.cwd(), 'uploads', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Use PNG ou JPG.'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Apenas Provider (super-admin e provider-admin) podem acessar
router.use(authorize('super-admin', 'provider-admin'));

// ==================== TENANTS ====================

// Listar tenants
router.get('/tenants', providerController.getTenants);

// Obter tenant específico
router.get('/tenants/:id', providerController.getTenantById);

// Criar novo tenant
router.post('/tenants', providerController.createTenant);

// Atualizar tenant
router.put('/tenants/:id', providerController.updateTenant);

// Suspender tenant
router.put('/tenants/:id/suspend', providerController.suspendTenant);

// Reativar tenant
router.put('/tenants/:id/activate', providerController.activateTenant);

// ==================== PROVIDER USERS ====================

// Listar usuários provider (super-admin, provider-admin)
router.get('/users', providerController.getProviderUsers);

// Obter usuário provider por ID
router.get('/users/:id', providerController.getProviderUserById);

// Criar usuário provider
router.post('/users', providerController.createProviderUser);

// Atualizar usuário provider
router.put('/users/:id', providerController.updateProviderUser);

// Deletar usuário provider
router.delete('/users/:id', providerController.deleteProviderUser);

// Toggle status do usuário
router.post('/users/:id/toggle-status', providerController.toggleProviderUserStatus);

// Atualizar permissões
router.put('/users/:id/permissions', providerController.updateProviderUserPermissions);

// Resetar senha
router.post('/users/:id/reset-password', providerController.resetProviderUserPassword);

// ==================== STATISTICS ====================

// Estatísticas globais
router.get('/stats', providerController.getGlobalStats);

// ==================== SETTINGS ====================

// Configurações gerais
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

// Upload de logo
router.post('/settings/logo', logoUpload.single('logo'), settingsController.uploadLogo);

// Configurações de segurança
router.get('/settings/security', settingsController.getSecuritySettings);
router.put('/settings/security', settingsController.updateSecuritySettings);

// Configurações de integrações
router.get('/settings/integrations', settingsController.getIntegrationSettings);
router.put('/settings/integrations', settingsController.updateIntegrationSettings);
router.post('/settings/integrations/generate-key', settingsController.generateApiKey);

// ==================== EMAIL SETTINGS ====================

// Configurações de email
router.get('/settings/email', settingsController.getEmailSettings);
router.put('/settings/email', settingsController.updateEmailSettings);
router.post('/settings/email/test', settingsController.testEmail);

// ==================== AUDIT LOGS ====================

// Logs de auditoria
router.get('/audit-logs', settingsController.getAuditLogs);
router.get('/audit-logs/changes', settingsController.getChangeHistory);

// ==================== REPORTS ====================

// Relatórios
router.get('/reports/financial', reportsController.getFinancialReports);
router.get('/reports/usage', reportsController.getUsageReports);
router.get('/reports/support', reportsController.getSupportReports);

// ==================== MONITORING ====================

// Monitoramento
router.get('/monitoring/status', monitoringController.getSystemStatus);
router.get('/monitoring/logs', monitoringController.getLogs);
router.get('/monitoring/performance', monitoringController.getPerformanceMetrics);

export default router;
