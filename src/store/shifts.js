import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api'

export const useShiftsStore = defineStore('shifts', () => {
  const shifts = ref([])
  const shiftsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const shiftSwaps = ref([])
  const rosters = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const myRosters = ref([])
  const todayRoster = ref(null)
  const myShiftSwaps = ref([])
  const shiftTeams = ref([])
  
  // Enterprise Roster Architecture State (API Contract 03 §2)
  const rosterPlans = ref([])
  const rosterPlansPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const activeValidationReport = ref(null)
  const availablePeers = ref([])
  const customRotationPatterns = ref([])
  const rotationPatternsPaginated = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
  const workScheduleMasters = ref([])

  // Computed Rotation Patterns (Pure DB Data Directly from GET /api/v1/rotation-patterns)
  const rotationPatterns = computed(() => {
    return Array.isArray(customRotationPatterns.value) ? customRotationPatterns.value : []
  })

  // --- ON-DEMAND LAZY FETCHING FUNCTIONS (Prevents heavy simultaneous HTTP requests) ---

  async function fetchShiftsOnlyAction() {
    try {
      console.log('[Lazy Load] Fetching Master Shifts...')
      let sfRes
      try {
        sfRes = await api.fetchShiftsPaginated(1, 100)
      } catch (err) {
        if (err.response && err.response.status === 404) {
          sfRes = await api.fetchShifts()
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
      console.warn('[API Warning] Fetching shifts failed:', err.message)
    }
  }

  async function fetchShiftTeamsOnlyAction() {
    try {
      console.log('[Lazy Load] Fetching Shift Teams...')
      const teamRes = await api.fetchShiftTeamsPaginated(1, 100)
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
      console.warn('[API Warning] Fetching shift teams failed:', err.message)
    }
  }

  async function fetchRosterPlansOnlyAction() {
    try {
      console.log('[Lazy Load] Fetching Roster Plans...')
      const rpRes = await api.fetchRosterPlansPaginated(1, 9)
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
      console.warn('[API Warning] Fetching Roster Plans failed:', err.message)
    }
  }

  async function fetchShiftSwapsOnlyAction() {
    try {
      console.log('[Lazy Load] Fetching Shift Swaps...')
      const swapRes = await api.fetchShiftSwaps()
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
      console.warn('[API Warning] Fetching shift swaps failed:', err.message)
    }
  }

  async function loadInitialData() {
    // Only load lightweight initial active tab data if needed
    await fetchShiftsOnlyAction()
  }

  async function assignWorkScheduleAction(data) {
    const res = await api.assignWorkSchedule(data)
    return res
  }

  async function assignRosterAction(data) {
    const res = await api.assignRoster(data)
    return res
  }

  async function adjustIndividualScheduleAction(scheduleId, data) {
    try {
      console.log(`[API] Adjusting individual schedule ID ${scheduleId}...`)
      const res = await api.adjustIndividualSchedule(scheduleId, data)
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function requestShiftSwapAction(data) {
    const res = await api.requestShiftSwap(data)
    if (res && res.success) {
      await fetchShiftSwapsOnlyAction()
    }
    return res
  }

  async function respondShiftSwapPeerAction(swapId, responseType, rejectionReason = null) {
    const res = await api.respondShiftSwapPeer(swapId, responseType, rejectionReason)
    if (res && res.success) {
      await fetchShiftSwapsOnlyAction()
    }
    return res
  }

  async function approveShiftSwapAction(swapId, status, rejectionReason = null) {
    console.log(`[API] HR Approval for shift swap ID: ${swapId} to status: ${status}`)
    const res = await api.approveShiftSwap(swapId, status, rejectionReason)
    if (res && res.success) {
      console.log('[API] Shift swap status updated successfully by HR')
      await fetchShiftSwapsOnlyAction()
    }
    return res
  }

  async function loadRostersAction(page = 1, perPage = 10) {
    const res = await api.fetchRosters(page, perPage)
    if (res && res.success && res.data) {
      rosters.value = res.data
    }
  }

  // API Contract 03 §2.2: Generate Roster Massal Otomatis
  async function generateTeamRosterAction(teamId, startDate, endDate) {
    console.log(`[API] Generating roster for team ${teamId} from ${startDate} to ${endDate}...`)
    const res = await api.generateTeamRoster(teamId, startDate, endDate)
    if (res && res.success) {
      console.log(`[API] Roster generated: ${res.data?.created_count || 0} entries created`)
    }
    return res
  }

  // API Contract 03 §2.3: Buat Tim Shift Baru
  async function createShiftTeamAction(data) {
    console.log('[API] Creating new shift team...')
    const res = await api.createShiftTeam(data)
    if (res && res.success) {
      console.log(`[API] Shift team created: ${res.data?.name}`)
      await fetchShiftTeamsOnlyAction()
    }
    return res
  }

  // API Contract 03 §2.4: Update Tim Shift
  async function updateShiftTeamAction(id, data) {
    console.log(`[API] Updating shift team ID: ${id}...`)
    const res = await api.updateShiftTeam(id, data)
    if (res && res.success) {
      await fetchShiftTeamsOnlyAction()
    }
    return res
  }

  // API Contract 03 §2.5: Hapus Tim Shift
  async function deleteShiftTeamAction(id) {
    console.log(`[API] Deleting shift team ID: ${id}...`)
    const res = await api.deleteShiftTeam(id)
    if (res && res.success) {
      await fetchShiftTeamsOnlyAction()
    }
    return res
  }

  // API Contract 03 §2.6: Tambah Anggota ke Tim (Individual)
  async function addTeamMemberAction(teamId, employeeId, joinedAt) {
    console.log(`[API] Adding employee ${employeeId} to team ${teamId}...`)
    const res = await api.addShiftTeamMember(teamId, {
      employee_id: employeeId,
      joined_at: joinedAt
    })
    if (res && res.success) {
      console.log(`[API] Member added: ${res.data?.employee?.name}`)
      await fetchShiftTeamsOnlyAction()
    }
    return res
  }

  // API Contract 03 §2.7: Atur Pola Rotasi Tim (KUNCI generate roster)
  async function setTeamRotationPatternAction(teamId, data) {
    console.log(`[API] Setting rotation pattern for team ${teamId}...`)
    const res = await api.setTeamRotationPattern(teamId, data)
    if (res && res.success) {
      console.log(`[API] Rotation pattern set: ${res.data?.name}`)
    }
    return res
  }

  // Enterprise Roster Plan Actions (API Contract 03 §2)
  async function fetchRosterPlanAction(id) {
    try {
      console.log(`[API] Fetching Roster Plan detail ID: ${id}...`)
      const res = await api.fetchRosterPlan(id)
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function updateRosterPlanAction(id, data) {
    try {
      console.log(`[API] Updating Roster Plan ID: ${id}...`)
      const res = await api.updateRosterPlan(id, data)
      if (res && res.success) {
        await fetchRosterPlansFilteredAction({ page: 1, per_page: 9 })
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function createRosterPlanAction(data) {
    try {
      console.log('[API] Creating new Roster Plan...')
      const res = await api.createRosterPlan(data)
      if (res && res.success) {
        console.log(`[API] Roster Plan created: ${res.data?.code}`)
        await fetchRosterPlansFilteredAction({ page: 1, per_page: 9 })
      }
      return res
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      }
    }
  }

  async function generateRosterPlanAction(id) {
    try {
      console.log(`[API] Generating Roster Plan ID: ${id}...`)
      const res = await api.generateRosterPlan(id)
      if (res && res.success) {
        console.log(`[API] Roster generated: ${res.data?.created_count} entries. Coverage: ${res.data?.report?.coverage_percentage}%`)
        await fetchRosterPlansFilteredAction({ page: 1, per_page: 9 })
      }
      return res
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      }
    }
  }

  async function validateRosterPlanAction(id) {
    try {
      console.log(`[API] Running Soft Validation Engine for Roster Plan ID: ${id}...`)
      const res = await api.validateRosterPlan(id)
      if (res && res.success && res.data) {
        activeValidationReport.value = res.data
      }
      return res
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      }
    }
  }

  async function publishRosterPlanAction(id) {
    try {
      console.log(`[API] Publishing Roster Plan ID: ${id}...`)
      const res = await api.publishRosterPlan(id)
      if (res && res.success) {
        console.log(`[API] Roster Plan published: ${res.data?.published_at}`)
        await fetchRosterPlansFilteredAction({ page: 1, per_page: 9 })
      }
      return res
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      }
    }
  }

  async function lockRosterPlanAction(id) {
    try {
      console.log(`[API] Locking Roster Plan ID: ${id}...`)
      const res = await api.lockRosterPlan(id)
      if (res && res.success) {
        console.log('[API] Roster Plan locked.')
        await fetchRosterPlansFilteredAction({ page: 1, per_page: 9 })
      }
      return res
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      }
    }
  }

  async function fetchAvailablePeersAction(params = {}) {
    console.log('[API] Fetching available peers for shift swap...')
    const res = await api.fetchAvailablePeers(params)
    if (res && res.success && res.data) {
      availablePeers.value = Array.isArray(res.data.data) ? res.data.data : []
    }
    return res
  }

  // Shift CRUD
  async function createShiftAction(data) {
    const res = await api.createShift(data)
    if (res && res.success) {
      await fetchShiftsOnlyAction()
    }
    return res
  }
  async function updateShiftAction(id, data) {
    const res = await api.updateShift(id, data)
    if (res && res.success) {
      await fetchShiftsOnlyAction()
    }
    return res
  }
  async function deleteShiftAction(id) {
    const res = await api.deleteShift(id)
    if (res && res.success) {
      await fetchShiftsOnlyAction()
    }
    return res
  }

  async function fetchRosterPlansFilteredAction(filters = {}) {
    try {
      const rpRes = await api.fetchRosterPlansPaginated(filters)
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
      return rpRes
    } catch (err) {
      console.error('[API Error] Fetching roster plans filtered failed:', err.message)
      throw err
    }
  }

  async function deleteRosterPlanAction(id) {
    const res = await api.deleteRosterPlan(id)
    if (res && res.success) {
      await loadInitialData()
    }
    return res
  }

  async function fetchRotationPatternsFilteredAction(filters = {}) {
    try {
      const patRes = await api.fetchRotationPatterns(filters)
      if (patRes && patRes.success && patRes.data) {
        const items = Array.isArray(patRes.data.data) ? patRes.data.data : (Array.isArray(patRes.data) ? patRes.data : [])
        customRotationPatterns.value = items
        if (patRes.data.meta) {
          rotationPatternsPaginated.value = {
            data: items,
            current_page: patRes.data.meta.current_page || 1,
            last_page: patRes.data.meta.last_page || 1,
            total: patRes.data.meta.total || items.length
          }
        } else {
          rotationPatternsPaginated.value = {
            data: items,
            current_page: 1,
            last_page: 1,
            total: items.length
          }
        }
      }
      return patRes
    } catch (err) {
      console.error('[API Error] Fetching rotation patterns filtered failed:', err.message)
      throw err
    }
  }

  async function deleteRotationPatternAction(id) {
    const res = await api.deleteRotationPattern(id)
    if (res && res.success) {
      await fetchRotationPatternsFilteredAction({ page: 1, per_page: 9 })
    }
    return res
  }

  async function updateRotationPatternAction(id, payload) {
    const res = await api.updateRotationPattern(id, payload)
    if (res && res.success) {
      await fetchRotationPatternsFilteredAction({ page: 1, per_page: 9 })
    }
    return res
  }

  async function fetchWorkScheduleMastersAction() {
    try {
      const res = await api.fetchWorkScheduleMasters()
      if (res && res.success) {
        workScheduleMasters.value = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : [])
      }
      return res
    } catch (err) {
      console.warn('[API Warning] Fetching work schedule masters failed:', err.message)
    }
  }

  async function createWorkScheduleMasterAction(data) {
    const res = await api.createWorkScheduleMaster(data)
    if (res && res.success) {
      await fetchWorkScheduleMastersAction()
    }
    return res
  }

  async function updateWorkScheduleMasterAction(id, data) {
    const res = await api.updateWorkScheduleMaster(id, data)
    if (res && res.success) {
      await fetchWorkScheduleMastersAction()
    }
    return res
  }

  async function deleteWorkScheduleMasterAction(id) {
    const res = await api.deleteWorkScheduleMaster(id)
    if (res && res.success) {
      await fetchWorkScheduleMastersAction()
    }
    return res
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
    rotationPatterns,
    workScheduleMasters,
    fetchShiftsOnlyAction,
    fetchShiftTeamsOnlyAction,
    fetchRosterPlansOnlyAction,
    fetchShiftSwapsOnlyAction,
    loadRostersAction,
    generateTeamRosterAction,
    createShiftTeamAction,
    updateShiftTeamAction,
    deleteShiftTeamAction,
    addTeamMemberAction,
    setTeamRotationPatternAction,
    updateRotationPatternAction,
    fetchRosterPlanAction,
    updateRosterPlanAction,
    createRosterPlanAction,
    generateRosterPlanAction,
    validateRosterPlanAction,
    publishRosterPlanAction,
    lockRosterPlanAction,
    fetchRosterPlansFilteredAction,
    fetchRotationPatternsFilteredAction,
    deleteRosterPlanAction,
    deleteRotationPatternAction,
    fetchAvailablePeersAction,
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
    deleteWorkScheduleMasterAction
  }
})
