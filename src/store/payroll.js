import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '../plugins/axios'
import { handleError } from '../helpers/errorHelper'

export const usePayrollStore = defineStore('payroll', () => {
  const payrolls = ref([])
  const overtimes = ref([])
  const myPayslips = ref([])
  const loading = ref(false)
  const error = ref(null)
  const success = ref(null)

  const totalPayrollAugust = computed(() => {
    return payrolls.value.reduce((acc, pay) => {
      return acc + (pay.baseSalary + pay.allowance - pay.deductions)
    }, 0)
  })

  async function loadInitialData() {
    loading.value = true
    error.value = null
    try {
      console.log('[API] Loading payroll runs history...')
      const payrollRes = await axiosInstance.get('/payroll/runs')
      if (payrollRes.data?.success && Array.isArray(payrollRes.data?.data)) {
        payrolls.value = payrollRes.data.data.map(pay => ({
          id: pay.id,
          idShort: String(pay.id).slice(0, 8),
          employeeId: pay.employee_id || 'EMP-001',
          name: pay.employee_name || pay.name || 'Karyawan',
          dept: pay.department || 'Departemen',
          baseSalary: pay.base_salary || 10000000,
          allowance: pay.allowance || 1500000,
          deductions: pay.deductions || 0,
          overtimePay: pay.overtime_pay || 0,
          netSalary: pay.net_salary || 0,
          status: pay.status || 'draft',
          month: pay.month,
          year: pay.year,
          totalEmployees: pay.total_employees,
          totalTakeHomePay: pay.total_take_home_pay
        }))
      }

      console.log('[API] Loading overtime requests...')
      const otRes = await axiosInstance.get('/overtime')
      if (otRes.data?.success) {
        const otData = Array.isArray(otRes.data.data) ? otRes.data.data : (otRes.data.data?.data || [])
        overtimes.value = otData.map(ot => ({
          id: ot.id,
          idShort: String(ot.id).slice(0, 8),
          employeeId: ot.employee_id,
          name: ot.employee_name || ot.employee?.name || 'Karyawan',
          dept: ot.department || ot.employee?.department?.name || 'Departemen',
          date: ot.date,
          plannedStart: ot.planned_start,
          plannedEnd: ot.planned_end,
          plannedHours: ot.planned_hours || 0,
          actualStart: ot.actual_start || null,
          actualEnd: ot.actual_end || null,
          actualHours: ot.actual_hours || 0,
          reason: ot.reason || '',
          workReport: ot.work_report || null,
          preApprovalStatus: ot.pre_approval_status || ot.status || 'pending_approval',
          claimStatus: ot.claim_status || 'none',
          calculatedPay: ot.calculated_pay || 0,
          status: ot.status || 'pending_approval'
        }))
      }

      console.log('[API] Loading my payslips (self-service)...')
      const slipsRes = await axiosInstance.get('/payroll/my-slips')
      if (slipsRes.data?.success && Array.isArray(slipsRes.data?.data)) {
        myPayslips.value = slipsRes.data.data.map(slip => ({
          id: slip.id,
          period: slip.period,
          basicSalary: slip.basic_salary || 0,
          overtimePay: slip.overtime_pay || 0,
          totalEarnings: slip.total_earnings || 0,
          totalDeductions: slip.total_deductions || 0,
          netSalary: slip.net_salary || 0
        }))
      }
    } catch (err) {
      error.value = handleError(err)
      console.error('[API Error] Fetching payroll data failed:', err.message)
    } finally {
      loading.value = false
    }
  }

  async function requestOvertimeAction(data) {
    loading.value = true
    error.value = null
    try {
      console.log('[API] Submitting overtime pre-approval request...')
      const response = await axiosInstance.post('/overtime/request', data)
      const res = response.data
      if (res && res.success) {
        await loadInitialData()
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

  async function claimOvertimeAction(overtimeId, data) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] Submitting actual overtime claim for ID: ${overtimeId}...`)
      const response = await axiosInstance.post(`/overtime/${overtimeId}/claim`, data)
      const res = response.data
      if (res && res.success) {
        await loadInitialData()
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

  async function approveOvertimeAction(otId, status, rejectionReason = null) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] HR approving overtime ID: ${otId} to status: ${status}`)
      const response = await axiosInstance.post(`/overtime/${otId}/approve`, {
        status,
        rejection_reason: rejectionReason
      })
      const res = response.data
      if (res && res.success) {
        console.log(`[API] Overtime approved. Calculated pay: ${res.data?.calculated_pay || 0}`)
        await loadInitialData()
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

  async function updatePayrollStatus(runId = null, status = null) {
    loading.value = true
    error.value = null
    try {
      console.log('[API] Running payroll calculation on server...')
      const currentDate = new Date()
      const response = await axiosInstance.post('/payroll/run', {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      })
      const res = response.data
      if (res && res.success) {
        console.log('[API] Payroll run completed successfully')
        await loadInitialData()
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

  async function releasePayrollAction(runId) {
    loading.value = true
    error.value = null
    try {
      console.log(`[API] Releasing payroll run ID: ${runId}...`)
      const response = await axiosInstance.post(`/payroll/runs/${runId}/release`)
      const res = response.data
      if (res && res.success) {
        console.log('[API] Payroll released. Payslips now accessible to employees.')
        await loadInitialData()
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
    payrolls,
    overtimes,
    myPayslips,
    loading,
    error,
    success,
    totalPayrollAugust,
    loadInitialData,
    requestOvertimeAction,
    claimOvertimeAction,
    approveOvertimeAction,
    updatePayrollStatus,
    releasePayrollAction
  }
})
