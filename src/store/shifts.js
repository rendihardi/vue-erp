import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const useShiftsStore = defineStore('shifts', () => {
  const shifts = ref([])
  const shiftsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const shiftSwaps = ref([])
  const rosters = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const myRosters = ref([])
  const todayRoster = ref(null)
  const myShiftSwaps = ref([])
  const shiftTeams = ref([])
  
  const rosterPlans = ref([])
  const rosterPlansPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const activeValidationReport = ref(null)
  const availablePeers = ref([])
  const customRotationPatterns = ref([])
  const rotationPatternsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const workScheduleMasters = ref([])

  const loading = ref(false)
  const error = ref(null)
  const success = ref(null)

  const rotationPatterns = computed(() => {
    return Array.isArray(customRotationPatterns.value) ? customRotationPatterns.value : []
  })

  // Single Item Fetch Actions
  async function fetchShift(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/shifts/${id}`)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchRosterPlanCalendar(planId) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/roster-plans/${planId}/calendar`)
      return response.data
    } catch (err) {
      console.warn(`[API Fallback] /roster-plans/${planId}/calendar fallback:`, err.message)
      return { success: false, data: null }
    } finally {
      loading.value = false
    }
  }

  async function fetchShiftTeamCalendar(teamId, month = null) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/shift-teams/${teamId}/calendar`, {
        params: month ? { month } : {}
      })
      return response.data
    } catch (err) {
      console.warn(`[API Fallback] /shift-teams/${teamId}/calendar fallback:`, err.message)
      return { success: false, data: null }
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableShiftTeamEmployees(search = '', page = 1, perPage = 100) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/shift-teams/available-employees', {
        params: { search, page, per_page: perPage }
      })
      return response.data
    } catch (err) {
      console.warn('[API Fallback] /shift-teams/available-employees fallback:', err.message)
      return { success: false, data: [] }
    } finally {
      loading.value = false
    }
  }

  async function fetchFixedRosters(page = 1, perPage = 15, params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/rosters', {
        params: { page, per_page: perPage, source: 'fixed', ...params }
      })
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchWorkScheduleAssignments(page = 1, perPage = 15, params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/work-schedules/assignments', {
        params: { page, per_page: perPage, schedule_type: 'fixed', ...params }
      })
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployeeDailySchedule(employeeId, date) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/work-schedules/employees/${employeeId}/schedule`, {
        params: { date }
      })
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployeeScheduleHistory(employeeId) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/work-schedules/employees/${employeeId}/history`)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // --- ON-DEMAND LAZY FETCHING FUNCTIONS ---
  async function fetchShiftsOnlyAction() {
    loading.value = true
    error.value = null
    try {
      console.log('[Lazy Load] Fetching Master Shifts...')
      let sfRes
      try {
        const response = await axiosInstance.get('/shifts/paginated', { params: { page: 1, per_page: 100 } })
        sfRes = response.data
      } catch (err) {
        if (err.response && err.response.status === 404) {
          const response = await axiosInstance.get('/shifts')
          sfRes = response.data
        } else {
          throw err
        }
      }
      if (sfRes && sfRes.success && sfRes.data) {
        const items = Array.isArray(sfRes.data.data) ? sfRes.data.data : (Array.isArray(sfRes.data) ? sfRes.data : [])
        shifts.value = items.map(sf => ({
          id: sf.id,
          name: sf.name,
          code: sf.code,
          startTime: sf.start_time,
          endTime: sf.end_time,
          gracePeriodMinutes: sf.grace_period_minutes
        }))
        shiftsPaginated.value = {
          data: shifts.value,
          current_page: sfRes.data.meta?.current_page || 1,
          last_page: sfRes.data.meta?.last_page || 1,
          total: sfRes.data.meta?.total || shifts.value.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
      console.warn('[API Warning] Fetching shifts failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function fetchShiftTeamsOnlyAction() {
    loading.value = true
    error.value = null
    try {
      console.log('[Lazy Load] Fetching Shift Teams...')
      let teamRes
      try {
        const response = await axiosInstance.get('/shift-teams/paginated', { params: { page: 1, per_page: 100 } })
        teamRes = response.data
      } catch (err) {
        if (err.response && err.response.status === 404) {
          const response = await axiosInstance.get('/shift-teams')
          teamRes = response.data
        } else {
          throw err
        }
      }
      if (teamRes && teamRes.success && teamRes.data) {
        const rawTeams = Array.isArray(teamRes.data.data) ? teamRes.data.data : (Array.isArray(teamRes.data) ? teamRes.data : [])
        shiftTeams.value = rawTeams.map(t => {
          const activeList = Array.isArray(t.active_members) ? t.active_members : (Array.isArray(t.members) ? t.members : [])
          return {
            id: t.id,
            name: t.name,
            description: t.description || '',
            activeMembersCount: t.active_members_count ?? activeList.length ?? 0,
            activeMembers: activeList,
            rotationPatterns: Array.isArray(t.rotation_patterns) ? t.rotation_patterns : []
          }
        })
      }
    } catch (err) {
      error.value = handleError(err)
      console.warn('[API Warning] Fetching shift teams failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function fetchRosterPlansOnlyAction() {
    loading.value = true
    error.value = null
    try {
      console.log('[Lazy Load] Fetching Roster Plans...')
      const response = await axiosInstance.get('/roster-plans', { params: { page: 1, per_page: 9 } })
      const rpRes = response.data
      if (rpRes && rpRes.success && rpRes.data) {
        const items = Array.isArray(rpRes.data.data) ? rpRes.data.data : []
        rosterPlans.value = items.map(rp => ({
          id: rp.id,
          code: rp.code,
          name: rp.name,
          periodStart: rp.period_start,
          periodEnd: rp.period_end,
          status: rp.status || 'draft',
          coveragePercentage: rp.coverage_percentage || 0,
          warningCount: rp.warning_count || 0
        }))
        rosterPlansPaginated.value = {
          data: rosterPlans.value,
          current_page: rpRes.data.meta?.current_page || 1,
          last_page: rpRes.data.meta?.last_page || 1,
          total: rpRes.data.meta?.total || rosterPlans.value.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
      console.warn('[API Warning] Fetching Roster Plans failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function fetchShiftSwapsOnlyAction() {
    loading.value = true
    error.value = null
    try {
      console.log('[Lazy Load] Fetching Shift Swaps...')
      const response = await axiosInstance.get('/shift-swaps')
      const swapRes = response.data
      if (swapRes && swapRes.success) {
        const swapData = Array.isArray(swapRes.data) ? swapRes.data : (swapRes.data?.data || [])
        shiftSwaps.value = swapData.map(sw => ({
          id: String(sw.id),
          requesterId: sw.requester_employee_id || sw.employee_id,
          requesterName: sw.requester_name || sw.employee?.name || 'Karyawan Pemohon',
          targetId: sw.requested_employee_id,
          targetName: sw.target_name || sw.requested_employee?.name || 'Rekan Kerja Target',
          requesterDate: sw.requester_date || sw.requested_date,
          requestedDate: sw.requested_date,
          status: sw.status || 'pending_peer',
          rejectionReason: sw.rejection_reason || null
        }))
      }
    } catch (err) {
      error.value = handleError(err)
      console.warn('[API Warning] Fetching shift swaps failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function loadInitialData() {
    await fetchShiftsOnlyAction()
  }

  async function assignWorkScheduleAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/work-schedules/assign', data)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function assignRosterAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/rosters/assign', data)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function adjustIndividualScheduleAction(scheduleId, data) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] Adjusting individual schedule ID ${scheduleId}...`)
      let response
      try {
        response = await axiosInstance.put(`/rosters/schedules/${scheduleId}`, data)
      } catch (err) {
        if (err.response && err.response.status === 404) {
          response = await axiosInstance.put(`/shift-schedules/${scheduleId}`, data)
        } else {
          throw err
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

  async function requestShiftSwapAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/shift-swaps', data)
      const res = response.data
      if (res && res.success) {
        await fetchShiftSwapsOnlyAction()
      }
      return res
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function respondShiftSwapPeerAction(swapId, responseType, rejectionReason = null) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/shift-swaps/${swapId}/respond`, {
        response: responseType,
        rejection_reason: rejectionReason
      })
      const res = response.data
      if (res && res.success) {
        await fetchShiftSwapsOnlyAction()
      }
      return res
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function approveShiftSwapAction(swapId, status, rejectionReason = null) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] HR Approval for shift swap ID: ${swapId} to status: ${status}`)
      const response = await axiosInstance.post(`/shift-swaps/${swapId}/approve`, {
        status,
        rejection_reason: rejectionReason
      })
      const res = response.data
      if (res && res.success) {
        console.log('[API] Shift swap status updated successfully by HR')
        await fetchShiftSwapsOnlyAction()
      }
      return res
    } catch (err) {
      error.value = handleError(err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function createShiftAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/shifts', data)
      const res = response.data
      if (res && res.success) {
        await fetchShiftsOnlyAction()
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

  async function updateShiftAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/shifts/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await fetchShiftsOnlyAction()
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

  async function deleteShiftAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/shifts/${id}`)
      const res = response.data
      if (res && res.success) {
        await fetchShiftsOnlyAction()
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

  async function fetchWorkScheduleMastersAction() {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/work-schedule-masters')
      const res = response.data

      let items = []
      if (Array.isArray(res)) {
        items = res
      } else if (res && Array.isArray(res.data)) {
        items = res.data
      } else if (res && res.data && Array.isArray(res.data.data)) {
        items = res.data.data
      } else if (res && Array.isArray(res.items)) {
        items = res.items
      }

      workScheduleMasters.value = items
      return res
    } catch (err) {
      error.value = handleError(err)
      console.warn('[API Warning] Fetching work schedule masters failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function createWorkScheduleMasterAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/work-schedule-masters', data)
      const res = response.data
      if (res && res.success) {
        await fetchWorkScheduleMastersAction()
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

  async function updateWorkScheduleMasterAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/work-schedule-masters/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await fetchWorkScheduleMastersAction()
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

  async function deleteWorkScheduleMasterAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/work-schedule-masters/${id}`)
      const res = response.data
      if (res && res.success) {
        await fetchWorkScheduleMastersAction()
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

  async function loadRostersAction(page = 1, perPage = 10) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/rosters', { params: { page, per_page: perPage } })
      const res = response.data
      if (res && res.success && res.data) {
        rosters.value = res.data
      }
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function generateTeamRosterAction(teamId, startDate, endDate) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] Generating roster for team ${teamId} from ${startDate} to ${endDate}...`)
      const response = await axiosInstance.post(`/shift-teams/${teamId}/generate-roster`, {
        start_date: startDate,
        end_date: endDate
      })
      const res = response.data
      if (res && res.success) {
        await fetchShiftTeamsOnlyAction()
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

  async function createShiftTeamAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/shift-teams', data)
      const res = response.data
      if (res && res.success) {
        await fetchShiftTeamsOnlyAction()
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

  async function updateShiftTeamAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/shift-teams/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await fetchShiftTeamsOnlyAction()
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

  async function deleteShiftTeamAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/shift-teams/${id}`)
      const res = response.data
      if (res && res.success) {
        await fetchShiftTeamsOnlyAction()
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

  async function addTeamMemberAction(teamId, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/shift-teams/${teamId}/members`, data)
      const res = response.data
      if (res && res.success) {
        await fetchShiftTeamsOnlyAction()
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

  async function setTeamRotationPatternAction(teamId, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/shift-teams/${teamId}/patterns`, data)
      const res = response.data
      if (res && res.success) {
        await fetchShiftTeamsOnlyAction()
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

  async function updateRotationPatternAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/rotation-patterns/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await fetchRotationPatternsFilteredAction()
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

  async function deleteRotationPatternAction(id) {
    loading.value = true
    error.value = null
    try {
      let res
      try {
        const response = await axiosInstance.delete(`/rotation-patterns/${id}`)
        res = response.data
      } catch (err) {
        if (err.response && err.response.status === 404) {
          const response = await axiosInstance.delete(`/shift-teams/patterns/${id}`)
          res = response.data
        } else {
          throw err
        }
      }
      if (res && res.success) {
        await fetchRotationPatternsFilteredAction()
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

  async function createRosterPlanAction(data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/roster-plans', data)
      const res = response.data
      if (res && res.success) {
        await fetchRosterPlansOnlyAction()
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

  async function fetchRosterPlanAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/roster-plans/${id}`)
      return response.data
    } catch (err) {
      error.value = handleError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateRosterPlanAction(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/roster-plans/${id}`, data)
      const res = response.data
      if (res && res.success) {
        await fetchRosterPlansOnlyAction()
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

  async function generateRosterPlanAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/roster-plans/${id}/generate`)
      const res = response.data
      if (res && res.success) {
        await fetchRosterPlansOnlyAction()
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

  async function validateRosterPlanAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/roster-plans/${id}/validate`)
      const res = response.data
      if (res && res.success && res.data) {
        activeValidationReport.value = res.data
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

  async function publishRosterPlanAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/roster-plans/${id}/publish`)
      const res = response.data
      if (res && res.success) {
        await fetchRosterPlansOnlyAction()
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

  async function lockRosterPlanAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/roster-plans/${id}/lock`)
      const res = response.data
      if (res && res.success) {
        await fetchRosterPlansOnlyAction()
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

  async function deleteRosterPlanAction(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.delete(`/roster-plans/${id}`)
      const res = response.data
      if (res && res.success) {
        await fetchRosterPlansOnlyAction()
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

  async function fetchRosterPlansFilteredAction(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const params = typeof filters === 'number' ? { page: filters, per_page: 9 } : {
        page: filters.page || 1,
        per_page: filters.per_page || filters.perPage || 9,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.shift_team_id ? { shift_team_id: filters.shift_team_id } : {}),
        ...(filters.month ? { month: filters.month } : {})
      }
      const response = await axiosInstance.get('/roster-plans', { params })
      const rpRes = response.data
      if (rpRes && rpRes.success && rpRes.data) {
        const items = Array.isArray(rpRes.data.data) ? rpRes.data.data : []
        rosterPlans.value = items.map(rp => ({
          id: rp.id,
          code: rp.code,
          name: rp.name,
          periodStart: rp.period_start,
          periodEnd: rp.period_end,
          status: rp.status || 'draft',
          coveragePercentage: rp.coverage_percentage || 0,
          warningCount: rp.warning_count || 0
        }))
        rosterPlansPaginated.value = {
          data: rosterPlans.value,
          current_page: rpRes.data.meta?.current_page || 1,
          last_page: rpRes.data.meta?.last_page || 1,
          total: rpRes.data.meta?.total || rosterPlans.value.length
        }
      }
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchRotationPatternsFilteredAction(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const params = typeof filters === 'string' || typeof filters === 'number'
        ? { page: Number(filters), per_page: 9 }
        : {
            page: filters.page || 1,
            per_page: filters.per_page || filters.perPage || 9,
            ...(filters.search ? { search: filters.search } : {}),
            ...(filters.shift_team_id ? { shift_team_id: filters.shift_team_id } : {})
          }
      let response
      try {
        response = await axiosInstance.get('/rotation-patterns', { params })
      } catch (err) {
        if (err.response && err.response.status === 404) {
          customRotationPatterns.value = []
          return { success: false, data: [] }
        }
        throw err
      }
      const res = response.data
      if (res && res.success && res.data) {
        const rawItems = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
        customRotationPatterns.value = rawItems
        rotationPatternsPaginated.value = {
          data: rawItems,
          current_page: res.data.meta?.current_page || 1,
          last_page: res.data.meta?.last_page || 1,
          total: res.data.meta?.total || rawItems.length
        }
      }
      return res
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailablePeersAction(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/shift-swaps/available-peers', { params })
      const res = response.data
      let items = []
      if (Array.isArray(res)) {
        items = res
      } else if (res && Array.isArray(res.data)) {
        items = res.data
      } else if (res && res.data && Array.isArray(res.data.data)) {
        items = res.data.data
      }
      availablePeers.value = items
      return res
    } catch (err) {
      error.value = handleError(err)
    } finally {
      loading.value = false
    }
  }

  return {
    shifts,
    shiftsPaginated,
    shiftSwaps,
    rosters,
    myRosters,
    todayRoster,
    myShiftSwaps,
    shiftTeams,
    rosterPlans,
    rosterPlansPaginated,
    activeValidationReport,
    availablePeers,
    customRotationPatterns,
    rotationPatternsPaginated,
    workScheduleMasters,
    rotationPatterns,
    loading,
    error,
    success,
    fetchShift,
    fetchRosterPlanCalendar,
    fetchShiftTeamCalendar,
    fetchAvailableShiftTeamEmployees,
    fetchFixedRosters,
    fetchWorkScheduleAssignments,
    fetchEmployeeDailySchedule,
    fetchEmployeeScheduleHistory,
    fetchShiftsOnlyAction,
    fetchShiftTeamsOnlyAction,
    fetchRosterPlansOnlyAction,
    fetchShiftSwapsOnlyAction,
    loadInitialData,
    assignWorkScheduleAction,
    assignRosterAction,
    adjustIndividualScheduleAction,
    requestShiftSwapAction,
    respondShiftSwapPeerAction,
    approveShiftSwapAction,
    createShiftAction,
    updateShiftAction,
    deleteShiftAction,
    fetchWorkScheduleMastersAction,
    createWorkScheduleMasterAction,
    updateWorkScheduleMasterAction,
    deleteWorkScheduleMasterAction,
    loadRostersAction,
    generateTeamRosterAction,
    createShiftTeamAction,
    updateShiftTeamAction,
    deleteShiftTeamAction,
    addTeamMemberAction,
    setTeamRotationPatternAction,
    updateRotationPatternAction,
    deleteRotationPatternAction,
    createRosterPlanAction,
    fetchRosterPlanAction,
    updateRosterPlanAction,
    generateRosterPlanAction,
    validateRosterPlanAction,
    publishRosterPlanAction,
    lockRosterPlanAction,
    deleteRosterPlanAction,
    fetchRosterPlansFilteredAction,
    fetchRotationPatternsFilteredAction,
    fetchAvailablePeersAction
  }
})

export const useShiftStore = useShiftsStore
