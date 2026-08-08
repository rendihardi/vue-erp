import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null)
  
  const isAuthenticated = computed(() => !!token.value)

  async function loginAction(email, password) {
    console.log(`[API] Logging in user: ${email}`)
    const res = await api.login(email, password)
    if (res && res.success) {
      token.value = res.data.access_token
      user.value = res.data.user
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      return { success: true }
    }
    return { success: false, message: res?.message || 'Login failed.' }
  }

  function logoutAction() {
    api.logout().catch(err => console.warn('[API] Token revocation error', err.message))
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isAuthenticated,
    loginAction,
    logoutAction
  }
})
