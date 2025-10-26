import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import logger from '../config/logger.js';
import Ticket from '../modules/tickets/ticketModel.js';
import User from '../modules/users/userModel.js';

class EmailInboxService {
  constructor() {
    this.imap = null;
    this.isConnected = false;
    this.isProcessing = false;
    this.pollingInterval = null;
  }

  /**
   * Inicializar conexão IMAP
   */
  initialize() {
    if (!process.env.IMAP_USER || !process.env.IMAP_PASS) {
      logger.warn('Configuração IMAP não encontrada. Serviço de e-mail inbox desativado.');
      return;
    }

    const config = {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: process.env.IMAP_TLS !== 'false',
      tlsOptions: { rejectUnauthorized: false }
    };

    this.imap = new Imap(config);

    this.imap.once('ready', () => {
      logger.info('📧 Conexão IMAP estabelecida');
      this.isConnected = true;
      this.startPolling();
    });

    this.imap.once('error', (err) => {
      logger.error('Erro IMAP:', err);
      this.isConnected = false;
    });

    this.imap.once('end', () => {
      logger.info('Conexão IMAP encerrada');
      this.isConnected = false;
    });

    this.imap.connect();
  }

  /**
   * Iniciar polling de e-mails
   */
  startPolling() {
    const interval = parseInt(process.env.EMAIL_POLL_INTERVAL) || 60000; // 1 minuto padrão

    logger.info(`📬 Iniciando polling de e-mails a cada ${interval/1000} segundos`);

    this.pollingInterval = setInterval(() => {
      if (this.isConnected && !this.isProcessing) {
        this.processInbox();
      }
    }, interval);

    // Processar imediatamente
    this.processInbox();
  }

  /**
   * Processar caixa de entrada
   */
  async processInbox() {
    if (!this.isConnected || this.isProcessing) return;

    this.isProcessing = true;

    try {
      this.imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          logger.error('Erro ao abrir inbox:', err);
          this.isProcessing = false;
          return;
        }

        // Buscar e-mails não lidos
        this.imap.search(['UNSEEN'], async (err, results) => {
          if (err) {
            logger.error('Erro ao buscar e-mails:', err);
            this.isProcessing = false;
            return;
          }

          if (!results || results.length === 0) {
            logger.debug('Nenhum e-mail novo encontrado');
            this.isProcessing = false;
            return;
          }

          logger.info(`📨 ${results.length} novo(s) e-mail(s) encontrado(s)`);

          const fetch = this.imap.fetch(results, { bodies: '' });

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  logger.error('Erro ao parsear e-mail:', err);
                  return;
                }

                await this.processEmail(parsed);
              });
            });
          });

          fetch.once('error', (err) => {
            logger.error('Erro ao buscar mensagens:', err);
          });

          fetch.once('end', () => {
            logger.debug('Processamento de e-mails concluído');
            this.isProcessing = false;
          });
        });
      });
    } catch (error) {
      logger.error('Erro ao processar inbox:', error);
      this.isProcessing = false;
    }
  }

  /**
   * Processar um e-mail individual
   */
  async processEmail(email) {
    try {
      logger.info(`Processando e-mail: ${email.subject} de ${email.from.text}`);

      // Extrair informações do e-mail
      const fromEmail = email.from.value[0].address;
      const subject = email.subject || 'Sem assunto';
      const body = email.text || email.html || '';

      // Verificar se é resposta a um ticket existente (formato: RE: #TICKET-XXXX)
      const ticketNumberMatch = subject.match(/#(TICKET-\d+)/);
      
      if (ticketNumberMatch) {
        // É uma resposta - adicionar como comentário
        await this.addCommentToTicket(ticketNumberMatch[1], fromEmail, body);
      } else {
        // É um novo ticket
        await this.createTicketFromEmail(fromEmail, subject, body, email);
      }

      logger.info(`✅ E-mail processado com sucesso`);
    } catch (error) {
      logger.error('Erro ao processar e-mail:', error);
    }
  }

  /**
   * Criar ticket a partir de e-mail
   */
  async createTicketFromEmail(fromEmail, subject, body, emailData) {
    try {
      // Buscar usuário pelo e-mail
      const user = await User.findOne({ where: { email: fromEmail } });

      if (!user) {
        logger.warn(`Usuário não encontrado para e-mail: ${fromEmail}`);
        // Poderia enviar e-mail de volta informando que precisa se registrar
        return;
      }

      // Processar anexos se houver
      const attachments = [];
      if (emailData.attachments && emailData.attachments.length > 0) {
        for (const attachment of emailData.attachments) {
          // TODO: Salvar anexo no sistema
          attachments.push({
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size
          });
        }
      }

      // Criar ticket
      const ticket = await Ticket.create({
        organizationId: user.organizationId,
        requesterId: user.id,
        subject: subject.substring(0, 255), // Limitar tamanho
        description: body.substring(0, 5000), // Limitar tamanho
        status: 'novo',
        priority: 'media',
        source: 'email',
        metadata: {
          emailFrom: fromEmail,
          emailDate: emailData.date,
          hasAttachments: attachments.length > 0,
          attachmentsCount: attachments.length
        }
      });

      logger.info(`✅ Ticket #${ticket.ticketNumber} criado a partir de e-mail`);

      // TODO: Enviar e-mail de confirmação ao solicitante
      // TODO: Notificar agentes responsáveis

      return ticket;
    } catch (error) {
      logger.error('Erro ao criar ticket a partir de e-mail:', error);
      throw error;
    }
  }

  /**
   * Adicionar comentário a ticket existente
   */
  async addCommentToTicket(ticketNumber, fromEmail, content) {
    try {
      const ticket = await Ticket.findOne({ 
        where: { ticketNumber },
        include: ['requester', 'assignee']
      });

      if (!ticket) {
        logger.warn(`Ticket não encontrado: ${ticketNumber}`);
        return;
      }

      const user = await User.findOne({ where: { email: fromEmail } });

      if (!user) {
        logger.warn(`Usuário não encontrado para e-mail: ${fromEmail}`);
        return;
      }

      // Verificar se usuário tem permissão para comentar
      if (user.organizationId !== ticket.organizationId) {
        logger.warn(`Usuário ${fromEmail} não tem permissão para comentar no ticket ${ticketNumber}`);
        return;
      }

      // TODO: Adicionar comentário ao ticket
      // const Comment = (await import('../modules/comments/commentModel.js')).Comment;
      // await Comment.create({
      //   ticketId: ticket.id,
      //   userId: user.id,
      //   content: content.substring(0, 5000),
      //   isInternal: false
      // });

      logger.info(`✅ Comentário adicionado ao ticket #${ticketNumber} por e-mail`);

      // TODO: Notificar participantes do ticket

    } catch (error) {
      logger.error('Erro ao adicionar comentário por e-mail:', error);
      throw error;
    }
  }

  /**
   * Parar serviço
   */
  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.imap) {
      this.imap.end();
    }

    logger.info('Serviço de e-mail inbox parado');
  }
}

// Singleton
const emailInboxService = new EmailInboxService();

export default emailInboxService;
