import { useState, useRef } from 'react'
import { Upload, X, File, Image as ImageIcon, FileText, Film } from 'lucide-react'
import toast from 'react-hot-toast'

const FileUpload = ({ onFilesChange, maxSize = 20, maxFiles = 5, accept = "*/*" }) => {
  const [files, setFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const maxSizeBytes = maxSize * 1024 * 1024 // Convert MB to bytes

  const validateFile = (file) => {
    if (file.size > maxSizeBytes) {
      toast.error(`Arquivo ${file.name} excede o tamanho máximo de ${maxSize}MB`)
      return false
    }
    return true
  }

  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(validateFile)
    
    if (files.length + validFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    const filesWithPreview = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }))

    const updatedFiles = [...files, ...filesWithPreview]
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles.map(f => f.file))
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (id) => {
    const updatedFiles = files.filter(f => f.id !== id)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles.map(f => f.file))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8" />
    if (type.startsWith('video/')) return <Film className="w-8 h-8" />
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-8 h-8" />
    return <File className="w-8 h-8" />
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Arraste arquivos aqui ou{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            clique para selecionar
          </button>
        </p>
        
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Máximo {maxFiles} arquivos · Até {maxSize}MB cada
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Arquivos selecionados ({files.length})
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Preview or Icon */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-gray-500">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload
