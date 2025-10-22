import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketService } from '../services/api'
import { ArrowLeft, Clock, User, Building2, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  useEffect(() => {
    loadTicket()
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

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      await ticketService.addComment(id, { content: comment, isInternal })
      setComment('')
      setIsInternal(false)
      toast.success('Comentário adicionado')
      loadTicket()
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold mb-4">Descrição</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Comments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold mb-4">
              Comentários ({ticket.comments?.length || 0})
            </h2>

            <div className="space-y-4 mb-6">
              {ticket.comments?.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg ${
                    comment.isInternal
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
                      {comment.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{comment.user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                      </p>
                    </div>
                    {comment.isInternal && (
                      <span className="ml-auto text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                        Interno
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicionar comentário..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
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
                  disabled={!comment.trim()}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Adicionar Comentário
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

              {ticket.assignee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Atribuído a:</span>
                  <span className="font-medium ml-auto">{ticket.assignee?.name}</span>
                </div>
              )}

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
        </div>
      </div>
    </div>
  )
}

export default TicketDetail
