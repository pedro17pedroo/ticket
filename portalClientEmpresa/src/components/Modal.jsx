import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Componente Modal que renderiza usando Portal
 * Garante que o modal sempre apareça acima de todos os elementos
 */
const Modal = ({ isOpen, onClose, children }) => {
  // Prevenir scroll quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalRoot = document.getElementById('modal-root') || document.body

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 animate-in fade-in duration-200">
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    modalRoot
  )
}

export default Modal
