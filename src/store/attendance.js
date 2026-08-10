import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const useAttendanceStore = defineStore('attendance', () => {
  const attendanceLogs = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function checkIn(formData) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/attendance/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function checkOut(formData) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/attendance/check-out', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchDailySummary(date) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/attendance/daily-summary', {
        params: { date }
      })
      if (response.data?.success && response.data?.data) {
        attendanceLogs.value = Array.isArray(response.data.data.data) ? response.data.data.data : []
      }
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    attendanceLogs,
    loading,
    error,
    checkIn,
    checkOut,
    fetchDailySummary
  }
})
