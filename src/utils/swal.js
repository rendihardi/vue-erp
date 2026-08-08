import Swal from 'sweetalert2'

const customSwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm text-xs font-sans transition-all mx-1 cursor-pointer focus:outline-none',
    cancelButton: 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl text-xs font-sans transition-all mx-1 cursor-pointer focus:outline-none border border-slate-200',
    popup: 'rounded-3xl p-6 font-sans border border-slate-100 shadow-2xl bg-white'
  },
  buttonsStyling: false
})

/**
 * Tampilkan Alert Sukses
 */
export const showSuccess = (title, text = '') => {
  return customSwal.fire({
    icon: 'success',
    title: title,
    text: text,
    timer: 2500,
    showConfirmButton: false,
    timerProgressBar: true
  })
}

/**
 * Tampilkan Alert Error
 */
export const showError = (title, text = '') => {
  return customSwal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonText: 'Tutup'
  })
}

/**
 * Tampilkan Alert Peringatan
 */
export const showWarning = (title, text = '') => {
  return customSwal.fire({
    icon: 'warning',
    title: title,
    text: text,
    confirmButtonText: 'Mengerti'
  })
}

/**
 * Tampilkan Alert Informasi
 */
export const showInfo = (title, text = '') => {
  return customSwal.fire({
    icon: 'info',
    title: title,
    text: text,
    confirmButtonText: 'Oke'
  })
}

/**
 * Tampilkan Konfirmasi (Menggantikan confirm())
 */
export const confirmAction = async ({
  title = 'Apakah Anda yakin?',
  text = 'Tindakan ini tidak dapat dibatalkan.',
  confirmButtonText = 'Ya, Lanjutkan',
  cancelButtonText = 'Batal',
  icon = 'warning'
} = {}) => {
  const result = await customSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true
  })
  return result.isConfirmed
}

/**
 * Tampilkan Input Prompt (Menggantikan prompt())
 */
export const promptInput = async ({
  title = 'Masukkan Alasan',
  text = '',
  placeholder = 'Tuliskan di sini...',
  input = 'text',
  inputValidator = null
} = {}) => {
  const result = await customSwal.fire({
    title,
    text,
    input,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: 'Kirim',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    inputValidator: inputValidator || ((value) => {
      if (!value && input !== 'textarea') {
        return 'Bidang ini tidak boleh kosong!'
      }
    })
  })

  if (result.isConfirmed) {
    return result.value
  }
  return null
}

export default customSwal
