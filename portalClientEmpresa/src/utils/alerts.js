import Swal from 'sweetalert2'

// Configuração padrão para suportar dark mode
const getSwalConfig = () => {
  const isDark = document.documentElement.classList.contains('dark')
  
  return {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#111827',
    confirmButtonColor: '#3B82F6',
    cancelButtonColor: '#6B7280',
  }
}

// Alerta de confirmação
export const confirmDelete = async (title = 'Tem certeza?', text = 'Esta ação não pode ser revertida!') => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, eliminar!',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    ...getSwalConfig()
  })
  
  return result.isConfirmed
}

// Alerta de sucesso
export const showSuccess = (title = 'Sucesso!', text = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    ...getSwalConfig()
  })
}

// Alerta de erro
export const showError = (title = 'Erro!', text = 'Algo correu mal.') => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    ...getSwalConfig()
  })
}

// Alerta de informação
export const showInfo = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: 'info',
    confirmButtonText: 'OK',
    ...getSwalConfig()
  })
}

// Confirmação genérica
export const confirmAction = async (title, text, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    ...getSwalConfig()
  })
  
  return result.isConfirmed
}

// Toast notification (mais discreto)
export const showToast = (message, icon = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })

  return Toast.fire({
    icon,
    title: message,
    ...getSwalConfig()
  })
}

// Alerta de loading
export const showLoading = (title = 'A processar...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    },
    ...getSwalConfig()
  })
}

// Fechar loading
export const closeLoading = () => {
  Swal.close()
}
