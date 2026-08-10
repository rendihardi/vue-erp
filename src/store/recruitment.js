import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const useRecruitmentStore = defineStore('recruitment', () => {
  const jobs = ref([])
  const candidates = ref([])
  const loading = ref(false)
  const error = ref(null)
  const success = ref(null)

  async function loadInitialData() {
    loading.value = true
    error.value = null
    try {
      console.log('[API] Loading recruitment data...')
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching recruitment data failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function createJobAction(jobData) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/recruitment/jobs', jobData)
      return response.data
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function registerCandidateAction(candidateData) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/recruitment/candidates', candidateData)
      return response.data
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function updateCandidateStatusAction(id, status) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.patch(`/recruitment/candidates/${id}/status`, { status })
      return response.data
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  async function convertCandidateAction(candidateId, positionId) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] Converting candidate ${candidateId} to employee on server...`)
      const response = await axiosInstance.post(`/recruitment/candidates/${candidateId}/convert`, { position_id: positionId })
      const res = response.data
      if (res && res.success) {
        console.log('[API] Candidate converted to employee successfully')
        await loadInitialData()
        return { success: true, name: res.data?.name || 'New Employee', nik: res.data?.nik || 'EMP-00X' }
      }
      return { success: false, message: res?.message || 'Failed to onboard candidate.' }
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  return {
    jobs,
    candidates,
    loading,
    error,
    success,
    loadInitialData,
    createJobAction,
    registerCandidateAction,
    updateCandidateStatusAction,
    convertCandidateAction
  }
})
