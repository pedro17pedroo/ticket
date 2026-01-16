import { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Calendar, 
  User, 
  Clock, 
  MessageSquare, 
  Paperclip,
  Send,
  Trash2,
  Download,
  File,
  Image as ImageIcon,
  FileText,
  Film,
  Eye,
  Upload,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'
import Modal from './Modal'
import { 
  getTaskById,
  getTaskComments,
  addTaskComment,
  deleteTaskComment,
  getTaskAttachments,
  addTaskAttachment,
  deleteTaskAttachment,
  TASK_STATUSES,
  TASK_PRIORITIES
} from '../services/projectService'
import { confirmDelete } from '../utils/alerts'

/**
 * TaskDetail - Component for viewing task details with comments and attachments
 * Features:
 * - Display task information
 * - Comments section with add/delete
 * - Attachments section with upload/delete
 * 
 * Requirements: 3.8, 3.9
 */
const TaskDetail = ({ 
  isOpen, 
  onClose, 
  projectId, 
  taskId,
  onTaskUpdate 
}) => {
  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [activeTab, setActiveTab] = useState('comments')
  const fileInputRef = useRef(null)

  // Load task data when modal opens
  useEffect(() => {
    if (isOpen && projectId && taskId) {
      loadTaskData()
    }
  }, [isOpen, projectId, taskId])

  const loadTaskData = async () => {
    setLoading(true)
    try {
      // Load task details
      const taskResponse = await getTaskById(projectId, taskId)
      const taskData = taskResponse.task || taskResponse.data || taskResponse
      setTask(taskData)

      // Load comments
      await loadComments()

      // Load attachments
      await loadAttachments()
    } catch (error) {
      console.error('Erro ao carregar tarefa:', error)
      toast.error('Erro ao carregar detalhes da tarefa')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const response = await getTaskComments(projectId, taskId)
      const commentsData = response.comments || response.data || response || []
      setComments(Array.isArray(commentsData) ? commentsData : [])
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const loadAttachments = async () => {
    setLoadingAttachments(true)
    try {
      const response = await getTaskAttachments(projectId, taskId)
      const attachmentsData = response.attachments || response.data || response || []
      setAttachments(Array.isArray(attachmentsData) ? attachmentsData : [])
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
      setAttachments([])
    } finally {
      setLoadingAttachments(false)
    }
  }

  // Handle add comment
  const handleAddComment = async (e) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      toast.error('O comentário não pode estar vazio')
      return
    }

    setSubmittingComment(true)
    try {
      await addTaskComment(projectId, taskId, { content: newComment.trim() })
      toast.success('Comentário adicionado')
      setNewComment('')
      await loadComments()
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao adicionar comentário'
      toast.error(errorMessage)
    } finally {
      setSubmittingComment(false)
    }
  }

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    const confirmed = await confirmDelete(
      'Eliminar Comentário?',
      'Tem certeza que deseja eliminar este comentário?'
    )

    if (!confirmed) return

    try {
      await deleteTaskComment(projectId, taskId, commentId)
      toast.success('Comentário eliminado')
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Erro ao eliminar comentário:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao eliminar comentário'
      toast.error(errorMessage)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('O ficheiro excede o tamanho máximo de 20MB')
      return
    }

    setUploadingFile(true)
    try {
      await addTaskAttachment(projectId, taskId, file)
      toast.success('Anexo adicionado')
      await loadAttachments()
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao adicionar anexo'
      toast.error(errorMessage)
    } finally {
      setUploadingFile(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle delete attachment
  const handleDeleteAttachment = async (attachmentId) => {
    const confirmed = await confirmDelete(
      'Eliminar Anexo?',
      'Tem certeza que deseja eliminar este anexo?'
    )

    if (!confirmed) return

    try {
      await deleteTaskAttachment(projectId, taskId, attachmentId)
      toast.success('Anexo eliminado')
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
    } catch (error) {
      console.error('Erro ao eliminar anexo:', error)
      const errorMessage = error.response?.data?.error || 'Erro ao eliminar anexo'
      toast.error(errorMessage)
    }
  }

  // Helper functions
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-5 h-5" />
    }
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
      return <Film className="w-5 h-5" />
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      return <FileText className="w-5 h-5" />
    }
    return <File className="w-5 h-5" />
  }

  const isImage = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  }

  const getStatusBadge = (status) => {
    const statusConfig = TASK_STATUSES.find(s => s.value === status)
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[statusConfig?.color] || colorMap.gray}`}>
        {statusConfig?.label || status}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = TASK_PRIORITIES.find(p => p.value === priority)
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[priorityConfig?.color] || colorMap.gray}`}>
        {priorityConfig?.label || priority}
      </span>
    )
  }

  const getStatusIcon = (status) => {
    if (status === 'done') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    }
    if (status === 'in_progress' || status === 'in_review') {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    }
    return <Circle className="w-5 h-5 text-gray-400" />
  }

  const getAttachmentUrl = (attachment) => {
    // Build URL based on attachment path
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return `${baseUrl}/uploads/${attachment.filename}`
  }

  const downloadFile = (attachment) => {
    const url = getAttachmentUrl(attachment)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.originalName || attachment.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {task && getStatusIcon(task.status)}
            <h2 className="text-xl font-semibold truncate">
              {loading ? 'A carregar...' : task?.title || 'Detalhes da Tarefa'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : task ? (
            <div className="p-6 space-y-6">
              {/* Task Info */}
              <div className="space-y-4">
                {/* Status and Priority */}
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(task.status)}
                  {getPriorityBadge(task.priority)}
                </div>

                {/* Description */}
                {task.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Assignee */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Responsável
                    </h4>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {task.assignee?.name || 'Não atribuído'}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  {task.dueDate && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Data de Fim
                      </h4>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: pt })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Estimated Hours */}
                  {task.estimatedHours && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Horas Estimadas
                      </h4>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {task.estimatedHours}h
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Phase */}
                  {task.phase && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Fase
                      </h4>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {task.phase.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                      activeTab === 'comments'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Comentários ({comments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('attachments')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                      activeTab === 'attachments'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Paperclip className="w-4 h-4" />
                    Anexos ({attachments.length})
                  </button>
                </div>
              </div>

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva um comentário..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      disabled={submittingComment}
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
                    >
                      {submittingComment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>

                  {/* Comments List */}
                  {loadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum comentário ainda</p>
                      <p className="text-sm">Seja o primeiro a comentar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                {comment.user?.avatar ? (
                                  <img
                                    src={comment.user.avatar}
                                    alt={comment.user.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                    {comment.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>

                              {/* Content */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {comment.user?.name || 'Utilizador'}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { 
                                      addSuffix: true, 
                                      locale: pt 
                                    })}
                                  </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                              title="Eliminar comentário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Attachments Tab */}
              {activeTab === 'attachments' && (
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="*/*"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 rounded-lg text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-full justify-center"
                    >
                      {uploadingFile ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          A carregar...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Adicionar Anexo
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                      Máximo 20MB por ficheiro
                    </p>
                  </div>

                  {/* Attachments List */}
                  {loadingAttachments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum anexo ainda</p>
                      <p className="text-sm">Clique no botão acima para adicionar</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          {/* Icon */}
                          <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                            {getFileIcon(attachment.originalName || attachment.filename)}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {attachment.originalName || attachment.filename}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatFileSize(attachment.size)}</span>
                              {attachment.uploader && (
                                <>
                                  <span>•</span>
                                  <span>{attachment.uploader.name}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex gap-1">
                            {isImage(attachment.originalName || attachment.filename) && (
                              <button
                                onClick={() => setSelectedImage(getAttachmentUrl(attachment))}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            )}
                            <button
                              onClick={() => downloadFile(attachment)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Tarefa não encontrada</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

TaskDetail.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.string.isRequired,
  taskId: PropTypes.string,
  onTaskUpdate: PropTypes.func
}

export default TaskDetail
