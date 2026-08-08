import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api'

export const useEmployeesStore = defineStore('employees', () => {
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

  const totalEmployees = computed(() => employees.value.length)
  
  const todayAttendanceRate = computed(() => {
    if (totalEmployees.value === 0) return 0
    const present = attendanceLogs.value.length
    return Math.round((present / totalEmployees.value) * 100)
  })

  // Individual Lazy Loaders — each fetches ONLY its own data
  async function loadEmployeesOnly() {
    try {
      const empRes = await api.fetchEmployeesPaginated(1, 100)
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
      console.error('[API Error] Fetching employees failed:', err.message)
    }
  }

  async function loadDepartmentsOnly() {
    try {
      const deptRes = await api.fetchDepartments()
      if (deptRes && deptRes.success && Array.isArray(deptRes.data)) {
        departments.value = deptRes.data
      }
    } catch (err) {
      console.error('[API Error] Fetching departments failed:', err.message)
    }
  }

  async function loadPositionsOnly() {
    try {
      const posRes = await api.fetchPositions()
      if (posRes && posRes.success && Array.isArray(posRes.data)) {
        positions.value = posRes.data
      }
    } catch (err) {
      console.error('[API Error] Fetching positions failed:', err.message)
    }
  }

  async function loadOfficeLocationsOnly() {
    try {
      const locRes = await api.fetchOfficeLocations()
      if (locRes && locRes.success && Array.isArray(locRes.data)) {
        officeLocations.value = locRes.data
      }
    } catch (err) {
      console.error('[API Error] Fetching office locations failed:', err.message)
    }
  }

  async function loadAttendanceSummaryOnly() {
    try {
      const todayString = new Date().toISOString().split('T')[0]
      const summaryRes = await api.fetchDailySummary(todayString)
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
      console.error('[API Error] Fetching attendance summary failed:', err.message)
    }
  }

  async function loadContractsOnly() {
    try {
      const contractRes = await api.fetchContracts()
      if (contractRes && contractRes.success && Array.isArray(contractRes.data)) {
        contracts.value = contractRes.data
      }
    } catch (err) {
      console.error('[API Error] Fetching contracts failed:', err.message)
    }
  }

  // Lightweight initial load — ONLY employees for dropdown references
  async function loadInitialData() {
    if (employees.value.length === 0) {
      await loadEmployeesOnly()
    }
  }

  async function loadEmployeesPaginated(page = 1, perPage = 10, search = '') {
    const res = await api.fetchEmployeesPaginated(page, perPage, search)
    if (res && res.success && res.data) {
      // API Contract 01: paginated response: res.data.data (items) + res.data.meta (pagination)
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
  }

  async function loadOfficeLocationsPaginated(page = 1, perPage = 10, search = '') {
    const res = await api.fetchOfficeLocationsPaginated(page, perPage, search)
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
  }

  async function loadDepartmentsPaginated(page = 1, perPage = 10, search = '') {
    const res = await api.fetchDepartmentsPaginated(page, perPage, search)
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
  }

  async function loadPositionsPaginated(page = 1, perPage = 10, search = '') {
    const res = await api.fetchPositionsPaginated(page, perPage, search)
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
  }

  async function loadContractsPaginated(page = 1, perPage = 10, search = '') {
    const res = await api.fetchContractsPaginated(page, perPage, search)
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
  }

  // Employee CRUD
  async function createEmployeeAction(data) {
    try {
      const res = await api.createEmployee(data)
      if (res && res.success) {
        await loadEmployeesOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function updateEmployeeAction(id, data) {
    try {
      const res = await api.updateEmployee(id, data)
      if (res && res.success) {
        await loadEmployeesOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function deleteEmployeeAction(id) {
    try {
      const res = await api.deleteEmployee(id)
      if (res && res.success) {
        await loadEmployeesOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // Office Location CRUD
  async function createOfficeLocationAction(data) {
    try {
      const res = await api.createOfficeLocation(data)
      if (res && res.success) {
        await loadOfficeLocationsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function updateOfficeLocationAction(id, data) {
    try {
      const res = await api.updateOfficeLocation(id, data)
      if (res && res.success) {
        await loadOfficeLocationsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function deleteOfficeLocationAction(id) {
    try {
      const res = await api.deleteOfficeLocation(id)
      if (res && res.success) {
        await loadOfficeLocationsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // Department CRUD
  async function createDepartmentAction(data) {
    try {
      const res = await api.createDepartment(data)
      if (res && res.success) {
        await loadDepartmentsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function updateDepartmentAction(id, data) {
    try {
      const res = await api.updateDepartment(id, data)
      if (res && res.success) {
        await loadDepartmentsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function deleteDepartmentAction(id) {
    try {
      const res = await api.deleteDepartment(id)
      if (res && res.success) {
        await loadDepartmentsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // Position CRUD
  async function createPositionAction(data) {
    try {
      const res = await api.createPosition(data)
      if (res && res.success) {
        await loadPositionsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function updatePositionAction(id, data) {
    try {
      const res = await api.updatePosition(id, data)
      if (res && res.success) {
        await loadPositionsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function deletePositionAction(id) {
    try {
      const res = await api.deletePosition(id)
      if (res && res.success) {
        await loadPositionsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function checkInEmployee(employeeId, status = 'Ontime') {
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
      const apiRes = await api.checkIn(formData)
      if (apiRes && apiRes.success) {
        console.log('[API] Check-in successfully registered')
        await loadAttendanceSummaryOnly()
        return apiRes
      }
      return apiRes
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // Contract Actions
  async function createContractAction(data) {
    try {
      const res = await api.createContract(data)
      if (res && res.success) {
        await loadContractsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function updateContractAction(id, data) {
    try {
      const res = await api.updateContract(id, data)
      if (res && res.success) {
        await loadContractsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function deleteContractAction(id) {
    try {
      const res = await api.deleteContract(id)
      if (res && res.success) {
        await loadContractsOnly()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
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
    totalEmployees,
    todayAttendanceRate,
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
