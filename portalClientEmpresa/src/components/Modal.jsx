import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Componente Modal Padrão do Portal Cliente Empresa
 * 
 * Uso:
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
 *   <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full">
 *     Conteúdo do modal
 *   </div>
 * </Modal>
 * 
 * Features:
 * - Renderiza via Portal no body
 * - Backdrop escurecido com blur
 * - Fecha com ESC
 * - Bloqueia scroll da página
 * - z-index: 9999
 */
const Modal = ({ isOpen, onClose, children }) => {
  // Bloqueia scroll quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fecha com ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Renderiza no body via Portal
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
