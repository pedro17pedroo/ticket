import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketService } from '../services/api'
import { ArrowLeft, Clock, User, MessageSquare, Send, Paperclip, Download, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import FileUpload from '../components/FileUpload'
import RichTextEditor from '../components/RichTextEditor'

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [commentAttachments, setCommentAttachments] = useState([])

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
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    
    // Validar se há comentário ou anexos (verificar HTML vazio)
    const isCommentEmpty = !comment || comment.trim() === '' || comment === '<p><br></p>'
    if (isCommentEmpty && commentAttachments.length === 0) {
      toast.error('Adicione uma resposta ou anexo')
      return
    }

    setSubmitting(true)
    try {
      // Se há comentário, adicionar
      if (!isCommentEmpty) {
        await ticketService.addComment(id, { content: comment, isInternal: false })
      }
      
      // Upload anexos se houver
      if (commentAttachments.length > 0) {
        await ticketService.uploadAttachments(id, commentAttachments)
        loadAttachments()
      }
      
      setComment('')
      setCommentAttachments([])
      toast.success(comment.trim() ? 'Resposta adicionada' : 'Anexos adicionados')
      loadTicket()
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      toast.error('Erro ao adicionar resposta/anexos')
    } finally {
      setSubmitting(false)
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusBadge = (status) => {
    const styles = {
      novo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      em_progresso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      aguardando_cliente: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      resolvido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      fechado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    }
    const labels = {
      novo: 'Novo',
      em_progresso: 'Em Progresso',
      aguardando_cliente: 'Aguardando Você',
      resolvido: 'Resolvido',
      fechado: 'Fechado',
    }
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
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

  // Filtrar apenas comentários públicos (não mostrar notas internas para clientes)
  const publicComments = ticket.comments?.filter(c => !c.isInternal) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{ticket.ticketNumber}</h1>
            {getStatusBadge(ticket.status)}
          </div>
          <p className="text-gray-600 dark:text-gray-400">{ticket.subject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Descrição
            </h2>
            <div 
              className="ticket-description-view text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: ticket.description }}
            />
          </div>


          {/* Form Fields */}
          {ticket.customFields && Object.keys(ticket.customFields).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações do Formulário
              </h2>
              <div className="space-y-3">
                {Object.entries(ticket.customFields).map(([key, field]) => (
                  <div key={key}>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{field.label}:</span>
                    <p className="text-gray-700 dark:text-gray-300">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Attachments from metadata */}
          {ticket.metadata?.clientRequest?.attachments && ticket.metadata.clientRequest.attachments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Anexos da Solicitação ({ticket.metadata.clientRequest.attachments.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ticket.metadata.clientRequest.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border"
                  >
                    <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                  >
                    <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.originalName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold mb-4">
              Histórico de Respostas ({publicComments.length})
            </h2>

            <div className="space-y-4 mb-6">
              {publicComments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhuma resposta ainda. Aguarde o retorno de nossa equipe.
                </p>
              ) : (
                publicComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                        {comment.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{comment.user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <div 
                      className="ticket-description-view text-gray-700 dark:text-gray-300 ml-13"
                      dangerouslySetInnerHTML={{ __html: comment.content }}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            {ticket.status !== 'fechado' && (
              <form onSubmit={handleAddComment} className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Adicionar Resposta
                  </label>
                  <RichTextEditor
                    value={comment}
                    onChange={setComment}
                    placeholder="Digite sua resposta ou informações adicionais...

Você pode usar formatação para:
• Destacar informações importantes em negrito
• Organizar passos em listas
• Adicionar links úteis"
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

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={((!comment || comment === '<p><br></p>') && commentAttachments.length === 0) || submitting}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Enviando...' : (commentAttachments.length > 0 && !comment.trim() ? 'Enviar Anexos' : 'Enviar Resposta')}
                  </button>
                </div>
              </form>
            )}

            {ticket.status === 'fechado' && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este ticket foi fechado e não aceita mais respostas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Service Information */}
          {ticket.metadata?.catalogItem && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações do Serviço
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{ticket.metadata.catalogItem.typeLabel}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Serviço:</span>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{ticket.metadata.catalogItem.name}</p>
                </div>
                {ticket.metadata.catalogItem.description && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Sobre:</span>
                    <p className="text-gray-700 dark:text-gray-300 text-xs mt-1">{ticket.metadata.catalogItem.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Expectations */}
          {ticket.metadata?.clientRequest && (ticket.metadata.clientRequest.userPriority || ticket.metadata.clientRequest.expectedResolutionTime) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Expectativas do Cliente
              </h3>
              <div className="space-y-3 text-sm">
                {ticket.metadata.clientRequest.userPriority && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Urgência:</span>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {ticket.metadata.clientRequest.userPriority === 'baixa' && '🟢 Baixa'}
                      {ticket.metadata.clientRequest.userPriority === 'media' && '🟡 Média'}
                      {ticket.metadata.clientRequest.userPriority === 'alta' && '🟠 Alta'}
                      {ticket.metadata.clientRequest.userPriority === 'critica' && '🔴 Crítica'}
                    </p>
                  </div>
                )}
                {ticket.metadata.clientRequest.expectedResolutionTime && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Prazo Esperado:</span>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {format(new Date(ticket.metadata.clientRequest.expectedResolutionTime), "dd/MM/yyyy", { locale: pt })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold">Informações</h3>

            <div className="space-y-3">
              {ticket.assignee && (
                <div className="flex items-start gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Atendente:</p>
                    <p className="font-medium">{ticket.assignee.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Criado em:</p>
                  <p className="font-medium">
                    {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                  </p>
                </div>
              </div>

              {ticket.updatedAt !== ticket.createdAt && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Última atualização:</p>
                    <p className="font-medium">
                      {format(new Date(ticket.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Message */}
          {ticket.status === 'aguardando_cliente' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                ⏰ Aguardando sua resposta
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                Nossa equipe está aguardando informações adicionais suas.
              </p>
            </div>
          )}

          {ticket.status === 'resolvido' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                ✓ Ticket Resolvido
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                Seu problema foi resolvido. Se tudo estiver OK, este ticket será fechado automaticamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TicketDetail
