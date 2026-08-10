import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const usePerformanceStore = defineStore('performance', () => {
  const reviews = ref([])
  const loading = ref(false)
  const error = ref(null)
  const success = ref(null)

  async function loadInitialData() {
    loading.value = true
    error.value = null
    try {
      console.log('[API] Loading KPI reviews...')
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching performance review data failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function rateManagerAction(reviewId, managerScore, managerNotes) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] Saving manager rating on server for review ID: ${reviewId}`)
      const response = await axiosInstance.post(`/performance/reviews/${reviewId}/manager-rate`, {
        manager_score: managerScore,
        manager_notes: managerNotes
      })
      const res = response.data
      if (res && res.success) {
        console.log('[API] Manager rating saved on server')
        await loadInitialData()
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

  async function releaseScorecardAction(reviewId) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] Releasing final scorecard on server for review ID: ${reviewId}`)
      const response = await axiosInstance.post(`/performance/reviews/${reviewId}/release`)
      const res = response.data
      if (res && res.success) {
        console.log('[API] Scorecard released on server successfully')
        await loadInitialData()
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

  return {
    reviews,
    loading,
    error,
    success,
    loadInitialData,
    rateManagerAction,
    releaseScorecardAction
  }
})
