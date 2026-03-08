import express from 'express';
import {
  createPayment,
  checkPaymentStatus,
  getPaymentHistory,
  getPaymentReceipt,
  calculateUpgrade
} from './paymentController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Criar pagamento
router.post('/create', createPayment);

// Verificar status do pagamento
router.get('/:id/status', checkPaymentStatus);

// Histórico de pagamentos
router.get('/history', getPaymentHistory);

// Obter recibo
router.get('/:id/receipt', getPaymentReceipt);

// Calcular valor de upgrade
router.post('/calculate-upgrade', calculateUpgrade);

export default router;
