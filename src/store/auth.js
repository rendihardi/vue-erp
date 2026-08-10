import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  async function loginAction(email, password) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] Logging in user: ${email}`)
      const response = await axiosInstance.post('/auth/login', { email, password })
      const res = response.data
      if (res && res.success) {
        token.value = res.data.access_token
        user.value = res.data.user
        localStorage.setItem('token', res.data.access_token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        return { success: true }
      }
      return { success: false, message: res?.message || 'Login failed.' }
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function logoutAction() {
    try {
      await axiosInstance.post('/auth/logout')
    } catch (err) {
      console.warn('[API] Token revocation error', err.message)
    } finally {
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  async function fetchMeAction() {
    try {
      const response = await axiosInstance.get('/auth/me')
      if (response.data?.success && response.data?.data) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(response.data.data))
      }
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return null
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    loginAction,
    logoutAction,
    fetchMeAction
  }
})
