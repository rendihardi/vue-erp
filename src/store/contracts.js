import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const useContractStore = defineStore('contracts', () => {
  const contracts = ref([])
  const contractsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const loading = ref(false)
  const error = ref(null)

  async function fetchContracts() {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/contracts')
      if (response.data?.success && Array.isArray(response.data?.data)) {
        contracts.value = response.data.data
      }
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchContractsPaginated(page = 1, perPage = 10, search = '') {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/contracts/paginated', {
        params: { page, per_page: perPage, search }
      })
      if (response.data?.success && response.data?.data) {
        const items = Array.isArray(response.data.data.data) ? response.data.data.data : []
        contracts.value = items
        contractsPaginated.value = {
          data: items,
          current_page: response.data.meta?.current_page || page,
          last_page: response.data.meta?.last_page || 1,
          total: response.data.meta?.total || items.length
        }
      }
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchContract(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/contracts/${id}`)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createContract(data) {
    loading.value = true
    error.value = null
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
      const response = await axiosInstance.post('/contracts', data, isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : {})
      if (response.data?.success) {
        await fetchContracts()
      }
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function updateContract(id, data) {
    loading.value = true
    error.value = null
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
      let response
      if (isFormData) {
        if (!data.has('_method')) {
          data.append('_method', 'PUT')
        }
        response = await axiosInstance.post(`/contracts/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        response = await axiosInstance.put(`/contracts/${id}`, data)
      }
      if (response.data?.success) {
        await fetchContracts()
      }
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function deleteContract(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/contracts/${id}`)
      if (response.data?.success) {
        await fetchContracts()
      }
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function downloadContractFile(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/contracts/${id}/download`, {
        responseType: 'blob'
      })
      return response
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    contracts,
    contractsPaginated,
    loading,
    error,
    fetchContracts,
    fetchContractsPaginated,
    fetchContract,
    createContract,
    updateContract,
    deleteContract,
    downloadContractFile
  }
})
