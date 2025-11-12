import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketService } from '../services/api'
import api from '../services/api'
import { ArrowLeft, Clock, User, Building2, Tag, UserPlus, Paperclip, Download, Trash2, FileText, Mail, Phone, GitMerge, ArrowRightLeft } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import FileUpload from '../components/FileUpload'
import TimeTracker from '../components/TimeTracker'
import TagManager from '../components/TagManager'
import TemplateSelector from '../components/TemplateSelector'
import ClientHistory from '../components/ClientHistory'
import SLAIndicator from '../components/SLAIndicator'
import ActivityTimeline from '../components/ActivityTimeline'
import RelatedTickets from '../components/RelatedTickets'
import MergeTicketsModal from '../components/MergeTicketsModal'
import TransferTicketModal from '../components/TransferTicketModal'
import AssignTicketModal from '../components/AssignTicketModal'
import TicketHistoryPanel from '../components/TicketHistoryPanel'
import ResolutionStatusManager from '../components/ResolutionStatusManager'
import InternalPriorityManager from '../components/InternalPriorityManager'
import StatusManager from '../components/StatusManager'
import RichTextEditor from '../components/RichTextEditor'
import RemoteAccessButton from '../components/RemoteAccessButton'

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [ticketAttachments, setTicketAttachments] = useState([])
  const [commentsAttachments, setCommentsAttachments] = useState([])
  const [commentAttachments, setCommentAttachments] = useState([])
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    loadTicket()
    loadAttachments()
  }, [id])


  const loadTicket = async () => {
    try {
      const data = await ticketService.getById(id)
      setTicket(data.ticket)
    } catch (error) {
      console.error('Erro ao carregar ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAttachments = async () => {
    try {
      const data = await ticketService.getAttachments(id)
      setAttachments(data.attachments || [])
      setTicketAttachments(data.ticketAttachments || [])
      setCommentsAttachments(data.commentAttachments || [])
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    // Validar se há comentário ou anexos (verificar HTML vazio)
    const isCommentEmpty = !comment || comment.trim() === '' || comment === '<p><br></p>'
    if (isCommentEmpty && commentAttachments.length === 0) {
      toast.error('Adicione um comentário ou anexo')
      return
    }

    // Validar se ticket está concluído
    const isTicketClosed = ['fechado', 'resolvido'].includes(ticket.status);
    if (isTicketClosed) {
      toast.error('Não é possível adicionar comentários em ticket concluído');
      return;
    }

    // Validar se ticket está atribuído (apenas para agentes)
    const isAgent = ['admin-org', 'agente'].includes(user.role);
    const isTicketAssigned = ticket.assigneeId !== null && ticket.assigneeId !== undefined;
    if (isAgent && !isTicketAssigned) {
      toast.error('Ticket deve ser atribuído antes de adicionar comentários');
      return;
    }

    try {
      let commentId = null
      
      // Se há comentário, adicionar e obter ID
      if (!isCommentEmpty) {
        const response = await ticketService.addComment(id, { content: comment, isInternal })
        commentId = response.comment?.id
      }
      
      // Upload anexos se houver, associando ao comentário se existir
      if (commentAttachments.length > 0) {
        await ticketService.uploadAttachments(id, commentAttachments, commentId)
        loadAttachments()
      }
      
      setComment('')
      setIsInternal(false)
      setCommentAttachments([])
      
      if (!isCommentEmpty && commentAttachments.length > 0) {
        toast.success('Comentário e anexos adicionados')
      } else if (!isCommentEmpty) {
        toast.success('Comentário adicionado')
      } else {
        toast.success('Anexos adicionados')
      }
      
      loadTicket()
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      toast.error('Erro ao adicionar comentário/anexos')
    }
  }

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const blob = await ticketService.downloadAttachment(id, attachmentId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast.error('Erro ao fazer download do arquivo')
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('Tem certeza que deseja eliminar este anexo?')) return
    
    try {
      await ticketService.deleteAttachment(id, attachmentId)
      toast.success('Anexo eliminado')
      loadAttachments()
    } catch (error) {
      console.error('Erro ao eliminar anexo:', error)
      toast.error('Erro ao eliminar anexo')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!ticket) {
    return <div>Ticket não encontrado</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.ticketNumber}</h1>
            <p className="text-gray-600 dark:text-gray-400">{ticket.subject}</p>
          </div>
        </div>
{(user.role === 'admin-org' || user.role === 'agente') && (() => {
          const isTicketClosed = ['fechado', 'resolvido'].includes(ticket.status);
          return (
            <div className="flex gap-2">
              <RemoteAccessButton ticket={ticket} />
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={isTicketClosed}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isTicketClosed ? 'Não é possível atribuir ticket concluído' : 'Atribuir ticket'}
              >
                <UserPlus className="w-4 h-4" />
                Atribuir
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                disabled={isTicketClosed}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isTicketClosed ? 'Não é possível transferir ticket concluído' : 'Transferir ticket'}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Transferir
              </button>
              <button
                onClick={() => setShowMergeModal(true)}
                disabled={isTicketClosed}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isTicketClosed ? 'Não é possível mesclar ticket concluído' : 'Mesclar tickets'}
              >
                <GitMerge className="w-4 h-4" />
                Mesclar
              </button>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold mb-4">Descrição</h2>
            <div 
              className="ticket-description-view text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: ticket.description }}
            />
          </div>

          {/* Attachments */}
          {ticketAttachments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Anexos do Ticket ({ticketAttachments.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ticketAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border"
                  >
                    <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.originalName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment Attachments */}
          {commentsAttachments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Anexos de Comentários ({commentsAttachments.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commentsAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border"
                  >
                    <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.originalName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold mb-4">
              Atividades ({ticket.comments?.length || 0})
            </h2>

            <div className="mb-6">
              <ActivityTimeline ticket={ticket} />
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-4">
              {/* Alerta se ticket não está atribuído */}
              {(() => {
                const isAgent = ['admin-org', 'agente'].includes(user.role);
                const isTicketAssigned = ticket.assigneeId !== null && ticket.assigneeId !== undefined;
                const isTicketClosed = ['fechado', 'resolvido'].includes(ticket.status);
                
                if (isTicketClosed) {
                  return (
                    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        ℹ️ <strong>Ticket concluído.</strong> Não é possível adicionar comentários.
                      </p>
                    </div>
                  );
                }
                
                if (isAgent && !isTicketAssigned) {
                  return (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ <strong>Ticket não atribuído.</strong> Atribua o ticket a alguém antes de adicionar comentários.
                      </p>
                    </div>
                  );
                }
                
                return null;
              })()}

              {/* Template Selector */}
              {(user.role === 'admin-org' || user.role === 'agente') && (
                <TemplateSelector onSelect={(content) => setComment(comment + content)} />
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Comentário</label>
                <RichTextEditor
                  value={comment}
                  onChange={setComment}
                  placeholder="Adicione seu comentário...

Você pode usar formatação para destacar informações importantes:
• Negrito para pontos críticos
• Listas para organizar passos
• Cores para destacar alertas
• Links para referências"
                />
              </div>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Anexos (opcional)</label>
                <FileUpload
                  onFilesChange={setCommentAttachments}
                  maxSize={20}
                  maxFiles={5}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Nota interna (não visível para o cliente)</span>
                </label>
                <button
                  type="submit"
                  disabled={(!comment || comment === '<p><br></p>') && commentAttachments.length === 0}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {commentAttachments.length > 0 && (!comment || comment === '<p><br></p>') ? 'Adicionar Anexos' : 'Adicionar Comentário'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold">Informações</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Solicitante:</span>
                <span className="font-medium ml-auto">{ticket.requester?.name}</span>
              </div>

              {ticket.requester?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <a href={`mailto:${ticket.requester.email}`} className="font-medium ml-auto text-primary-600 hover:underline">
                    {ticket.requester.email}
                  </a>
                </div>
              )}

              {ticket.requester?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Telefone:</span>
                  <a href={`tel:${ticket.requester.phone}`} className="font-medium ml-auto text-primary-600 hover:underline">
                    {ticket.requester.phone}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Atribuído a:</span>
                <span className="font-medium ml-auto">
                  {ticket.assignee?.name || 'Não atribuído'}
                </span>
              </div>

              {ticket.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Departamento:</span>
                  <span className="font-medium ml-auto">{ticket.department?.name}</span>
                </div>
              )}

              {ticket.category && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Categoria:</span>
                  <span className="font-medium ml-auto">{ticket.category?.name}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Criado em:</span>
                <span className="font-medium ml-auto">
                  {format(new Date(ticket.createdAt), 'dd/MM/yyyy', { locale: pt })}
                </span>
              </div>
            </div>
          </div>

          {/* Time Tracker */}
          {(user.role === 'admin-org' || user.role === 'agente') && (
            <TimeTracker ticketId={id} ticket={ticket} />
          )}

          {/* Tags */}
          {(user.role === 'admin-org' || user.role === 'agente') && (
            <TagManager ticketId={id} />
          )}

          {/* Client History */}
          {ticket.requesterId && (
            <ClientHistory userId={ticket.requesterId} currentTicketId={id} />
          )}

          {/* SLA Indicator */}
          {ticket.sla && (
            <SLAIndicator ticket={ticket} sla={ticket.sla} />
          )}

          {/* Related Tickets */}
          <RelatedTickets ticketId={id} />

          {/* Status Manager */}
          {(user.role === 'admin-org' || user.role === 'agente') && (
            <StatusManager
              ticketId={id}
              currentStatus={ticket.status}
              onUpdate={loadTicket}
            />
          )}

          {/* Internal Priority Manager */}
          {(user.role === 'admin-org' || user.role === 'agente') && (
            <InternalPriorityManager
              ticketId={id}
              clientPriority={ticket.priority}
              internalPriority={ticket.internalPriority}
              catalogItemPriority={ticket.catalogItem?.priority?.name}
              onUpdate={loadTicket}
            />
          )}

          {/* Resolution Status Manager */}
          {(user.role === 'admin-org' || user.role === 'agente') && (
            <ResolutionStatusManager
              ticketId={id}
              currentStatus={ticket.resolutionStatus}
              onUpdate={loadTicket}
            />
          )}

          {/* Ticket History */}
          <TicketHistoryPanel ticketId={id} />

        </div>
      </div>

      {/* Merge Modal */}
      {showMergeModal && (
        <MergeTicketsModal
          ticketId={id}
          onClose={() => setShowMergeModal(false)}
          onSuccess={() => {
            loadTicket();
            loadAttachments();
          }}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignTicketModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          ticket={ticket}
          onAssigned={() => {
            loadTicket();
            setShowAssignModal(false);
          }}
        />
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferTicketModal
          ticketId={id}
          currentData={{
            directionId: ticket.directionId,
            departmentId: ticket.departmentId,
            sectionId: ticket.sectionId,
            assigneeId: ticket.assigneeId,
            categoryId: ticket.categoryId,
            type: ticket.type
          }}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            loadTicket();
            loadAttachments();
          }}
        />
      )}
    </div>
  )
}

export default TicketDetail
