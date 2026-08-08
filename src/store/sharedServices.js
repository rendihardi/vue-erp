import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../api'

export const useSharedServicesStore = defineStore('sharedServices', () => {
  const nationalHolidays = ref([])
  const auditLogs = ref([])
  const employeeLocationHistories = ref({})
  const faceProfiles = ref({})

  async function loadNationalHolidays(year = null) {
    try {
      // API Contract 02: try /national-holidays/paginated first, fallback to /national-holidays if 404
      let res
      try {
        res = await api.fetchNationalHolidaysPaginated(1, 100, year)
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.warn('[API Fallback] /national-holidays/paginated not found (404), falling back to /national-holidays')
          res = await api.fetchNationalHolidays()
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
      console.error('[API Error] Fetching national holidays failed:', err.message)
    }
  }

  async function createNationalHolidayAction(data) {
    try {
      const res = await api.createNationalHoliday(data)
      if (res && res.success) {
        await loadNationalHolidays()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function updateNationalHolidayAction(id, data) {
    try {
      const res = await api.updateNationalHoliday(id, data)
      if (res && res.success) {
        await loadNationalHolidays()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function deleteNationalHolidayAction(id) {
    try {
      const res = await api.deleteNationalHoliday(id)
      if (res && res.success) {
        await loadNationalHolidays()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function loadLocationHistory(employeeId) {
    try {
      const res = await api.fetchEmployeeLocationHistory(employeeId)
      if (res && res.success && Array.isArray(res.data)) {
        employeeLocationHistories.value[employeeId] = res.data
        return res.data
      }
    } catch (err) {
      console.error(`[API Error] Fetching location history for ${employeeId} failed:`, err.message)
    }
    return []
  }

  async function loadFaceProfile(employeeId) {
    try {
      const res = await api.fetchFaceProfile(employeeId)
      if (res && res.success) {
        faceProfiles.value[employeeId] = res.data
        return res.data
      }
    } catch (err) {
      console.error(`[API Error] Fetching face profile for ${employeeId} failed:`, err.message)
    }
    return null
  }

  async function registerFaceProfileAction(employeeId, formData) {
    try {
      const res = await api.registerFaceProfile(employeeId, formData)
      if (res && res.success) {
        await loadFaceProfile(employeeId)
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function revokeFaceProfileAction(employeeId) {
    try {
      const res = await api.revokeFaceProfile(employeeId)
      if (res && res.success) {
        await loadFaceProfile(employeeId)
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function loadAuditLogs(params = {}) {
    try {
      const res = await api.fetchAuditLogs(params)
      if (res && res.success && res.data) {
        // API Contract 02: audit logs response structure:
        // res.data.current_page + res.data.data (flat, not nested meta)
        if (Array.isArray(res.data.data)) {
          auditLogs.value = res.data.data
        } else if (Array.isArray(res.data)) {
          auditLogs.value = res.data
        }
      }
    } catch (err) {
      console.error('[API Error] Fetching audit logs failed:', err.message)
    }
  }

  async function loadInitialData() {
    // No-op: Each page loads its own data on-demand
    // National Holidays → loaded by NationalHolidays.vue
    // Audit Logs → loaded by AuditLogs.vue
  }

  return {
    nationalHolidays,
    auditLogs,
    employeeLocationHistories,
    faceProfiles,
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
