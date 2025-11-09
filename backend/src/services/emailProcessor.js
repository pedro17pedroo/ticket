import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import Imap from 'imap-simple';
import { Ticket } from '../modules/models/index.js';
import { User } from '../modules/models/index.js';
import { Comment } from '../modules/models/index.js';
import { Attachment } from '../modules/models/index.js';
import { EmailTemplate } from '../modules/models/index.js';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

class EmailProcessor {
  constructor() {
    this.config = {
      imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT || '993'),
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
          servername: process.env.IMAP_HOST || 'imap.gmail.com',
          minVersion: 'TLSv1.2'
        },
        authTimeout: 10000,
        connTimeout: 10000
      },
      smtp: {
        host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
        secure: false, // STARTTLS
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER || process.env.IMAP_USER,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || process.env.IMAP_PASS
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        }
      }
    };

    this.transporter = null;
    this.connection = null;
    this.processedEmails = new Set(); // Para evitar duplicados
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.ticketRefRegex = /\[#(\d+)\]/g;
  }

  async initialize() {
    try {
      // Configurar transporter para envio de e-mails
      this.transporter = nodemailer.createTransport(this.config.smtp);
      
      // Verificar configuração SMTP
      await this.transporter.verify();
      logger.info('📧 Serviço de e-mail SMTP configurado com sucesso');

      // Iniciar monitoramento IMAP
      await this.startImapMonitoring();
      
      return true;
    } catch (error) {
      logger.error('❌ Erro ao inicializar serviço de e-mail:', error);
      throw error;
    }
  }

  async startImapMonitoring() {
    try {
      this.connection = await Imap.connect({
        imap: this.config.imap
      });

      logger.info('📥 Conectado ao servidor IMAP');

      // Processar e-mails não lidos
      setInterval(async () => {
        await this.checkNewEmails();
      }, 60000); // Verificar a cada minuto

      // Processar e-mails iniciais
      await this.checkNewEmails();
    } catch (error) {
      logger.error('❌ Erro ao conectar IMAP:', error);
      setTimeout(() => this.startImapMonitoring(), 30000); // Retry em 30s
    }
  }

  async checkNewEmails() {
    try {
      if (!this.connection) return;

      await this.connection.openBox('INBOX');
      
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: [''],
        markSeen: true
      };

      const messages = await this.connection.search(searchCriteria, fetchOptions);

      for (const message of messages) {
        try {
          const parsed = await this.parseEmail(message);
          
          // Verificar se já foi processado (evitar duplicados)
          const messageId = parsed.messageId || crypto.randomBytes(16).toString('hex');
          if (this.processedEmails.has(messageId)) {
            continue;
          }
          
          this.processedEmails.add(messageId);
          
          // Processar e-mail
          await this.processIncomingEmail(parsed);
        } catch (error) {
          logger.error('Erro ao processar e-mail:', error);
        }
      }
    } catch (error) {
      logger.error('Erro ao verificar novos e-mails:', error);
    }
  }

  async parseEmail(message) {
    const all = message.parts.find(part => part.which === '');
    const parsed = await simpleParser(all.body);

    return {
      from: parsed.from?.value[0]?.address || '',
      fromName: parsed.from?.value[0]?.name || '',
      to: parsed.to?.value[0]?.address || '',
      subject: parsed.subject || 'Sem assunto',
      body: this.extractBody(parsed),
      html: parsed.html || '',
      text: parsed.text || '',
      attachments: parsed.attachments || [],
      messageId: parsed.messageId,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references,
      date: parsed.date || new Date()
    };
  }

  extractBody(parsed) {
    // Preferir texto simples, senão converter HTML
    if (parsed.text) {
      return this.cleanEmailBody(parsed.text);
    }
    
    if (parsed.html) {
      // Remove tags HTML básicas
      return parsed.html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
    }
    
    return '';
  }

  cleanEmailBody(text) {
    // Remove assinaturas comuns e quoted text
    const lines = text.split('\n');
    const cleanedLines = [];
    let foundSignature = false;

    for (const line of lines) {
      // Detectar assinaturas comuns
      if (line.match(/^--\s*$/) || 
          line.match(/^_{3,}/) ||
          line.match(/^On .+ wrote:/) ||
          line.match(/^From:/) ||
          line.match(/^Sent from my/)) {
        foundSignature = true;
        break;
      }

      // Remover linhas de quote
      if (!line.startsWith('>')) {
        cleanedLines.push(line);
      }
    }

    return cleanedLines.join('\n').trim();
  }

  async processIncomingEmail(email) {
    try {
      logger.info(`📧 Processando e-mail de: ${email.from}`);

      // 1. Verificar se é resposta a ticket existente
      const existingTicket = await this.findRelatedTicket(email);
      
      if (existingTicket) {
        logger.info(`📎 Adicionando resposta ao ticket #${existingTicket.ticketNumber}`);
        return await this.addCommentToTicket(existingTicket, email);
      }

      // 2. Buscar ou criar usuário
      const user = await this.findOrCreateUser(email);

      // 3. Criar novo ticket
      const ticket = await this.createTicketFromEmail(email, user);
      logger.info(`✅ Novo ticket criado: #${ticket.ticketNumber}`);

      // 4. Processar anexos
      if (email.attachments?.length > 0) {
        await this.processAttachments(ticket, email.attachments);
      }

      // 5. Enviar auto-resposta
      await this.sendAutoResponse(ticket, email.from);

      return ticket;
    } catch (error) {
      logger.error('Erro ao processar e-mail:', error);
      throw error;
    }
  }

  async findRelatedTicket(email) {
    // 1. Verificar por referência no assunto [#12345]
    const matches = email.subject.match(this.ticketRefRegex);
    if (matches) {
      const ticketNumber = matches[1];
      const ticket = await Ticket.findOne({
        where: { ticketNumber }
      });
      if (ticket) return ticket;
    }

    // 2. Verificar por In-Reply-To ou References headers
    if (email.inReplyTo || email.references) {
      const comment = await Comment.findOne({
        where: {
          emailMessageId: email.inReplyTo || email.references
        },
        include: [Ticket]
      });
      if (comment) return comment.ticket;
    }

    // 3. Verificar por assunto similar (últimas 24h)
    const recentTicket = await Ticket.findOne({
      where: {
        subject: email.subject.replace(/^(Re:|Fwd:)\s*/gi, '').trim(),
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    return recentTicket;
  }

  async findOrCreateUser(email) {
    let user = await User.findOne({
      where: { email: email.from }
    });

    if (!user) {
      // Criar usuário como cliente
      user = await User.create({
        name: email.fromName || email.from.split('@')[0],
        email: email.from,
        password: crypto.randomBytes(16).toString('hex'), // Senha aleatória
        role: 'cliente-org',
        active: true,
        organizationId: 1 // TODO: Determinar organização baseado no domínio
      });
      
      logger.info(`👤 Novo usuário criado via e-mail: ${user.email}`);
    }

    return user;
  }

  async createTicketFromEmail(email, user) {
    const ticket = await Ticket.create({
      ticketNumber: await this.generateTicketNumber(),
      subject: email.subject,
      description: email.body,
      status: 'novo',
      priority: await this.detectPriority(email),
      type: 'suporte', // Default
      requesterId: user.id,
      organizationId: user.organizationId,
      source: 'email',
      emailMessageId: email.messageId
    });

    // Criar primeiro comentário com o conteúdo do e-mail
    await Comment.create({
      content: email.body,
      ticketId: ticket.id,
      userId: user.id,
      isPublic: true,
      emailMessageId: email.messageId
    });

    return ticket;
  }

  async generateTicketNumber() {
    const lastTicket = await Ticket.findOne({
      order: [['ticketNumber', 'DESC']]
    });

    const lastNumber = lastTicket ? parseInt(lastTicket.ticketNumber) : 0;
    return String(lastNumber + 1).padStart(6, '0');
  }

  async detectPriority(email) {
    const urgentKeywords = ['urgente', 'urgent', 'crítico', 'critical', 'emergency', 'asap'];
    const highKeywords = ['importante', 'important', 'alta prioridade', 'high priority'];
    
    const content = (email.subject + ' ' + email.body).toLowerCase();
    
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return 'urgente';
    }
    
    if (highKeywords.some(keyword => content.includes(keyword))) {
      return 'alta';
    }
    
    return 'media'; // Default
  }

  async addCommentToTicket(ticket, email) {
    const user = await this.findOrCreateUser(email);

    const comment = await Comment.create({
      content: email.body,
      ticketId: ticket.id,
      userId: user.id,
      isPublic: true,
      emailMessageId: email.messageId
    });

    // Atualizar status do ticket se estava fechado
    if (ticket.status === 'fechado' || ticket.status === 'resolvido') {
      await ticket.update({ 
        status: 'em_progresso',
        reopenedAt: new Date()
      });
    }

    // Processar anexos
    if (email.attachments?.length > 0) {
      await this.processAttachments(ticket, email.attachments, comment.id);
    }

    // Notificar agente responsável
    if (ticket.assigneeId) {
      await this.notifyAgent(ticket, comment);
    }

    return ticket;
  }

  async processAttachments(ticket, attachments, commentId = null) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'tickets', String(ticket.id));
    await fs.mkdir(uploadDir, { recursive: true });

    for (const attachment of attachments) {
      try {
        const filename = `${uuidv4()}-${attachment.filename}`;
        const filepath = path.join(uploadDir, filename);
        
        await fs.writeFile(filepath, attachment.content);

        await Attachment.create({
          filename: attachment.filename,
          originalName: attachment.filename,
          path: filepath,
          mimeType: attachment.contentType,
          size: attachment.size,
          ticketId: ticket.id,
          commentId: commentId,
          uploadedById: ticket.requesterId
        });

        logger.info(`📎 Anexo salvo: ${attachment.filename}`);
      } catch (error) {
        logger.error('Erro ao processar anexo:', error);
      }
    }
  }

  async sendAutoResponse(ticket, recipientEmail) {
    try {
      const template = await this.getAutoResponseTemplate();
      
      const mailOptions = {
        from: `"${process.env.SYSTEM_NAME || 'TatuTicket'}" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `[#${ticket.ticketNumber}] ${ticket.subject}`,
        html: this.renderTemplate(template, {
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status,
          portalUrl: process.env.PORTAL_URL || 'http://localhost:3001'
        }),
        messageId: `<${uuidv4()}@${process.env.SYSTEM_DOMAIN || 'tatuticket.com'}>`
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`✉️ Auto-resposta enviada para: ${recipientEmail}`);
    } catch (error) {
      logger.error('Erro ao enviar auto-resposta:', error);
    }
  }

  async getAutoResponseTemplate() {
    // Buscar template do banco ou usar padrão
    const template = await EmailTemplate.findOne({
      where: { type: 'auto_response', active: true }
    });

    if (template) {
      return template.content;
    }

    // Template padrão
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Recebemos sua solicitação</h2>
        <p>Olá,</p>
        <p>Recebemos sua solicitação e criamos o ticket <strong>#{{ticketNumber}}</strong>.</p>
        <p><strong>Assunto:</strong> {{subject}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <p>Nossa equipe analisará sua solicitação e responderá o mais breve possível.</p>
        <p>Você pode acompanhar o status do seu ticket através do nosso portal:</p>
        <p><a href="{{portalUrl}}/tickets/{{ticketNumber}}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Ver Ticket</a></p>
        <p>Atenciosamente,<br>Equipe de Suporte</p>
      </div>
    `;
  }

  renderTemplate(template, variables) {
    let rendered = template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, variables[key]);
    });
    
    return rendered;
  }

  async notifyAgent(ticket, comment) {
    try {
      const agent = await User.findByPk(ticket.assigneeId);
      if (!agent || !agent.email) return;

      const mailOptions = {
        from: `"${process.env.SYSTEM_NAME || 'TatuTicket'}" <${process.env.SMTP_USER}>`,
        to: agent.email,
        subject: `[#${ticket.ticketNumber}] Nova resposta do cliente`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h3>Nova resposta no ticket #${ticket.ticketNumber}</h3>
            <p><strong>Cliente:</strong> ${comment.user?.name || 'Cliente'}</p>
            <p><strong>Mensagem:</strong></p>
            <blockquote style="border-left: 3px solid #4F46E5; padding-left: 10px; margin-left: 0;">
              ${comment.content}
            </blockquote>
            <p><a href="${process.env.PORTAL_URL}/tickets/${ticket.id}">Ver ticket</a></p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      logger.error('Erro ao notificar agente:', error);
    }
  }

  async sendTicketUpdate(ticket, updates, recipientEmail) {
    try {
      const mailOptions = {
        from: `"${process.env.SYSTEM_NAME || 'TatuTicket'}" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `[#${ticket.ticketNumber}] Atualização do ticket`,
        html: this.renderUpdateTemplate(ticket, updates)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Notificação enviada para: ${recipientEmail}`);
    } catch (error) {
      logger.error('Erro ao enviar atualização:', error);
    }
  }

  renderUpdateTemplate(ticket, updates) {
    let updatesList = '';
    
    if (updates.status) {
      updatesList += `<li>Status alterado para: <strong>${updates.status}</strong></li>`;
    }
    if (updates.priority) {
      updatesList += `<li>Prioridade alterada para: <strong>${updates.priority}</strong></li>`;
    }
    if (updates.assignee) {
      updatesList += `<li>Atribuído para: <strong>${updates.assignee}</strong></li>`;
    }
    if (updates.comment) {
      updatesList += `<li>Novo comentário adicionado</li>`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Atualização do Ticket #${ticket.ticketNumber}</h2>
        <p>Seu ticket foi atualizado:</p>
        <ul>${updatesList}</ul>
        ${updates.comment ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <strong>Comentário:</strong>
            <p>${updates.comment}</p>
          </div>
        ` : ''}
        <p style="margin-top: 30px;">
          <a href="${process.env.PORTAL_URL}/tickets/${ticket.id}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Ver Ticket</a>
        </p>
      </div>
    `;
  }

  async cleanup() {
    // Limpar e-mails processados antigos da memória
    if (this.processedEmails.size > 1000) {
      const entries = Array.from(this.processedEmails);
      this.processedEmails = new Set(entries.slice(-500));
    }
  }

  async stop() {
    if (this.connection) {
      await this.connection.end();
      logger.info('📧 Conexão IMAP encerrada');
    }
    
    if (this.transporter) {
      this.transporter.close();
      logger.info('📧 Transporter SMTP encerrado');
    }
  }
}

export default new EmailProcessor();
