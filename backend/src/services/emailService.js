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

/**
 * Enviar email de verificação para onboarding SaaS
 */
export const sendEmailVerification = async (email, name, token, organizationName) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5176'}/onboarding?verify=${token}&email=${encodeURIComponent(email)}`;
    
    const content = `
      <p>Olá <strong>${name}</strong>,</p>
      <p>Bem-vindo ao <strong>TatuTicket</strong>! Para completar o registo da sua organização <strong>${organizationName}</strong>, precisa de verificar o seu email.</p>
      
      <div class="verification-code" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <h2 style="margin: 0; color: #495057; font-size: 32px; letter-spacing: 8px; font-family: 'Courier New', monospace;">${token}</h2>
        <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">Código de verificação</p>
      </div>
      
      <p>Copie este código e cole no formulário de onboarding, ou clique no botão abaixo:</p>
      
      <a href="${verificationUrl}" class="button">Verificar Email</a>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        Se não solicitou este registo, pode ignorar este email.<br>
        Este código expira em 24 horas por motivos de segurança.
      </p>
    `;

    await sendEmail({
      to: email,
      subject: `Verifique seu email - ${organizationName} | TatuTicket`,
      html: baseTemplate('Verificação de Email', content),
      text: `Código de verificação: ${token}. Use este código para completar o registo da sua organização ${organizationName} no TatuTicket.`
    });

    logger.info(`Email de verificação enviado para: ${email} (${organizationName})`);
    return { success: true };
  } catch (error) {
    logger.error('Erro ao enviar email de verificação:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar email de boas-vindas após verificação
 */
export const sendWelcomeEmail = async (email, name, organizationName, portalUrl, adminPassword) => {
  try {
    const content = `
      <p>Olá <strong>${name}</strong>,</p>
      <p>🎉 <strong>Parabéns!</strong> A sua organização <strong>${organizationName}</strong> está pronta para usar o TatuTicket!</p>
      
      <div class="info-box" style="background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #155724;">🚀 Detalhes de Acesso</h3>
        <p style="margin: 5px 0;"><strong>URL do Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Plano:</strong> Profissional (Trial de 14 dias)</p>
      </div>
      
      <p><strong>Próximos passos:</strong></p>
      <ul style="line-height: 1.8;">
        <li>Acesse o seu portal usando o link acima</li>
        <li>Configure a estrutura da sua organização (departamentos, utilizadores)</li>
        <li>Personalize as configurações do sistema</li>
        <li>Comece a usar o sistema de tickets</li>
      </ul>
      
      <a href="${portalUrl}" class="button">Acessar Portal</a>
      
      <div class="support-info" style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 30px 0;">
        <p style="margin: 0;"><strong>Precisa de ajuda?</strong></p>
        <p style="margin: 5px 0 0 0;">Nossa equipa de suporte está pronta para ajudar: <a href="mailto:suporte@tatuticket.com">suporte@tatuticket.com</a></p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `🎉 Bem-vindo ao TatuTicket - ${organizationName}`,
      html: baseTemplate('Bem-vindo ao TatuTicket!', content),
      text: `Bem-vindo ao TatuTicket! Sua organização ${organizationName} está pronta. Acesse: ${portalUrl}`
    });

    logger.info(`Email de boas-vindas enviado para: ${email} (${organizationName})`);
    return { success: true };
  } catch (error) {
    logger.error('Erro ao enviar email de boas-vindas:', error);
    return { success: false, error: error.message };
  }
};

export const sendClientAdminWelcomeEmail = async ({ email, name, clientName, tenantName, portalUrl }) => {
  try {
    const accessUrl = portalUrl || process.env.CLIENT_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const content = `
      <p>Olá <strong>${name}</strong>,</p>
      <p>A empresa <strong>${clientName}</strong> foi configurada no TatuTicket por <strong>${tenantName || 'a sua equipa de suporte'}</strong>.</p>

      <div class="info-box" style="background: #e8f0ff; border: 1px solid #c3d4ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #1d4ed8;">🔐 Acesso ao Portal do Cliente</h3>
        <p style="margin: 5px 0;"><strong>Portal:</strong> <a href="${accessUrl}">${accessUrl}</a></p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
      </div>

      <p><strong>Próximos passos sugeridos:</strong></p>
      <ul style="line-height: 1.8;">
        <li>Acesse o portal com o email acima (a password definida no registo inicial)</li>
        <li>Configure a estrutura da sua empresa (departamentos, equipas, contactos)</li>
        <li>Crie outros utilizadores e atribua roles personalizados</li>
        <li>Disponibilize a base de conhecimento e canais de suporte aos seus colaboradores</li>
      </ul>

      <a href="${accessUrl}" class="button">Entrar no Portal do Cliente</a>

      <div class="support-info" style="background: #f8f9fa; border-left: 4px solid #1d4ed8; padding: 15px; margin: 30px 0;">
        <p style="margin: 0;"><strong>Precisa de ajuda?</strong></p>
        <p style="margin: 5px 0 0 0;">Contacte a equipa de suporte do TatuTicket ou o administrador da organização ${tenantName || ''}.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `Bem-vindo ao Portal do Cliente - ${clientName}`,
      html: baseTemplate('Portal do Cliente disponível', content),
      text: `Portal do Cliente disponível para ${clientName}. Acesse ${accessUrl} com o email ${email}.`
    });

    logger.info(`Email de boas-vindas do portal do cliente enviado para: ${email} (${clientName})`);
    return { success: true };
  } catch (error) {
    logger.error('Erro ao enviar email de boas-vindas do portal do cliente:', error);
    return { success: false, error: error.message };
  }
};

export default {
  notifyNewTicket,
  notifyNewComment,
  notifyStatusChange,
  notifyTicketAssignment,
  notifyRequesterResponse,
  sendEmailVerification,
  sendWelcomeEmail,
  sendClientAdminWelcomeEmail
};
