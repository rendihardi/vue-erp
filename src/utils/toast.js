import { toast } from 'vue3-toastify'

export const showToastSuccess = (message) => {
  toast.success(message, {
    autoClose: 3000,
    position: 'top-right'
  })
}

export const showToastError = (message) => {
  toast.error(message, {
    autoClose: 4000,
    position: 'top-right'
  })
}

export const showToastInfo = (message) => {
  toast.info(message, {
    autoClose: 3000,
    position: 'top-right'
  })
}

export const showToastWarning = (message) => {
  toast.warning(message, {
    autoClose: 3500,
    position: 'top-right'
  })
}

export default toast
