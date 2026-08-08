import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../api'

export const usePerformanceStore = defineStore('performance', () => {
  const reviews = ref([])

  async function loadInitialData() {
    try {
      console.log('[API] Loading KPI reviews...')
      // Fallback/direct fetch reviews
    } catch (err) {
      console.error('[API Error] Fetching performance review data failed:', err.message)
    }
  }

  async function rateManagerAction(reviewId, managerScore, managerNotes) {
    try {
      console.log(`[API] Saving manager rating on server for review ID: ${reviewId}`)
      const res = await api.rateManager(reviewId, managerScore, managerNotes)
      if (res && res.success) {
        console.log('[API] Manager rating saved on server')
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function releaseScorecardAction(reviewId) {
    try {
      console.log(`[API] Releasing final scorecard on server for review ID: ${reviewId}`)
      const res = await api.releaseScorecard(reviewId)
      if (res && res.success) {
        console.log('[API] Scorecard released on server successfully')
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  return {
    reviews,
    loadInitialData,
    rateManagerAction,
    releaseScorecardAction
  }
})
