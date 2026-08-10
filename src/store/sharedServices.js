import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const useSharedServicesStore = defineStore('sharedServices', () => {
  const nationalHolidays = ref([])
  const auditLogs = ref([])
  const employeeLocationHistories = ref({})
  const faceProfiles = ref({})
  const loading = ref(false)
  const error = ref(null)
  const success = ref(null)

  async function loadNationalHolidays(year = null) {
    loading.value = true
    error.value = null
    try {
      let res
      try {
        const response = await axiosInstance.get('/national-holidays/paginated', {
          params: { page: 1, per_page: 100, ...(year ? { year } : {}) }
        })
        res = response.data
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.warn('[API Fallback] /national-holidays/paginated not found (404), falling back to /national-holidays')
          const response = await axiosInstance.get('/national-holidays', { params: year ? { year } : {} })
          res = response.data
        } else {
          throw err
        }
      }

      if (res && res.success && res.data) {
        const rawItems = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
        nationalHolidays.value = rawItems.map(h => ({
          ...h,
          date: h.date ? (String(h.date).includes('T') ? String(h.date).split('T')[0] : String(h.date)) : ''
        }))
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching national holidays failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function createNationalHolidayAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/national-holidays', data)
      const res = response.data
      if (res && res.success) {
        await loadNationalHolidays()
      }
      return res
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function updateNationalHolidayAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/national-holidays/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await loadNationalHolidays()
      }
      return res
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function deleteNationalHolidayAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/national-holidays/${id}`)
      const res = response.data
      if (res && res.success) {
        await loadNationalHolidays()
      }
      return res
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function loadLocationHistory(employeeId) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/employees/${employeeId}/location-history`)
      const res = response.data
      if (res && res.success && Array.isArray(res.data)) {
        employeeLocationHistories.value[employeeId] = res.data
        return res.data
      }
    } catch (err) {
      error.value = handleError(err)
      console.error(`[API Error] Fetching location history for ${employeeId} failed:`, err.message)
    } finally {
      loading.value = false
    }
    return []
  }

  async function loadFaceProfile(employeeId) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/employees/${employeeId}/face-profile`)
      const res = response.data
      if (res && res.success) {
        faceProfiles.value[employeeId] = res.data
        return res.data
      }
    } catch (err) {
      error.value = handleError(err)
      console.error(`[API Error] Fetching face profile for ${employeeId} failed:`, err.message)
    } finally {
      loading.value = false
    }
    return null
  }

  async function registerFaceProfileAction(employeeId, formData) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/employees/${employeeId}/face-profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const res = response.data
      if (res && res.success) {
        await loadFaceProfile(employeeId)
      }
      return res
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function revokeFaceProfileAction(employeeId) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/employees/${employeeId}/face-profile`)
      const res = response.data
      if (res && res.success) {
        await loadFaceProfile(employeeId)
      }
      return res
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function loadAuditLogs(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/audit-logs', { params })
      const res = response.data
      if (res && res.success && res.data) {
        if (Array.isArray(res.data.data)) {
          auditLogs.value = res.data.data
        } else if (Array.isArray(res.data)) {
          auditLogs.value = res.data
        }
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching audit logs failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function loadInitialData() {
    // On-demand
  }

  return {
    nationalHolidays,
    auditLogs,
    employeeLocationHistories,
    faceProfiles,
    loading,
    error,
    success,
    loadNationalHolidays,
    createNationalHolidayAction,
    updateNationalHolidayAction,
    deleteNationalHolidayAction,
    loadLocationHistory,
    loadFaceProfile,
    registerFaceProfileAction,
    revokeFaceProfileAction,
    loadAuditLogs,
    loadInitialData
  }
})
