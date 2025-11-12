import nodemailer from 'nodemailer';
import logger from './logger.js';

const createTransporter = () => {
  // Configuração para Gmail (pode ser alterada para outros provedores)
  const config = {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    },
  };

  // Se não houver configuração SMTP, usar ethereal para testes
  if (!config.auth.user) {
    logger.warn('Configuração SMTP não encontrada. Usando modo de teste (emails não serão enviados).');
    return null;
  }

  const transporter = nodemailer.createTransport(config);

  // Verificar conexão
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Erro ao conectar ao servidor SMTP:', error);
    } else {
      logger.info('Servidor SMTP conectado e pronto para enviar emails');
    }
  });

  return transporter;
};

export const transporter = createTransporter();

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    logger.warn(`Email não enviado (modo teste): ${subject} para ${to}`);
    return { success: false, message: 'SMTP não configurado' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'TatuTicket'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email enviado: ${info.messageId} para ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
};

export default { transporter, sendEmail };
