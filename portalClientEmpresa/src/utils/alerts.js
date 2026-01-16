import toast from 'react-hot-toast'

// Alerta de confirmação
export const confirmDelete = async (title = 'Tem certeza?', text = 'Esta ação não pode ser revertida!') => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n${text}`)
    resolve(confirmed)
  })
}

// Alerta de sucesso
export const showSuccess = (title = 'Sucesso!', text = '') => {
  const message = text ? `${title}: ${text}` : title
  return toast.success(message, {
    duration: 2000,
    position: 'top-right',
  })
}

// Alerta de erro
export const showError = (title = 'Erro!', text = 'Algo correu mal.') => {
  const message = text ? `${title}: ${text}` : title
  return toast.error(message, {
    duration: 4000,
    position: 'top-right',
  })
}

// Alerta de informação
export const showInfo = (title, text) => {
  const message = text ? `${title}: ${text}` : title
  return toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
  })
}

// Confirmação genérica
export const confirmAction = async (title, text, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n${text}`)
    resolve(confirmed)
  })
}

// Toast notification (mais discreto)
export const showToast = (message, icon = 'success') => {
  if (icon === 'success') {
    return toast.success(message, {
      duration: 3000,
      position: 'top-right',
    })
  } else if (icon === 'error') {
    return toast.error(message, {
      duration: 3000,
      position: 'top-right',
    })
  } else {
    return toast(message, {
      duration: 3000,
      position: 'top-right',
    })
  }
}

// Alerta de loading
export const showLoading = (title = 'A processar...') => {
  return toast.loading(title)
}

// Fechar loading
export const closeLoading = (toastId) => {
  if (toastId) {
    toast.dismiss(toastId)
  } else {
    toast.dismiss()
  }
}
