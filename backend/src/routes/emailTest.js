import express from 'express';
import { sendEmail } from '../config/email.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * Endpoint de teste para email
 * GET /api/test-email?to=email@example.com
 */
router.get('/test-email', async (req, res) => {
  try {
    const { to } = req.query;
    
    if (!to) {
      return res.status(400).json({ error: 'Parâmetro "to" é obrigatório' });
    }

    const result = await sendEmail({
      to: to,
      subject: '🧪 Teste de Email - TatuTicket',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🧪 Teste de Email</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">TatuTicket Sistema</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #1f2937;">Email de Teste Funcionando!</h2>
            <p>Se você recebeu este email, a configuração SMTP está funcionando corretamente.</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: 'Teste de email - TatuTicket Sistema funcionando!'
    });

    logger.info(`Teste de email enviado para ${to}`, result);

    res.json({
      success: result.success,
      message: result.success ? 'Email de teste enviado com sucesso!' : 'Falha ao enviar email',
      details: result
    });

  } catch (error) {
    logger.error('Erro no teste de email:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

export default router;
