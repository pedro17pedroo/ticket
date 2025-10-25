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
import TicketHistoryPanel from '../components/TicketHistoryPanel'
import ResolutionStatusManager from '../components/ResolutionStatusManager'
import InternalPriorityManager from '../components/InternalPriorityManager'
import RichTextEditor from '../components/RichTextEditor'

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [agents, setAgents] = useState([])
  const [showAssignSelect, setShowAssignSelect] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [commentAttachments, setCommentAttachments] = useState([])
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)

  useEffect(() => {
    loadTicket()
    loadAgents()
    loadAttachments()
  }, [id])

  const loadAgents = async () => {
    try {
      const response = await api.get('/users')
      const agentsList = response.data.users?.filter(
        u => u.role === 'agente' || u.role === 'admin-org'
      ) || []
      setAgents(agentsList)
    } catch (error) {
      console.error('Erro ao carregar agentes:', error)
    }
  }

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
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    
    // Validar se há comentário ou anexos (verificar HTML vazio)
    const isCommentEmpty = !comment || comment.trim() === '' || comment === '<p><br></p>'
    if (isCommentEmpty && commentAttachments.length === 0) {
      toast.error('Adicione um comentário ou anexo')
      return
    }

    try {
      // Se há comentário, adicionar
      if (!isCommentEmpty) {
        await ticketService.addComment(id, { content: comment, isInternal })
      }
      
      // Upload anexos se houver
      if (commentAttachments.length > 0) {
        await ticketService.uploadAttachments(id, commentAttachments)
        loadAttachments()
      }
      
      setComment('')
      setIsInternal(false)
      setCommentAttachments([])
      toast.success(!isCommentEmpty ? 'Comentário adicionado' : 'Anexos adicionados')
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

  const handleAssignToMe = async () => {
    try {
      await api.put(`/tickets/${id}`, { assigneeId: user.id })
      toast.success('Ticket atribuído a você')
      loadTicket()
    } catch (error) {
      console.error('Erro ao atribuir ticket:', error)
      toast.error('Erro ao atribuir ticket')
    }
  }

  const handleAssignTo = async (assigneeId) => {
    try {
      await api.put(`/tickets/${id}`, { assigneeId })
      const agent = agents.find(a => a.id === assigneeId)
      toast.success(`Ticket atribuído a ${agent?.name}`)
      setShowAssignSelect(false)
      loadTicket()
    } catch (error) {
      console.error('Erro ao atribuir ticket:', error)
      toast.error('Erro ao atribuir ticket')
    }
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
            onClick={() => navigate('/tickets')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.ticketNumber}</h1>
            <p className="text-gray-600 dark:text-gray-400">{ticket.subject}</p>
          </div>
        </div>
        {(user.role === 'admin-org' || user.role === 'agente') && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transferir
            </button>
            <button
              onClick={() => setShowMergeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <GitMerge className="w-4 h-4" />
              Mesclar
            </button>
          </div>
        )}
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
          {attachments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Anexos ({attachments.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attachments.map((attachment) => (
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
                <label className="block text-sm font-medium mb-2">Anexos (opcional)</label>
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
            <TimeTracker ticketId={id} />
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

          {/* Internal Priority Manager */}
          {(user.role === 'admin-org' || user.role === 'agente') && (
            <InternalPriorityManager
              ticketId={id}
              clientPriority={ticket.priority}
              internalPriority={ticket.internalPriority}
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

          {/* Assignment Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Atribuição
            </h3>

            {!ticket.assigneeId && (
              <button
                onClick={handleAssignToMe}
                className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Atribuir a mim
              </button>
            )}

            {!showAssignSelect ? (
              <button
                onClick={() => setShowAssignSelect(true)}
                className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                {ticket.assigneeId ? 'Reatribuir' : 'Atribuir a outro agente'}
              </button>
            ) : (
              <div className="space-y-2">
                <select
                  onChange={(e) => handleAssignTo(e.target.value)}
                  defaultValue=""
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                >
                  <option value="">Selecione um agente...</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.role === 'admin-org' ? '(Admin)' : '(Agente)'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAssignSelect(false)}
                  className="w-full py-1 px-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
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
