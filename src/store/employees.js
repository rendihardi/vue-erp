import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref([])
  const attendanceLogs = ref([])
  const departments = ref([])
  const positions = ref([])
  const officeLocations = ref([])
  const contracts = ref([])

  const employeesPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const departmentsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const positionsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const officeLocationsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const contractsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })

  const loading = ref(false)
  const error = ref(null)
  const success = ref(null)

  const totalEmployees = computed(() => employees.value.length)
  
  const todayAttendanceRate = computed(() => {
    if (totalEmployees.value === 0) return 0
    const present = attendanceLogs.value.length
    return Math.round((present / totalEmployees.value) * 100)
  })

  // Individual Fetch Actions
  async function fetchEmployee(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/employees/${id}`)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDepartment(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/departments/${id}`)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPosition(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/positions/${id}`)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchOfficeLocation(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/office-locations/${id}`)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
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

  // Individual Lazy Loaders
  async function loadEmployeesOnly() {
    loading.value = true
    error.value = null
    try {
      let empRes
      try {
        const response = await axiosInstance.get('/employees/paginated', { params: { page: 1, per_page: 100 } })
        empRes = response.data
      } catch (err) {
        if (err.response && err.response.status === 404) {
          const response = await axiosInstance.get('/employees', { params: { page: 1, per_page: 100 } })
          empRes = response.data
        } else {
          throw err
        }
      }

      if (empRes && empRes.success && empRes.data) {
        const items = Array.isArray(empRes.data.data) ? empRes.data.data : (Array.isArray(empRes.data) ? empRes.data : [])
        const meta = empRes.data.meta || {}
        const mapped = items.map(e => ({
          id: e.id,
          nik: e.nik || (e.id ? String(e.id).slice(0, 7) : ''),
          name: e.name,
          email: e.user ? e.user.email : (e.email || ''),
          phone: e.phone || '',
          departmentId: e.department ? e.department.id : (e.department_id || ''),
          positionId: e.position ? e.position.id : (e.position_id || ''),
          officeLocationId: e.office_location ? e.office_location.id : (e.office_location_id || ''),
          dept: e.department ? e.department.name : 'Unassigned',
          position: e.position ? e.position.name : 'Staff',
          officeLocation: e.office_location ? e.office_location.name : 'Kantor Pusat',
          shiftMode: e.shift_mode || 'fixed',
          contractType: e.face_registered ? 'PKWTT' : 'PKWT',
          status: e.status === 'active' || e.status === 'Active' ? 'Active' : 'Inactive',
          role: e.role || (e.user ? e.user.role : 'employee'),
          faceRegistered: !!e.face_registered,
          avatar: e.avatar_url || e.avatar || null
        }))
        employees.value = mapped
        employeesPaginated.value = {
          data: mapped,
          current_page: meta.current_page || 1,
          last_page: meta.last_page || 1,
          total: meta.total || mapped.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching employees failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function loadDepartmentsOnly() {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/departments')
      const deptRes = response.data
      if (deptRes && deptRes.success && Array.isArray(deptRes.data)) {
        departments.value = deptRes.data
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching departments failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function loadPositionsOnly() {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/positions')
      const posRes = response.data
      if (posRes && posRes.success && Array.isArray(posRes.data)) {
        positions.value = posRes.data
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching positions failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function loadOfficeLocationsOnly() {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/office-locations')
      const locRes = response.data
      if (locRes && locRes.success && Array.isArray(locRes.data)) {
        officeLocations.value = locRes.data
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching office locations failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function loadAttendanceSummaryOnly() {
    loading.value = true
    error.value = null
    try {
      const todayString = new Date().toISOString().split('T')[0]
      const response = await axiosInstance.get('/attendance/daily-summary', { params: { date: todayString } })
      const summaryRes = response.data
      if (summaryRes && summaryRes.success && summaryRes.data && Array.isArray(summaryRes.data.data)) {
        attendanceLogs.value = summaryRes.data.data.map(log => ({
          id: String(log.id).slice(0, 8),
          employeeId: String(log.employee_id).slice(0, 8),
          name: log.notes ? log.notes.split(' | ')[0] : 'Employee Log',
          dept: 'HRIS Core',
          checkIn: log.check_in_time ? log.check_in_time.split('T')[1].slice(0, 8) : '08:00:00',
          checkOut: log.check_out_time ? log.check_out_time.split('T')[1].slice(0, 8) : null,
          status: log.status === 'present' ? 'Ontime' : 'Late',
          coord: `${log.check_in_latitude}, ${log.check_in_longitude}`,
          method: 'Face + GPS'
        }))
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching attendance summary failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function loadContractsOnly() {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/contracts')
      const contractRes = response.data
      if (contractRes && contractRes.success && Array.isArray(contractRes.data)) {
        contracts.value = contractRes.data
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching contracts failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function loadInitialData() {
    if (employees.value.length === 0) {
      await loadEmployeesOnly()
    }
  }

  async function loadEmployeesPaginated(page = 1, perPage = 10, search = '') {
    loading.value = true
    error.value = null
    try {
      let res
      try {
        const response = await axiosInstance.get('/employees/paginated', { params: { page, per_page: perPage, search } })
        res = response.data
      } catch (err) {
        if (err.response && err.response.status === 404) {
          const response = await axiosInstance.get('/employees', { params: { page, per_page: perPage, search } })
          res = response.data
        } else {
          throw err
        }
      }

      if (res && res.success && res.data) {
        const items = Array.isArray(res.data.data) ? res.data.data : []
        const meta = res.data.meta || {}
        const mapped = items.map(e => ({
          id: e.id,
          nik: e.nik || String(e.id).slice(0, 7),
          name: e.name,
          email: e.user ? e.user.email : (e.email || ''),
          phone: e.phone || '',
          departmentId: e.department ? e.department.id : (e.department_id || ''),
          positionId: e.position ? e.position.id : (e.position_id || ''),
          officeLocationId: e.office_location ? e.office_location.id : (e.office_location_id || ''),
          dept: e.department ? e.department.name : 'Unassigned',
          position: e.position ? e.position.name : 'Staff',
          officeLocation: e.office_location ? e.office_location.name : 'Kantor Pusat',
          shiftMode: e.shift_mode || 'fixed',
          contractType: e.face_registered ? 'PKWTT' : 'PKWT',
          status: e.status === 'active' || e.status === 'Active' ? 'Active' : 'Inactive',
          role: e.role || (e.user ? e.user.role : 'employee'),
          faceRegistered: !!e.face_registered,
          avatar: e.avatar_url || e.avatar || null
        }))
        employees.value = mapped
        employeesPaginated.value = {
          data: mapped,
          current_page: meta.current_page || page,
          last_page: meta.last_page || 1,
          total: meta.total || mapped.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function loadOfficeLocationsPaginated(page = 1, perPage = 10, search = '') {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/office-locations/paginated', { params: { page, per_page: perPage, search } })
      const res = response.data
      if (res && res.success && res.data) {
        const items = Array.isArray(res.data.data) ? res.data.data : []
        officeLocations.value = items
        officeLocationsPaginated.value = {
          data: items,
          current_page: res.data.meta?.current_page || page,
          last_page: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || items.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function loadDepartmentsPaginated(page = 1, perPage = 10, search = '') {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/departments/paginated', { params: { page, per_page: perPage, search } })
      const res = response.data
      if (res && res.success && res.data) {
        const items = Array.isArray(res.data.data) ? res.data.data : []
        departments.value = items
        departmentsPaginated.value = {
          data: items,
          current_page: res.data.meta?.current_page || page,
          last_page: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || items.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function loadPositionsPaginated(page = 1, perPage = 10, search = '') {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/positions/paginated', { params: { page, per_page: perPage, search } })
      const res = response.data
      if (res && res.success && res.data) {
        const items = Array.isArray(res.data.data) ? res.data.data : []
        positions.value = items
        positionsPaginated.value = {
          data: items,
          current_page: res.data.meta?.current_page || page,
          last_page: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || items.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function loadContractsPaginated(page = 1, perPage = 10, search = '') {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/contracts/paginated', { params: { page, per_page: perPage, search } })
      const res = response.data
      if (res && res.success && res.data) {
        const items = Array.isArray(res.data.data) ? res.data.data : []
        contracts.value = items
        contractsPaginated.value = {
          data: items,
          current_page: res.data.meta?.current_page || page,
          last_page: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || items.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  // Employee CRUD
  async function createEmployeeAction(data) {
    loading.value = true
    error.value = null
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
      const response = await axiosInstance.post('/employees', data, isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : {})
      const res = response.data
      if (res && res.success) {
        await loadEmployeesOnly()
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

  async function updateEmployeeAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
      let response
      if (isFormData) {
        if (!data.has('_method')) {
          data.append('_method', 'PUT')
        }
        response = await axiosInstance.post(`/employees/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        response = await axiosInstance.put(`/employees/${id}`, data)
      }
      const res = response.data
      if (res && res.success) {
        await loadEmployeesOnly()
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

  async function deleteEmployeeAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/employees/${id}`)
      const res = response.data
      if (res && res.success) {
        await loadEmployeesOnly()
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

  // Office Location CRUD
  async function createOfficeLocationAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/office-locations', data)
      const res = response.data
      if (res && res.success) {
        await loadOfficeLocationsOnly()
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

  async function updateOfficeLocationAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/office-locations/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await loadOfficeLocationsOnly()
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

  async function deleteOfficeLocationAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/office-locations/${id}`)
      const res = response.data
      if (res && res.success) {
        await loadOfficeLocationsOnly()
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

  // Department CRUD
  async function createDepartmentAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/departments', data)
      const res = response.data
      if (res && res.success) {
        await loadDepartmentsOnly()
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

  async function updateDepartmentAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/departments/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await loadDepartmentsOnly()
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

  async function deleteDepartmentAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/departments/${id}`)
      const res = response.data
      if (res && res.success) {
        await loadDepartmentsOnly()
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

  // Position CRUD
  async function createPositionAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/positions', data)
      const res = response.data
      if (res && res.success) {
        await loadPositionsOnly()
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

  async function updatePositionAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/positions/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await loadPositionsOnly()
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

  async function deletePositionAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/positions/${id}`)
      const res = response.data
      if (res && res.success) {
        await loadPositionsOnly()
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

  async function checkInEmployee(employeeId, status = 'Ontime') {
    loading.value = true
    error.value = null
    try {
      const employee = employees.value.find(e => e.id === employeeId || e.nik === employeeId)
      if (!employee) return { success: false, message: 'Karyawan tidak ditemukan' }

      const formData = new FormData()
      formData.append('latitude', '-6.2088')
      formData.append('longitude', '106.8456')
      formData.append('notes', status === 'Ontime' ? 'Tepat waktu' : 'Terlambat')
      
      const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01, 0x00])], { type: 'image/jpeg' })
      const dummySelfie = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
      formData.append('selfie_image', dummySelfie)

      console.log(`[API] Registering check-in on server for employee: ${employeeId}`)
      const response = await axiosInstance.post('/attendance/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const apiRes = response.data
      if (apiRes && apiRes.success) {
        console.log('[API] Check-in successfully registered')
        await loadAttendanceSummaryOnly()
        return apiRes
      }
      return apiRes
    } catch (err) {
      const msg = handleError(err)
      error.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  // Contract Actions
  async function createContractAction(data) {
    loading.value = true
    error.value = null
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
      const response = await axiosInstance.post('/contracts', data, isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : {})
      const res = response.data
      if (res && res.success) {
        await loadContractsOnly()
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

  async function updateContractAction(id, data) {
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
      const res = response.data
      if (res && res.success) {
        await loadContractsOnly()
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

  async function deleteContractAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/contracts/${id}`)
      const res = response.data
      if (res && res.success) {
        await loadContractsOnly()
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
    employees,
    attendanceLogs,
    departments,
    positions,
    officeLocations,
    contracts,
    employeesPaginated,
    departmentsPaginated,
    positionsPaginated,
    officeLocationsPaginated,
    contractsPaginated,
    loading,
    error,
    success,
    totalEmployees,
    todayAttendanceRate,
    fetchEmployee,
    fetchDepartment,
    fetchPosition,
    fetchOfficeLocation,
    fetchContract,
    downloadContractFile,
    loadInitialData,
    loadEmployeesOnly,
    loadDepartmentsOnly,
    loadPositionsOnly,
    loadOfficeLocationsOnly,
    loadAttendanceSummaryOnly,
    loadContractsOnly,
    loadEmployeesPaginated,
    loadOfficeLocationsPaginated,
    loadDepartmentsPaginated,
    loadPositionsPaginated,
    loadContractsPaginated,
    createEmployeeAction,
    updateEmployeeAction,
    deleteEmployeeAction,
    createOfficeLocationAction,
    updateOfficeLocationAction,
    deleteOfficeLocationAction,
    createDepartmentAction,
    updateDepartmentAction,
    deleteDepartmentAction,
    createPositionAction,
    updatePositionAction,
    deletePositionAction,
    createContractAction,
    updateContractAction,
    deleteContractAction,
    checkInEmployee
  }
})

// Alias export to maintain backward compatibility with components using useEmployeesStore
export const useEmployeesStore = useEmployeeStore
