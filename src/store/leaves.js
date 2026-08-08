import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../api'
import { useErpStore } from './erp'

export const useLeavesStore = defineStore('leaves', () => {
  const leaves = ref([])
  const leaveTypes = ref([])
  const leaveBalances = ref([])
  const allLeaveBalances = ref([])
  const allLeaveBalancesMeta = ref({ current_page: 1, last_page: 1, total: 0 })
  const myLeaves = ref([])
  const leaveCalendar = ref([])

  async function loadInitialData(year = null) {
    try {
      const erpStore = useErpStore()
      console.log('[API] Loading leave balances & requests...')
      const [balRes, reqRes] = await Promise.allSettled([
        api.fetchLeaveBalances(year),
        api.fetchLeaveRequests()
      ])

      const allEmployees = erpStore.employees || []

      if (balRes.status === 'fulfilled' && balRes.value && balRes.value.success) {
        const rawBal = Array.isArray(balRes.value.data) ? balRes.value.data : []
        leaveBalances.value = rawBal.map((lv, idx) => {
          const matchedEmp = allEmployees.find(e => 
            String(e.id) === String(lv.employee_id) || 
            String(e.id) === String(lv.employee?.id) ||
            String(e.user_id) === String(lv.user_id)
          )
          const resolvedEmpName = lv.employee?.name || lv.employee_name || lv.user?.name || matchedEmp?.name || 'Budi Santoso (EMP-00045)'
          const resolvedNik = lv.employee?.nik || lv.employee?.employee_code || lv.employee_code || matchedEmp?.nik || 'EMP-00045'
          const resolvedDept = lv.employee?.department?.name || lv.department_name || matchedEmp?.dept || 'Operasional'
          const leaveTypeName = lv.leave_type?.name || lv.leave_type_name || lv.name || lv.leave_type || `Jenis Cuti #${idx + 1}`

          return {
            id: String(lv.id || `BAL-${idx + 1}`),
            employeeId: resolvedNik,
            employeeName: resolvedEmpName,
            dept: resolvedDept,
            name: leaveTypeName, // Nama Jenis Cuti (Cuti Tahunan, Sakit, Melahirkan, dll)
            typeCode: lv.leave_type?.code || lv.code || 'CUTI',
            quotaAllocated: lv.allocated ?? lv.allocated_days ?? 12,
            quotaUsed: lv.used ?? lv.used_days ?? 0,
            quotaRemaining: lv.remaining ?? lv.remaining_days ?? (lv.allocated ?? 12)
          }
        })
      }

      if (reqRes.status === 'fulfilled' && reqRes.value && reqRes.value.success) {
        const rawData = Array.isArray(reqRes.value.data?.data) ? reqRes.value.data.data : (Array.isArray(reqRes.value.data) ? reqRes.value.data : [])
        leaves.value = rawData.map((lv, idx) => {
          const matchedEmp = allEmployees.find(e => 
            String(e.id) === String(lv.employee_id) || 
            String(e.id) === String(lv.employee?.id) ||
            String(e.user_id) === String(lv.user_id)
          )
          const resolvedName = lv.employee?.name || lv.employee_name || lv.name || lv.user?.name || lv.user_name || matchedEmp?.name || `Karyawan #${idx + 1}`
          const resolvedNik = lv.employee?.nik || lv.employee?.employee_code || lv.employee_code || matchedEmp?.nik || `EMP-00${idx + 1}`
          const resolvedDept = lv.employee?.department?.name || lv.department_name || matchedEmp?.dept || 'Operasional'

          return {
            id: String(lv.id || `REQ-${idx + 1}`),
            employeeId: resolvedNik,
            name: resolvedName,
            dept: resolvedDept,
            type: lv.leave_type ? (lv.leave_type.name || lv.leave_type) : (lv.type || 'Cuti Tahunan'),
            startDate: lv.start_date || '2026-08-10',
            endDate: lv.end_date || '2026-08-12',
            reason: lv.reason || 'Keperluan Keluarga',
            attachment: lv.attachment_url || lv.attachment || null,
            status: lv.status || 'pending',
            rejectionReason: lv.rejection_reason || null
          }
        })
      } else {
        // Fallback to balances data for leaves list if requests endpoint returns empty
        leaves.value = leaveBalances.value
      }

      console.log('[API] Loading leave types list (paginated)...')
      // API Contract 04: use /leave-types/paginated
      const ltRes = await api.fetchLeaveTypesPaginated(1, 100)
      if (ltRes && ltRes.success && ltRes.data) {
        // paginated response: res.data.data (items) + res.data.meta
        leaveTypes.value = Array.isArray(ltRes.data.data) ? ltRes.data.data : []
      }

      console.log('[API] Loading team leave calendar...')
      const calRes = await api.fetchLeaveCalendar()
      if (calRes && calRes.success && Array.isArray(calRes.data)) {
        leaveCalendar.value = calRes.data.map((item, idx) => {
          const empName = item.employee_name || item.employee?.name || item.name || item.user_name || `Karyawan #${idx + 1}`
          const typeName = item.leave_type_name || item.leave_type?.name || (typeof item.leave_type === 'string' ? item.leave_type : null) || item.type || 'Cuti Tahunan'
          return {
            id: item.id || `CAL-${idx + 1}`,
            employee_name: empName,
            leave_type_name: typeName,
            start_date: item.start_date || '2026-08-10',
            end_date: item.end_date || '2026-08-12',
            status: item.status || 'approved'
          }
        })
      }
    } catch (err) {
      console.error('[API Error] Fetching leaves data failed:', err.message)
    }
  }

  async function requestLeaveAction(formData) {
    try {
      const res = await api.requestLeave(formData)
      if (res && res.success) {
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // Leave Type CRUD
  async function createLeaveTypeAction(data) {
    try {
      const res = await api.createLeaveType(data)
      if (res && res.success) {
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function updateLeaveTypeAction(id, data) {
    try {
      const res = await api.updateLeaveType(id, data)
      if (res && res.success) {
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }
  async function deleteLeaveTypeAction(id) {
    try {
      const res = await api.deleteLeaveType(id)
      if (res && res.success) {
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function approveLeaveAction(leaveId, status, rejectionReason = null) {
    try {
      console.log(`[API] Processing 1-Level HR Leave approval for ID: ${leaveId} to status: ${status}`)
      const res = await api.approveLeave(leaveId, status, rejectionReason)
      if (res && res.success) {
        console.log('[API] Leave status updated successfully and quota deducted')
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function adjustLeaveBalanceAction(data) {
    try {
      const res = await api.adjustLeaveBalance(data)
      if (res && res.success) {
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  async function loadAllLeaveBalancesAction(page = 1, perPage = 15, params = {}) {
    try {
      const res = await api.fetchLeaveAllBalances(page, perPage, params)
      if (res && res.success && res.data) {
        const rawItems = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
        const meta = res.data.meta || { current_page: page, last_page: 1, total: rawItems.length }
        
        allLeaveBalances.value = rawItems.map((lv, idx) => ({
          id: lv.id || `BAL-${idx + 1}`,
          employeeId: lv.employee?.nik || lv.employee?.employee_code || lv.employee_id || 'EMP',
          employeeName: lv.employee?.name || lv.employee_name || 'Karyawan',
          dept: lv.employee?.department?.name || lv.department_name || 'Operasional',
          name: lv.leave_type?.name || lv.leave_type_name || 'Cuti Tahunan',
          typeCode: lv.leave_type?.code || 'CUTI',
          quotaAllocated: lv.allocated ?? 12,
          quotaUsed: lv.used ?? 0,
          quotaRemaining: lv.remaining ?? (lv.allocated ?? 12)
        }))
        allLeaveBalancesMeta.value = meta
      }
      return res
    } catch (err) {
      console.warn('[API Warning] Fetching all leave balances failed:', err.message)
    }
  }

  return {
    leaves,
    leaveTypes,
    leaveBalances,
    allLeaveBalances,
    allLeaveBalancesMeta,
    myLeaves,
    leaveCalendar,
    loadInitialData,
    loadAllLeaveBalancesAction,
    requestLeaveAction,
    approveLeaveAction,
    createLeaveTypeAction,
    updateLeaveTypeAction,
    deleteLeaveTypeAction,
    adjustLeaveBalanceAction
  }
})
