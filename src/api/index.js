import axios from 'axios'

// Set the base API URL to point to the Laravel local development server (or fallback)
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10s timeout
})

// Automatically attach Sanctum token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Automatically handle expired/invalid tokens (401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API] Unauthorized (401) detected. Clearing credentials and redirecting to login...')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Authentication
export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password })
  return response.data
}

export const logout = async () => {
  const response = await apiClient.post('/auth/logout')
  return response.data
}

export const fetchMe = async () => {
  const response = await apiClient.get('/auth/me')
  return response.data
}

// Master Office Locations (Sprint 1 - API Contract 01)
export const fetchOfficeLocations = async () => {
  const response = await apiClient.get('/office-locations')
  return response.data
}

export const fetchOfficeLocationsPaginated = async (page = 1, perPage = 10, search = '') => {
  const response = await apiClient.get('/office-locations/paginated', {
    params: { page, per_page: perPage, search }
  })
  return response.data
}

export const fetchOfficeLocation = async (id) => {
  const response = await apiClient.get(`/office-locations/${id}`)
  return response.data
}

export const createOfficeLocation = async (locationData) => {
  const response = await apiClient.post('/office-locations', locationData)
  return response.data
}

export const updateOfficeLocation = async (id, locationData) => {
  const response = await apiClient.put(`/office-locations/${id}`, locationData)
  return response.data
}

export const deleteOfficeLocation = async (id) => {
  const response = await apiClient.delete(`/office-locations/${id}`)
  return response.data
}

// Module 02: Shared Services & Audit
// 1. National Holidays
export const fetchNationalHolidays = async (year = null) => {
  const response = await apiClient.get('/national-holidays', { params: year ? { year } : {} })
  return response.data
}

// API Contract 02: paginated endpoint for national holidays
export const fetchNationalHolidaysPaginated = async (page = 1, perPage = 10, year = null) => {
  const params = { page, per_page: perPage }
  if (year) params.year = year
  const response = await apiClient.get('/national-holidays/paginated', { params })
  return response.data
}
export const createNationalHoliday = async (holidayData) => {
  const response = await apiClient.post('/national-holidays', holidayData)
  return response.data
}

export const updateNationalHoliday = async (id, holidayData) => {
  const response = await apiClient.put(`/national-holidays/${id}`, holidayData)
  return response.data
}

export const deleteNationalHoliday = async (id) => {
  const response = await apiClient.delete(`/national-holidays/${id}`)
  return response.data
}

// 2. Employee Location History
export const fetchEmployeeLocationHistory = async (employeeId) => {
  const response = await apiClient.get(`/employees/${employeeId}/location-history`)
  return response.data
}

// 3. Face Profile & UU PDP Consent
export const fetchFaceProfile = async (employeeId) => {
  const response = await apiClient.get(`/employees/${employeeId}/face-profile`)
  return response.data
}

export const registerFaceProfile = async (employeeId, formData) => {
  const response = await apiClient.post(`/employees/${employeeId}/face-profile`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const revokeFaceProfile = async (employeeId) => {
  const response = await apiClient.delete(`/employees/${employeeId}/face-profile`)
  return response.data
}

// 4. Audit Logs
export const fetchAuditLogs = async (params = {}) => {
  const response = await apiClient.get('/audit-logs', { params })
  return response.data
}

// Master Employees, Departments, & Positions (Sprint 1)
export const fetchEmployees = async (params = {}) => {
  const response = await apiClient.get('/employees', { params })
  return response.data
}

export const fetchEmployeesPaginated = async (page = 1, perPage = 10, search = '') => {
  try {
    const response = await apiClient.get('/employees/paginated', {
      params: { page, per_page: perPage, search }
    })
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn('[API Fallback] /employees/paginated return 404. Falling back to GET /employees...')
      const response = await apiClient.get('/employees', {
        params: { page, per_page: perPage, search }
      })
      return response.data
    }
    throw err
  }
}

export const fetchEmployee = async (id) => {
  const response = await apiClient.get(`/employees/${id}`)
  return response.data
}

export const createEmployee = async (employeeData) => {
  const isFormData = typeof FormData !== 'undefined' && employeeData instanceof FormData
  const response = await apiClient.post('/employees', employeeData, isFormData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : {})
  return response.data
}

export const updateEmployee = async (id, employeeData) => {
  const isFormData = typeof FormData !== 'undefined' && employeeData instanceof FormData
  if (isFormData) {
    if (!employeeData.has('_method')) {
      employeeData.append('_method', 'PUT')
    }
    const response = await apiClient.post(`/employees/${id}`, employeeData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
  const response = await apiClient.put(`/employees/${id}`, employeeData)
  return response.data
}

export const deleteEmployee = async (id) => {
  const response = await apiClient.delete(`/employees/${id}`)
  return response.data
}

export const fetchDepartments = async () => {
  const response = await apiClient.get('/departments')
  return response.data
}

export const fetchDepartmentsPaginated = async (page = 1, perPage = 10, search = '') => {
  const response = await apiClient.get('/departments/paginated', {
    params: { page, per_page: perPage, search }
  })
  return response.data
}

export const fetchDepartment = async (id) => {
  const response = await apiClient.get(`/departments/${id}`)
  return response.data
}

export const createDepartment = async (departmentData) => {
  const response = await apiClient.post('/departments', departmentData)
  return response.data
}

export const updateDepartment = async (id, departmentData) => {
  const response = await apiClient.put(`/departments/${id}`, departmentData)
  return response.data
}

export const deleteDepartment = async (id) => {
  const response = await apiClient.delete(`/departments/${id}`)
  return response.data
}

export const fetchPositions = async () => {
  const response = await apiClient.get('/positions')
  return response.data
}

export const fetchPositionsPaginated = async (page = 1, perPage = 10, search = '') => {
  const response = await apiClient.get('/positions/paginated', {
    params: { page, per_page: perPage, search }
  })
  return response.data
}

export const fetchPosition = async (id) => {
  const response = await apiClient.get(`/positions/${id}`)
  return response.data
}

export const createPosition = async (positionData) => {
  const response = await apiClient.post('/positions', positionData)
  return response.data
}

export const updatePosition = async (id, positionData) => {
  const response = await apiClient.put(`/positions/${id}`, positionData)
  return response.data
}

export const deletePosition = async (id) => {
  const response = await apiClient.delete(`/positions/${id}`)
  return response.data
}

// Attendance & Geofencing (Sprint 2)
export const checkIn = async (formData) => {
  // Check-in requires multipart form-data because it uploads a selfie image file
  const response = await apiClient.post('/attendance/check-in', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const checkOut = async (formData) => {
  const response = await apiClient.post('/attendance/check-out', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const fetchDailySummary = async (date) => {
  const response = await apiClient.get('/attendance/daily-summary', {
    params: { date }
  })
  return response.data
}

// Payroll Engine - API Contract 07
export const fetchPayrollRuns = async () => {
  const response = await apiClient.get('/payroll/runs')
  return response.data
}

export const runPayroll = async (month, year) => {
  const response = await apiClient.post('/payroll/run', { month, year })
  return response.data
}

// API Contract 07: Release / Finalisasi Payroll
export const releasePayroll = async (runId) => {
  const response = await apiClient.post(`/payroll/runs/${runId}/release`)
  return response.data
}

export const fetchPayrollSlips = async (runId) => {
  const response = await apiClient.get(`/payroll/runs/${runId}/slips`)
  return response.data
}

// API Contract 07: Slip Gaji Karyawan (Self-Service)
export const fetchMyPayslips = async () => {
  const response = await apiClient.get('/payroll/my-slips')
  return response.data
}

export const fetchSlipDetails = async (slipId) => {
  const response = await apiClient.get(`/payroll/slips/${slipId}`)
  return response.data
}

// Overtime Management - API Contract 06
export const fetchOvertimes = async (params = {}) => {
  const response = await apiClient.get('/overtime', { params })
  return response.data
}

// API Contract 06.1: Pre-Approval - Pengajuan Rencana Lembur
export const requestOvertime = async (data) => {
  const response = await apiClient.post('/overtime/request', data)
  return response.data
}

// API Contract 06.2: Claim Lembur Aktual
export const claimOvertime = async (id, data) => {
  const response = await apiClient.post(`/overtime/${id}/claim`, data)
  return response.data
}

export const approveOvertime = async (id, status, rejectionReason = null) => {
  const response = await apiClient.post(`/overtime/${id}/approve`, {
    status,
    rejection_reason: rejectionReason
  })
  return response.data
}

// Performance Management (Sprint 7)
export const createPeriod = async (periodData) => {
  const response = await apiClient.post('/performance/periods', periodData)
  return response.data
}

export const rateManager = async (reviewId, managerScore, managerNotes) => {
  const response = await apiClient.post(`/performance/reviews/${reviewId}/manager-rate`, {
    manager_score: managerScore,
    manager_notes: managerNotes
  })
  return response.data
}

export const releaseScorecard = async (reviewId) => {
  const response = await apiClient.post(`/performance/reviews/${reviewId}/release`)
  return response.data
}

// Recruitment & Onboarding (Sprint 8)
export const createJob = async (jobData) => {
  const response = await apiClient.post('/recruitment/jobs', jobData)
  return response.data
}

export const registerCandidate = async (candidateData) => {
  const response = await apiClient.post('/recruitment/candidates', candidateData)
  return response.data
}

export const updateCandidateStatus = async (id, status) => {
  const response = await apiClient.patch(`/recruitment/candidates/${id}/status`, { status })
  return response.data
}

export const convertCandidate = async (id, positionId) => {
  const response = await apiClient.post(`/recruitment/candidates/${id}/convert`, { position_id: positionId })
  return response.data
}

// Leave & Time-Off (Module 04 - API Contract 04)
export const fetchLeaveBalances = async (params = {}) => {
  const queryParams = typeof params === 'number' || typeof params === 'string' ? { year: params } : params
  const response = await apiClient.get('/leaves/balances', { params: queryParams })
  return response.data
}

// 👥 Endpoint HR Admin: GET /api/v1/leaves/all-balances?page=1&per_page=15&search=&year=
export const fetchLeaveAllBalances = async (page = 1, perPage = 15, params = {}) => {
  const response = await apiClient.get('/leaves/all-balances', {
    params: { page, per_page: perPage, ...params }
  })
  return response.data
}

export const adjustLeaveBalance = async (data) => {
  const response = await apiClient.post('/leaves/balances/adjust', data)
  return response.data
}

export const requestLeave = async (leaveData) => {
  const response = await apiClient.post('/leaves/request', leaveData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const submitLeaveRequest = async (data) => {
  const response = await apiClient.post('/leaves/request', data)
  return response.data
}

export const fetchMyLeaves = async () => {
  const response = await apiClient.get('/leaves/my-requests')
  return response.data
}

export const fetchMyLeaveRequests = async () => {
  const response = await apiClient.get('/leaves/my-requests')
  return response.data
}

export const fetchLeaveRequests = async (params = null, page = 1, perPage = 10) => {
  try {
    const queryParams = typeof params === 'string' 
      ? { status: params, page, per_page: perPage } 
      : (params && typeof params === 'object' ? params : { status: params, page, per_page: perPage })
    const response = await apiClient.get('/leaves/requests', {
      params: queryParams
    })
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn('[API Fallback] /leaves/requests returned 404. Falling back to /leaves/balances...')
      const response = await apiClient.get('/leaves/balances')
      return response.data
    }
    throw err
  }
}

export const fetchLeaveCalendar = async (month = null) => {
  const queryParams = typeof month === 'object' && month !== null ? month : (month ? { month } : {})
  const response = await apiClient.get('/leaves/calendar', { params: queryParams })
  return response.data
}

export const approveLeave = async (id, status, rejectionReason = null) => {
  const response = await apiClient.post(`/leaves/approve/${id}`, {
    status,
    rejection_reason: rejectionReason
  })
  return response.data
}

export const approveLeaveRequest = async (requestId, data) => {
  if (typeof data === 'object' && data !== null) {
    const response = await apiClient.post(`/leaves/approve/${requestId}`, data)
    return response.data
  }
  const response = await apiClient.post(`/leaves/approve/${requestId}`, { status: data })
  return response.data
}

// Shift Management & Roster (Module 03 - API Contract 03)
export const fetchShifts = async () => {
  const response = await apiClient.get('/shifts')
  return response.data
}

// API Contract 03: paginated shifts
export const fetchShiftsPaginated = async (page = 1, perPage = 10) => {
  const response = await apiClient.get('/shifts/paginated', { params: { page, per_page: perPage } })
  return response.data
}

// API Contract 03: Shift Teams
export const fetchShiftTeamsPaginated = async (page = 1, perPage = 10) => {
  try {
    const response = await apiClient.get('/shift-teams/paginated', { params: { page, per_page: perPage } })
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn('[API Fallback] /shift-teams/paginated returned 404. Falling back to GET /shift-teams...')
      const response = await apiClient.get('/shift-teams')
      return response.data
    }
    throw err
  }
}

// Endpoint Karyawan Bebas / Belum Memiliki Tim Shift (GET /shift-teams/available-employees)
export const fetchAvailableShiftTeamEmployees = async (search = '', page = 1, perPage = 100) => {
  try {
    const response = await apiClient.get('/shift-teams/available-employees', {
      params: { search, page, per_page: perPage }
    })
    return response.data
  } catch (err) {
    console.warn('[API Fallback] /shift-teams/available-employees fallback:', err.message)
    return { success: false, data: [] }
  }
}

// Endpoint Kalender Kerja Pribadi Karyawan (GET /rosters/my-calendar)
export const fetchMyWorkCalendar = async (month = null) => {
  try {
    const response = await apiClient.get('/rosters/my-calendar', {
      params: month ? { month } : {}
    })
    return response.data
  } catch (err) {
    console.warn('[API Fallback] /rosters/my-calendar fallback:', err.message)
    return { success: false, data: null }
  }
}

// Endpoint Kalender Matriks Roster Plan (GET /roster-plans/{id}/calendar)
export const fetchRosterPlanCalendar = async (planId) => {
  try {
    const response = await apiClient.get(`/roster-plans/${planId}/calendar`)
    return response.data
  } catch (err) {
    console.warn(`[API Fallback] /roster-plans/${planId}/calendar fallback:`, err.message)
    return { success: false, data: null }
  }
}

// Endpoint Kalender Matriks Tim Shift (GET /shift-teams/{id}/calendar)
export const fetchShiftTeamCalendar = async (teamId, month = null) => {
  try {
    const response = await apiClient.get(`/shift-teams/${teamId}/calendar`, {
      params: month ? { month } : {}
    })
    return response.data
  } catch (err) {
    console.warn(`[API Fallback] /shift-teams/${teamId}/calendar fallback:`, err.message)
    return { success: false, data: null }
  }
}

// Endpoint Kalender Spesifik Karyawan untuk HR Admin (GET /rosters/employee-calendar/{employee_id})
export const fetchEmployeeCalendarForHr = async (employeeId, month = null) => {
  try {
    const response = await apiClient.get(`/rosters/employee-calendar/${employeeId}`, {
      params: month ? { month } : {}
    })
    return response.data
  } catch (err) {
    console.warn(`[API Fallback] /rosters/employee-calendar/${employeeId} fallback:`, err.message)
    return { success: false, data: null }
  }
}

export const generateTeamRoster = async (teamId, startDate, endDate) => {
  const response = await apiClient.post(`/shift-teams/${teamId}/generate-roster`, {
    start_date: startDate,
    end_date: endDate
  })
  return response.data
}

// API Contract 03 §2.3: Buat Tim Shift Baru (POST)
export const createShiftTeam = async (data) => {
  const response = await apiClient.post('/shift-teams', data)
  return response.data
}

// API Contract 03 §2.3 Detail: GET /shift-teams/{id}
export const fetchShiftTeamDetail = async (id) => {
  const response = await apiClient.get(`/shift-teams/${id}`)
  return response.data
}

// API Contract 03 §2.4: Update Tim Shift
export const updateShiftTeam = async (id, data) => {
  const response = await apiClient.put(`/shift-teams/${id}`, data)
  return response.data
}

// API Contract 03 §2.5: Hapus Tim Shift
export const deleteShiftTeam = async (id) => {
  const response = await apiClient.delete(`/shift-teams/${id}`)
  return response.data
}

// API Contract 03 §2.6: Tambah Anggota ke Tim (Individual)
export const addShiftTeamMember = async (teamId, data) => {
  // data: { employee_id, joined_at }
  const response = await apiClient.post(`/shift-teams/${teamId}/members`, data)
  return response.data
}

// API Contract 03 §2.7: Atur Pola Rotasi Tim
export const setTeamRotationPattern = async (teamId, data) => {
  // data: { name, start_date, rotation_sequence: [...] }
  const response = await apiClient.post(`/shift-teams/${teamId}/patterns`, data)
  return response.data
}

// PUT /api/v1/rotation-patterns/{id} (Update Pola Rotasi secara langsung)
export const updateRotationPattern = async (id, data) => {
  const response = await apiClient.put(`/rotation-patterns/${id}`, data)
  return response.data
}

// GET /api/v1/rotation-patterns (List Seluruh Pola Rotasi Terpaginasi & Filterable)
export const fetchRotationPatterns = async (filters = {}) => {
  try {
    const params = typeof filters === 'string' || typeof filters === 'number'
      ? { page: Number(filters), per_page: 9 }
      : {
          page: filters.page || 1,
          per_page: filters.per_page || filters.perPage || 9,
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.shift_team_id ? { shift_team_id: filters.shift_team_id } : {})
        }
    const response = await apiClient.get('/rotation-patterns', { params })
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn('[API Fallback] /rotation-patterns 404, fallback to shift-teams patterns')
      return { success: false, data: [] }
    }
    throw err
  }
}

// DELETE /api/v1/rotation-patterns/{id} (Hapus Pola Rotasi)
export const deleteRotationPattern = async (id) => {
  try {
    const response = await apiClient.delete(`/rotation-patterns/${id}`)
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 404) {
      const response = await apiClient.delete(`/shift-teams/patterns/${id}`)
      return response.data
    }
    throw err
  }
}

export const fetchShift = async (id) => {
  const response = await apiClient.get(`/shifts/${id}`)
  return response.data
}

// API Contract 03 §3.1: Tetapkan Pola Kerja (updated with effective_until & notes)
export const assignWorkSchedule = async (scheduleData) => {
  // scheduleData: { employee_id, schedule_type, shift_id, effective_from, effective_until, notes }
  const response = await apiClient.post('/work-schedules/assign', scheduleData)
  return response.data
}

export const assignRoster = async (rosterData) => {
  const response = await apiClient.post('/rosters/assign', rosterData)
  return response.data
}

// PUT /api/v1/rosters/schedules/{id} (Individual Schedule Adjustment / Manual Override)
export const adjustIndividualSchedule = async (scheduleId, data) => {
  try {
    const response = await apiClient.put(`/rosters/schedules/${scheduleId}`, data)
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 404) {
      const response = await apiClient.put(`/shift-schedules/${scheduleId}`, data)
      return response.data
    }
    throw err
  }
}

export const fetchRosters = async (page = 1, perPage = 10, params = {}) => {
  const response = await apiClient.get('/rosters', {
    params: { page, per_page: perPage, ...params }
  })
  return response.data
}

// 📋 1. Melihat Seluruh Data Jadwal Fixed Shift (GET /api/v1/rosters?source=fixed)
export const fetchFixedRosters = async (page = 1, perPage = 15, params = {}) => {
  const response = await apiClient.get('/rosters', {
    params: { page, per_page: perPage, source: 'fixed', ...params }
  })
  return response.data
}

// 🌟 1. PILIH UTAMA: Endpoint Khusus Penugasan Work Schedule (GET /api/v1/work-schedules/assignments?schedule_type=fixed)
export const fetchWorkScheduleAssignments = async (page = 1, perPage = 15, params = {}) => {
  const response = await apiClient.get('/work-schedules/assignments', {
    params: { page, per_page: perPage, schedule_type: 'fixed', ...params }
  })
  return response.data
}

// 👤 2. Melihat Shift Tetap Karyawan Spesifik per Tanggal (GET /api/v1/work-schedules/employees/{employee_id}/schedule?date=YYYY-MM-DD)
export const fetchEmployeeDailySchedule = async (employeeId, date) => {
  const response = await apiClient.get(`/work-schedules/employees/${employeeId}/schedule`, {
    params: { date }
  })
  return response.data
}

// 📜 3. Melihat Riwayat Penugasan Shift Tetap Karyawan (GET /api/v1/work-schedules/employees/{employee_id}/history)
export const fetchEmployeeScheduleHistory = async (employeeId) => {
  const response = await apiClient.get(`/work-schedules/employees/${employeeId}/history`)
  return response.data
}

/* ==========================================================================
   WORK SCHEDULE MASTERS (MASTER POLA KERJA - ENTERPRISE HRCORE)
   ========================================================================== */

export const fetchWorkScheduleMasters = async () => {
  const response = await apiClient.get('/work-schedule-masters')
  return response.data
}

export const fetchWorkScheduleMaster = async (id) => {
  const response = await apiClient.get(`/work-schedule-masters/${id}`)
  return response.data
}

export const createWorkScheduleMaster = async (data) => {
  // data: { name, code, off_days, description }
  const response = await apiClient.post('/work-schedule-masters', data)
  return response.data
}

export const updateWorkScheduleMaster = async (id, data) => {
  const response = await apiClient.put(`/work-schedule-masters/${id}`, data)
  return response.data
}

export const deleteWorkScheduleMaster = async (id) => {
  const response = await apiClient.delete(`/work-schedule-masters/${id}`)
  return response.data
}

export const fetchMyRoster = async (startDate, endDate) => {
  const response = await apiClient.get('/rosters/my-roster', {
    params: { start_date: startDate, end_date: endDate }
  })
  return response.data
}

export const fetchTodayRoster = async () => {
  const response = await apiClient.get('/rosters/today')
  return response.data
}

// Enterprise Roster Planning (API Contract 03 §2 - Enterprise Architecture Blueprint)
export const fetchRosterPlansPaginated = async (filters = {}) => {
  const params = typeof filters === 'number' ? { page: filters, per_page: 9 } : {
    page: filters.page || 1,
    per_page: filters.per_page || filters.perPage || 9,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.shift_team_id ? { shift_team_id: filters.shift_team_id } : {}),
    ...(filters.month ? { month: filters.month } : {})
  }
  const response = await apiClient.get('/roster-plans', { params })
  return response.data
}

export const deleteRosterPlan = async (id) => {
  const response = await apiClient.delete(`/roster-plans/${id}`)
  return response.data
}

export const fetchRosterPlan = async (id) => {
  const response = await apiClient.get(`/roster-plans/${id}`)
  return response.data
}

export const updateRosterPlan = async (id, data) => {
  const response = await apiClient.put(`/roster-plans/${id}`, data)
  return response.data
}

export const createRosterPlan = async (data) => {
  // data: { code, name, shift_team_id, period_start, period_end }
  const response = await apiClient.post('/roster-plans', data)
  return response.data
}

export const generateRosterPlan = async (id) => {
  const response = await apiClient.post(`/roster-plans/${id}/generate`)
  return response.data
}

export const validateRosterPlan = async (id) => {
  const response = await apiClient.post(`/roster-plans/${id}/validate`)
  return response.data
}

export const publishRosterPlan = async (id) => {
  const response = await apiClient.post(`/roster-plans/${id}/publish`)
  return response.data
}

export const lockRosterPlan = async (id) => {
  const response = await apiClient.post(`/roster-plans/${id}/lock`)
  return response.data
}

// Shift Swaps (API Contract 03 §3)
export const fetchAvailablePeers = async (params = {}) => {
  // params: { date, search, page, per_page }
  const response = await apiClient.get('/shift-swaps/available-peers', { params })
  return response.data
}

export const fetchShiftSwaps = async () => {
  const response = await apiClient.get('/shift-swaps')
  return response.data
}

export const fetchMyShiftSwaps = async () => {
  const response = await apiClient.get('/shift-swaps/me')
  return response.data
}

export const requestShiftSwap = async (swapData) => {
  const response = await apiClient.post('/shift-swaps', swapData)
  return response.data
}

export const respondShiftSwapPeer = async (id, responseType, rejectionReason = null) => {
  const response = await apiClient.post(`/shift-swaps/${id}/respond`, {
    response: responseType,
    rejection_reason: rejectionReason
  })
  return response.data
}

export const approveShiftSwap = async (id, status, rejectionReason = null) => {
  const response = await apiClient.post(`/shift-swaps/${id}/approve`, {
    status,
    rejection_reason: rejectionReason
  })
  return response.data
}

// Master Leave Types (Sprint 3 + API Contract 04)
export const fetchLeaveTypes = async () => {
  const response = await apiClient.get('/leave-types')
  return response.data
}

// API Contract 04: paginated leave types
export const fetchLeaveTypesPaginated = async (page = 1, perPage = 10, search = '') => {
  const response = await apiClient.get('/leave-types/paginated', { params: { page, per_page: perPage, search } })
  return response.data
}

export const fetchLeaveType = async (id) => {
  const response = await apiClient.get(`/leave-types/${id}`)
  return response.data
}

export const createLeaveType = async (data) => {
  const response = await apiClient.post('/leave-types', data)
  return response.data
}

export const updateLeaveType = async (id, data) => {
  const response = await apiClient.put(`/leave-types/${id}`, data)
  return response.data
}

export const deleteLeaveType = async (id) => {
  const response = await apiClient.delete(`/leave-types/${id}`)
  return response.data
}

// Master Shifts (Sprint 4)
export const createShift = async (data) => {
  const response = await apiClient.post('/shifts', data)
  return response.data
}

export const updateShift = async (id, data) => {
  const response = await apiClient.put(`/shifts/${id}`, data)
  return response.data
}

export const deleteShift = async (id) => {
  const response = await apiClient.delete(`/shifts/${id}`)
  return response.data
}

// Contracts Management
export const fetchContracts = async () => {
  const response = await apiClient.get('/contracts')
  return response.data
}

export const fetchContractsPaginated = async (page = 1, perPage = 10, search = '') => {
  const response = await apiClient.get('/contracts/paginated', {
    params: { page, per_page: perPage, search }
  })
  return response.data
}

export const fetchContract = async (id) => {
  const response = await apiClient.get(`/contracts/${id}`)
  return response.data
}

export const createContract = async (data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  const response = await apiClient.post('/contracts', data, isFormData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : {})
  return response.data
}

export const updateContract = async (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  if (isFormData) {
    if (!data.has('_method')) {
      data.append('_method', 'PUT')
    }
    const response = await apiClient.post(`/contracts/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
  const response = await apiClient.put(`/contracts/${id}`, data)
  return response.data
}

export const deleteContract = async (id) => {
  const response = await apiClient.delete(`/contracts/${id}`)
  return response.data
}

export const downloadContractFile = async (id) => {
  const response = await apiClient.get(`/contracts/${id}/download`, {
    responseType: 'blob'
  })
  return response
}
