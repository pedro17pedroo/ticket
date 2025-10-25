import { sendEmail } from '../config/email.js';
import logger from '../config/logger.js';

/**
 * Template base HTML para emails
 */
const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #eee;
    }
    .ticket-info {
      background: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-high { background: #fee; color: #c33; }
    .badge-medium { background: #fef3cd; color: #856404; }
    .badge-low { background: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Este é um email automático do TatuTicket. Por favor não responda.</p>
      <p>&copy; ${new Date().getFullYear()} TatuTicket. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Notificar criação de novo ticket
 */
export const notifyNewTicket = async (ticket, requester, assignee) => {
  try {
    const ticketUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tickets/${ticket.id}`;
    
    const content = `
      <p>Olá${assignee ? ` <strong>${assignee.name}</strong>` : ''},</p>
      <p>Um novo ticket foi criado${assignee ? ' e atribuído a você' : ''}:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket:</strong> #${ticket.ticketNumber}</p>
        <p><strong>Assunto:</strong> ${ticket.subject}</p>
        <p><strong>Prioridade:</strong> <span class="badge badge-${ticket.priority?.toLowerCase() || 'medium'}">${ticket.priority || 'Média'}</span></p>
        <p><strong>Solicitante:</strong> ${requester.name} (${requester.email})</p>
      </div>
      
      <p><strong>Descrição:</strong></p>
      <p>${ticket.description}</p>
      
      <a href="${ticketUrl}" class="button">Ver Ticket</a>
    `;

    const recipients = [];
    
    // Enviar para agente atribuído
    if (assignee?.email) {
      recipients.push(assignee.email);
    }
    
    // Enviar para todos os admins se não houver atribuição
    // TODO: Buscar admins da organização
    
    for (const email of recipients) {
      await sendEmail({
        to: email,
        subject: `Novo Ticket #${ticket.ticketNumber} - ${ticket.subject}`,
        html: baseTemplate('Novo Ticket Criado', content),
        text: `Novo ticket #${ticket.ticketNumber}: ${ticket.subject}\n\nDescrição: ${ticket.description}`
      });
    }

    logger.info(`Notificação de novo ticket enviada: #${ticket.ticketNumber}`);
  } catch (error) {
    logger.error('Erro ao enviar notificação de novo ticket:', error);
  }
};

/**
 * Notificar novo comentário
 */
export const notifyNewComment = async (ticket, comment, author, recipients) => {
  try {
    const ticketUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tickets/${ticket.id}`;
    
    const content = `
      <p>Olá,</p>
      <p><strong>${author.name}</strong> adicionou um ${comment.isInternal ? 'comentário interno' : 'comentário'} ao ticket:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket:</strong> #${ticket.ticketNumber} - ${ticket.subject}</p>
        ${comment.isInternal ? '<p><strong>🔒 Comentário Interno</strong> (visível apenas para agentes)</p>' : ''}
      </div>
      
      <p><strong>Comentário:</strong></p>
      <p>${comment.content}</p>
      
      <a href="${ticketUrl}" class="button">Ver Ticket</a>
    `;

    for (const email of recipients) {
      await sendEmail({
        to: email,
        subject: `Novo comentário no ticket #${ticket.ticketNumber}`,
        html: baseTemplate('Novo Comentário', content),
        text: `${author.name} comentou no ticket #${ticket.ticketNumber}:\n\n${comment.content}`
      });
    }

    logger.info(`Notificação de comentário enviada para ticket #${ticket.ticketNumber}`);
  } catch (error) {
    logger.error('Erro ao enviar notificação de comentário:', error);
  }
};

/**
 * Notificar mudança de status
 */
export const notifyStatusChange = async (ticket, oldStatus, newStatus, changedBy, recipients) => {
  try {
    const ticketUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tickets/${ticket.id}`;
    
    const statusLabels = {
      novo: 'Novo',
      em_progresso: 'Em Progresso',
      aguardando_cliente: 'Aguardando Cliente',
      resolvido: 'Resolvido',
      fechado: 'Fechado'
    };

    const content = `
      <p>Olá,</p>
      <p>O status do ticket foi alterado por <strong>${changedBy.name}</strong>:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket:</strong> #${ticket.ticketNumber} - ${ticket.subject}</p>
        <p><strong>Status Anterior:</strong> ${statusLabels[oldStatus] || oldStatus}</p>
        <p><strong>Novo Status:</strong> ${statusLabels[newStatus] || newStatus}</p>
      </div>
      
      <a href="${ticketUrl}" class="button">Ver Ticket</a>
    `;

    for (const email of recipients) {
      await sendEmail({
        to: email,
        subject: `Ticket #${ticket.ticketNumber} - Status alterado para ${statusLabels[newStatus]}`,
        html: baseTemplate('Status Alterado', content),
        text: `O ticket #${ticket.ticketNumber} teve seu status alterado para ${statusLabels[newStatus]}`
      });
    }

    logger.info(`Notificação de mudança de status enviada para ticket #${ticket.ticketNumber}`);
  } catch (error) {
    logger.error('Erro ao enviar notificação de mudança de status:', error);
  }
};

/**
 * Notificar atribuição de ticket
 */
export const notifyTicketAssignment = async (ticket, assignee, assignedBy) => {
  try {
    if (!assignee?.email) return;

    const ticketUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tickets/${ticket.id}`;
    
    const content = `
      <p>Olá <strong>${assignee.name}</strong>,</p>
      <p>Um ticket foi atribuído a você por <strong>${assignedBy.name}</strong>:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket:</strong> #${ticket.ticketNumber}</p>
        <p><strong>Assunto:</strong> ${ticket.subject}</p>
        <p><strong>Prioridade:</strong> <span class="badge badge-${ticket.priority?.toLowerCase() || 'medium'}">${ticket.priority || 'Média'}</span></p>
      </div>
      
      <p><strong>Descrição:</strong></p>
      <p>${ticket.description}</p>
      
      <a href="${ticketUrl}" class="button">Ver Ticket</a>
    `;

    await sendEmail({
      to: assignee.email,
      subject: `Ticket #${ticket.ticketNumber} atribuído a você`,
      html: baseTemplate('Ticket Atribuído', content),
      text: `O ticket #${ticket.ticketNumber} foi atribuído a você`
    });

    logger.info(`Notificação de atribuição enviada para ${assignee.email}`);
  } catch (error) {
    logger.error('Erro ao enviar notificação de atribuição:', error);
  }
};

/**
 * Notificar solicitante sobre resposta
 */
export const notifyRequesterResponse = async (ticket, comment, agent) => {
  try {
    if (!ticket.requester?.email || comment.isInternal) return;

    const ticketUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/tickets/${ticket.id}`;
    
    const content = `
      <p>Olá <strong>${ticket.requester.name}</strong>,</p>
      <p>Há uma nova resposta no seu ticket:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket:</strong> #${ticket.ticketNumber} - ${ticket.subject}</p>
        <p><strong>Respondido por:</strong> ${agent.name}</p>
      </div>
      
      <p><strong>Resposta:</strong></p>
      <p>${comment.content}</p>
      
      <a href="${ticketUrl}" class="button">Ver Ticket</a>
    `;

    await sendEmail({
      to: ticket.requester.email,
      subject: `Resposta no ticket #${ticket.ticketNumber}`,
      html: baseTemplate('Nova Resposta', content),
      text: `Há uma nova resposta no seu ticket #${ticket.ticketNumber}`
    });

    logger.info(`Notificação de resposta enviada para solicitante: ${ticket.requester.email}`);
  } catch (error) {
    logger.error('Erro ao enviar notificação para solicitante:', error);
  }
};

export default {
  notifyNewTicket,
  notifyNewComment,
  notifyStatusChange,
  notifyTicketAssignment,
  notifyRequesterResponse
};
