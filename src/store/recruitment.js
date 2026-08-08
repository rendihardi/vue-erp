import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../api'

export const useRecruitmentStore = defineStore('recruitment', () => {
  const jobs = ref([])
  const candidates = ref([])

  async function loadInitialData() {
    try {
      console.log('[API] Loading recruitment data...')
      // Can populate initial recruitment listings if endpoints exist
    } catch (err) {
      console.error('[API Error] Fetching recruitment data failed:', err.message)
    }
  }

  async function convertCandidateAction(candidateId, positionId) {
    try {
      console.log(`[API] Converting candidate ${candidateId} to employee on server...`)
      const res = await api.convertCandidate(candidateId, positionId)
      if (res && res.success) {
        console.log('[API] Candidate converted to employee successfully')
        await loadInitialData()
        return { success: true, name: res.data?.name || 'New Employee', nik: res.data?.nik || 'EMP-00X' }
      }
      return { success: false, message: res?.message || 'Failed to onboard candidate.' }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  return {
    jobs,
    candidates,
    loadInitialData,
    convertCandidateAction
  }
})
