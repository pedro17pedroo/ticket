import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import Imap from 'imap-simple';
import { Op } from 'sequelize';
import { Ticket } from '../modules/models/index.js';
import { User } from '../modules/models/index.js';
import { Comment } from '../modules/models/index.js';
import { Attachment } from '../modules/models/index.js';
import { EmailTemplate } from '../modules/models/index.js';
import emailRouterService from './emailRouterService.js';
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
    this.ticketRefRegex = /\[#?(TKT-\d+)\]/gi;
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
      
      // Limpar emails processados antigos a cada hora
      setInterval(() => this.cleanup(), 3600000);
      
      return true;
    } catch (error) {
      logger.error('❌ Erro ao inicializar serviço de e-mail:', error);
      throw error;
    }
  }

  async startImapMonitoring() {
    if (!process.env.IMAP_USER || !process.env.IMAP_PASS) {
      logger.info('📧 IMAP monitoring desativado (credenciais não configuradas)');
      return;
    }

    try {
      logger.info('📧 Tentando conectar ao IMAP...', {
        host: this.config.imap.host,
        port: this.config.imap.port,
        user: this.config.imap.user
      });

      this.connection = await Imap.connect({
        imap: this.config.imap
      });

      logger.info('📥 Conectado ao servidor IMAP com sucesso');

      // Configurar event handlers para a conexão
      if (this.connection.imap) {
        this.connection.imap.on('error', (err) => {
          logger.error('❌ Erro na conexão IMAP:', err.message);
          this.handleConnectionError();
        });

        this.connection.imap.on('end', () => {
          logger.warn('⚠️ Conexão IMAP encerrada');
          this.handleConnectionError();
        });

        this.connection.imap.on('close', () => {
          logger.warn('⚠️ Conexão IMAP fechada');
          this.handleConnectionError();
        });
      }

      // Processar e-mails não lidos a cada minuto
      this.emailCheckInterval = setInterval(async () => {
        await this.checkNewEmails();
      }, 60000);

      // Processar e-mails iniciais
      await this.checkNewEmails();
    } catch (error) {
      logger.error('❌ Erro ao conectar IMAP:', {
        message: error.message,
        code: error.code,
        host: this.config.imap.host,
        port: this.config.imap.port
      });
      
      this.handleConnectionError();
    }
  }

  handleConnectionError() {
    // Limpar conexão existente
    this.connection = null;
    
    // Limpar intervalo existente
    if (this.emailCheckInterval) {
      clearInterval(this.emailCheckInterval);
      this.emailCheckInterval = null;
    }
    
    // Tentar reconectar após 5 minutos
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        logger.info('🔄 Tentando reconectar ao IMAP...');
        this.startImapMonitoring();
      }, 300000);
    }
  }

  async checkNewEmails() {
    try {
      if (!this.connection) {
        logger.warn('⚠️ Conexão IMAP não disponível, pulando verificação');
        return;
      }

      await this.connection.openBox('INBOX');
      
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: [''],
        markSeen: true
      };

      const messages = await this.connection.search(searchCriteria, fetchOptions);

      if (messages.length > 0) {
        logger.info(`📬 ${messages.length} novos emails encontrados`);
      }

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
          logger.error('Erro ao processar e-mail individual:', error.message);
        }
      }
    } catch (error) {
      // Se erro de autenticação, tentar reconectar
      if (error.message?.includes('Not authenticated') || error.message?.includes('ENOTFOUND')) {
        logger.warn('⚠️ Conexão IMAP perdida, tentando reconectar...');
        this.connection = null;
        
        // Limpar intervalo existente
        if (this.emailCheckInterval) {
          clearInterval(this.emailCheckInterval);
          this.emailCheckInterval = null;
        }
        
        // Tentar reconectar após 2 minutos
        setTimeout(() => {
          this.startImapMonitoring();
        }, 120000);
      } else {
        logger.error('Erro ao verificar novos e-mails:', error.message);
      }
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
      logger.info(`📧 Processando e-mail de: ${email.from} para: ${email.to}`);

      // 1. Verificar se é resposta a ticket existente
      const existingTicket = await this.findRelatedTicket(email);
      
      if (existingTicket) {
        logger.info(`📎 Adicionando resposta ao ticket #${existingTicket.ticketNumber}`);
        return await this.addCommentToTicket(existingTicket, email);
      }

      // 2. Buscar utilizador (NÃO criar automaticamente)
      const userInfo = await this.findOrCreateUser(email);
      
      if (!userInfo) {
        logger.info(`ℹ️ Email processado mas ticket não criado: Utilizador ${email.from} não está registado`);
        // Email de notificação já foi enviado no findOrCreateUser
        return null;
      }

      // 3. Criar novo ticket (com roteamento por email)
      const ticket = await this.createTicketFromEmail(email, userInfo);
      logger.info(`✅ Novo ticket criado: #${ticket.ticketNumber}`);

      // 4. Processar anexos
      if (email.attachments?.length > 0) {
        await this.processAttachments(ticket, email.attachments);
      }

      // 5. Enviar auto-resposta (confirmação de criação do ticket)
      await this.sendAutoResponse(ticket, email.from);

      return ticket;
    } catch (error) {
      logger.error('Erro ao processar e-mail:', error);
      // Não fazer throw - apenas logar o erro
      return null;
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
    // Buscar em todas as tabelas de utilizadores
    const { OrganizationUser, ClientUser } = await import('../modules/models/index.js');
    
    // 1. Tentar encontrar em organization_users
    let user = await OrganizationUser.findOne({
      where: { email: email.from }
    });

    if (user) {
      logger.info(`👤 Utilizador encontrado (organization_users): ${user.email}`);
      return {
        user,
        type: 'organization',
        organizationId: user.organizationId
      };
    }

    // 2. Tentar encontrar em client_users
    user = await ClientUser.findOne({
      where: { email: email.from }
    });

    if (user) {
      logger.info(`👤 Utilizador encontrado (client_users): ${user.email}`);
      return {
        user,
        type: 'client',
        organizationId: user.organizationId
      };
    }

    // 3. Utilizador não encontrado - enviar email de notificação
    logger.warn(`⚠️ Email recebido de utilizador não registado: ${email.from}`);
    await this.sendUserNotRegisteredEmail(email.from, email.subject);
    
    return null;
  }

  async sendUserNotRegisteredEmail(recipientEmail, originalSubject) {
    try {
      const mailOptions = {
        from: `"${process.env.SYSTEM_NAME || 'TatuTicket'}" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `Re: ${originalSubject} - Registo Necessário`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Registo Necessário</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333; line-height: 1.6;">Olá,</p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Recebemos o seu email mas <strong>não foi possível criar um ticket</strong> porque o seu endereço de email 
                <strong>${recipientEmail}</strong> não está registado no nosso sistema.
              </p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>📋 Assunto do seu email:</strong><br>
                  ${originalSubject}
                </p>
              </div>
              
              <h3 style="color: #667eea; margin-top: 30px;">Como proceder:</h3>
              
              <ol style="font-size: 15px; color: #555; line-height: 1.8;">
                <li>Contacte o administrador do sistema para solicitar o registo</li>
                <li>Após o registo, poderá enviar emails para criar tickets automaticamente</li>
                <li>Ou aceda ao portal para criar tickets manualmente</li>
              </ol>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.ORGANIZATION_PORTAL_URL || 'http://localhost:5173'}" 
                   style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Aceder ao Portal
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                Se acredita que isto é um erro, por favor contacte o suporte.
              </p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Email de notificação enviado para: ${recipientEmail}`);
    } catch (error) {
      logger.error('Erro ao enviar email de notificação:', error);
    }
  }

  async createTicketFromEmail(email, userInfo) {
    const { user, type, organizationId } = userInfo;
    
    // Tentar rotear baseado no email de destino
    let routingInfo = null;
    if (email.to) {
      try {
        routingInfo = await emailRouterService.findOrganizationalUnitByEmail(
          email.to,
          organizationId
        );
        
        if (routingInfo) {
          logger.info(`📍 Email roteado para ${routingInfo.type}: ${routingInfo.unit.name}`);
        }
      } catch (error) {
        logger.error('Erro ao rotear email:', error);
        // Continuar sem roteamento se houver erro
      }
    }

    // Preparar dados do ticket
    const ticketData = {
      ticketNumber: await this.generateTicketNumber(),
      subject: email.subject,
      description: email.body,
      status: 'novo',
      priority: await this.detectPriority(email),
      type: 'suporte', // Default
      organizationId: organizationId,
      source: 'email',
      emailMessageId: email.messageId
    };

    // Definir requester baseado no tipo de utilizador
    if (type === 'organization') {
      ticketData.requesterOrgUserId = user.id;
      ticketData.requesterType = 'organization';
    } else if (type === 'client') {
      ticketData.requesterClientUserId = user.id;
      ticketData.requesterType = 'client';
      ticketData.clientId = user.clientId;
    }

    // Adicionar roteamento se encontrado
    if (routingInfo) {
      switch (routingInfo.type) {
        case 'section':
          ticketData.sectionId = routingInfo.unit.id;
          ticketData.departmentId = routingInfo.unit.departmentId;
          // Buscar directionId do departamento
          if (routingInfo.unit.departmentId) {
            const Department = (await import('../modules/departments/departmentModel.js')).default;
            const dept = await Department.findByPk(routingInfo.unit.departmentId);
            if (dept) ticketData.directionId = dept.directionId;
          }
          break;
        case 'department':
          ticketData.departmentId = routingInfo.unit.id;
          ticketData.directionId = routingInfo.unit.directionId;
          break;
        case 'direction':
          ticketData.directionId = routingInfo.unit.id;
          break;
      }
      
      // Atribuir ao gestor se existir (OPCIONAL - não bloqueia criação)
      if (routingInfo.unit.managerId) {
        ticketData.assigneeId = routingInfo.unit.managerId;
        logger.info(`👤 Ticket atribuído ao gestor: ${routingInfo.unit.managerId}`);
      } else {
        logger.info(`⚠️ Unidade ${routingInfo.unit.name} não tem gestor definido - ticket ficará não atribuído`);
      }
    }

    const ticket = await Ticket.create(ticketData);

    // Criar primeiro comentário com o conteúdo do e-mail
    await Comment.create({
      content: email.body,
      ticketId: ticket.id,
      userId: user.id,
      isPublic: true,
      emailMessageId: email.messageId,
      organizationId: organizationId
    });

    return ticket;
  }

  async generateTicketNumber() {
    const lastTicket = await Ticket.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['ticketNumber']
    });

    if (!lastTicket || !lastTicket.ticketNumber) {
      return 'TKT-000001';
    }

    // Extrair número do último ticket (formato: TKT-XXXXXX)
    const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[1] || '0');
    const nextNumber = (lastNumber + 1).toString().padStart(6, '0');

    return `TKT-${nextNumber}`;
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
    const userInfo = await this.findOrCreateUser(email);
    
    if (!userInfo) {
      logger.error(`❌ Comentário NÃO adicionado: Utilizador ${email.from} não está registado no sistema`);
      return ticket;
    }

    const { user, organizationId } = userInfo;

    const comment = await Comment.create({
      content: email.body,
      ticketId: ticket.id,
      userId: user.id,
      isPublic: true,
      emailMessageId: email.messageId,
      organizationId: organizationId
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

    // Template padrão melhorado
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Ticket Criado com Sucesso</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Olá,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Recebemos a sua solicitação e criámos o ticket <strong style="color: #667eea;">#{{ticketNumber}}</strong>.
          </p>
          
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>📋 Assunto:</strong></p>
            <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">{{subject}}</p>
            
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>📊 Status:</strong></p>
            <p style="margin: 0; color: #333; font-size: 16px;">
              <span style="background: #e3f2fd; color: #1976d2; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                {{status}}
              </span>
            </p>
          </div>
          
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            A nossa equipa analisará a sua solicitação e responderá o mais breve possível.
          </p>
          
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Pode acompanhar o progresso do seu ticket através do nosso portal:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{portalUrl}}/tickets/{{ticketNumber}}" 
               style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Ver Ticket #{{ticketNumber}}
            </a>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>💡 Dica:</strong> Para adicionar mais informações, basta responder a este email.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Atenciosamente,<br>
            <strong>Equipa de Suporte</strong>
          </p>
        </div>
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
    // Limpar intervalo de verificação de emails
    if (this.emailCheckInterval) {
      clearInterval(this.emailCheckInterval);
      this.emailCheckInterval = null;
    }

    // Limpar timeout de reconexão
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Fechar conexão IMAP
    if (this.connection) {
      try {
        await this.connection.end();
        logger.info('📧 Conexão IMAP encerrada');
      } catch (error) {
        logger.error('Erro ao encerrar conexão IMAP:', error.message);
      }
      this.connection = null;
    }
    
    // Fechar transporter SMTP
    if (this.transporter) {
      this.transporter.close();
      logger.info('📧 Transporter SMTP encerrado');
    }
  }
}

export default new EmailProcessor();
