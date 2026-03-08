import { useState, useEffect } from 'react'
import { X, Download, FileText, Image as ImageIcon, FileVideo, FileAudio, File, ZoomIn, ZoomOut } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const AttachmentViewer = ({ attachment, ticketId, onDownload, onClose }) => {
  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(true)
  const [fileUrl, setFileUrl] = useState(null)
  const [error, setError] = useState(false)

  // Determinar tipo de arquivo
  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return 'image'
    }
    if (ext === 'pdf') {
      return 'pdf'
    }
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      return 'video'
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return 'audio'
    }
    if (['txt', 'log', 'md', 'json', 'xml', 'csv'].includes(ext)) {
      return 'text'
    }
    return 'other'
  }

  const fileType = getFileType(attachment.originalName)

  // Carregar arquivo com autenticação
  useEffect(() => {
    const loadFile = async () => {
      try {
        setLoading(true)
        setError(false)
        
        const response = await api.get(`/tickets/${ticketId}/attachments/${attachment.id}/view`, {
          responseType: 'blob'
        })
        
        const blob = response.data
        const url = window.URL.createObjectURL(blob)
        setFileUrl(url)
        setLoading(false)
      } catch (err) {
        console.error('Erro ao carregar arquivo:', err)
        setError(true)
        setLoading(false)
        toast.error('Erro ao carregar arquivo')
      }
    }

    loadFile()

    // Cleanup: revogar URL quando componente desmontar
    return () => {
      if (fileUrl) {
        window.URL.revokeObjectURL(fileUrl)
      }
    }
  }, [ticketId, attachment.id])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleDownload = () => {
    onDownload(attachment.id, attachment.originalName)
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <File className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <p className="text-lg font-medium mb-2 text-white">Erro ao carregar arquivo</p>
            <p className="text-gray-400 mb-4">
              Não foi possível carregar o arquivo para visualização
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 mx-auto"
            >
              <Download className="w-4 h-4" />
              Fazer Download
            </button>
          </div>
        </div>
      )
    }

    if (!fileUrl) {
      return null
    }

    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full overflow-auto p-4">
            <img
              src={fileUrl}
              alt={attachment.originalName}
              style={{ transform: `scale(${zoom / 100})` }}
              className="max-w-full max-h-full object-contain transition-transform"
              onError={() => {
                setError(true)
                toast.error('Erro ao carregar imagem')
              }}
            />
          </div>
        )

      case 'pdf':
        return (
          <iframe
            src={fileUrl}
            className="w-full h-full"
            title={attachment.originalName}
            onError={() => {
              setError(true)
              toast.error('Erro ao carregar PDF')
            }}
          />
        )

      case 'video':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <video
              controls
              className="max-w-full max-h-full"
              onError={() => {
                setError(true)
                toast.error('Erro ao carregar vídeo')
              }}
            >
              <source src={fileUrl} />
              Seu navegador não suporta reprodução de vídeo.
            </video>
          </div>
        )

      case 'audio':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <div className="w-full max-w-2xl">
              <div className="mb-4 text-center">
                <FileAudio className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                <p className="text-lg font-medium text-white">{attachment.originalName}</p>
              </div>
              <audio
                controls
                className="w-full"
                onError={() => {
                  setError(true)
                  toast.error('Erro ao carregar áudio')
                }}
              >
                <source src={fileUrl} />
                Seu navegador não suporta reprodução de áudio.
              </audio>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="h-full overflow-auto p-6 bg-white">
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={attachment.originalName}
              onError={() => {
                setError(true)
                toast.error('Erro ao carregar arquivo')
              }}
            />
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2 text-white">{attachment.originalName}</p>
              <p className="text-gray-400 mb-4">
                Pré-visualização não disponível para este tipo de arquivo
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Fazer Download
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 z-10 h-[72px]">
        <div className="flex items-center justify-between p-4 h-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {fileType === 'image' && <ImageIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            {fileType === 'pdf' && <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            {fileType === 'video' && <FileVideo className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            {fileType === 'audio' && <FileAudio className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            {!['image', 'pdf', 'video', 'audio'].includes(fileType) && <File className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{attachment.originalName}</p>
              <p className="text-gray-400 text-sm">
                {(attachment.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls para imagens */}
            {fileType === 'image' && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <span className="text-white text-sm min-w-[60px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <div className="w-px h-6 bg-gray-700 mx-2" />
              </>
            )}

            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Fazer download"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full h-full pt-[72px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        {renderContent()}
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  )
}

export default AttachmentViewer
