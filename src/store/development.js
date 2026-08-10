import { defineStore } from 'pinia'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const useDevelopmentStore = defineStore('development', {
  state: () => ({
    developments: [],
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
    },
    loading: false,
    error: null,
    success: null,
  }),

  actions: {
    async fetchDevelopment(params) {
      this.loading = true
      this.error = null

      try {
        const response = await axiosInstance.get('/development', {
          params,
        })

        this.developments = response.data.data
        this.meta = response.data.meta
      } catch (error) {
        this.error = handleError(error)
      } finally {
        this.loading = false
      }
    },
  },
})
